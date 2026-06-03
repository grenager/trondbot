"use client";

import CreditsPanel from "@/components/CreditsPanel";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface CreditsModalProps {
  open: boolean;
  credits: number;
  inviteCode?: string;
  onClose: () => void;
  onPurchase: (creditsToAdd: number) => number;
}

export default function CreditsModal({
  open,
  credits,
  inviteCode,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <CreditsPanel
          credits={credits}
          inviteCode={inviteCode}
          onPurchase={onPurchase}
        />
      </div>
    </div>
  );
}
