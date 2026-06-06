"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface StreakBadgeProps {
  streak: number;
  celebrating: boolean;
}

export default function StreakBadge({ streak, celebrating }: StreakBadgeProps) {
  const { t } = useTranslation();
  const [pulse, setPulse] = useState<boolean>(false);

  useEffect(() => {
    if (!celebrating) {
      return;
    }
    setPulse(true);
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setPulse(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [celebrating]);

  return (
    <Link
      href="/history"
      className={`flex items-center gap-1 rounded-full px-2 py-1 transition-all hover:bg-stone-100 ${
        pulse ? "animate-bounce" : ""
      }`}
      aria-label={t.dayStreak(streak)}
    >
      <span
        className={`text-base transition-transform ${
          pulse ? "scale-125" : ""
        }`}
        style={{
          display: "inline-block",
          transition: "transform 0.3s ease",
        }}
      >
        🔥
      </span>
      <span className="text-xs font-semibold text-stone-700">
        {streak > 0 ? streak : t.streakStartPrompt}
      </span>
    </Link>
  );
}
