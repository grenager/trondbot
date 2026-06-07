"use client";

import { useCallback, useEffect, useState } from "react";
import SecondaryPageShell from "@/components/SecondaryPageShell";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { useAuth } from "@/components/AuthProvider";

interface VocabEntry {
  id: string;
  word: string;
  translation: string;
  source_language: string;
  target_language: string;
  created_at: string;
}

function VocabContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFlashcards, setShowFlashcards] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState<string>("");
  const [editTranslation, setEditTranslation] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const fetchEntries = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/vocab");
      if (!res.ok) {
        setEntries([]);
        return;
      }
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "entries" in data &&
        Array.isArray((data as Record<string, unknown>).entries)
      ) {
        setEntries((data as { entries: VocabEntry[] }).entries);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchEntries();
    } else {
      setLoading(false);
    }
  }, [user, fetchEntries]);

  function startEditing(entry: VocabEntry): void {
    setEditingId(entry.id);
    setEditWord(entry.word);
    setEditTranslation(entry.translation);
  }

  async function handleSaveEdit(): Promise<void> {
    if (!editingId || saving) {
      return;
    }

    const trimmedWord: string = editWord.trim();
    const trimmedTranslation: string = editTranslation.trim();
    if (!trimmedWord || !trimmedTranslation) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/vocab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          word: trimmedWord,
          translation: trimmedTranslation,
        }),
      });

      const data: unknown = await res.json();
      if (
        res.ok &&
        typeof data === "object" &&
        data !== null &&
        "word" in data &&
        "translation" in data
      ) {
        const updated = data as { word: string; translation: string };
        setEntries((prev) =>
          prev.map((e) =>
            e.id === editingId
              ? { ...e, word: updated.word, translation: updated.translation }
              : e,
          ),
        );
      }
    } catch {
      // Silently fail; entry stays unchanged.
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/vocab?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  function exportCsv(): void {
    const header = "word,translation,source_language,target_language\n";
    const rows: string = entries
      .map(
        (e) =>
          `"${e.word.replace(/"/g, '""')}","${e.translation.replace(/"/g, '""')}","${e.source_language}","${e.target_language}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url: string = URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = "vocab.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!user) {
    return (
      <p className="text-center text-sm text-stone-500">{t.signInForVocab}</p>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-blue-600" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">{t.vocabEmpty}</p>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFlashcards(true)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t.review}
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
        >
          {t.exportCsv}
        </button>
      </div>

      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {entries.map((entry) => (
          <div key={entry.id} className="px-4 py-3">
            {editingId === entry.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editWord}
                  onChange={(e) => setEditWord(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSaveEdit();
                    } else if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                />
                <input
                  type="text"
                  value={editTranslation}
                  onChange={(e) => setEditTranslation(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSaveEdit();
                    } else if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveEdit()}
                    disabled={saving || !editWord.trim() || !editTranslation.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-stone-300"
                  >
                    {t.saveWord}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => startEditing(entry)}
                  className="min-w-0 flex-1 text-left"
                  aria-label={t.editWord}
                >
                  <p className="text-sm font-medium text-stone-900">{entry.word}</p>
                  <p className="text-xs text-stone-500">{entry.translation}</p>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(entry.id)}
                  className="ml-3 shrink-0 rounded-md p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600"
                  aria-label={t.deleteWord}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showFlashcards ? (
        <FlashcardModal
          entries={entries}
          onClose={() => setShowFlashcards(false)}
        />
      ) : null}
    </>
  );
}

function FlashcardModal({
  entries,
  onClose,
}: {
  entries: VocabEntry[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [shuffled, setShuffled] = useState<VocabEntry[]>([]);

  useEffect(() => {
    const copy: VocabEntry[] = [...entries];
    for (let i: number = copy.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    setShuffled(copy);
  }, [entries]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % shuffled.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, shuffled.length]);

  const card: VocabEntry | undefined = shuffled[currentIndex];
  if (!card) {
    return null;
  }

  function handleNext(): void {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % shuffled.length);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-4 top-4 rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <p className="text-xs text-stone-400">
          {currentIndex + 1} / {shuffled.length}
        </p>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="flex h-48 w-full items-center justify-center rounded-2xl border-2 border-stone-200 bg-stone-50 p-6 transition-all hover:border-blue-300 hover:shadow-md"
        >
          <span className="text-center text-xl font-medium text-stone-900">
            {flipped ? card.translation : card.word}
          </span>
        </button>

        <p className="text-xs text-stone-400">
          {flipped ? "" : t.flipCard}
        </p>

        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-stone-100 px-5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
        >
          {t.nextCard}
        </button>
      </div>
    </div>
  );
}

export default function VocabPage() {
  return (
    <SecondaryPageShell titleKey="vocabTitle">
      <VocabContent />
    </SecondaryPageShell>
  );
}
