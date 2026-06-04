export interface VocabSaveParams {
  word: string;
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export type VocabSaveResult = "saved" | "unauthorized" | "error";

/**
 * Save a vocab entry. Returns the outcome so callers can show feedback.
 */
export async function saveVocabEntry(params: VocabSaveParams): Promise<VocabSaveResult> {
  try {
    const response = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (response.status === 401) {
      return "unauthorized";
    }

    return response.ok ? "saved" : "error";
  } catch {
    return "error";
  }
}
