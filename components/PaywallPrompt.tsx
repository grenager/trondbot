"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface PaywallPromptProps {
  onSignInWithGoogle: () => Promise<string | null>;
  buttonLabel?: string;
}

export default function PaywallPrompt({
  onSignInWithGoogle,
  buttonLabel,
}: PaywallPromptProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const authError: string | null = await onSignInWithGoogle();
      if (authError) {
        setError(authError);
      }
    } catch {
      setError(t.authError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="space-y-1">
        <p className="text-sm leading-relaxed text-stone-700">
          {t.trialLimitUsedCredits}
        </p>
        <p className="text-sm leading-relaxed text-stone-700">
          {t.trialLimitSignInForMore}
        </p>
      </div>
      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleGoogleSignIn()}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel ?? t.signInWithGoogle}
      </button>
      <p className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
        {t.signInPaywallFreeBadge}
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
