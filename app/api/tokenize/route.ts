import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { getLanguageLabel } from "@/lib/languages";
import { isLanguageCode } from "@/lib/languagePath";
import { parseJsonFromModelText } from "@/lib/validation";
import type { LanguageCode, Token } from "@/lib/types";
import {
  attachUsageToResponse,
  spendMessageCredit,
} from "@/lib/usage/quota";

const MODEL: string = "claude-sonnet-4-20250514";

interface TokenizeRequestBody {
  text: string;
  messageLanguage: LanguageCode;
  glossLanguage: LanguageCode;
}

function isTokenizeRequestBody(value: unknown): value is TokenizeRequestBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.text === "string" &&
    record.text.trim().length > 0 &&
    typeof record.messageLanguage === "string" &&
    isLanguageCode(record.messageLanguage) &&
    typeof record.glossLanguage === "string" &&
    isLanguageCode(record.glossLanguage)
  );
}

function parseTokens(value: unknown): Token[] | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const tokens: unknown = (value as Record<string, unknown>).tokens;
  if (!Array.isArray(tokens)) {
    return null;
  }

  const parsed: Token[] = tokens
    .map((entry: unknown): Token | null => {
      if (typeof entry !== "object" || entry === null) {
        return null;
      }

      const word: unknown = (entry as Record<string, unknown>).word;
      const gloss: unknown = (entry as Record<string, unknown>).gloss;
      if (typeof word !== "string" || typeof gloss !== "string") {
        return null;
      }

      if (word.trim().length === 0 || gloss.trim().length === 0) {
        return null;
      }

      return { word, gloss };
    })
    .filter((token): token is Token => token !== null);

  return parsed.length > 0 ? parsed : null;
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

  if (!isTokenizeRequestBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const spendResult = await spendMessageCredit();
  if (!spendResult.ok) {
    return (
      spendResult.response ??
      NextResponse.json({ error: "Could not spend message credit." }, { status: 500 })
    );
  }

  const messageLabel: string = getLanguageLabel(body.messageLanguage);
  const glossLabel: string = getLanguageLabel(body.glossLanguage);
  const text: string = body.text.trim();
  const maxTokens: number = Math.min(4096, Math.max(512, text.length * 4));

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system:
        "You tokenize text for language learners. Return only valid JSON. " +
        "Cover the entire input text with tokens in order without skipping words.",
      messages: [
        {
          role: "user",
          content:
            `Tokenize this ${messageLabel} text for a learner whose comfort language is ${glossLabel}.\n` +
            `Text: "${text}"\n` +
            'Return JSON only: {"tokens":[{"word":"...","gloss":"..."}, ...]}\n' +
            "- word: each word or meaningful unit from the text, in order (keep punctuation attached when natural)\n" +
            `- gloss: the ${glossLabel} meaning or translation of that unit`,
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
    const tokens: Token[] | null = parseTokens(parsed);
    if (!tokens) {
      return NextResponse.json(
        { error: "Model response did not match expected schema" },
        { status: 502 },
      );
    }

    return await attachUsageToResponse(
      { tokens },
      spendResult.usage,
      spendResult.deviceUsage,
    );
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[api/tokenize]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
