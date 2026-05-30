import type { Language, LanguageCode } from "./types";

export const LANGUAGES: readonly Language[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "sv", label: "Swedish", flag: "🇸🇪" },
  { code: "no", label: "Norwegian", flag: "🇳🇴" },
] as const;

export const DEFAULT_NATIVE_LANGUAGE: LanguageCode = "en";
export const DEFAULT_TARGET_LANGUAGE: LanguageCode = "es";

export function getLanguageLabel(code: LanguageCode): string {
  const language: Language | undefined = LANGUAGES.find(
    (lang) => lang.code === code,
  );
  return language?.label ?? code;
}
