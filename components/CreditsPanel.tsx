"use client";

import { useState } from "react";
import { trackCreditPurchase, trackInviteFriend } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { getInviteUrl, MAX_TOTAL_CREDITS } from "@/lib/storage";

type PanelView = "options" | "invite" | "confirmation";

interface CreditsPanelProps {
  credits: number;
  inviteCode?: string;
  onPurchase: (creditsToAdd: number) => number;
}

export default function CreditsPanel({
  credits,
  inviteCode,
  onPurchase,
}: CreditsPanelProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<PanelView>("options");
  const [confirmationCredits, setConfirmationCredits] = useState<number>(0);
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const atCreditCap: boolean = credits >= MAX_TOTAL_CREDITS;

  function handleBuy(): void {
    trackCreditPurchase(100, 2);
    const creditsAdded: number = onPurchase(100);
    if (creditsAdded > 0) {
      setConfirmationCredits(creditsAdded);
      setView("confirmation");
    }
  }

  function handleInvite(): void {
    trackInviteFriend();
    const creditsAdded: number = onPurchase(100);
    setConfirmationCredits(creditsAdded);
    setInviteUrl(getInviteUrl(inviteCode));
    setView("invite");
  }

  async function handleCopyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback: select the text for manual copy
    }
  }

  if (view === "confirmation") {
    return (
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">{t.creditsAdded}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {t.creditsAddedMessage(confirmationCredits)}
        </p>
        <button
          type="button"
          onClick={() => setView("options")}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t.ok}
        </button>
      </section>
    );
  }

  if (view === "invite") {
    return (
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">{t.creditsAdded}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {t.creditsAddedMessage(confirmationCredits)}
        </p>
        <p className="mt-4 text-xs font-medium text-stone-500">
          {t.yourInviteLink}
        </p>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <span className="flex-1 truncate text-xs text-stone-700">{inviteUrl}</span>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            {linkCopied ? t.linkCopied : t.copyLink}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setView("options")}
          className="mt-5 w-full rounded-lg bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
        >
          {t.ok}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-stone-900">{t.getMoreCredits}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        {t.youHaveMessagesRemaining(credits)}
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          disabled={atCreditCap}
          onClick={handleBuy}
          className="group w-full rounded-xl border-2 border-blue-100 bg-blue-50/50 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-900">
              {t.buy100Credits}
            </span>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
              $2
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">{t.buyCreditsDescription}</p>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium text-stone-400">{t.orDivider}</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <button
          type="button"
          disabled={atCreditCap}
          onClick={handleInvite}
          className="group w-full rounded-xl border-2 border-green-100 bg-green-50/50 p-4 text-left transition-colors hover:border-green-300 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-900">
              {t.inviteFriend}
            </span>
            <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
              {t.free}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {t.inviteFriendDescription}
          </p>
        </button>
      </div>
    </section>
  );
}
