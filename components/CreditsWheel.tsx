"use client";

import { INITIAL_FREE_CREDITS } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface CreditsWheelProps {
  credits: number;
  onClick: () => void;
}

export default function CreditsWheel({ credits, onClick }: CreditsWheelProps) {
  const { t } = useTranslation();
  const ratio: number = Math.min(credits / INITIAL_FREE_CREDITS, 1);
  const radius = 9;
  const circumference: number = 2 * Math.PI * radius;
  const strokeDashoffset: number = circumference * (1 - ratio);
  const color: string = ratio > 0.2 ? "#3b82f6" : "#ef4444";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-stone-500 transition-colors hover:text-stone-700"
      aria-label={t.creditsRemainingAria(credits)}
    >
      <svg width="20" height="20" className="-rotate-90">
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="2"
        />
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-medium">{t.creditsLabel(credits)}</span>
    </button>
  );
}
