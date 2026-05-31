"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import ConfirmDialog from "@/components/ConfirmDialog";
import AboutModal from "@/components/AboutModal";
import NewChatForm from "@/components/NewChatForm";
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
  const [customDescription, setCustomDescription] = useState<string | undefined>(
    undefined,
  );
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [showSetupForm, setShowSetupForm] = useState<boolean>(true);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState<boolean>(false);
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
    setShowSetupForm(stored.messages.length === 0);
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

  function handleNewChatClick(): void {
    if (messages.length === 0) {
      setShowSetupForm(true);
      return;
    }
    setShowNewChatConfirm(true);
  }

  function confirmNewChat(): void {
    setMessages([]);
    setInput("");
    setError(null);
    setShowNewChatConfirm(false);
    setShowSetupForm(true);
  }

  function cancelNewChat(): void {
    setShowNewChatConfirm(false);
  }

  async function startScenario(
    scenarioId: ScenarioId,
    customDesc: string | undefined,
    nativeLang: LanguageCode,
    targetLang: LanguageCode,
  ): Promise<void> {
    setNativeLanguage(nativeLang);
    setTargetLanguage(targetLang);
    setScenario(scenarioId);
    setCustomDescription(customDesc);
    setMessages([]);
    setInput("");
    setError(null);
    setShowSetupForm(false);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          nativeLanguage: nativeLang,
          targetLanguage: targetLang,
          scenario: scenarioId,
          customDescription: customDesc,
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

    setMessages((previous) => [...previous, userMessage]);
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
          customDescription,
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
        setMessages((previous) => [
          ...previous.slice(0, -1),
          userAwaitingAck,
        ]);
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
          ...previous.slice(0, -1),
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

  const scenarioLabel: string =
    scenario === "custom" && customDescription
      ? `Custom: ${customDescription}`
      : getScenario(scenario).label;
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
        correction: message.correction,
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
    <main className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden px-4 py-6">
      <ConfirmDialog
        open={showNewChatConfirm}
        title="Start a new chat?"
        message="Starting a new chat will clear your current conversation."
        confirmLabel="Start new chat"
        cancelLabel="Keep current chat"
        onConfirm={confirmNewChat}
        onCancel={cancelNewChat}
      />
      <header className="mb-6 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              Trondbot
            </h1>
            <AboutModal />
            <a
              href="https://github.com/grenager/trondbot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="text-stone-400 transition-colors hover:text-stone-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>
          <button
            type="button"
            disabled={loading || awaitingAcknowledgment}
            onClick={handleNewChatClick}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Chat
          </button>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {showSetupForm ? (
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
            <NewChatForm
              initialNativeLanguage={nativeLanguage}
              initialTargetLanguage={targetLanguage}
              initialScenario={scenario}
              onStart={(native, target, scenarioId, customDesc) =>
                startScenario(scenarioId, customDesc, native, target)
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {displayMessages.length === 0 ? null : (
                <>
                  <p className="text-center text-xs text-stone-400">
                    Scenario: {scenarioLabel}
                  </p>
                  {displayMessages.map((message, index) => (
                    <ChatMessage
                      key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                      message={message}
                      language={targetLanguage}
                      loading={
                        loading &&
                        index === displayMessages.length - 1 &&
                        message.role === "user" &&
                        !message.accepted &&
                        !message.awaitingAcknowledgment
                      }
                      onAcknowledgeCorrection={
                        message.role === "user" && message.awaitingAcknowledgment
                          ? acknowledgeCorrection
                          : undefined
                      }
                    />
                  ))}
                </>
              )}
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
                lang={targetLanguage === "no" ? "nb" : targetLanguage}
                autoComplete="off"
                autoCorrect="on"
                spellCheck
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
          </>
        )}
      </section>
    </main>
  );
}
