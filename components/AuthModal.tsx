"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

type AuthStep = "options" | "verify-code";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  paywall?: boolean;
  onSignInWithGoogle: () => Promise<string | null>;
  onSendEmailCode: (email: string) => Promise<string | null>;
  onVerifyEmailCode: (email: string, code: string) => Promise<string | null>;
}

export default function AuthModal({
  open,
  onClose,
  paywall = false,
  onSignInWithGoogle,
  onSendEmailCode,
  onVerifyEmailCode,
}: AuthModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<AuthStep>("options");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setStep("options");
      setEmail("");
      setCode("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function handleDismiss(): void {
    if (paywall) {
      return;
    }
    onClose();
  }

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

  async function handleSendCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const authError: string | null = await onSendEmailCode(email.trim());
      if (authError) {
        setError(authError);
        return;
      }

      setStep("verify-code");
    } catch {
      setError(t.authError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const authError: string | null = await onVerifyEmailCode(
        email.trim(),
        code.trim(),
      );
      if (authError) {
        setError(authError);
        return;
      }

      onClose();
    } catch {
      setError(t.authError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={handleDismiss}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        {!paywall ? (
          <button
            type="button"
            onClick={handleDismiss}
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
        ) : null}

        <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
          {paywall ? t.signInToContinue : t.signIn}
        </h2>
        {paywall ? (
          <div className="mb-4 space-y-1">
            <p className="text-sm leading-relaxed text-stone-600">
              {t.trialLimitUsedCredits}
            </p>
            <p className="text-sm leading-relaxed text-stone-600">
              {t.trialLimitSignInForMore}
            </p>
          </div>
        ) : null}

        {step === "verify-code" && !paywall ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-600">
              {t.codeSentMessage(email.trim())}
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-600">
                {t.enterSignInCode}
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-center text-lg tracking-[0.3em] text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting || code.length < 6}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t.loadingAccount : t.verifyCode}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("options");
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-xs text-stone-500 transition-colors hover:text-stone-700"
            >
              {t.useDifferentEmail}
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleGoogleSignIn()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t.signInWithGoogle}
            </button>

            {paywall ? (
              <>
                {error ? (
                  <p className="mt-3 text-center text-xs text-red-600">{error}</p>
                ) : null}
                <div className="mt-3 flex justify-center">
                  <p className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
                    {t.signInPaywallFreeBadge}
                  </p>
                </div>
              </>
            ) : null}

            {!paywall ? (
              <>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-xs font-medium text-stone-400">
                    {t.orDivider}
                  </span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>

                <form onSubmit={handleSendCode} className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-stone-600">
                      {t.email}
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  {error ? <p className="text-xs text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? t.loadingAccount : t.sendSignInCode}
                  </button>
                </form>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
