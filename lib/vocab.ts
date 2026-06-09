export interface VocabSaveParams {
  word: string;
  translation: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export type VocabSaveResult = "saved" | "already_saved" | "unauthorized" | "error";

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

    if (!response.ok) {
      return "error";
    }

    const data: unknown = await response.json();
    const existed: boolean =
      typeof data === "object" &&
      data !== null &&
      "existed" in data &&
      (data as Record<string, unknown>).existed === true;

    return existed ? "already_saved" : "saved";
  } catch {
    return "error";
  }
}
