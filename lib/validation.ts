import { isScenarioId } from "./scenarios";
import type {
  AgentReply,
  AgentResponse,
  ChatMessage,
  ChatRequestBody,
  Correction,
  ScenarioOpeningResponse,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    typeof value.corrected !== "string" ||
    typeof value.explanation !== "string"
  ) {
    return undefined;
  }

  if (userMessage && isTrivialCorrection(userMessage, value.corrected)) {
    return undefined;
  }

  return {
    corrected: value.corrected,
    explanation: value.explanation,
  };
}

function tryParseEmbeddedJson(text: string): unknown | null {
  const trimmed: string = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return parseJsonFromModelText(trimmed);
  } catch {
    // After a prior JSON.parse, control characters (newlines, tabs) become
    // literal chars which are invalid inside JSON string values. Re-escape them.
    const sanitized: string = trimmed.replace(/[\x00-\x1f]/g, (ch: string) => {
      if (ch === "\n") return "\\n";
      if (ch === "\r") return "\\r";
      if (ch === "\t") return "\\t";
      return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
    });
    try {
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

function coerceReplyInput(raw: unknown): unknown {
  if (typeof raw === "string") {
    const parsed: unknown | null = tryParseEmbeddedJson(raw);
    if (parsed !== null) {
      return parsed;
    }

    if (raw.trim().length > 0) {
      return { text: raw };
    }

    return raw;
  }

  return raw;
}

function stripXmlParameterWrapper(text: string): string {
  const match: RegExpMatchArray | null = text.match(
    /^<parameter\s+name="text">\s*([\s\S]*?)\s*<\/parameter>$/,
  );
  return match?.[1] ?? text;
}

function extractReplyText(value: unknown): string | null {
  if (typeof value === "string") {
    const stripped: string = stripXmlParameterWrapper(value.trim());
    const parsed: unknown | null = tryParseEmbeddedJson(stripped);
    if (isRecord(parsed) && typeof parsed.text === "string") {
      return parsed.text.trim().length > 0 ? parsed.text : null;
    }

    return stripped.trim().length > 0 ? stripped : null;
  }

  if (isRecord(value) && typeof value.text === "string") {
    return extractReplyText(value.text);
  }

  return null;
}

function parseAgentReply(raw: unknown): AgentReply | null {
  const coerced: unknown = coerceReplyInput(raw);
  const text: string | null = extractReplyText(coerced);
  if (!text) {
    return null;
  }

  return { text };
}

export function parseAgentResponseFailureReason(
  raw: unknown,
  userMessage?: string,
): string {
  if (!isRecord(raw)) {
    return "response is not an object";
  }

  if (raw.reply === undefined) {
    return "missing reply (correction-only responses are invalid)";
  }

  const reply: AgentReply | null = parseAgentReply(raw.reply);
  if (!reply) {
    return "reply is missing, invalid, or empty";
  }

  if (raw.correction !== undefined) {
    const correction: Correction | undefined = parseOptionalCorrection(
      raw.correction,
      userMessage,
    );
    if (!correction) {
      return "correction present but invalid or trivial";
    }
  }

  return "unknown validation failure";
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
