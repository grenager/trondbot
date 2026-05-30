"use client";

import { useState } from "react";
import type { LanguageCode, UserMessageWithCorrection } from "@/lib/types";
import SpeakButton from "./SpeakButton";

interface UserBubbleProps {
  message: UserMessageWithCorrection;
  language: LanguageCode;
  loading?: boolean;
  onAcknowledgeCorrection?: () => void;
}

export default function UserBubble({
  message,
  language,
  loading = false,
  onAcknowledgeCorrection,
}: UserBubbleProps) {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const isAwaitingAck: boolean =
    !!message.awaitingAcknowledgment && !!message.correction;
  const wasAccepted: boolean = !!message.accepted;
  const wasCorrected: boolean = !!message.originalContent;

  return (
    <div className="flex flex-col items-end">
      <div className="relative max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 pr-8 text-sm text-white">
        {message.content}
        <SpeakButton
          text={message.content}
          language={language}
          variant="user"
        />
      </div>

      {loading ? (
        <div className="mt-1.5 flex items-center gap-1.5 self-end text-xs text-stone-400">
          <span>Checking</span>
          <span className="flex items-center gap-0.5">
            <span className="h-1 w-1 animate-bounce rounded-full bg-stone-400 [animation-delay:0ms]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
          </span>
        </div>
      ) : null}

      {wasAccepted ? (
        <p className="mt-1.5 self-end text-xs font-medium text-green-600">
          Perfect!
        </p>
      ) : null}

      {wasCorrected && !isAwaitingAck ? (
        <div className="relative mt-1.5 self-end">
          <button
            type="button"
            onClick={() => setShowExplanation((current) => !current)}
            className="text-xs text-stone-400 underline decoration-dotted underline-offset-2 hover:text-stone-600"
          >
            Corrected
          </button>
          {showExplanation && message.correction ? (
            <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg bg-stone-800 px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg">
              <p className="mb-1.5 text-stone-300">
                <span className="font-medium text-stone-100">Original:</span>{" "}
                {message.originalContent}
              </p>
              <p>{message.correction.explanation}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {isAwaitingAck && message.correction ? (
        <div className="mt-2 flex flex-col items-end gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExplanation((current) => !current)}
              className="text-xs text-stone-400 underline decoration-dotted underline-offset-2 hover:text-stone-600"
            >
              Corrected
            </button>
            {showExplanation ? (
              <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg bg-stone-800 px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg">
                <p className="mb-1.5 text-stone-300">
                  <span className="font-medium text-stone-100">Original:</span>{" "}
                  {message.content}
                </p>
                <p>{message.correction.explanation}</p>
              </div>
            ) : null}
          </div>
          <div className="relative max-w-[85%] rounded-2xl rounded-br-md border-2 border-blue-300 bg-blue-50 px-4 py-2.5 pr-8 text-sm text-blue-900">
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
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Accept Changes
          </button>
        </div>
      ) : null}
    </div>
  );
}
