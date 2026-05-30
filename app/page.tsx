"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import LanguageSelect from "@/components/LanguageSelect";
import ScenarioMenu from "@/components/ScenarioMenu";
import {
  DEFAULT_NATIVE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
} from "@/lib/languages";
import type { ScenarioId } from "@/lib/scenarios";
import { getScenario } from "@/lib/scenarios";
import {
  DEFAULT_SCENARIO,
  loadStoredState,
  saveStoredState,
} from "@/lib/storage";
import type {
  AgentResponse,
  AssistantMessage,
  ChatMessage as ApiChatMessage,
  DisplayMessage,
  LanguageCode,
  ScenarioOpeningResponse,
  UserMessageWithCorrection,
} from "@/lib/types";

function toApiMessages(displayMessages: DisplayMessage[]): ApiChatMessage[] {
  return displayMessages.map((message) => {
    if (message.role === "user") {
      return { role: "user", content: message.content };
    }
    return {
      role: "assistant",
      content: message.content,
      tokens: message.tokens,
    };
  });
}

export default function HomePage() {
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>(
    DEFAULT_NATIVE_LANGUAGE,
  );
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    DEFAULT_TARGET_LANGUAGE,
  );
  const [scenario, setScenario] = useState<ScenarioId>(DEFAULT_SCENARIO);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadStoredState();
    setNativeLanguage(stored.nativeLanguage);
    setTargetLanguage(stored.targetLanguage);
    setScenario(stored.scenario);
    setMessages(stored.messages);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveStoredState({ nativeLanguage, targetLanguage, scenario, messages });
  }, [hydrated, nativeLanguage, targetLanguage, scenario, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startScenario(scenarioId: ScenarioId): Promise<void> {
    setScenario(scenarioId);
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          nativeLanguage,
          targetLanguage,
          scenario: scenarioId,
          startScenario: true,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage: string =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Something went wrong";
        throw new Error(errorMessage);
      }

      const opening: ScenarioOpeningResponse = data as ScenarioOpeningResponse;

      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: opening.reply.text,
        tokens: opening.reply.tokens,
      };

      setMessages([assistantMessage]);
    } catch (startError: unknown) {
      const message: string =
        startError instanceof Error
          ? startError.message
          : "Failed to start scenario";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedInput: string = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    const userMessage: UserMessageWithCorrection = {
      role: "user",
      content: trimmedInput,
    };

    const nextMessages: DisplayMessage[] = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: toApiMessages(nextMessages),
          nativeLanguage,
          targetLanguage,
          scenario,
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage: string =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Something went wrong";
        throw new Error(errorMessage);
      }

      const agentResponse: AgentResponse = data as AgentResponse;

      const userWithCorrection: UserMessageWithCorrection = {
        ...userMessage,
        correction: agentResponse.correction,
      };

      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: agentResponse.reply.text,
        tokens: agentResponse.reply.tokens,
      };

      setMessages([...messages, userWithCorrection, assistantMessage]);
    } catch (submitError: unknown) {
      const message: string =
        submitError instanceof Error
          ? submitError.message
          : "Failed to send message";
      setError(message);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  const scenarioLabel: string = getScenario(scenario).label;

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col px-4 py-6">
      <header className="mb-6 shrink-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Trondbot
          </h1>
          <ScenarioMenu disabled={loading} onSelect={startScenario} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LanguageSelect
            id="native-language"
            label="I speak"
            value={nativeLanguage}
            onChange={setNativeLanguage}
          />
          <LanguageSelect
            id="target-language"
            label="I want to learn"
            value={targetLanguage}
            onChange={setTargetLanguage}
          />
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">
              Choose <span className="font-medium text-stone-500">New</span> to
              pick a scenario, or start chatting in your target language. Hover
              agent words for translations; hover your corrections for
              explanations.
            </p>
          ) : (
            <>
              <p className="text-center text-xs text-stone-400">
                Scenario: {scenarioLabel}
              </p>
              {messages.map((message, index) => (
                <ChatMessage
                  key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                  message={message}
                />
              ))}
            </>
          )}
          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-stone-100 px-4 py-2.5 text-sm text-stone-500">
                Thinking…
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {error ? (
          <p className="border-t border-stone-100 px-4 py-2 text-xs text-red-600">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 gap-2 border-t border-stone-100 p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message…"
            disabled={loading}
            className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
