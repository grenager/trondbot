"use client";

import { createContext, useContext, useMemo } from "react";
import { getTranslations, type Translations } from "./index";
import type { LanguageCode } from "../types";

interface TranslationContextValue {
  locale: LanguageCode;
  t: Translations;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

interface TranslationProviderProps {
  locale: LanguageCode;
  children: React.ReactNode;
}

export function TranslationProvider({
  locale,
  children,
}: TranslationProviderProps) {
  const value: TranslationContextValue = useMemo(
    () => ({
      locale,
      t: getTranslations(locale),
    }),
    [locale],
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  const context: TranslationContextValue | null =
    useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}
