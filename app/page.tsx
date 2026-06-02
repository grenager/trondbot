"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ChatMessage from "@/components/ChatMessage";
import ConfirmDialog from "@/components/ConfirmDialog";
import AboutModal from "@/components/AboutModal";
import CreditsModal from "@/components/CreditsModal";
import CreditsWheel from "@/components/CreditsWheel";
import NewChatForm from "@/components/NewChatForm";
import TypingIndicator from "@/components/TypingIndicator";
import LocaleHtmlLang from "@/components/LocaleHtmlLang";
import {
  DEFAULT_NATIVE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  LANGUAGES,
} from "@/lib/languages";
import { getScenarioLabel, getTranslations } from "@/lib/i18n";
import { TranslationProvider } from "@/lib/i18n/TranslationContext";
import type { ScenarioId } from "@/lib/scenarios";
import type { Language } from "@/lib/types";
import {
  DEFAULT_SCENARIO,
  loadCredits,
  loadStoredState,
  MAX_TOTAL_CREDITS,
  saveCredits,
  saveStoredState,
} from "@/lib/storage";
import { trackNewChat, trackSendMessage } from "@/lib/analytics";
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
const ACCURACY_WINDOW = 20;

function getFlag(code: LanguageCode): string {
  const lang: Language | undefined = LANGUAGES.find((l) => l.code === code);
  return lang?.flag ?? "";
}

function computeAccuracy(messages: DisplayMessage[]): number | null {
  const userMessages: DisplayMessage[] = messages.filter(
    (m): m is UserMessageWithCorrection =>
      m.role === "user" && (!!m.accepted || !!m.correction),
  );
  const recent: DisplayMessage[] = userMessages.slice(-ACCURACY_WINDOW);
  if (recent.length === 0) {
    return null;
  }
  const correct: number = recent.filter(
    (m) => m.role === "user" && !!(m as UserMessageWithCorrection).accepted,
  ).length;
  return Math.round((correct / recent.length) * 100);
}


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
  const [showSetupForm, setShowSetupForm] = useState<boolean>(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [credits, setCredits] = useState<number>(100);
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
    setCredits(loadCredits());
    setHydrated(true);
    setShowSetupForm(stored.messages.length === 0);
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

  useEffect(() => {
    if (!loading && !showSetupForm) {
      composerRef.current?.focus();
    }
  }, [loading, showSetupForm]);

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

  function handleCreditsPurchase(creditsToAdd: number): number {
    const creditsAdded: number = Math.min(
      creditsToAdd,
      MAX_TOTAL_CREDITS - credits,
    );
    if (creditsAdded <= 0) {
      return 0;
    }
    const newCredits: number = credits + creditsAdded;
    setCredits(newCredits);
    saveCredits(newCredits);
    return creditsAdded;
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
    trackNewChat(nativeLang, targetLang, scenarioId);

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
            : getTranslations(nativeLang).somethingWentWrong;
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
          : getTranslations(nativeLang).failedToStartScenario;
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
    trackSendMessage(nativeLanguage, targetLanguage, scenario);

    const newCredits: number = Math.max(0, credits - 1);
    setCredits(newCredits);
    saveCredits(newCredits);

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
            : getTranslations(nativeLanguage).somethingWentWrong;
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
          : getTranslations(nativeLanguage).failedToSendMessage;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const t = getTranslations(nativeLanguage);
  const scenarioLabel: string =
    scenario === "custom" && customDescription
      ? t.customPrefix(customDescription)
      : getScenarioLabel(scenario, nativeLanguage);
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
    <TranslationProvider locale={nativeLanguage}>
      <LocaleHtmlLang />
      <main className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden py-3">
      <ConfirmDialog
        open={showNewChatConfirm}
        title={t.confirmNewChatTitle}
        message={t.confirmNewChatMessage}
        confirmLabel={t.confirmNewChatConfirm}
        cancelLabel={t.confirmNewChatCancel}
        onConfirm={confirmNewChat}
        onCancel={cancelNewChat}
      />
      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
      <CreditsModal
        open={showCreditsModal}
        credits={credits}
        onClose={() => setShowCreditsModal(false)}
        onPurchase={handleCreditsPurchase}
      />
      <header className="mb-2 shrink-0 px-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="flex items-center"
            aria-label={t.aboutTrondbotAria}
          >
            <Image
              src="/trondbot-icon.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
              priority
            />
          </button>
          <CreditsWheel credits={credits} onClick={() => setShowCreditsModal(true)} />
          <button
            type="button"
            disabled={loading || awaitingAcknowledgment}
            onClick={handleNewChatClick}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t.newChatAria}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </button>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showSetupForm ? (
          <div className="flex flex-1 flex-col items-center overflow-y-auto p-6">
            <NewChatForm
              initialNativeLanguage={nativeLanguage}
              initialTargetLanguage={targetLanguage}
              initialScenario={scenario}
              onComfortLanguageChange={setNativeLanguage}
              onStart={(native, target, scenarioId, customDesc) =>
                startScenario(scenarioId, customDesc, native, target)
              }
            />
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-stone-100 px-3 py-2 text-center">
              <p className="text-sm font-semibold text-stone-800">
                {getFlag(targetLanguage)} {scenarioLabel}
              </p>
              {(() => {
                const accuracy: number | null = computeAccuracy(messages);
                if (accuracy === null) return null;
                return (
                  <p className="text-xs font-medium text-stone-500">
                    {t.accuracyCorrect(accuracy)}
                  </p>
                );
              })()}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
              {loading && displayMessages.length === 0 ? (
                <TypingIndicator />
              ) : displayMessages.length > 0 ? (
                displayMessages.map((message, index) => (
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
                  ))
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {error ? (
              <p className="border-t border-stone-100 px-3 py-1.5 text-xs text-red-600">
                {error}
              </p>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="shrink-0 px-3 pb-0 pt-2"
            >
              <div className={`flex flex-col border border-stone-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${input.trim() ? "rounded-2xl" : "rounded-full"}`}>
                <div className="flex items-end">
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
                        ? t.acknowledgeCorrectionPlaceholder
                        : t.typeMessagePlaceholder
                    }
                    disabled={loading || awaitingAcknowledgment}
                    className="flex-1 resize-none border-none bg-transparent px-4 py-2 text-sm leading-5 focus:outline-none focus:ring-0 disabled:bg-stone-50"
                  />
                  {!input.trim() ? (
                    <button
                      type="submit"
                      disabled={loading || awaitingAcknowledgment || !input.trim()}
                      className="m-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-300 text-white transition-colors disabled:cursor-not-allowed"
                      aria-label={t.send}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {input.trim() ? (
                  <div className="flex justify-end px-1.5 pb-1.5">
                    <button
                      type="submit"
                      disabled={loading || awaitingAcknowledgment}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                      aria-label={t.send}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </div>
            </form>
          </>
        )}
      </section>
    </main>
    </TranslationProvider>
  );
}
