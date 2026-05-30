import type { LanguageCode } from "./types";

/** BCP-47 tags to try, most specific first. */
const SPEECH_LOCALE_CANDIDATES: Record<LanguageCode, readonly string[]> = {
  en: ["en-US", "en-GB", "en"],
  es: ["es-ES", "es-MX", "es"],
  fr: ["fr-FR", "fr-CA", "fr"],
  de: ["de-DE", "de-AT", "de"],
  it: ["it-IT", "it"],
  pt: ["pt-PT", "pt-BR", "pt"],
  ja: ["ja-JP", "ja"],
  ko: ["ko-KR", "ko"],
  zh: ["zh-CN", "zh-TW", "zh"],
  ar: ["ar-SA", "ar"],
  hi: ["hi-IN", "hi"],
  ru: ["ru-RU", "ru"],
  nl: ["nl-NL", "nl-BE", "nl"],
  sv: ["sv-SE", "sv"],
  no: ["nb-NO", "no-NO", "nn-NO", "nb", "no", "nn"],
};

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function getSpeechLocale(language: LanguageCode): string {
  return SPEECH_LOCALE_CANDIDATES[language][0];
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function warmupSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) {
    return Promise.resolve([]);
  }

  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const readVoices = (): SpeechSynthesisVoice[] =>
        window.speechSynthesis.getVoices();

      const existing: SpeechSynthesisVoice[] = readVoices();
      if (existing.length > 0) {
        resolve(existing);
        return;
      }

      const finish = (): void => {
        resolve(readVoices());
      };

      window.speechSynthesis.addEventListener("voiceschanged", finish, {
        once: true,
      });
      window.setTimeout(finish, 300);
      readVoices();
    });
  }

  return voicesPromise;
}

function voiceScore(
  voice: SpeechSynthesisVoice,
  candidates: readonly string[],
): number {
  const voiceLang: string = voice.lang.toLowerCase();

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate: string = candidates[index].toLowerCase();
    if (voiceLang === candidate) {
      return 200 - index;
    }
    if (voiceLang.startsWith(`${candidate}-`)) {
      return 150 - index;
    }
    if (candidate.includes("-") && voiceLang.startsWith(candidate.split("-")[0])) {
      return 100 - index;
    }
    if (!candidate.includes("-") && voiceLang.startsWith(candidate)) {
      return 120 - index;
    }
  }

  return 0;
}

export function pickVoiceForLanguage(
  language: LanguageCode,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const candidates: readonly string[] = SPEECH_LOCALE_CANDIDATES[language];

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of voices) {
    const score: number = voiceScore(voice, candidates);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) {
    return;
  }
  window.speechSynthesis.cancel();
}

export async function speakText(
  text: string,
  language: LanguageCode,
  options?: SpeakOptions,
): Promise<void> {
  if (!isSpeechSupported()) {
    return;
  }

  window.speechSynthesis.cancel();

  const voices: SpeechSynthesisVoice[] = await warmupSpeechVoices();
  const voice: SpeechSynthesisVoice | null = pickVoiceForLanguage(
    language,
    voices,
  );

  const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? getSpeechLocale(language);
  if (voice) {
    utterance.voice = voice;
  }

  if (options?.onStart) {
    utterance.onstart = options.onStart;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}
