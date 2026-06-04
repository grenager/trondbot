"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { LanguageCode, UserMessageWithCorrection } from "@/lib/types";
import type { UsageSnapshot } from "@/lib/usage/client";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { debugLog } from "@/lib/debug";
import LazyWordText from "./LazyWordText";
import SpeakButton from "./SpeakButton";

const EMOJI_OPTIONS: readonly string[] = ["🎉", "✨", "🌟", "💫", "⭐"];
const PARTICLE_COUNT = 6;

interface Particle {
  emoji: string;
  x: number;
  delay: number;
}

function EmojiRain(): React.ReactElement {
  const particles: Particle[] = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        emoji: EMOJI_OPTIONS[i % EMOJI_OPTIONS.length]!,
        x: (i / (PARTICLE_COUNT - 1)) * 60 - 30,
        delay: Math.random() * 0.3,
      })),
    [],
  );

  return (
    <span className="pointer-events-none absolute -top-1 left-0 h-0 w-0 overflow-visible" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute animate-emoji-rise text-4xl opacity-0"
          style={{
            left: `${p.x - 40}px`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </span>
  );
}

interface UserBubbleProps {
  message: UserMessageWithCorrection;
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  loading?: boolean;
  onAcknowledgeCorrection?: () => void;
  onRejectCorrection?: () => void;
  canSpendCredit?: () => boolean;
  onUsageUpdate?: (usage: UsageSnapshot) => void;
}

const STATUS_LABEL_CLASS: string =
  "mt-1.5 text-xs leading-none";

export default function UserBubble({
  message,
  targetLanguage,
  nativeLanguage,
  loading = false,
  onAcknowledgeCorrection,
  onRejectCorrection,
  canSpendCredit,
  onUsageUpdate,
}: UserBubbleProps) {
  const { t } = useTranslation();
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const isAwaitingAck: boolean =
    !!message.awaitingAcknowledgment && !!message.correction;
  const wasAccepted: boolean = !!message.accepted;
  const wasCorrected: boolean = !!message.originalContent;

  useEffect(() => {
    if (!loading) {
      return;
    }

    debugLog("ui", "UserBubble checking visible", {
      contentPreview: message.content.slice(0, 40),
      awaitingAcknowledgment: message.awaitingAcknowledgment === true,
      accepted: message.accepted === true,
      hasCorrection: message.correction !== undefined,
    });
  }, [loading, message]);

  useEffect(() => {
    if (!isAwaitingAck || !onAcknowledgeCorrection) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Enter") {
        e.preventDefault();
        onAcknowledgeCorrection();
      } else if (e.key === "Escape" && onRejectCorrection) {
        e.preventDefault();
        onRejectCorrection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAwaitingAck, onAcknowledgeCorrection, onRejectCorrection]);

  return (
    <div className="flex flex-col items-end">
      <div className="flex w-full max-w-[85%] flex-col items-end">
        <div className="relative w-fit max-w-full rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 pr-8 text-sm text-white">
          <LazyWordText
            text={message.content}
            messageLanguage={targetLanguage}
            glossLanguage={nativeLanguage}
            variant="onDark"
            canSpendCredit={canSpendCredit}
            onUsageUpdate={onUsageUpdate}
          />
          <SpeakButton
            text={message.content}
            language={targetLanguage}
            variant="user"
          />
        </div>

        {loading ? (
          <div
            className={`${STATUS_LABEL_CLASS} flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 font-medium text-blue-700`}
            role="status"
            aria-live="polite"
          >
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
              aria-hidden="true"
            />
            <span>{t.checking}</span>
          </div>
        ) : null}

        {wasAccepted ? (
          <div className="relative">
            <p className={`${STATUS_LABEL_CLASS} font-medium text-green-600`}>
              {t.perfect}
            </p>
            <EmojiRain />
          </div>
        ) : null}

        {wasCorrected && !isAwaitingAck ? (
          <div className={`${STATUS_LABEL_CLASS} relative`}>
            <button
              type="button"
              onClick={() => setShowExplanation((current) => !current)}
              className="text-stone-400 underline decoration-dotted underline-offset-2 hover:text-stone-600"
            >
              {t.corrected}
            </button>
            {showExplanation && message.correction ? (
              <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg bg-stone-800 px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg">
                <p className="mb-1.5 text-stone-300">
                  <span className="font-medium text-stone-100">{t.original}</span>{" "}
                  {message.originalContent}
                </p>
                <p>{message.correction.explanation}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {isAwaitingAck && message.correction ? (
          <>
            <div className={`${STATUS_LABEL_CLASS} relative`}>
              <button
                type="button"
                onClick={() => setShowExplanation((current) => !current)}
                className="text-stone-400 underline decoration-dotted underline-offset-2 hover:text-stone-600"
              >
                {t.corrected}
              </button>
              {showExplanation ? (
                <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg bg-stone-800 px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg">
                  <p className="mb-1.5 text-stone-300">
                    <span className="font-medium text-stone-100">{t.original}</span>{" "}
                    {message.content}
                  </p>
                  <p>{message.correction.explanation}</p>
                </div>
              ) : null}
            </div>
            <div className="relative mt-1.5 w-fit max-w-full rounded-2xl rounded-br-md border-2 border-blue-300 bg-blue-50 px-4 py-2.5 pr-8 text-sm text-blue-900">
              <LazyWordText
                text={message.correction.corrected}
                messageLanguage={targetLanguage}
                glossLanguage={nativeLanguage}
                canSpendCredit={canSpendCredit}
            onUsageUpdate={onUsageUpdate}
              />
              <SpeakButton
                text={message.correction.corrected}
                language={targetLanguage}
                variant="correction"
              />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onAcknowledgeCorrection}
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
              >
                {t.accept}
              </button>
              <button
                type="button"
                onClick={onRejectCorrection}
                className="text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
              >
                {t.reject}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
