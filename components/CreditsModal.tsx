"use client";

import { useEffect, useState } from "react";
import { trackCreditPurchase, trackInviteFriend } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { getInviteUrl, MAX_TOTAL_CREDITS } from "@/lib/storage";

type ModalView = "options" | "invite" | "confirmation";

interface CreditsModalProps {
  open: boolean;
  credits: number;
  inviteCode?: string;
  onClose: () => void;
  onPurchase: (creditsToAdd: number) => number;
}

export default function CreditsModal({
  open,
  credits,
  inviteCode,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<ModalView>("options");
  const [confirmationCredits, setConfirmationCredits] = useState<number>(0);
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const atCreditCap: boolean = credits >= MAX_TOTAL_CREDITS;

  useEffect(() => {
    if (!open) {
      setView("options");
      setConfirmationCredits(0);
      setInviteUrl("");
      setLinkCopied(false);
    }
  }, [open]);

  if (!open) return null;

  function handleClose(): void {
    onClose();
  }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label={t.close}
          className="absolute right-4 top-4 rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {view === "confirmation" ? (
          <>
            <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
              {t.creditsAdded}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              {t.creditsAddedMessage(confirmationCredits)}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t.ok}
            </button>
          </>
        ) : view === "invite" ? (
          <>
            <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
              {t.creditsAdded}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              {t.creditsAddedMessage(confirmationCredits)}
            </p>
            <p className="mt-4 text-xs font-medium text-stone-500">
              {t.yourInviteLink}
            </p>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
              <span className="flex-1 truncate text-xs text-stone-700">
                {inviteUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                {linkCopied ? t.linkCopied : t.copyLink}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 w-full rounded-lg bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
            >
              {t.ok}
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 pr-8 text-lg font-semibold text-stone-900">
              {t.getMoreCredits}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
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
                <p className="mt-1 text-xs text-stone-500">
                  {t.buyCreditsDescription}
                </p>
              </button>

              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-xs font-medium text-stone-400">
                  {t.orDivider}
                </span>
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
          </>
        )}
      </div>
    </div>
  );
}
