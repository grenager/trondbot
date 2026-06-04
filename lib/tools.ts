export const CHAT_TURN_TOOL_NAME = "chat_turn";
export const SCENARIO_OPENING_TOOL_NAME = "scenario_opening";

export const chatTurnTool = {
  name: CHAT_TURN_TOOL_NAME,
  description:
    "Return a conversational reply (10-20 words max). When correcting the user, include a correction with the fixed text and a brief explanation.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "object" as const,
        description: "Your reply in the target language. MUST be 10-20 words.",
        properties: {
          text: { type: "string" as const, description: "10-20 words max." },
        },
        required: ["text"],
      },
      correction: {
        type: "object" as const,
        properties: {
          corrected: { type: "string" as const },
          explanation: { type: "string" as const },
        },
        required: ["corrected", "explanation"],
      },
    },
    required: ["reply"],
  },
};

export const scenarioOpeningTool = {
  name: SCENARIO_OPENING_TOOL_NAME,
  description: "Return your opening line for the scenario.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "object" as const,
        properties: {
          text: { type: "string" as const },
        },
        required: ["text"],
      },
    },
    required: ["reply"],
  },
};
