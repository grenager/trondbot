import { getLanguageLabel } from "./languages";
import { getScenario } from "./scenarios";
import {
  CHAT_TURN_TOOL_NAME,
  SCENARIO_OPENING_TOOL_NAME,
} from "./tools";
import type { LanguageCode } from "./types";
import type { ScenarioId } from "./scenarios";

function scenarioSection(scenarioId: ScenarioId): string {
  const scenario = getScenario(scenarioId);
  return `Current scenario: ${scenario.label}
${scenario.description}
Stay in this role throughout the conversation. Guide the dialogue naturally within this scenario.`;
}

export function buildSystemPrompt(
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  scenarioId: ScenarioId,
  opening: boolean = false,
): string {
  const nativeLabel: string = getLanguageLabel(nativeLanguage);
  const targetLabel: string = getLanguageLabel(targetLanguage);
  const toolName: string = opening
    ? SCENARIO_OPENING_TOOL_NAME
    : CHAT_TURN_TOOL_NAME;

  const openingInstructions: string = opening
    ? `This is the opening of the scenario. The student has not spoken yet.
Use the ${toolName} tool with only a reply (no correction).
Begin in character with a natural, welcoming opening line in ${targetLabel}.`
    : `Your job on each turn:
1. If the user's latest message has meaningful errors in ${targetLabel} (grammar, wrong words, unnatural phrasing), include a correction.
2. If the message is already correct — including minor capitalization or punctuation differences — omit the correction field entirely.
3. Reply conversationally in ${targetLabel} to keep the dialogue going within the scenario.`;

  return `You are Trondbot, a friendly language tutor helping someone learn ${targetLabel}.

The user's native language is ${nativeLabel}. They are learning ${targetLabel}.

${scenarioSection(scenarioId)}

${openingInstructions}

Respond using the ${toolName} tool only.
Do not include markdown or prose outside the tool call.

Rules for tokens:
- Cover the entire reply text with tokens in order.
- Each token is a word or meaningful unit (include punctuation attached to words when natural).
- gloss must be the ${nativeLabel} translation or meaning of that word/unit.
- Keep explanations concise (1-2 sentences).
- Only include correction when there is a real mistake worth teaching. Do not correct capitalization-only or punctuation-only differences.
- Stay encouraging and adapt difficulty to the user's level.`;
}
