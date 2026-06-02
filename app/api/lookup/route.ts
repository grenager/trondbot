import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { getLanguageLabel } from "@/lib/languages";
import { isLanguageCode } from "@/lib/languagePath";
import { parseJsonFromModelText } from "@/lib/validation";
import type { LanguageCode } from "@/lib/types";

const MODEL: string = "claude-sonnet-4-20250514";
const MAX_TOKENS: number = 256;

interface LookupRequestBody {
  word: string;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}

function isLookupRequestBody(value: unknown): value is LookupRequestBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.word === "string" &&
    record.word.trim().length > 0 &&
    typeof record.nativeLanguage === "string" &&
    isLanguageCode(record.nativeLanguage) &&
    typeof record.targetLanguage === "string" &&
    isLanguageCode(record.targetLanguage)
  );
}

function parseTranslation(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const translation: unknown = (value as Record<string, unknown>).translation;
  if (typeof translation !== "string" || translation.trim().length === 0) {
    return null;
  }

  return translation.trim();
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey: string | undefined = getAnthropicApiKey();
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

  if (!isLookupRequestBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sourceLabel: string = getLanguageLabel(body.nativeLanguage);
  const targetLabel: string = getLanguageLabel(body.targetLanguage);
  const word: string = body.word.trim();

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        "You are a concise bilingual dictionary for language learners. " +
        "Return only valid JSON with a single translation field. " +
        "Pick the most natural, common translation. No explanation.",
      messages: [
        {
          role: "user",
          content:
            `Translate this ${sourceLabel} word or short phrase into ${targetLabel}: "${word}"\n` +
            'Respond with JSON only: {"translation":"..."}',
        },
      ],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "Model response was empty" },
        { status: 502 },
      );
    }

    const parsed: unknown = parseJsonFromModelText(textBlock.text);
    const translation: string | null = parseTranslation(parsed);
    if (!translation) {
      return NextResponse.json(
        { error: "Model response did not match expected schema" },
        { status: 502 },
      );
    }

    return NextResponse.json({ translation });
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[api/lookup]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
