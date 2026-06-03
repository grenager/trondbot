"use client";

import { FormEvent, useEffect, useState } from "react";
import LanguageSelect from "@/components/LanguageSelect";
import { SCENARIOS, type ScenarioId } from "@/lib/scenarios";
import { GUEST_SCENARIO_ID } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import type { LanguageCode } from "@/lib/types";

interface NewChatFormProps {
  initialNativeLanguage: LanguageCode;
  initialTargetLanguage: LanguageCode;
  initialScenario: ScenarioId;
  guestOnly?: boolean;
  onComfortLanguageChange: (nativeLanguage: LanguageCode) => void;
  onTargetLanguageChange: (targetLanguage: LanguageCode) => void;
  onStart: (
    nativeLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    scenarioId: ScenarioId,
    customDescription?: string,
  ) => void;
}

const FIRST_SCENARIO_ID = SCENARIOS[0].id;

export default function NewChatForm({
  initialNativeLanguage,
  initialTargetLanguage,
  initialScenario,
  guestOnly = false,
  onComfortLanguageChange,
  onTargetLanguageChange,
  onStart,
}: NewChatFormProps) {
  const { t } = useTranslation();
  const [nativeLanguage, setNativeLanguage] =
    useState<LanguageCode>(initialNativeLanguage);
  const [targetLanguage, setTargetLanguage] =
    useState<LanguageCode>(initialTargetLanguage);

  useEffect(() => {
    setNativeLanguage(initialNativeLanguage);
  }, [initialNativeLanguage]);

  useEffect(() => {
    setTargetLanguage(initialTargetLanguage);
  }, [initialTargetLanguage]);

  function handleComfortLanguageChange(code: LanguageCode): void {
    setNativeLanguage(code);
    onComfortLanguageChange(code);
  }

  function handleTargetLanguageChange(code: LanguageCode): void {
    setTargetLanguage(code);
    onTargetLanguageChange(code);
  }
  const [scenario, setScenario] = useState<ScenarioId>(
    initialScenario === "custom" ? FIRST_SCENARIO_ID : initialScenario,
  );
  const [customDescription, setCustomDescription] = useState<string>("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const scenarioId: ScenarioId = guestOnly ? GUEST_SCENARIO_ID : scenario;
    onStart(
      nativeLanguage,
      targetLanguage,
      scenarioId,
      scenarioId === "custom" ? customDescription.trim() || undefined : undefined,
    );
  }

  const isValid: boolean =
    guestOnly || scenario !== "custom" || customDescription.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xs flex-col gap-4"
    >
      <h2 className="text-center text-lg font-semibold text-stone-900">
        {t.startNewChat}
      </h2>
      <p className="text-sm leading-relaxed text-stone-500">{t.introText}</p>
      <LanguageSelect
        id="setup-native-language"
        label={t.comfortLanguageLabel}
        value={nativeLanguage}
        onChange={handleComfortLanguageChange}
      />
      <LanguageSelect
        id="setup-target-language"
        label={t.targetLanguageLabel}
        value={targetLanguage}
        onChange={handleTargetLanguageChange}
      />
      {!guestOnly ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="setup-scenario"
            className="text-xs font-medium text-stone-500"
          >
            {t.chatTopic}
          </label>
          <select
            id="setup-scenario"
            value={scenario}
            onChange={(event) => setScenario(event.target.value as ScenarioId)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {t.scenarioLabels[s.id]}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-stone-500">{t.guestScenarioNote}</p>
      )}
      {!guestOnly && scenario === "custom" ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="setup-custom"
            className="text-xs font-medium text-stone-500"
          >
            {t.describeConversation}
          </label>
          <textarea
            id="setup-custom"
            value={customDescription}
            onChange={(event) => setCustomDescription(event.target.value)}
            rows={3}
            placeholder={t.conversationPlaceholder}
            className="resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!isValid}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {t.startChattingNow}
      </button>
      <p className="text-center text-xs leading-relaxed text-stone-400">
        {t.freeCreditsNote}
      </p>
    </form>
  );
}
