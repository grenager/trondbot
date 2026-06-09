"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getLanguageLabelLocalized } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { applyUsageFromApiResponse, type UsageSnapshot } from "@/lib/usage/client";
import { useVocabSave } from "@/components/VocabContext";
import type { LanguageCode } from "@/lib/types";

interface LookupModalProps {
  open: boolean;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  onClose: () => void;
  onInsert: (word: string) => void;
  canSpendCredit?: () => boolean;
  onUsageUpdate?: (usage: UsageSnapshot) => void;
  composerContext?: string;
}

export default function LookupModal({
  open,
  nativeLanguage,
  targetLanguage,
  onClose,
  onInsert,
  canSpendCredit,
  onUsageUpdate,
  composerContext,
}: LookupModalProps) {
  const { t, locale } = useTranslation();
  const vocabSave = useVocabSave();
  const [sourceWord, setSourceWord] = useState<string>("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setSourceWord("");
      setTranslation(null);
      setError(null);
      setLoading(false);
      return;
    }

    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !translation) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Enter") {
        event.preventDefault();
        if (translation) {
          onInsert(translation);
          onClose();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, translation, onInsert, onClose]);

  if (!open) {
    return null;
  }

  async function handleLookup(event?: FormEvent<HTMLFormElement>): Promise<void> {
    event?.preventDefault();

    const word: string = sourceWord.trim();
    if (!word || loading) {
      return;
    }

    if (canSpendCredit && !canSpendCredit()) {
      setError(t.noCreditsForWordLookup);
      return;
    }

    setLoading(true);
    setError(null);
    setTranslation(null);

    try {
      const context: string = (composerContext ?? "").trim();
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          nativeLanguage,
          targetLanguage,
          ...(context ? { context } : {}),
        }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const errorMessage: string =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : t.lookupFailed;
        throw new Error(errorMessage);
      }

      if (onUsageUpdate) {
        applyUsageFromApiResponse(data, onUsageUpdate);
      }

      const nextTranslation: unknown =
        typeof data === "object" && data !== null && "translation" in data
          ? data.translation
          : null;

      if (typeof nextTranslation !== "string" || nextTranslation.trim().length === 0) {
        setError(t.lookupNoResult);
        return;
      }

      setTranslation(nextTranslation.trim());
      vocabSave({
        word: word,
        translation: nextTranslation.trim(),
        sourceLanguage: nativeLanguage,
        targetLanguage,
      });
    } catch (lookupError: unknown) {
      const message: string =
        lookupError instanceof Error ? lookupError.message : t.lookupFailed;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleInsert(): void {
    if (!translation) {
      return;
    }

    onInsert(translation);
    onClose();
  }

  const sourceLabel: string = getLanguageLabelLocalized(nativeLanguage, locale);
  const targetLabel: string = getLanguageLabelLocalized(targetLanguage, locale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
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

        <h2 className="pr-8 text-base font-semibold text-stone-900">
          {t.lookupTitle}
        </h2>
        <p className="mt-1 text-xs text-stone-500">{t.lookupDescription}</p>
        <p className="mt-1.5 text-xs text-stone-400 italic">
          {t.lookupSlashHint}
        </p>

        <form onSubmit={handleLookup} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-600">
              {t.lookupSourceLabel(sourceLabel)}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={sourceWord}
              onChange={(event) => {
                setSourceWord(event.target.value);
                setTranslation(null);
                setError(null);
              }}
              placeholder={t.lookupSourcePlaceholder}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            disabled={!sourceWord.trim() || loading}
            className="w-full rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {loading ? t.checking : t.lookupAction}
          </button>
        </form>

        {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

        {translation ? (
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
            <p className="text-xs font-medium text-stone-500">
              {t.lookupTargetLabel(targetLabel)}
            </p>
            <p className="mt-1 text-base font-medium text-stone-900">
              {translation}
            </p>
            <button
              type="button"
              onClick={handleInsert}
              className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t.lookupInsert}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
