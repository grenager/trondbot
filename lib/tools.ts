export const CHAT_TURN_TOOL_NAME = "chat_turn";
export const SCENARIO_OPENING_TOOL_NAME = "scenario_opening";

export const chatTurnTool = {
  name: CHAT_TURN_TOOL_NAME,
  description:
    "Return a correction only if the user's message needs fixing, plus your conversational reply with word-level translations.",
  input_schema: {
    type: "object" as const,
    properties: {
      correction: {
        type: "object" as const,
        properties: {
          corrected: { type: "string" as const },
          explanation: { type: "string" as const },
        },
        required: ["corrected", "explanation"],
      },
      reply: {
        type: "object" as const,
        properties: {
          text: { type: "string" as const },
          tokens: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                word: { type: "string" as const },
                gloss: { type: "string" as const },
              },
              required: ["word", "gloss"],
            },
          },
        },
        required: ["text", "tokens"],
      },
    },
    required: ["reply"],
  },
};

export const scenarioOpeningTool = {
  name: SCENARIO_OPENING_TOOL_NAME,
  description:
    "Return your opening line for the scenario with word-level translations.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "object" as const,
        properties: {
          text: { type: "string" as const },
          tokens: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                word: { type: "string" as const },
                gloss: { type: "string" as const },
              },
              required: ["word", "gloss"],
            },
          },
        },
        required: ["text", "tokens"],
      },
    },
    required: ["reply"],
  },
};
