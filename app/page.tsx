"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import ConfirmDialog from "@/components/ConfirmDialog";
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

const MAX_COMPOSER_LINES = 3;

type PendingLanguageChange =
  | { kind: "native"; value: LanguageCode }
  | { kind: "target"; value: LanguageCode };

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

function getDisplayMessages(allMessages: DisplayMessage[]): DisplayMessage[] {
  const unackedIndex: number = allMessages.findIndex(
    (message) => message.role === "user" && message.awaitingAcknowledgment,
  );

  if (unackedIndex === -1) {
    return allMessages;
  }

  return allMessages.slice(0, unackedIndex + 1);
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
  const [pendingLanguageChange, setPendingLanguageChange] =
    useState<PendingLanguageChange | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  function resizeComposer(): void {
    const textarea: HTMLTextAreaElement | null = composerRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const styles: CSSStyleDeclaration = getComputedStyle(textarea);
    const lineHeight: number =
      Number.parseFloat(styles.lineHeight) || 20;
    const padding: number =
      Number.parseFloat(styles.paddingTop) +
      Number.parseFloat(styles.paddingBottom);
    const maxHeight: number = lineHeight * MAX_COMPOSER_LINES + padding;

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }

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
    resizeComposer();
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function requestLanguageChange(
    kind: PendingLanguageChange["kind"],
    nextLanguage: LanguageCode,
    currentLanguage: LanguageCode,
  ): void {
    if (nextLanguage === currentLanguage) {
      return;
    }

    if (messages.length === 0) {
      if (kind === "native") {
        setNativeLanguage(nextLanguage);
      } else {
        setTargetLanguage(nextLanguage);
      }
      return;
    }

    setPendingLanguageChange({ kind, value: nextLanguage });
  }

  function confirmLanguageChange(): void {
    if (!pendingLanguageChange) {
      return;
    }

    if (pendingLanguageChange.kind === "native") {
      setNativeLanguage(pendingLanguageChange.value);
    } else {
      setTargetLanguage(pendingLanguageChange.value);
    }

    setMessages([]);
    setInput("");
    setError(null);
    setPendingLanguageChange(null);
  }

  function cancelLanguageChange(): void {
    setPendingLanguageChange(null);
  }

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

    const apiMessages: DisplayMessage[] = [...messages, userMessage];
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: toApiMessages(apiMessages),
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

      if (agentResponse.correction) {
        const userAwaitingAck: UserMessageWithCorrection = {
          ...userMessage,
          correction: agentResponse.correction,
          awaitingAcknowledgment: true,
          pendingReply: agentResponse.reply,
        };
        setMessages((previous) => [...previous, userAwaitingAck]);
      } else {
        const userAccepted: UserMessageWithCorrection = {
          ...userMessage,
          accepted: true,
        };
        const assistantMessage: AssistantMessage = {
          role: "assistant",
          content: agentResponse.reply.text,
          tokens: agentResponse.reply.tokens,
        };
        setMessages((previous) => [
          ...previous,
          userAccepted,
          assistantMessage,
        ]);
      }
    } catch (submitError: unknown) {
      const message: string =
        submitError instanceof Error
          ? submitError.message
          : "Failed to send message";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const scenarioLabel: string = getScenario(scenario).label;
  const displayMessages: DisplayMessage[] = getDisplayMessages(messages);
  const awaitingAcknowledgment: boolean = messages.some(
    (message) => message.role === "user" && message.awaitingAcknowledgment,
  );

  function acknowledgeCorrection(): void {
    setMessages((previous) => {
      const messageIndex: number = previous.findIndex(
        (message) => message.role === "user" && message.awaitingAcknowledgment,
      );
      const message: DisplayMessage | undefined = previous[messageIndex];
      if (
        messageIndex === -1 ||
        !message ||
        message.role !== "user" ||
        !message.awaitingAcknowledgment ||
        !message.correction ||
        !message.pendingReply
      ) {
        return previous;
      }

      const updatedUser: UserMessageWithCorrection = {
        role: "user",
        content: message.correction.corrected,
        originalContent: message.content,
      };

      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: message.pendingReply.text,
        tokens: message.pendingReply.tokens,
      };

      return [
        ...previous.slice(0, messageIndex),
        updatedUser,
        assistantMessage,
        ...previous.slice(messageIndex + 1),
      ];
    });
  }

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col px-4 py-6">
      <ConfirmDialog
        open={pendingLanguageChange !== null}
        title="Start a new chat?"
        message="Changing languages starts a fresh conversation with a new tutor. Your current chat will be cleared."
        confirmLabel="Start new chat"
        cancelLabel="Keep current chat"
        onConfirm={confirmLanguageChange}
        onCancel={cancelLanguageChange}
      />
      <header className="mb-6 shrink-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">
            Trondbot
          </h1>
          <ScenarioMenu
            disabled={loading || awaitingAcknowledgment}
            onSelect={startScenario}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <LanguageSelect
            id="native-language"
            label="I speak"
            value={nativeLanguage}
            disabled={loading || awaitingAcknowledgment}
            onChange={(code) =>
              requestLanguageChange("native", code, nativeLanguage)
            }
          />
          <LanguageSelect
            id="target-language"
            label="I want to learn"
            value={targetLanguage}
            disabled={loading || awaitingAcknowledgment}
            onChange={(code) =>
              requestLanguageChange("target", code, targetLanguage)
            }
          />
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {displayMessages.length === 0 ? (
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
              {displayMessages.map((message, index) => (
                <ChatMessage
                  key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                  message={message}
                  language={targetLanguage}
                  onAcknowledgeCorrection={
                    message.role === "user" && message.awaitingAcknowledgment
                      ? acknowledgeCorrection
                      : undefined
                  }
                />
              ))}
            </>
          )}
          {loading && !awaitingAcknowledgment ? (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-stone-100 px-4 py-2.5 text-sm text-stone-500">
                Checking…
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
          className="flex shrink-0 items-end gap-2 border-t border-stone-100 p-4"
        >
          <textarea
            ref={composerRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={
              awaitingAcknowledgment
                ? "Acknowledge the correction to continue…"
                : "Type a message…"
            }
            disabled={loading || awaitingAcknowledgment}
            className="flex-1 resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm leading-5 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-stone-50"
          />
          <button
            type="submit"
            disabled={loading || awaitingAcknowledgment || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
