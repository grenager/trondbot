import { splitMessageWords } from "./splitMessageWords";

function normalize(word: string): string {
  return word.replace(/[\p{P}\p{S}]/gu, "").toLowerCase();
}

export interface WordDiffResult {
  originalChanged: Set<number>;
  correctedChanged: Set<number>;
}

/**
 * LCS-based word diff that returns changed indices for both sides.
 * Ignores capitalization and punctuation.
 */
export function getWordDiff(
  original: string,
  corrected: string,
): WordDiffResult {
  const origWords: string[] = splitMessageWords(original);
  const corrWords: string[] = splitMessageWords(corrected);
  const origNorm: string[] = origWords.map(normalize);
  const corrNorm: string[] = corrWords.map(normalize);
  const m: number = origNorm.length;
  const n: number = corrNorm.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origNorm[i - 1] === corrNorm[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  const matchedOrigIndices = new Set<number>();
  const matchedCorrIndices = new Set<number>();
  let i: number = m;
  let j: number = n;
  while (i > 0 && j > 0) {
    if (origNorm[i - 1] === corrNorm[j - 1]) {
      matchedOrigIndices.add(i - 1);
      matchedCorrIndices.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      i--;
    } else {
      j--;
    }
  }

  const originalChanged = new Set<number>();
  for (let idx = 0; idx < m; idx++) {
    if (!matchedOrigIndices.has(idx)) {
      originalChanged.add(idx);
    }
  }

  const correctedChanged = new Set<number>();
  for (let idx = 0; idx < n; idx++) {
    if (!matchedCorrIndices.has(idx)) {
      correctedChanged.add(idx);
    }
  }

  return { originalChanged, correctedChanged };
}
