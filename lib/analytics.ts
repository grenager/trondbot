import type { ScenarioId } from "./scenarios";
import type { LanguageCode } from "./types";

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      targetOrEventName: string | Date,
      params?: Record<string, string | number>,
    ) => void;
  }
}

export function formatLanguagePair(
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): string {
  return `${nativeLanguage}-${targetLanguage}`;
}

function languageParams(
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): Record<string, string> {
  return {
    language_pair: formatLanguagePair(nativeLanguage, targetLanguage),
    native_language: nativeLanguage,
    target_language: targetLanguage,
  };
}

function trackEvent(
  eventName: string,
  params: Record<string, string | number>,
): void {
  window.gtag?.("event", eventName, params);
}

export function trackNewChat(
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  scenario: ScenarioId,
): void {
  trackEvent("new_chat", {
    ...languageParams(nativeLanguage, targetLanguage),
    scenario,
  });
}

export function trackSendMessage(
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  scenario: ScenarioId,
): void {
  trackEvent("send_message", {
    ...languageParams(nativeLanguage, targetLanguage),
    scenario,
  });
}

export function trackCreditPurchase(credits: number, priceUsd: number): void {
  trackEvent("purchase_credits", {
    credit_amount: credits,
    value: priceUsd,
    currency: "USD",
  });
}

export function trackInviteFriend(): void {
  trackEvent("invite_friend", {
    credit_amount: 100,
  });
}
