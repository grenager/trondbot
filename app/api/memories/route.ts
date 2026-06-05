import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { ChatMessage } from "@/lib/types";

const MODEL: string = "claude-sonnet-4-20250514";
const MAX_TOKENS: number = 256;

const MEMORY_SYSTEM_PROMPT: string = `You are a memory extraction assistant. Given a conversation transcript between a language learner and their tutor, produce a brief memory (2-3 sentences max) summarizing any personal details learned about the user — their interests, life situation, preferences, plans, family, work, hobbies, or anything else that would help personalize future conversations.

Focus only on facts about the user, not language performance. If no personal details were shared, respond with exactly "NONE".`;

interface MemoryRequestBody {
  messages: ChatMessage[];
}

function isMemoryRequestBody(value: unknown): value is MemoryRequestBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return Array.isArray(record.messages) && record.messages.length > 0;
}

function formatTranscript(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role === "user" ? "User" : "Tutor"}: ${m.content}`)
    .join("\n");
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isMemoryRequestBody(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const apiKey: string | undefined = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  const transcript: string = formatTranscript(body.messages);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: MEMORY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the conversation transcript:\n\n${transcript}`,
        },
      ],
    });

    const text: string =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

    if (!text || text === "NONE") {
      return NextResponse.json({ saved: false });
    }

    const { error } = await supabase
      .from("memories")
      .insert({ user_id: user.id, content: text });

    if (error) {
      console.error("[api/memories] insert error", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("[api/memories] LLM error", err);
    return NextResponse.json({ error: "Memory generation failed" }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ memories: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ memories: [] });
  }

  const { data, error } = await supabase
    .from("memories")
    .select("content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[api/memories] fetch error", error);
    return NextResponse.json({ memories: [] });
  }

  const memories: string[] = (data ?? []).map(
    (row: { content: string }) => row.content,
  );

  return NextResponse.json({ memories });
}
