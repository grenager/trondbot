"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

export default function LocaleHtmlLang() {
  const { locale } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = locale === "no" ? "nb" : locale;
  }, [locale]);

  return null;
}
