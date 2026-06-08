"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface StreakBadgeProps {
  streak: number;
  todaySent: number;
  todayThreshold: number;
  todayCompleted: boolean;
  celebrating: boolean;
}

export default function StreakBadge({
  streak,
  todaySent,
  todayThreshold,
  todayCompleted,
  celebrating,
}: StreakBadgeProps) {
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

  const label: string = todayCompleted
    ? `${streak} day streak`
    : `${todaySent}/${todayThreshold} for streak`;

  return (
    <Link
      href="/history"
      className={`flex items-center gap-1 rounded-full px-2 py-1 transition-all hover:bg-stone-100 ${
        pulse ? "animate-bounce" : ""
      }`}
      aria-label={todayCompleted ? t.dayStreak(streak) : `${todaySent}/${todayThreshold}`}
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
      <span className={`text-xs font-semibold ${todayCompleted ? "text-stone-700" : "text-stone-400"}`}>
        {label}
      </span>
    </Link>
  );
}
