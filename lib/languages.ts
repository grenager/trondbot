import type { Language, LanguageCode } from "./types";

export const LANGUAGES: readonly Language[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ru", label: "Russian" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "no", label: "Norwegian" },
] as const;

export const DEFAULT_NATIVE_LANGUAGE: LanguageCode = "en";
export const DEFAULT_TARGET_LANGUAGE: LanguageCode = "es";

export function getLanguageLabel(code: LanguageCode): string {
  const language: Language | undefined = LANGUAGES.find(
    (lang) => lang.code === code,
  );
  return language?.label ?? code;
}
