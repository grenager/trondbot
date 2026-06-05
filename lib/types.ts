import type { ScenarioId } from "./scenarios";

export type LanguageCode =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ja"
  | "ko"
  | "zh"
  | "ar"
  | "hi"
  | "ru"
  | "nl"
  | "sv"
  | "no";

export interface Language {
  code: LanguageCode;
  label: string;
  flag: string;
}

export interface Token {
  word: string;
  gloss: string;
}

export interface Correction {
  corrected: string;
  explanation: string;
}

export interface AgentReply {
  text: string;
}

export interface AgentResponse {
  correction?: Correction;
  reply: AgentReply;
}

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string;
}

export type ChatMessage = UserMessage | AssistantMessage;

export interface ChatRequestBody {
  messages: ChatMessage[];
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  scenario: ScenarioId;
  customDescription?: string;
  startScenario?: boolean;
  userName?: string;
  localDateTime?: string;
}

export interface ScenarioOpeningResponse {
  reply: AgentReply;
}

export interface UserMessageWithCorrection extends UserMessage {
  correction?: Correction;
  accepted?: boolean;
  awaitingAcknowledgment?: boolean;
  pendingReply?: AgentReply;
  originalContent?: string;
}

export type DisplayMessage = UserMessageWithCorrection | AssistantMessage;
