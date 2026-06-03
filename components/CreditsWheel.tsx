"use client";

import { useTranslation } from "@/lib/i18n/TranslationContext";

interface CreditsWheelProps {
  credits: number;
  maxCredits: number;
  disabled?: boolean;
  onClick: () => void;
}

export default function CreditsWheel({
  credits,
  maxCredits,
  disabled = false,
  onClick,
}: CreditsWheelProps) {
  const { t } = useTranslation();
  const ratio: number = maxCredits > 0 ? Math.min(credits / maxCredits, 1) : 0;
  const radius = 9;
  const circumference: number = 2 * Math.PI * radius;
  const strokeDashoffset: number = circumference * (1 - ratio);
  const color: string = ratio > 0.2 ? "#3b82f6" : "#ef4444";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-1 text-stone-500 transition-colors hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-stone-500"
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
