"use client";

import { FormEvent, useEffect, useState } from "react";
import SecondaryPageShell from "@/components/SecondaryPageShell";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { getLanguageLabelLocalized } from "@/lib/i18n";
import { loadStoredState } from "@/lib/storage";
import {
  loadUserSettings,
  saveUserSettings,
  type UserSettings,
} from "@/lib/userSettings";

function SettingsContent() {
  const { t, locale } = useTranslation();
  const { user, profile, displayName, supabaseEnabled, updateProfileDisplayName, signOut } = useAuth();
  const storedState = loadStoredState();
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings);
  const [displayNameInput, setDisplayNameInput] = useState<string>("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setDisplayNameInput(displayName ?? profile?.display_name ?? "");
  }, [displayName, profile?.display_name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setSavedMessage(null);

    saveUserSettings(settings);

    if (supabaseEnabled && user) {
      await updateProfileDisplayName(displayNameInput.trim() || null);
    }

    setSaving(false);
    setSavedMessage(t.settingsSaved);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">
          {t.reminderEnabled}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {t.reminderEnabledDescription}
        </p>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.reminderEnabled}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                reminderEnabled: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-stone-700">{t.reminderEnabled}</span>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-stone-700">
            {t.reminderTime}
          </span>
          <input
            type="time"
            value={`${String(settings.reminderHour).padStart(2, "0")}:${String(settings.reminderMinute).padStart(2, "0")}`}
            disabled={!settings.reminderEnabled}
            onChange={(event) => {
              const [hourText, minuteText] = event.target.value.split(":");
              const reminderHour = Number.parseInt(hourText ?? "9", 10);
              const reminderMinute = Number.parseInt(minuteText ?? "0", 10);
              setSettings((previous) => ({
                ...previous,
                reminderHour: Number.isFinite(reminderHour) ? reminderHour : 9,
                reminderMinute: Number.isFinite(reminderMinute)
                  ? reminderMinute
                  : 0,
              }));
            }}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 disabled:bg-stone-50"
          />
        </label>
      </section>

      {supabaseEnabled && user ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <label className="block">
            <span className="text-sm font-semibold text-stone-900">
              {t.displayName}
            </span>
            <input
              type="text"
              value={displayNameInput}
              onChange={(event) => setDisplayNameInput(event.target.value)}
              placeholder={t.displayNamePlaceholder}
              className="mt-2 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </section>
      ) : null}

      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">
          {t.languageDefaults}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {t.languageDefaultsDescription}
        </p>
        <p className="mt-3 text-sm text-stone-800">
          {getLanguageLabelLocalized(storedState.nativeLanguage, locale)} →{" "}
          {getLanguageLabelLocalized(storedState.targetLanguage, locale)}
        </p>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {t.saveSettings}
      </button>

      {savedMessage ? (
        <p className="text-center text-sm text-green-700">{savedMessage}</p>
      ) : null}

      {supabaseEnabled && user ? (
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-8 w-full text-center text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {t.signOut}
        </button>
      ) : null}
    </form>
  );
}

export default function SettingsPage() {
  return (
    <SecondaryPageShell titleKey="settingsTitle">
      <SettingsContent />
    </SecondaryPageShell>
  );
}
