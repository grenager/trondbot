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
  Token,
} from "./types";

export const STORAGE_KEY = "trondbot-state";
export const MAX_STORED_MESSAGES = 50;

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

function isAgentReply(value: unknown): value is AgentReply {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.text === "string" &&
    Array.isArray(value.tokens) &&
    value.tokens.every(isToken)
  );
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
    return Array.isArray(value.tokens) && value.tokens.every(isToken);
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

  const parsedMessages: DisplayMessage[] = messages.filter(isDisplayMessage);

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
