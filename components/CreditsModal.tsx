"use client";

import { useEffect, useState } from "react";
import { trackCreditPurchase } from "@/lib/analytics";
import { MAX_TOTAL_CREDITS } from "@/lib/storage";

interface CreditPurchaseOption {
  credits: number;
  priceUsd: number;
  label: string;
}

const PURCHASE_OPTIONS: readonly CreditPurchaseOption[] = [
  { credits: 100, priceUsd: 2, label: "Buy 100 credits ($2)" },
  { credits: 250, priceUsd: 5, label: "Buy 250 credits ($5)" },
  { credits: 500, priceUsd: 10, label: "Buy 500 credits ($10)" },
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
        aria-label="Close"
        className="absolute inset-0 bg-stone-900/40"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
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
              Credits Added
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              Surprise, credits are currently free of charge! We have added{" "}
              <span className="font-semibold text-stone-900">
                {confirmationCredits}
              </span>{" "}
              credits to your account. Happy chatting!
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              OK
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
              Message Credits
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              You have{" "}
              <span className="font-semibold text-stone-900">{credits}</span>{" "}
              messages remaining.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              If you are out of credits you will need to purchase more in order
              to continue chatting with Trondbot.
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
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
