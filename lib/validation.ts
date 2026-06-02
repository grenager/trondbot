import { isScenarioId } from "./scenarios";
import type {
  AgentReply,
  AgentResponse,
  ChatMessage,
  ChatRequestBody,
  Correction,
  ScenarioOpeningResponse,
  Token,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeToken(value: unknown): Token | null {
  if (!isRecord(value)) {
    return null;
  }

  const word: unknown = value.word;
  const gloss: unknown =
    value.gloss ?? value.translation ?? value.meaning;

  if (typeof word !== "string" || typeof gloss !== "string") {
    return null;
  }

  if (word.trim().length === 0 || gloss.trim().length === 0) {
    return null;
  }

  return { word, gloss };
}

function isCorrection(value: unknown): value is Correction {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.corrected === "string" &&
    typeof value.explanation === "string"
  );
}

export function parseJsonFromModelText(text: string): unknown {
  const trimmed: string = text.trim();
  const fencedMatch: RegExpMatchArray | null = trimmed.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/,
  );
  const jsonText: string = fencedMatch?.[1]?.trim() ?? trimmed;
  return JSON.parse(jsonText);
}

function normalizeForComparison(text: string): string {
  return text
    .trim()
    .replace(/^["'""'']+|["'""'']+$/g, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTrivialCorrection(original: string, corrected: string): boolean {
  return normalizeForComparison(original) === normalizeForComparison(corrected);
}

function parseOptionalCorrection(
  value: unknown,
  userMessage?: string,
): Correction | undefined {
  if (!isCorrection(value)) {
    return undefined;
  }

  if (userMessage && isTrivialCorrection(userMessage, value.corrected)) {
    return undefined;
  }

  return value;
}

function parseAgentReply(raw: unknown): AgentReply | null {
  if (!isRecord(raw)) {
    return null;
  }

  if (typeof raw.text !== "string" || !Array.isArray(raw.tokens)) {
    return null;
  }

  const tokens: Token[] = raw.tokens
    .map(normalizeToken)
    .filter((token): token is Token => token !== null);
  if (tokens.length === 0) {
    return null;
  }

  return {
    text: raw.text,
    tokens,
  };
}

export function parseAgentResponse(
  raw: unknown,
  userMessage?: string,
): AgentResponse | null {
  if (!isRecord(raw)) {
    return null;
  }

  const reply: AgentReply | null = parseAgentReply(raw.reply);
  if (!reply) {
    return null;
  }

  const correction: Correction | undefined = parseOptionalCorrection(
    raw.correction,
    userMessage,
  );

  return {
    correction,
    reply,
  };
}

export function parseScenarioOpeningResponse(
  raw: unknown,
): ScenarioOpeningResponse | null {
  if (!isRecord(raw)) {
    return null;
  }

  const reply: AgentReply | null = parseAgentReply(raw.reply);
  if (!reply) {
    return null;
  }

  return { reply };
}

export function toAnthropicMessages(
  messages: ChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function isChatRequestBody(value: unknown): value is ChatRequestBody {
  if (!isRecord(value)) {
    return false;
  }

  if (!Array.isArray(value.messages)) {
    return false;
  }

  if (
    typeof value.nativeLanguage !== "string" ||
    typeof value.targetLanguage !== "string" ||
    typeof value.scenario !== "string" ||
    !isScenarioId(value.scenario)
  ) {
    return false;
  }

  if (value.startScenario === true) {
    return true;
  }

  return value.messages.length > 0;
}
