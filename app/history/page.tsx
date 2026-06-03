"use client";

import { useEffect, useState } from "react";
import SecondaryPageShell from "@/components/SecondaryPageShell";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { getScenarioLabel } from "@/lib/i18n";
import { getActivityStats, type ActivityStats } from "@/lib/activity";
import { LANGUAGES } from "@/lib/languages";
import { loadStoredState } from "@/lib/storage";
import type { LanguageCode } from "@/lib/types";

function getFlag(code: LanguageCode): string {
  const language = LANGUAGES.find((entry) => entry.code === code);
  return language?.flag ?? "";
}

function HistoryContent() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const storedState = loadStoredState();
  const sessionMessageCount: number = storedState.messages.filter(
    (message) => message.role === "user",
  ).length;

  useEffect(() => {
    setStats(getActivityStats());
  }, []);

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.currentStreak}
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {t.dayStreak(stats.currentStreak)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.longestStreak}
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {t.dayStreak(stats.longestStreak)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {t.totalMessages}
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {stats.totalMessages}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">
          {t.currentSession}
        </h2>
        <p className="mt-2 text-sm text-stone-700">
          {getFlag(storedState.targetLanguage)}{" "}
          {getScenarioLabel(storedState.scenario, locale)}
        </p>
        <p className="mt-1 text-sm text-stone-600">
          {t.messagesSent(sessionMessageCount)}
        </p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">
          {t.recentActivity}
        </h2>
        {stats.recentDates.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">{t.noActivityYet}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.recentDates.map((date) => (
              <li
                key={date}
                className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700"
              >
                {date}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <SecondaryPageShell titleKey="historyTitle">
      <HistoryContent />
    </SecondaryPageShell>
  );
}
