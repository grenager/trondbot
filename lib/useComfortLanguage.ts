"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NATIVE_LANGUAGE } from "@/lib/languages";
import { loadStoredState } from "@/lib/storage";
import type { LanguageCode } from "@/lib/types";

export function useComfortLanguage(): LanguageCode {
  const [locale, setLocale] = useState<LanguageCode>(DEFAULT_NATIVE_LANGUAGE);

  useEffect(() => {
    setLocale(loadStoredState().nativeLanguage);
  }, []);

  return locale;
}
