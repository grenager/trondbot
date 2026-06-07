"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { applyUsageFromApiResponse, type UsageSnapshot } from "@/lib/usage/client";
import { useVocabSave } from "@/components/VocabContext";
import { splitMessageWords } from "@/lib/splitMessageWords";
import type { LanguageCode, Token } from "@/lib/types";

interface LazyWordTextProps {
  text: string;
  messageLanguage: LanguageCode;
  glossLanguage: LanguageCode;
  variant?: "default" | "onDark";
  canSpendCredit?: () => boolean;
  onUsageUpdate?: (usage: UsageSnapshot) => void;
  changedIndices?: Set<number>;
  changedVariant?: "error" | "fix";
}

function parseTokenizeResponse(data: unknown): Token[] | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const tokens: unknown = (data as Record<string, unknown>).tokens;
  if (!Array.isArray(tokens)) {
    return null;
  }

  const parsed: Token[] = tokens
    .map((entry: unknown): Token | null => {
      if (typeof entry !== "object" || entry === null) {
        return null;
      }

      const word: unknown = (entry as Record<string, unknown>).word;
      const gloss: unknown = (entry as Record<string, unknown>).gloss;
      if (typeof word !== "string" || typeof gloss !== "string") {
        return null;
      }

      if (word.trim().length === 0 || gloss.trim().length === 0) {
        return null;
      }

      return { word, gloss };
    })
    .filter((token): token is Token => token !== null);

  return parsed.length > 0 ? parsed : null;
}

export default function LazyWordText({
  text,
  messageLanguage,
  glossLanguage,
  variant = "default",
  canSpendCredit,
  onUsageUpdate,
  changedIndices,
  changedVariant = "error",
}: LazyWordTextProps) {
  const { t } = useTranslation();
  const vocabSave = useVocabSave();
  const words: string[] = splitMessageWords(text);
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const fetchPromiseRef = useRef<Promise<Token[]> | null>(null);

  const fetchTokens = useCallback(async (): Promise<Token[]> => {
    if (tokens) {
      return tokens;
    }

    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    const promise: Promise<Token[]> = (async (): Promise<Token[]> => {
      setLoading(true);
      setFetchError(null);

      try {
        if (canSpendCredit && !canSpendCredit()) {
          throw new Error(t.noCreditsForWordLookup);
        }

        const response = await fetch("/api/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            messageLanguage,
            glossLanguage,
          }),
        });

        const data: unknown = await response.json();
        if (onUsageUpdate) {
          applyUsageFromApiResponse(data, onUsageUpdate);
        }

        if (!response.ok) {
          const errorMessage: string =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as Record<string, unknown>).error === "string"
              ? ((data as Record<string, unknown>).error as string)
              : t.lookupFailed;
          throw new Error(errorMessage);
        }

        const parsed: Token[] | null = parseTokenizeResponse(data);
        if (!parsed) {
          throw new Error(t.lookupFailed);
        }

        setTokens(parsed);
        return parsed;
      } catch (error: unknown) {
        const message: string =
          error instanceof Error ? error.message : t.lookupFailed;
        setFetchError(message);
        throw error;
      } finally {
        setLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = promise;
    return promise;
  }, [
    text,
    messageLanguage,
    glossLanguage,
    tokens,
    canSpendCredit,
    onUsageUpdate,
    t.lookupFailed,
    t.noCreditsForWordLookup,
  ]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleOutsideClick(event: MouseEvent | TouchEvent): void {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setActiveIndex(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [activeIndex]);

  function getGloss(index: number): string | null {
    if (!tokens) {
      return null;
    }

    const byIndex: Token | undefined = tokens[index];
    if (byIndex) {
      return byIndex.gloss;
    }

    const word: string | undefined = words[index];
    if (!word) {
      return null;
    }

    const byWord: Token | undefined = tokens.find((token) => token.word === word);
    return byWord?.gloss ?? null;
  }

  async function handleWordClick(
    index: number,
    event: React.MouseEvent<HTMLSpanElement>,
  ): Promise<void> {
    event.stopPropagation();
    setActiveIndex(index);

    let resolvedTokens: Token[] | null = tokens;
    if (!tokens && !loading) {
      try {
        resolvedTokens = await fetchTokens();
      } catch {
        return;
      }
    }

    const word: string | undefined = words[index];
    if (!word || !resolvedTokens) {
      return;
    }

    const token: Token | undefined =
      resolvedTokens[index] ?? resolvedTokens.find((t) => t.word === word);
    if (token) {
      vocabSave({
        word: token.gloss,
        translation: token.word,
        sourceLanguage: glossLanguage,
        targetLanguage: messageLanguage,
      });
    }
  }

  const underlineClass: string =
    variant === "onDark"
      ? "border-white/50 hover:border-white"
      : "border-stone-400 hover:border-blue-500";

  return (
    <span ref={containerRef}>
      {words.map((word, index) => {
        const isActive: boolean = activeIndex === index;
        const gloss: string | null = getGloss(index);
        const isChanged: boolean = changedIndices?.has(index) ?? false;
        const changedClass: string = isChanged
          ? changedVariant === "fix"
            ? "decoration-blue-500 underline decoration-wavy underline-offset-2"
            : "decoration-red-500 underline decoration-wavy underline-offset-2"
          : "";

        return (
          <span key={`${word}-${index}`}>
            <span
              className={`relative inline cursor-pointer border-b border-dotted ${underlineClass} ${changedClass}`}
              onClick={(event) => void handleWordClick(index, event)}
            >
              {word}
              {isActive ? (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 flex min-w-16 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-xs text-white shadow-lg"
                >
                  {loading ? (
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-500 border-t-white"
                      aria-hidden="true"
                    />
                  ) : fetchError ? (
                    fetchError
                  ) : gloss ? (
                    gloss
                  ) : (
                    word
                  )}
                </span>
              ) : null}
            </span>
            {index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}
