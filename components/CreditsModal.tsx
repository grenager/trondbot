"use client";

import { useEffect, useState } from "react";
import { trackCreditPurchase } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { MAX_TOTAL_CREDITS } from "@/lib/storage";

interface CreditPurchaseOption {
  credits: number;
  priceUsd: number;
  labelKey: "buy100Credits" | "buy250Credits" | "buy500Credits";
}

const PURCHASE_OPTIONS: readonly CreditPurchaseOption[] = [
  { credits: 100, priceUsd: 2, labelKey: "buy100Credits" },
  { credits: 250, priceUsd: 5, labelKey: "buy250Credits" },
  { credits: 500, priceUsd: 10, labelKey: "buy500Credits" },
] as const;

interface CreditsModalProps {
  open: boolean;
  credits: number;
  onClose: () => void;
  onPurchase: (creditsToAdd: number) => number;
}

export default function CreditsModal({
  open,
  credits,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  const { t } = useTranslation();
  const [confirmationCredits, setConfirmationCredits] = useState<number | null>(
    null,
  );
  const atCreditCap: boolean = credits >= MAX_TOTAL_CREDITS;

  useEffect(() => {
    if (!open) {
      setConfirmationCredits(null);
    }
  }, [open]);

  if (!open) return null;

  function handleClose(): void {
    setConfirmationCredits(null);
    onClose();
  }

  function handlePurchase(option: CreditPurchaseOption): void {
    trackCreditPurchase(option.credits, option.priceUsd);
    const creditsAdded: number = onPurchase(option.credits);
    if (creditsAdded > 0) {
      setConfirmationCredits(creditsAdded);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label={t.close}
          className="absolute right-4 top-4 rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
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
        {confirmationCredits !== null ? (
          <>
            <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
              {t.creditsAdded}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              {t.creditsAddedMessage(confirmationCredits)}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t.ok}
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
              {t.messageCredits}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              {t.youHaveMessagesRemaining(credits)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {t.outOfCreditsMessage}
            </p>
            <div className="mt-5 space-y-2">
              {PURCHASE_OPTIONS.map((option, index) => (
                <button
                  key={option.credits}
                  type="button"
                  disabled={atCreditCap}
                  onClick={() => handlePurchase(option)}
                  className={
                    index === 0
                      ? "w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      : "w-full rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  }
                >
                  {t[option.labelKey]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
