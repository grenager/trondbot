"use client";

import { FormEvent, useState } from "react";
import LanguageSelect from "@/components/LanguageSelect";
import { SCENARIOS } from "@/lib/scenarios";
import type { ScenarioId } from "@/lib/scenarios";
import type { LanguageCode } from "@/lib/types";

interface NewChatFormProps {
  initialNativeLanguage: LanguageCode;
  initialTargetLanguage: LanguageCode;
  initialScenario: ScenarioId;
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
  onStart,
}: NewChatFormProps) {
  const [nativeLanguage, setNativeLanguage] =
    useState<LanguageCode>(initialNativeLanguage);
  const [targetLanguage, setTargetLanguage] =
    useState<LanguageCode>(initialTargetLanguage);
  const [scenario, setScenario] = useState<ScenarioId>(
    initialScenario === "custom" ? FIRST_SCENARIO_ID : initialScenario,
  );
  const [customDescription, setCustomDescription] = useState<string>("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onStart(
      nativeLanguage,
      targetLanguage,
      scenario,
      scenario === "custom" ? customDescription.trim() || undefined : undefined,
    );
  }

  const isValid = scenario !== "custom" || customDescription.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xs flex-col gap-4"
    >
      <LanguageSelect
        id="setup-native-language"
        label="My comfort language is"
        value={nativeLanguage}
        onChange={setNativeLanguage}
      />
      <LanguageSelect
        id="setup-target-language"
        label="I want to chat in"
        value={targetLanguage}
        onChange={setTargetLanguage}
      />
      <div className="flex flex-col gap-1">
        <label
          htmlFor="setup-scenario"
          className="text-xs font-medium text-stone-500"
        >
          Chat topic
        </label>
        <select
          id="setup-scenario"
          value={scenario}
          onChange={(event) => setScenario(event.target.value as ScenarioId)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {scenario === "custom" ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="setup-custom"
            className="text-xs font-medium text-stone-500"
          >
            Describe the conversation
          </label>
          <textarea
            id="setup-custom"
            value={customDescription}
            onChange={(event) => setCustomDescription(event.target.value)}
            rows={3}
            placeholder="e.g. I'm at the doctor's office describing my symptoms…"
            className="resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={!isValid}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        Get Started
      </button>
    </form>
  );
}
