"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  last_reviewed_at: string | null;
}

function VocabContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flashcardDirection, setFlashcardDirection] = useState<"source-to-target" | "target-to-source" | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
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
          onClick={() => setFlashcardDirection("source-to-target")}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t.review} →
        </button>
        <button
          type="button"
          onClick={() => setFlashcardDirection("target-to-source")}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          ← {t.review}
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
        >
          {t.exportCsv}
        </button>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.vocabSearchPlaceholder}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {entries
          .filter((entry) => {
            if (!searchQuery.trim()) {
              return true;
            }
            const q: string = searchQuery.toLowerCase();
            return (
              entry.word.toLowerCase().includes(q) ||
              entry.translation.toLowerCase().includes(q)
            );
          })
          .map((entry) => (
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
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900">{entry.word}</p>
                  <p className="text-xs text-stone-500">{entry.translation}</p>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(entry)}
                    className="rounded-md p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    aria-label={t.editWord}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry.id)}
                    className="rounded-md p-2 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600"
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
              </div>
            )}
          </div>
        ))}
      </div>

      {flashcardDirection !== null ? (
        <FlashcardModal
          entries={entries}
          direction={flashcardDirection}
          onClose={() => setFlashcardDirection(null)}
        />
      ) : null}
    </>
  );
}

function FlashcardModal({
  entries,
  direction,
  onClose,
}: {
  entries: VocabEntry[];
  direction: "source-to-target" | "target-to-source";
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [shuffled, setShuffled] = useState<VocabEntry[]>(() => {
    const copy: VocabEntry[] = [...entries];
    copy.sort((a, b) => {
      const aTime: number = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0;
      const bTime: number = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
      return aTime - bTime;
    });
    // Light shuffle within similar staleness tiers (4-hour window)
    const TIER_MS = 4 * 60 * 60 * 1000;
    for (let i = 0; i < copy.length - 1; i++) {
      const iTime: number = copy[i]!.last_reviewed_at ? new Date(copy[i]!.last_reviewed_at!).getTime() : 0;
      let j: number = i + 1;
      while (j < copy.length) {
        const jTime: number = copy[j]!.last_reviewed_at ? new Date(copy[j]!.last_reviewed_at!).getTime() : 0;
        if (jTime - iTime > TIER_MS) break;
        j++;
      }
      // Shuffle within [i, j)
      for (let k: number = j - 1; k > i; k--) {
        const r: number = i + Math.floor(Math.random() * (k - i + 1));
        [copy[k], copy[r]] = [copy[r]!, copy[k]!];
      }
      i = j - 1;
    }
    return copy;
  });

  const reviewedIds = useRef<Set<string>>(new Set());

  function markReviewed(id: string): void {
    if (reviewedIds.current.has(id)) return;
    reviewedIds.current.add(id);
    void fetch("/api/vocab/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipped((prev) => {
          if (!prev) {
            const c: VocabEntry | undefined = shuffled[currentIndex];
            if (c) markReviewed(c.id);
          }
          return !prev;
        });
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % shuffled.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + shuffled.length) % shuffled.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, shuffled, currentIndex]);

  const card: VocabEntry | undefined = shuffled[currentIndex];
  if (!card) {
    return null;
  }

  function handlePrevious(): void {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + shuffled.length) % shuffled.length);
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
          onClick={() => {
            setFlipped((prev) => {
              if (!prev) markReviewed(card.id);
              return !prev;
            });
          }}
          className="flex h-48 w-full items-center justify-center rounded-2xl border-2 border-stone-200 bg-stone-50 p-6 transition-all hover:border-blue-300 hover:shadow-md"
        >
          <span className="text-center text-xl font-medium text-stone-900">
            {flipped
              ? (direction === "source-to-target" ? card.translation : card.word)
              : (direction === "source-to-target" ? card.word : card.translation)}
          </span>
        </button>

        <p className="text-xs text-stone-400">
          {flipped ? "" : t.flipCard}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            className="rounded-lg bg-stone-100 px-5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-stone-100 px-5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
          >
            {t.nextCard} →
          </button>
        </div>

        <p className="text-center text-[10px] text-stone-300">
          {t.flashcardKeyboardHint}
        </p>
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
