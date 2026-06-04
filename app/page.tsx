"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildLanguagePath } from "@/lib/languagePath";
import { loadStoredState } from "@/lib/storage";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const params: URLSearchParams = new URLSearchParams(window.location.search);
    const refCode: string | null = params.get("ref");
    if (refCode) {
      router.replace(`/join?ref=${encodeURIComponent(refCode)}`);
      return;
    }

    const stored = loadStoredState();
    router.replace(
      buildLanguagePath(stored.nativeLanguage, stored.targetLanguage),
    );
  }, [router]);

  return null;
}
