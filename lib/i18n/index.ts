import type { LanguageCode } from "../types";
import type { ScenarioId } from "../scenarios";
import { en, type Translations } from "./translations";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { it } from "./locales/it";
import { pt } from "./locales/pt";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { zh } from "./locales/zh";
import { ar } from "./locales/ar";
import { hi } from "./locales/hi";
import { ru } from "./locales/ru";
import { nl } from "./locales/nl";
import { sv } from "./locales/sv";
import { no } from "./locales/no";

const TRANSLATIONS: Readonly<Record<LanguageCode, Translations>> = {
  en,
  es,
  fr,
  de,
  it,
  pt,
  ja,
  ko,
  zh,
  ar,
  hi,
  ru,
  nl,
  sv,
  no,
};

export function getTranslations(locale: LanguageCode): Translations {
  return TRANSLATIONS[locale] ?? en;
}

export function getScenarioLabel(
  scenarioId: ScenarioId,
  locale: LanguageCode,
): string {
  const translations: Translations = getTranslations(locale);
  return translations.scenarioLabels[scenarioId];
}

export function getLanguageLabelLocalized(
  code: LanguageCode,
  locale: LanguageCode,
): string {
  const translations: Translations = getTranslations(locale);
  return translations.languageLabels[code];
}

export { en, type Translations } from "./translations";
