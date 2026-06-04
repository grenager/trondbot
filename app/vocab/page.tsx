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

type Tab = "list" | "flashcards";

function VocabContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<Tab>("list");

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "list"
              ? "bg-blue-600 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {t.wordList}
        </button>
        <button
          type="button"
          onClick={() => setTab("flashcards")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "flashcards"
              ? "bg-blue-600 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {t.flashcards}
        </button>
      </div>

      {tab === "list" ? (
        <WordList
          entries={entries}
          onDelete={handleDelete}
          onExport={exportCsv}
        />
      ) : (
        <Flashcards entries={entries} />
      )}
    </div>
  );
}

function WordList({
  entries,
  onDelete,
  onExport,
}: {
  entries: VocabEntry[];
  onDelete: (id: string) => void;
  onExport: () => void;
}) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">{t.vocabEmpty}</p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onExport}
        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
      >
        {t.exportCsv}
      </button>

      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900">{entry.word}</p>
              <p className="text-xs text-stone-500">{entry.translation}</p>
            </div>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
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
        ))}
      </div>
    </div>
  );
}

function Flashcards({ entries }: { entries: VocabEntry[] }) {
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
    setCurrentIndex(0);
    setFlipped(false);
  }, [entries]);

  if (shuffled.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">{t.vocabEmpty}</p>
    );
  }

  const card: VocabEntry | undefined = shuffled[currentIndex];
  if (!card) {
    return null;
  }

  function handleNext(): void {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % shuffled.length);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-xs text-stone-400">
        {currentIndex + 1} / {shuffled.length}
      </p>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex h-48 w-full max-w-sm items-center justify-center rounded-2xl border-2 border-stone-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
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
        className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
      >
        {t.nextCard}
      </button>
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
