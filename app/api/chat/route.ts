import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import type {
  AgentResponse,
  ChatRequestBody,
  ScenarioOpeningResponse,
} from "@/lib/types";
import {
  isChatRequestBody,
  parseAgentResponse,
  parseScenarioOpeningResponse,
  toAnthropicMessages,
} from "@/lib/validation";

const MODEL: string = "claude-sonnet-4-20250514";

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey: string | undefined = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isChatRequestBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const chatBody: ChatRequestBody = body;
  const anthropic = new Anthropic({ apiKey });

  if (chatBody.startScenario) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(
          chatBody.nativeLanguage,
          chatBody.targetLanguage,
          chatBody.scenario,
          true,
        ),
        messages: [
          {
            role: "user",
            content: "Begin the scenario now.",
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return NextResponse.json(
          { error: "No text response from model" },
          { status: 502 },
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(textBlock.text);
      } catch {
        return NextResponse.json(
          { error: "Model returned invalid JSON" },
          { status: 502 },
        );
      }

      const opening: ScenarioOpeningResponse | null =
        parseScenarioOpeningResponse(parsed);
      if (!opening) {
        return NextResponse.json(
          { error: "Model response did not match expected schema" },
          { status: 502 },
        );
      }

      return NextResponse.json(opening);
    } catch (error: unknown) {
      const message: string =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const lastMessage = chatBody.messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from the user" },
      { status: 400 },
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(
        chatBody.nativeLanguage,
        chatBody.targetLanguage,
        chatBody.scenario,
      ),
      messages: toAnthropicMessages(chatBody.messages),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from model" },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON" },
        { status: 502 },
      );
    }

    const agentResponse: AgentResponse | null = parseAgentResponse(parsed);
    if (!agentResponse) {
      return NextResponse.json(
        { error: "Model response did not match expected schema" },
        { status: 502 },
      );
    }

    return NextResponse.json(agentResponse);
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
