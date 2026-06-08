"use client";

import { FormEvent, KeyboardEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import ChatMessage from "@/components/ChatMessage";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreditsModal from "@/components/CreditsModal";
import ReferralCapture from "@/components/ReferralCapture";
import PaywallPrompt from "@/components/PaywallPrompt";
import CreditsWheel from "@/components/CreditsWheel";
import StreakBadge from "@/components/StreakBadge";
import AuthModal from "@/components/AuthModal";
import SideDrawer from "@/components/SideDrawer";
import UserAvatar from "@/components/UserAvatar";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import LookupModal from "@/components/LookupModal";
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
import { VocabProvider } from "@/components/VocabContext";
import { useToast, ToastContainer } from "@/components/Toast";
import type { VocabSaveResult } from "@/lib/vocab";
import {
  buildLanguagePath,
  getDefaultLanguagePath,
  isLanguageCode,
  parseLanguagePath,
} from "@/lib/languagePath";
import type { ScenarioId } from "@/lib/scenarios";
import type { Language } from "@/lib/types";
import {
  ANONYMOUS_FREE_MESSAGES,
  DEFAULT_SCENARIO,
  GUEST_SCENARIO_ID,
  loadStoredState,
  MAX_TOTAL_CREDITS,
  saveStoredState,
} from "@/lib/storage";
import {
  fetchUsageSnapshot,
  parseUsageSnapshot,
  type UsageSnapshot,
} from "@/lib/usage/client";
import { trackNewChat, trackSendMessage } from "@/lib/analytics";
import {
  recordMessageSent,
  getTodayProgress,
  STREAK_THRESHOLD,
  type TodayProgress,
} from "@/lib/activity";
import { getActivityStats } from "@/lib/activity";
import { debugLog } from "@/lib/debug";
import { fetchChat, getFetchErrorMessage } from "@/lib/fetchChat";
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

const DEFAULT_USAGE: UsageSnapshot = {
  signedIn: false,
  remaining: ANONYMOUS_FREE_MESSAGES,
  maxCredits: ANONYMOUS_FREE_MESSAGES,
  requiresSignIn: false,
};

function applyUsageFromResponse(
  data: unknown,
  setUsage: (usage: UsageSnapshot) => void,
): void {
  if (typeof data !== "object" || data === null || !("usage" in data)) {
    return;
  }

  const parsed: UsageSnapshot | null = parseUsageSnapshot(
    (data as { usage: unknown }).usage,
  );
  if (parsed) {
    setUsage(parsed);
  }
}

function isQuotaErrorResponse(response: Response, data: unknown): boolean {
  if (response.status !== 402 && response.status !== 403) {
    return false;
  }

  if (typeof data !== "object" || data === null || !("code" in data)) {
    return response.status === 402;
  }

  const code: unknown = (data as { code: unknown }).code;
  return (
    code === "SIGN_IN_REQUIRED" ||
    code === "NO_CREDITS" ||
    code === "GUEST_SCENARIO_ONLY"
  );
}

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

export default function TrondbotApp() {
  return (
    <AuthProvider>
      <TrondbotAppContent />
    </AuthProvider>
  );
}

function TrondbotAppContent() {
  const router = useRouter();
  const pathname: string = usePathname();
  const params = useParams<{
    comfortLanguage?: string;
    targetLanguage?: string;
  }>();
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
  const [translating, setTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [showSetupForm, setShowSetupForm] = useState<boolean>(false);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [usage, setUsage] = useState<UsageSnapshot>(DEFAULT_USAGE);
  const [vocabCount, setVocabCount] = useState<number | null>(null);
  const {
    user,
    profile,
    displayName,
    avatarUrl,
    authReady,
    supabaseEnabled,
    signInWithGoogle,
    sendEmailCode,
    verifyEmailCode,
  } = useAuth();
  const [typingAfterAck, setTypingAfterAck] = useState<boolean>(false);
  const [composerMultiline, setComposerMultiline] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    sent: 0,
    threshold: STREAK_THRESHOLD,
    remaining: STREAK_THRESHOLD,
    completed: false,
  });
  const [streakCelebrating, setStreakCelebrating] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastComposerInputLengthRef = useRef<number>(0);

  const credits: number = usage.remaining;
  const signedIn: boolean = !!user;
  const hideCreditsNav: boolean = usage.requiresSignIn && !signedIn;
  const outOfCredits: boolean = usage.requiresSignIn || usage.remaining <= 0;


  function refreshUsage(): void {
    void fetchUsageSnapshot().then((snapshot: UsageSnapshot | null) => {
      if (snapshot) {
        setUsage(snapshot);
      }
    });
  }
  function updateLanguages(
    native: LanguageCode,
    target: LanguageCode,
  ): void {
    setNativeLanguage(native);
    setTargetLanguage(target);
    const nextPath: string = buildLanguagePath(native, target);
    if (pathname !== nextPath) {
      router.replace(nextPath, { scroll: false });
    }
  }

  function handleComfortLanguageChange(code: LanguageCode): void {
    updateLanguages(code, targetLanguage);
  }

  function handleTargetLanguageChange(code: LanguageCode): void {
    updateLanguages(nativeLanguage, code);
  }

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
    const singleLineHeight: number = lineHeight + padding;
    const inputLength: number = textarea.value.length;
    const wrapped: boolean = textarea.scrollHeight > singleLineHeight + 1;

    if (inputLength === 0) {
      lastComposerInputLengthRef.current = 0;
      setComposerMultiline(false);
    } else {
      setComposerMultiline((previous) => {
        if (wrapped) {
          lastComposerInputLengthRef.current = inputLength;
          return true;
        }

        if (!previous) {
          return false;
        }

        if (inputLength < lastComposerInputLengthRef.current) {
          lastComposerInputLengthRef.current = inputLength;
          return false;
        }

        return true;
      });
    }

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  useEffect(() => {
    const stored = loadStoredState();
    const fromPath = parseLanguagePath(pathname);

    if (fromPath) {
      setNativeLanguage(fromPath.nativeLanguage);
      setTargetLanguage(fromPath.targetLanguage);
    } else {
      setNativeLanguage(stored.nativeLanguage);
      setTargetLanguage(stored.targetLanguage);
    }

    setScenario(stored.scenario);
    setMessages(stored.messages);
    setHydrated(true);
    setShowSetupForm(stored.messages.length === 0);
    // Hydrate once from the initial URL and stored chat state.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const stats = getActivityStats();
    setStreakCount(stats.currentStreak);
    setTodayProgress(getTodayProgress());
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !authReady) {
      return;
    }
    refreshUsage();
  }, [hydrated, authReady, user, profile?.credits]);

  useEffect(() => {
    if (!user) {
      setVocabCount(null);
      return;
    }
    void fetch("/api/vocab/count")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (typeof d === "object" && d !== null && "count" in d) {
          setVocabCount((d as { count: number }).count);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }
    setShowAuthModal(false);
  }, [authReady, user]);

  useEffect(() => {
    if (!authReady || user || scenario === GUEST_SCENARIO_ID) {
      return;
    }
    setScenario(GUEST_SCENARIO_ID);
    setCustomDescription(undefined);
  }, [authReady, user, scenario]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const comfortParam: string | undefined = params.comfortLanguage;
    const targetParam: string | undefined = params.targetLanguage;
    if (
      !comfortParam ||
      !targetParam ||
      !isLanguageCode(comfortParam) ||
      !isLanguageCode(targetParam)
    ) {
      router.replace(getDefaultLanguagePath());
      return;
    }

    setNativeLanguage(comfortParam);
    setTargetLanguage(targetParam);
  }, [hydrated, pathname, params.comfortLanguage, params.targetLanguage, router]);

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
    requestAnimationFrame(() => {
      resizeComposer();
    });
  }, [composerMultiline]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, typingAfterAck]);

  useEffect(() => {
    if (!loading && !typingAfterAck && !showSetupForm) {
      composerRef.current?.focus();
    }
  }, [loading, typingAfterAck, showSetupForm]);

  useEffect(() => {
    debugLog("ui", "loading state changed", { loading });
  }, [loading]);

  useEffect(() => {
    debugLog("ui", "messages updated", {
      count: messages.length,
      lastRole: messages.at(-1)?.role,
      awaitingAcknowledgment: messages.some(
        (message) => message.role === "user" && message.awaitingAcknowledgment,
      ),
    });
  }, [messages]);

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (event.key === "Tab" && !event.shiftKey) {
      const match: RegExpMatchArray | null = input.match(/\/(\S.*)$/);
      if (match) {
        event.preventDefault();
        const lookupWord: string = match[1].trim();
        if (lookupWord) {
          void handleSlashTranslate(lookupWord, match[0]);
        }
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function insertIntoComposer(text: string): void {
    const trimmed: string = text.trim();
    if (!trimmed) {
      return;
    }

    setInput((previous) => {
      if (!previous.trim()) {
        return trimmed;
      }

      const needsSpace: boolean =
        !previous.endsWith(" ") && !previous.endsWith("\n");
      return `${previous}${needsSpace ? " " : ""}${trimmed}`;
    });

    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }

  async function handleSlashTranslate(word: string, token: string): Promise<boolean> {
    if (!canSpendCredit()) {
      return false;
    }

    setTranslating(true);
    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          nativeLanguage,
          targetLanguage,
        }),
      });

      const data: unknown = await response.json();
      if (data && typeof data === "object" && "usage" in data) {
        const parsed: UsageSnapshot | null = parseUsageSnapshot(
          (data as { usage: unknown }).usage,
        );
        if (parsed) {
          setUsage(parsed);
        }
      }

      if (!response.ok) {
        return false;
      }

      const translation: unknown =
        typeof data === "object" && data !== null && "translation" in data
          ? (data as { translation: unknown }).translation
          : null;

      if (typeof translation !== "string" || translation.trim().length === 0) {
        return false;
      }

      setInput((prev) => {
        const idx: number = prev.lastIndexOf(token);
        if (idx === -1) {
          return translation.trim();
        }
        return prev.slice(0, idx) + translation.trim() + prev.slice(idx + token.length);
      });
      return true;
    } catch {
      return false;
    } finally {
      setTranslating(false);
    }
  }

  function handleNewChatClick(): void {
    if (outOfCredits) {
      return;
    }

    if (messages.length === 0) {
      setShowSetupForm(true);
      return;
    }
    setShowNewChatConfirm(true);
  }

  function confirmNewChat(): void {
    if (signedIn && messages.length >= 4) {
      void fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toApiMessages(messages) }),
      });
    }
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
    setUsage((previous) => ({
      ...previous,
      remaining: previous.remaining + creditsAdded,
    }));
    return creditsAdded;
  }

  const applyUsageSnapshot = useCallback((snapshot: UsageSnapshot): void => {
    setUsage(snapshot);
  }, []);

  const canSpendCredit = useCallback((): boolean => {
    return !usage.requiresSignIn && usage.remaining > 0;
  }, [usage.requiresSignIn, usage.remaining]);

  async function startScenario(
    scenarioId: ScenarioId,
    customDesc: string | undefined,
    nativeLang: LanguageCode,
    targetLang: LanguageCode,
  ): Promise<void> {
    const effectiveScenario: ScenarioId = signedIn ? scenarioId : GUEST_SCENARIO_ID;
    const effectiveCustomDesc: string | undefined =
      effectiveScenario === "custom" ? customDesc : undefined;

    setNativeLanguage(nativeLang);
    setTargetLanguage(targetLang);
    const nextPath: string = buildLanguagePath(nativeLang, targetLang);
    if (pathname !== nextPath) {
      router.replace(nextPath, { scroll: false });
    }
    setScenario(effectiveScenario);
    setCustomDescription(effectiveCustomDesc);
    setMessages([]);
    setInput("");
    setError(null);
    setShowSetupForm(false);
    setLoading(true);
    trackNewChat(nativeLang, targetLang, effectiveScenario);
    debugLog("chat", "startScenario: request sent", {
      scenarioId: effectiveScenario,
      nativeLang,
      targetLang,
    });

    try {
      const response = await fetchChat({
          messages: [],
          nativeLanguage: nativeLang,
          targetLanguage: targetLang,
          scenario: effectiveScenario,
          customDescription: effectiveCustomDesc,
          startScenario: true,
          userName: displayName ?? undefined,
          localDateTime: new Date().toLocaleString(),
        });

      debugLog("chat", "startScenario: response received", {
        ok: response.ok,
        status: response.status,
      });

      const data: unknown = await response.json();

      debugLog("chat", "startScenario: response parsed", {
        hasReply:
          typeof data === "object" &&
          data !== null &&
          "reply" in data &&
          typeof data.reply === "object",
      });

      if (!response.ok) {
        if (isQuotaErrorResponse(response, data)) {
          setMessages([]);
          setShowSetupForm(true);
          applyUsageFromResponse(data, setUsage);
          return;
        }

        const errorMessage: string =
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : getTranslations(nativeLang).somethingWentWrong;
        throw new Error(errorMessage);
      }

      applyUsageFromResponse(data, setUsage);

      const opening: ScenarioOpeningResponse = data as ScenarioOpeningResponse;

      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: opening.reply.text,
      };

      setMessages([assistantMessage]);
      debugLog("chat", "startScenario: complete", {
        replyLength: assistantMessage.content.length,
      });
    } catch (startError: unknown) {
      const message: string = getFetchErrorMessage(
        startError,
        getTranslations(nativeLang).failedToStartScenario,
      );
      debugLog("chat", "startScenario: failed", { message, startError });
      setError(message);
    } finally {
      debugLog("chat", "startScenario: finally, clearing loading");
      setLoading(false);
    }
  }

  async function sendUserMessage(
    userMessage: UserMessageWithCorrection,
    apiMessages: DisplayMessage[],
  ): Promise<void> {
    setLoading(true);
    setError(null);

    debugLog("chat", "sendUserMessage: request sent", {
      contentLength: userMessage.content.length,
      messageCount: apiMessages.length,
    });

    try {
      const response = await fetchChat({
          messages: toApiMessages(apiMessages),
          nativeLanguage,
          targetLanguage,
          scenario,
          customDescription,
          userName: displayName ?? undefined,
          localDateTime: new Date().toLocaleString(),
        });

      debugLog("chat", "sendUserMessage: response received", {
        ok: response.ok,
        status: response.status,
      });

      let data: unknown;
      try {
        data = await response.json();
      } catch (parseError: unknown) {
        debugLog("chat", "sendUserMessage: failed to parse JSON", parseError);
        throw new Error(getTranslations(nativeLanguage).failedToSendMessage);
      }

      debugLog("chat", "sendUserMessage: response parsed", {
        hasCorrection:
          typeof data === "object" &&
          data !== null &&
          "correction" in data &&
          data.correction !== undefined,
        hasReply:
          typeof data === "object" &&
          data !== null &&
          "reply" in data &&
          typeof data.reply === "object",
      });

      if (!response.ok) {
        if (isQuotaErrorResponse(response, data)) {
          setMessages((previous) => previous.slice(0, -1));
          applyUsageFromResponse(data, setUsage);
          if (
            typeof data !== "object" ||
            data === null ||
            !("code" in data) ||
            (data as { code: unknown }).code !== "SIGN_IN_REQUIRED"
          ) {
            setError(
              typeof data === "object" &&
                data !== null &&
                "error" in data &&
                typeof data.error === "string"
                ? data.error
                : getTranslations(nativeLanguage).failedToSendMessage,
            );
          }
          return;
        }

        const errorMessage: string =
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : getTranslations(nativeLanguage).somethingWentWrong;
        throw new Error(errorMessage);
      }

      applyUsageFromResponse(data, setUsage);

      const agentResponse: AgentResponse = data as AgentResponse;

      if (agentResponse.correction) {
        debugLog("chat", "sendUserMessage: applying correction", {
          correctedLength: agentResponse.correction.corrected.length,
        });
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
        debugLog("chat", "sendUserMessage: message accepted", {
          replyLength: agentResponse.reply.text.length,
        });
        const userAccepted: UserMessageWithCorrection = {
          ...userMessage,
          accepted: true,
        };
        const assistantMessage: AssistantMessage = {
          role: "assistant",
          content: agentResponse.reply.text,
        };
        setMessages((previous) => [
          ...previous.slice(0, -1),
          userAccepted,
          assistantMessage,
        ]);
      }
      debugLog("chat", "sendUserMessage: complete");
    } catch (submitError: unknown) {
      const message: string = getFetchErrorMessage(
        submitError,
        getTranslations(nativeLanguage).failedToSendMessage,
      );
      debugLog("chat", "sendUserMessage: failed", { message, submitError });
      setError(message);
    } finally {
      debugLog("chat", "sendUserMessage: finally, clearing loading");
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedInput: string = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    if (usage.requiresSignIn || usage.remaining <= 0) {
      return;
    }

    const userMessage: UserMessageWithCorrection = {
      role: "user",
      content: trimmedInput,
    };

    setMessages((previous) => [...previous, userMessage]);
    const apiMessages: DisplayMessage[] = [...messages, userMessage];
    setInput("");
    trackSendMessage(nativeLanguage, targetLanguage, scenario);
    const progress: TodayProgress = recordMessageSent();
    const wasCompleted: boolean = todayProgress.completed;
    setTodayProgress(progress);
    if (progress.completed && !wasCompleted) {
      const stats = getActivityStats();
      setStreakCount(stats.currentStreak);
      setStreakCelebrating(true);
      setTimeout(() => setStreakCelebrating(false), 3000);
    }

    await sendUserMessage(userMessage, apiMessages);
  }

  function handleRetry(): void {
    if (loading) {
      return;
    }

    const lastMessage: DisplayMessage | undefined = messages.at(-1);
    if (!lastMessage || lastMessage.role !== "user") {
      return;
    }

    const userMessage: UserMessageWithCorrection = {
      role: "user",
      content: lastMessage.content,
    };

    void sendUserMessage(userMessage, messages);
  }

  const t = getTranslations(nativeLanguage);
  const { toasts, show: showToast } = useToast();

  const handleVocabResult = useCallback(
    (result: VocabSaveResult) => {
      if (result === "saved") {
        showToast(t.vocabSaved, "success");
      } else if (result === "unauthorized") {
        showToast(t.signInForVocab, "info");
      }
    },
    [showToast, t.vocabSaved, t.signInForVocab],
  );

  const scenarioLabel: string =
    scenario === "custom" && customDescription
      ? t.customPrefix(customDescription)
      : getScenarioLabel(scenario, nativeLanguage);
  const displayMessages: DisplayMessage[] = getDisplayMessages(messages);
  const awaitingAcknowledgment: boolean = messages.some(
    (message) => message.role === "user" && message.awaitingAcknowledgment,
  );
  const composerDisabled: boolean =
    loading ||
    awaitingAcknowledgment ||
    typingAfterAck ||
    usage.requiresSignIn ||
    usage.remaining <= 0;
  const hasComposerInput: boolean = input.trim().length > 0;
  const slashLookupMatch: RegExpMatchArray | null = input.match(
    /\/(\S.*)$/,
  );
  const slashLookupActive: boolean = slashLookupMatch !== null;

  const lookupButton = (
    <button
      type="button"
      onClick={() => setShowLookupModal(true)}
      disabled={composerDisabled}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200 p-1.5 text-stone-600 transition-colors hover:bg-stone-300 hover:text-stone-800 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300"
      aria-label={t.lookupWordAria}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path d="M9 4.804A7.968 7.968 0 0 0 5.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0 1 5.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0 1 14.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0 0 14.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 1 1-2 0V4.804Z" />
      </svg>
    </button>
  );

  const sendButton = (
    <button
      type="submit"
      disabled={composerDisabled || !hasComposerInput}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:cursor-not-allowed ${hasComposerInput
          ? "bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300"
          : "bg-stone-300"
        }`}
      aria-label={t.send}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
      </svg>
    </button>
  );

  function acknowledgeCorrection(): void {
    const ackIndex: number = messages.findIndex(
      (m) => m.role === "user" && m.awaitingAcknowledgment,
    );
    const ackMessage: DisplayMessage | undefined = messages[ackIndex];
    if (
      ackIndex === -1 ||
      !ackMessage ||
      ackMessage.role !== "user" ||
      !ackMessage.awaitingAcknowledgment ||
      !ackMessage.correction ||
      !ackMessage.pendingReply
    ) {
      return;
    }

    const pendingReply = ackMessage.pendingReply;

    const updatedUser: UserMessageWithCorrection = {
      role: "user",
      content: ackMessage.correction.corrected,
      originalContent: ackMessage.content,
      correction: ackMessage.correction,
    };

    setMessages((previous) => [
      ...previous.slice(0, ackIndex),
      updatedUser,
      ...previous.slice(ackIndex + 1),
    ]);
    setTypingAfterAck(true);

    const delayMs: number = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: pendingReply.text,
      };
      setMessages((previous) => [...previous, assistantMessage]);
      setTypingAfterAck(false);
    }, delayMs);
  }

  function rejectCorrection(): void {
    const ackIndex: number = messages.findIndex(
      (m) => m.role === "user" && m.awaitingAcknowledgment,
    );
    const ackMessage: DisplayMessage | undefined = messages[ackIndex];
    if (
      ackIndex === -1 ||
      !ackMessage ||
      ackMessage.role !== "user" ||
      !ackMessage.awaitingAcknowledgment
    ) {
      return;
    }

    const originalText: string = ackMessage.content;
    setMessages((previous) => previous.slice(0, ackIndex));
    setInput(originalText);
    setTimeout(() => {
      composerRef.current?.focus();
    }, 0);
  }

  return (
    <TranslationProvider locale={nativeLanguage}>
      <VocabProvider onNotify={handleVocabResult}>
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
        <SideDrawer
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
          chatPath={pathname}
          currentPath={pathname}
          email={profile?.email ?? user?.email ?? null}
          displayName={displayName}
          avatarUrl={avatarUrl}
          signedIn={signedIn}
          hideCreditsNav={hideCreditsNav}
          vocabCount={vocabCount}
          credits={credits}
          maxCredits={usage.maxCredits}
          onCreditsClick={() => setShowCreditsModal(true)}
          supabaseEnabled={supabaseEnabled}
          onSignIn={() => {
            if (hideCreditsNav) {
              void signInWithGoogle();
              return;
            }
            setShowAuthModal(true);
          }}
        />
        <CreditsModal
          open={showCreditsModal}
          credits={credits}
          inviteCode={profile?.invite_code}
          onClose={() => setShowCreditsModal(false)}
          onPurchase={handleCreditsPurchase}
          onReferralCreated={refreshUsage}
        />
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignInWithGoogle={signInWithGoogle}
          onSendEmailCode={sendEmailCode}
          onVerifyEmailCode={verifyEmailCode}
        />
        <LookupModal
          open={showLookupModal}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          onClose={() => setShowLookupModal(false)}
          onInsert={insertIntoComposer}
          canSpendCredit={canSpendCredit}
          onUsageUpdate={applyUsageSnapshot}
        />
        <header className="mb-2 shrink-0 px-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="flex items-center rounded-full p-0.5 transition-colors hover:bg-stone-100"
              aria-label={t.openMenu}
            >
              <UserAvatar
                email={profile?.email ?? user?.email ?? null}
                displayName={displayName}
                avatarUrl={avatarUrl}
                signedIn={!!user}
              />
            </button>
            <StreakBadge
              streak={streakCount}
              todaySent={todayProgress.sent}
              todayThreshold={todayProgress.threshold}
              todayCompleted={todayProgress.completed}
              celebrating={streakCelebrating}
            />
            <button
              type="button"
              disabled={
                loading ||
                typingAfterAck ||
                outOfCredits
              }
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
                guestOnly={!signedIn}
                onComfortLanguageChange={handleComfortLanguageChange}
                onTargetLanguageChange={handleTargetLanguageChange}
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
                  <>
                    {displayMessages.map((message, index) => (
                      <ChatMessage
                        key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                        message={message}
                        targetLanguage={targetLanguage}
                        nativeLanguage={nativeLanguage}
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
                        onRejectCorrection={
                          message.role === "user" && message.awaitingAcknowledgment
                            ? rejectCorrection
                            : undefined
                        }
                        canSpendCredit={canSpendCredit}
                        onUsageUpdate={applyUsageSnapshot}
                      />
                    ))}
                    {typingAfterAck ? <TypingIndicator /> : null}
                  </>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              {usage.requiresSignIn ? (
                <div className="border-t border-stone-100 bg-blue-50 px-3 py-3">
                  <PaywallPrompt onSignInWithGoogle={signInWithGoogle} />
                </div>
              ) : null}

              {!usage.requiresSignIn && usage.remaining <= 0 ? (
                <div className="shrink-0 border-t border-stone-100 bg-amber-50 px-3 py-2.5">
                  <p className="text-center text-xs font-medium text-amber-700">
                    {t.outOfCreditsMessage}
                  </p>
                </div>
              ) : null}

              {error ? (
                <div className="flex items-center justify-between border-t border-stone-100 px-3 py-1.5">
                  <p className="text-xs text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={loading}
                    className="ml-2 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                  >
                    {t.retry}
                  </button>
                </div>
              ) : null}

              {!showSetupForm && !usage.requiresSignIn ? (
                <div className="shrink-0 px-3 pt-1.5">
                  {streakCelebrating ? (
                    <p className="text-center text-xs font-medium text-amber-600">
                      {t.streakCongrats(streakCount)}
                    </p>
                  ) : todayProgress.completed ? (
                    <p className="text-center text-xs text-stone-400">
                      {t.streakCompletedToday}
                    </p>
                  ) : (
                    <p className="text-center text-xs text-stone-500">
                      {t.messagesToStreak(todayProgress.remaining)}
                    </p>
                  )}
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit}
                className="shrink-0 px-3 pb-0 pt-2"
              >
                <div className={`flex flex-col border border-stone-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${hasComposerInput ? "rounded-2xl" : "rounded-full"}`}>
                  <div
                    className={
                      composerMultiline
                        ? "px-4 pt-2"
                        : "flex items-end"
                    }
                  >
                    {!composerMultiline ? (
                      <div className="m-1.5 shrink-0">{lookupButton}</div>
                    ) : null}
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
                      disabled={composerDisabled}
                      className={`resize-none border-none bg-transparent py-2 text-sm leading-5 focus:outline-none focus:ring-0 disabled:bg-stone-50 ${
                        composerMultiline ? "w-full px-0" : "flex-1 px-4"
                      }`}
                    />
                    {!composerMultiline ? (
                      <div className="m-1.5 shrink-0">{sendButton}</div>
                    ) : null}
                  </div>
                  {composerMultiline ? (
                    <div className="flex items-center justify-between px-1.5 pb-1.5">
                      {lookupButton}
                      {sendButton}
                    </div>
                  ) : null}
                  {slashLookupActive && slashLookupMatch ? (
                    <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-0.5">
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-500">
                        {slashLookupMatch[0]}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        <kbd className="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-sans text-[10px] font-medium text-stone-500">tab</kbd>
                        {" "}{t.lookupSlashTabHint}
                      </span>
                    </div>
                  ) : null}
                </div>
              </form>
            </>
          )}
        </section>
      </main>
      <ToastContainer toasts={toasts} />
      </VocabProvider>
    </TranslationProvider>
  );
}
