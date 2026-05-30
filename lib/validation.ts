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

function isToken(value: unknown): value is Token {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.word === "string" && typeof value.gloss === "string";
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

function parseAgentReply(raw: unknown): AgentReply | null {
  if (!isRecord(raw)) {
    return null;
  }

  if (typeof raw.text !== "string" || !Array.isArray(raw.tokens)) {
    return null;
  }

  const tokens: Token[] = raw.tokens.filter(isToken);
  if (tokens.length === 0) {
    return null;
  }

  return {
    text: raw.text,
    tokens,
  };
}

export function parseAgentResponse(raw: unknown): AgentResponse | null {
  if (!isRecord(raw)) {
    return null;
  }

  const correction: unknown = raw.correction;
  const reply: AgentReply | null = parseAgentReply(raw.reply);

  if (!isCorrection(correction) || !reply) {
    return null;
  }

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
