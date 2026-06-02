"use client";

import { useState } from "react";
import type { LanguageCode, UserMessageWithCorrection } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import SpeakButton from "./SpeakButton";

interface UserBubbleProps {
  message: UserMessageWithCorrection;
  language: LanguageCode;
  loading?: boolean;
  onAcknowledgeCorrection?: () => void;
}

const STATUS_LABEL_CLASS: string =
  "mt-1.5 text-xs leading-none";

export default function UserBubble({
  message,
  language,
  loading = false,
  onAcknowledgeCorrection,
}: UserBubbleProps) {
  const { t } = useTranslation();
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const isAwaitingAck: boolean =
    !!message.awaitingAcknowledgment && !!message.correction;
  const wasAccepted: boolean = !!message.accepted;
  const wasCorrected: boolean = !!message.originalContent;

  return (
    <div className="flex flex-col items-end">
      <div className="flex w-full max-w-[85%] flex-col items-end">
        <div className="relative w-fit max-w-full rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 pr-8 text-sm text-white">
          {message.content}
          <SpeakButton
            text={message.content}
            language={language}
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
          <p className={`${STATUS_LABEL_CLASS} font-medium text-green-600`}>
            {t.perfect}
          </p>
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
              {message.correction.corrected}
              <SpeakButton
                text={message.correction.corrected}
                language={language}
                variant="correction"
              />
            </div>
            <button
              type="button"
              onClick={onAcknowledgeCorrection}
              className={`${STATUS_LABEL_CLASS} rounded-lg px-3 py-1.5 font-medium text-blue-600 transition-colors hover:bg-blue-50`}
            >
              {t.acceptChanges}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
