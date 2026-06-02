"use client";

import { useTranslation } from "@/lib/i18n/TranslationContext";

export default function TypingIndicator() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3"
        aria-label={t.agentIsTyping}
        role="status"
      >
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
