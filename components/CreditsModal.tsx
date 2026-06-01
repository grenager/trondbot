"use client";

interface CreditsModalProps {
  open: boolean;
  credits: number;
  onClose: () => void;
}

export default function CreditsModal({ open, credits, onClose }: CreditsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-stone-900">
          Message Credits
        </h2>
        <p className="text-sm leading-relaxed text-stone-600">
          You have <span className="font-semibold text-stone-900">{credits}</span> messages remaining.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          First 100 messages are free. Afterwards you can buy 100 credits for $2.
        </p>
        <button
          type="button"
          disabled
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
        >
          Purchase Credits for $2.00
        </button>
        <p className="mt-2 text-center text-xs text-stone-400">Coming soon</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
