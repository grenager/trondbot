"use client";

import { useEffect, useState } from "react";
import {
  isSpeechSupported,
  speakText,
  stopSpeaking,
  warmupSpeechVoices,
} from "@/lib/tts";
import type { LanguageCode } from "@/lib/types";

interface SpeakButtonProps {
  text: string;
  language: LanguageCode;
  variant: "user" | "assistant" | "correction";
}

export default function SpeakButton({
  text,
  language,
  variant,
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const supported: boolean = isSpeechSupported();

  useEffect(() => {
    void warmupSpeechVoices();
  }, []);

  useEffect(() => {
    return () => {
      if (speaking) {
        stopSpeaking();
      }
    };
  }, [speaking]);

  if (!supported) {
    return null;
  }

  function handleClick(): void {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    void speakText(text, language, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  }

  const colorClass: string =
    variant === "user"
      ? "text-blue-200 hover:text-white"
      : variant === "correction"
        ? "text-stone-400 hover:text-stone-600"
        : "text-stone-400 hover:text-stone-600";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={speaking ? "Stop audio" : "Play message"}
      className={`shrink-0 rounded p-1 transition-colors ${colorClass} ${
        speaking ? "opacity-100" : "opacity-70 hover:opacity-100"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
