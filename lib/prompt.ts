import { getLanguageLabel } from "./languages";
import { getScenario } from "./scenarios";
import {
  CHAT_TURN_TOOL_NAME,
  SCENARIO_OPENING_TOOL_NAME,
} from "./tools";
import type { LanguageCode } from "./types";
import type { ScenarioId } from "./scenarios";

function scenarioSection(
  scenarioId: ScenarioId,
  customDescription?: string,
): string {
  if (scenarioId === "custom" && customDescription) {
    return `Current scenario: Custom
${customDescription}
Stay in this role throughout the conversation. Guide the dialogue naturally within this scenario.`;
  }

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
  customDescription?: string,
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
1. The user MUST write in ${targetLabel}. If the user writes in ${nativeLabel} or any other language that is not ${targetLabel}, ALWAYS include a correction that translates/rewrites their message into natural ${targetLabel}.
2. If the user writes in ${targetLabel} but with meaningful errors (grammar, wrong words, unnatural phrasing), include a correction with the fixed ${targetLabel}.
3. If the message is already correct ${targetLabel} — including minor capitalization or punctuation differences — omit the correction field entirely.
4. Reply conversationally in ${targetLabel} to keep the dialogue going within the scenario.`;

  return `You are Trondbot, a friendly language tutor helping someone learn ${targetLabel}.

The user's native language is ${nativeLabel}. They are learning ${targetLabel}.

${scenarioSection(scenarioId, customDescription)}

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
