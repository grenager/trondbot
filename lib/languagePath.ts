import {
  DEFAULT_NATIVE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  LANGUAGES,
} from "./languages";
import type { LanguageCode } from "./types";

const LANGUAGE_CODES: ReadonlySet<LanguageCode> = new Set(
  LANGUAGES.map((language) => language.code),
);

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_CODES.has(value as LanguageCode);
}

export function buildLanguagePath(
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): string {
  return `/${nativeLanguage}/${targetLanguage}`;
}

export function parseLanguagePath(
  pathname: string,
): { nativeLanguage: LanguageCode; targetLanguage: LanguageCode } | null {
  const match: RegExpMatchArray | null = pathname.match(
    /^\/([^/]+)\/([^/]+)\/?$/,
  );
  if (!match) {
    return null;
  }

  const nativeLanguage: string = match[1];
  const targetLanguage: string = match[2];
  if (!isLanguageCode(nativeLanguage) || !isLanguageCode(targetLanguage)) {
    return null;
  }

  return { nativeLanguage, targetLanguage };
}

export function getDefaultLanguagePath(): string {
  return buildLanguagePath(
    DEFAULT_NATIVE_LANGUAGE,
    DEFAULT_TARGET_LANGUAGE,
  );
}
