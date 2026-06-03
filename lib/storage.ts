import { LANGUAGES } from "./languages";
import {
  DEFAULT_NATIVE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
} from "./languages";
import { isScenarioId } from "./scenarios";
import type { ScenarioId } from "./scenarios";
import type {
  AgentReply,
  Correction,
  DisplayMessage,
  LanguageCode,
} from "./types";

export const STORAGE_KEY = "trondbot-state";
export const CREDITS_KEY = "trondbot-credits";
export const INVITE_CODE_KEY = "trondbot-invite-code";
export const MAX_STORED_MESSAGES = 50;
export const INITIAL_FREE_CREDITS = 100;
export const MAX_TOTAL_CREDITS = 100;

export {
  ANONYMOUS_FREE_MESSAGES,
  SIGNED_IN_FREE_CREDITS,
  GUEST_SCENARIO_ID,
} from "@/lib/usage/constants";

const LANGUAGE_CODES: ReadonlySet<LanguageCode> = new Set(
  LANGUAGES.map((language) => language.code),
);

export const DEFAULT_SCENARIO: ScenarioId = "new-friend";

export interface StoredChatState {
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  scenario: ScenarioId;
  messages: DisplayMessage[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_CODES.has(value as LanguageCode);
}

function stripLegacyAssistantTokens(
  message: DisplayMessage,
): DisplayMessage {
  if (message.role !== "assistant") {
    return message;
  }

  if (!isRecord(message) || !("tokens" in message)) {
    return message;
  }

  const { tokens: _tokens, ...rest } = message as DisplayMessage & {
    tokens?: unknown;
  };
  return rest as DisplayMessage;
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

function isAgentReply(value: unknown): value is AgentReply {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.text === "string";
}

function isDisplayMessage(value: unknown): value is DisplayMessage {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.content !== "string") {
    return false;
  }

  if (value.role === "user") {
    if (value.accepted !== undefined && typeof value.accepted !== "boolean") {
      return false;
    }
    if (
      value.awaitingAcknowledgment !== undefined &&
      typeof value.awaitingAcknowledgment !== "boolean"
    ) {
      return false;
    }
    if (value.pendingReply !== undefined && !isAgentReply(value.pendingReply)) {
      return false;
    }
    if (value.correction !== undefined && !isCorrection(value.correction)) {
      return false;
    }
    if (
      value.originalContent !== undefined &&
      typeof value.originalContent !== "string"
    ) {
      return false;
    }
    return true;
  }

  if (value.role === "assistant") {
    return true;
  }

  return false;
}

function parseStoredState(raw: unknown): StoredChatState | null {
  if (!isRecord(raw)) {
    return null;
  }

  const nativeLanguage: unknown = raw.nativeLanguage;
  const targetLanguage: unknown = raw.targetLanguage;
  const scenario: unknown = raw.scenario;
  const messages: unknown = raw.messages;

  if (
    typeof nativeLanguage !== "string" ||
    typeof targetLanguage !== "string" ||
    !isLanguageCode(nativeLanguage) ||
    !isLanguageCode(targetLanguage) ||
    !Array.isArray(messages)
  ) {
    return null;
  }

  const parsedScenario: ScenarioId =
    typeof scenario === "string" && isScenarioId(scenario)
      ? scenario
      : DEFAULT_SCENARIO;

  const parsedMessages: DisplayMessage[] = messages
    .filter(isDisplayMessage)
    .map(stripLegacyAssistantTokens);

  return {
    nativeLanguage,
    targetLanguage,
    scenario: parsedScenario,
    messages: parsedMessages.slice(-MAX_STORED_MESSAGES),
  };
}

export function loadStoredState(): StoredChatState {
  if (typeof window === "undefined") {
    return {
      nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
      scenario: DEFAULT_SCENARIO,
      messages: [],
    };
  }

  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
        targetLanguage: DEFAULT_TARGET_LANGUAGE,
        scenario: DEFAULT_SCENARIO,
        messages: [],
      };
    }

    const parsed: StoredChatState | null = parseStoredState(JSON.parse(raw));
    if (!parsed) {
      return {
        nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
        targetLanguage: DEFAULT_TARGET_LANGUAGE,
        scenario: DEFAULT_SCENARIO,
        messages: [],
      };
    }

    return parsed;
  } catch {
    return {
      nativeLanguage: DEFAULT_NATIVE_LANGUAGE,
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
      scenario: DEFAULT_SCENARIO,
      messages: [],
    };
  }
}

export function saveStoredState(state: StoredChatState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: StoredChatState = {
      nativeLanguage: state.nativeLanguage,
      targetLanguage: state.targetLanguage,
      scenario: state.scenario,
      messages: state.messages.slice(-MAX_STORED_MESSAGES),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

export function loadCredits(): number {
  if (typeof window === "undefined") {
    return INITIAL_FREE_CREDITS;
  }
  try {
    const raw: string | null = window.localStorage.getItem(CREDITS_KEY);
    if (raw === null) {
      return INITIAL_FREE_CREDITS;
    }
    const value: number = Number.parseInt(raw, 10);
    return Number.isFinite(value)
      ? Math.min(MAX_TOTAL_CREDITS, Math.max(0, value))
      : INITIAL_FREE_CREDITS;
  } catch {
    return INITIAL_FREE_CREDITS;
  }
}

export function saveCredits(credits: number): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      CREDITS_KEY,
      String(Math.min(MAX_TOTAL_CREDITS, Math.max(0, credits))),
    );
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getOrCreateInviteCode(): string {
  if (typeof window === "undefined") {
    return generateInviteCode();
  }
  try {
    const existing: string | null = window.localStorage.getItem(INVITE_CODE_KEY);
    if (existing) {
      return existing;
    }
    const code: string = generateInviteCode();
    window.localStorage.setItem(INVITE_CODE_KEY, code);
    return code;
  } catch {
    return generateInviteCode();
  }
}

export function getInviteUrl(inviteCode?: string): string {
  const code: string = inviteCode ?? getOrCreateInviteCode();
  if (typeof window === "undefined") {
    return `https://trondbot.com/?ref=${code}`;
  }
  return `${window.location.origin}?ref=${code}`;
}
