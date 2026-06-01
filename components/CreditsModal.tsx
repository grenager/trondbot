"use client";

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

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      targetOrEventName: string | Date,
      params?: Record<string, string | number>,
    ) => void;
  }
}

function trackCreditPurchase(credits: number, priceUsd: number): void {
  window.gtag?.("event", "purchase_credits", {
    credit_amount: credits,
    value: priceUsd,
    currency: "USD",
  });
}

interface CreditsModalProps {
  open: boolean;
  credits: number;
  onClose: () => void;
  onPurchase: (creditsToAdd: number) => void;
}

export default function CreditsModal({
  open,
  credits,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  if (!open) return null;

  function handlePurchase(option: CreditPurchaseOption): void {
    trackCreditPurchase(option.credits, option.priceUsd);
    onPurchase(option.credits);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
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
        <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
          Message Credits
        </h2>
        <p className="text-sm leading-relaxed text-stone-600">
          You have{" "}
          <span className="font-semibold text-stone-900">{credits}</span>{" "}
          messages remaining.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          First 100 messages are free. Choose a credit pack below to keep
          chatting.
        </p>
        <div className="mt-5 space-y-2">
          {PURCHASE_OPTIONS.map((option) => (
            <button
              key={option.credits}
              type="button"
              onClick={() => handlePurchase(option)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
