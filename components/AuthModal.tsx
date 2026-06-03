"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

type AuthMode = "sign-in" | "sign-up";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignUp: (email: string, password: string) => Promise<string | null>;
}

export default function AuthModal({
  open,
  onClose,
  onSignIn,
  onSignUp,
}: AuthModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setMode("sign-in");
      setEmail("");
      setPassword("");
      setError(null);
      setMessage(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const authError: string | null =
        mode === "sign-in"
          ? await onSignIn(email.trim(), password)
          : await onSignUp(email.trim(), password);

      if (authError) {
        setError(authError);
        return;
      }

      if (mode === "sign-up") {
        setMessage(t.checkEmailConfirm);
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
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
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

        <h2 className="mb-4 pr-8 text-lg font-semibold text-stone-900">
          {mode === "sign-in" ? t.signIn : t.createAccount}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-600">
              {t.password}
            </span>
            <input
              type="password"
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : null}

          {message ? (
            <p className="text-xs text-green-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? t.loadingAccount
              : mode === "sign-in"
                ? t.signIn
                : t.createAccount}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-xs text-stone-500 transition-colors hover:text-stone-700"
        >
          {mode === "sign-in" ? t.dontHaveAccount : t.alreadyHaveAccount}
        </button>
      </div>
    </div>
  );
}
