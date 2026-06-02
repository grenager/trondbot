import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { buildSystemPrompt } from "@/lib/prompt";
import {
  CHAT_TURN_TOOL_NAME,
  chatTurnTool,
  SCENARIO_OPENING_TOOL_NAME,
  scenarioOpeningTool,
} from "@/lib/tools";
import { buildTellMeAStoryTurnThemeHint } from "@/lib/storyThemes";
import type {
  AgentResponse,
  ChatMessage,
  ChatRequestBody,
  ScenarioOpeningResponse,
} from "@/lib/types";
import {
  isChatRequestBody,
  parseAgentResponse,
  parseAgentResponseFailureReason,
  parseJsonFromModelText,
  parseScenarioOpeningResponse,
  toAnthropicMessages,
} from "@/lib/validation";

const MODEL: string = "claude-sonnet-4-20250514";
const MAX_TOKENS: number = 1024;
const STORY_MAX_TOKENS: number = 1500;
const RETRY_SYSTEM_SUFFIX: string =
  "\n\nIMPORTANT: Your previous response was invalid. You MUST always include a reply object with text on every turn — even when you also include a correction. Never omit reply.";

function isFirstTellMeAStoryTurn(
  scenario: ChatRequestBody["scenario"],
  messages: ChatMessage[],
): boolean {
  return (
    scenario === "tell-a-story" &&
    messages.length === 2 &&
    messages[0]?.role === "assistant" &&
    messages[1]?.role === "user"
  );
}

function logChatError(reason: string, detail: unknown): void {
  console.error(`[api/chat] ${reason}`, detail);
}

function logChatInfo(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const timestamp: string = new Date().toISOString();
  if (detail === undefined) {
    console.log(`[api/chat] ${timestamp} ${message}`);
    return;
  }

  console.log(`[api/chat] ${timestamp} ${message}`, detail);
}

function parseFromToolInput(
  content: Anthropic.Messages.ContentBlock[],
  toolName: string,
): unknown | null {
  const toolBlock = content.find(
    (block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use" && block.name === toolName,
  );
  return toolBlock?.input ?? null;
}

function parseFromTextContent(
  content: Anthropic.Messages.ContentBlock[],
): unknown | null {
  const textBlock = content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text",
  );
  if (!textBlock) {
    return null;
  }

  try {
    return parseJsonFromModelText(textBlock.text);
  } catch (error: unknown) {
    logChatError("Failed to parse model text as JSON", {
      text: textBlock.text.slice(0, 500),
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

function extractStructuredResponse(
  content: Anthropic.Messages.ContentBlock[],
  toolName: string,
): unknown | null {
  const fromTool: unknown | null = parseFromToolInput(content, toolName);
  if (fromTool !== null) {
    return fromTool;
  }

  logChatError("Tool use block missing, falling back to text JSON", {
    toolName,
    blockTypes: content.map((block) => block.type),
  });
  return parseFromTextContent(content);
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey: string | undefined = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  if (!apiKey.startsWith("sk-ant-")) {
    logChatError("ANTHROPIC_API_KEY looks malformed", {
      prefix: apiKey.slice(0, 8),
      length: apiKey.length,
    });
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is invalid. Check Railway variables." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isChatRequestBody(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const chatBody: ChatRequestBody = body;
  const requestId: string = crypto.randomUUID().slice(0, 8);
  const anthropic = new Anthropic({ apiKey });

  logChatInfo("request received", {
    requestId,
    startScenario: chatBody.startScenario === true,
    scenario: chatBody.scenario,
    messageCount: chatBody.messages.length,
    nativeLanguage: chatBody.nativeLanguage,
    targetLanguage: chatBody.targetLanguage,
  });

  if (chatBody.startScenario) {
    try {
      const startedAt: number = Date.now();
      const systemPrompt: string = buildSystemPrompt(
        chatBody.nativeLanguage,
        chatBody.targetLanguage,
        chatBody.scenario,
        true,
        chatBody.customDescription,
      );

      const openingUserMessage: string = "Begin the scenario now.";

      let opening: ScenarioOpeningResponse | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        logChatInfo("scenario opening attempt", { requestId, attempt });
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system:
            attempt === 0 ? systemPrompt : `${systemPrompt}${RETRY_SYSTEM_SUFFIX}`,
          tools: [scenarioOpeningTool],
          tool_choice: { type: "tool", name: SCENARIO_OPENING_TOOL_NAME },
          messages: [
            {
              role: "user",
              content: openingUserMessage,
            },
          ],
        });

        const parsed: unknown | null = extractStructuredResponse(
          response.content,
          SCENARIO_OPENING_TOOL_NAME,
        );
        if (parsed === null) {
          continue;
        }

        opening = parseScenarioOpeningResponse(parsed);
        if (opening) {
          logChatInfo("scenario opening parsed", {
            requestId,
            attempt,
            replyLength: opening.reply.text.length,
            elapsedMs: Date.now() - startedAt,
          });
          break;
        }

        logChatError("Opening response failed schema validation", parsed);
      }

      if (!opening) {
        return NextResponse.json(
          { error: "Model response did not match expected schema" },
          { status: 502 },
        );
      }

      return NextResponse.json(opening);
    } catch (error: unknown) {
      const message: string =
        error instanceof Error ? error.message : "Unknown error";
      logChatError("Scenario start failed", message);
      if (message.includes("authentication_error") || message.includes("401")) {
        return NextResponse.json(
          { error: "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in Railway." },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const lastMessage = chatBody.messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from the user" },
      { status: 400 },
    );
  }

  try {
    const startedAt: number = Date.now();
    const firstStoryTurn: boolean = isFirstTellMeAStoryTurn(
      chatBody.scenario,
      chatBody.messages,
    );
    const storyThemeHint: string | undefined = firstStoryTurn
      ? buildTellMeAStoryTurnThemeHint()
      : undefined;
    const systemPrompt: string = buildSystemPrompt(
      chatBody.nativeLanguage,
      chatBody.targetLanguage,
      chatBody.scenario,
      false,
      chatBody.customDescription,
      storyThemeHint,
    );
    const anthropicMessages = toAnthropicMessages(chatBody.messages);
    const turnMaxTokens: number =
      chatBody.scenario === "tell-a-story" && firstStoryTurn
        ? STORY_MAX_TOKENS
        : MAX_TOKENS;

    let agentResponse: AgentResponse | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      logChatInfo("chat turn attempt", {
        requestId,
        attempt,
        lastUserMessageLength: lastMessage.content.length,
      });
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: turnMaxTokens,
        system:
          attempt === 0 ? systemPrompt : `${systemPrompt}${RETRY_SYSTEM_SUFFIX}`,
        tools: [chatTurnTool],
        tool_choice: { type: "tool", name: CHAT_TURN_TOOL_NAME },
        messages: anthropicMessages,
      });

      const parsed: unknown | null = extractStructuredResponse(
        response.content,
        CHAT_TURN_TOOL_NAME,
      );
      if (parsed === null) {
        continue;
      }

      agentResponse = parseAgentResponse(parsed, lastMessage.content);
      if (agentResponse) {
        logChatInfo("chat turn parsed", {
          requestId,
          attempt,
          hasCorrection: agentResponse.correction !== undefined,
          replyLength: agentResponse.reply.text.length,
          elapsedMs: Date.now() - startedAt,
        });
        break;
      }

      logChatError("Chat turn failed schema validation", {
        reason: parseAgentResponseFailureReason(parsed, lastMessage.content),
        parsed,
      });
    }

    if (!agentResponse) {
      return NextResponse.json(
        { error: "Model response did not match expected schema" },
        { status: 502 },
      );
    }

    return NextResponse.json(agentResponse);
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : "Unknown error";
    logChatError("Chat turn failed", message);
    if (message.includes("authentication_error") || message.includes("401")) {
      return NextResponse.json(
        { error: "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in Railway." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
