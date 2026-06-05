"use client";

import Link from "next/link";
import { useEffect } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  chatPath: string;
  currentPath: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  signedIn: boolean;
  hideCreditsNav: boolean;
  supabaseEnabled: boolean;
  vocabCount: number | null;
  onSignIn: () => void;
}

export default function SideDrawer({
  open,
  onClose,
  chatPath,
  currentPath,
  email,
  displayName,
  avatarUrl,
  signedIn,
  hideCreditsNav,
  supabaseEnabled,
  vocabCount,
  onSignIn,
}: SideDrawerProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const accountLabel: string = signedIn
    ? displayName ?? email ?? t.account
    : t.guestUser;
  const accountSubtitle: string | null =
    signedIn && displayName && email ? email : null;
  const isChatActive: boolean = currentPath === chatPath;

  function navLinkClassName(active: boolean): string {
    return active
      ? "block rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700"
      : "block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100";
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label={t.closeMenu}
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={t.openMenu}
      >
        <div className="border-b border-stone-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              email={email}
              displayName={displayName}
              avatarUrl={avatarUrl}
              signedIn={signedIn}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">
                {accountLabel}
              </p>
              {accountSubtitle ? (
                <p className="truncate text-xs text-stone-500">{accountSubtitle}</p>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            <li>
              <Link
                href={chatPath}
                onClick={onClose}
                className={navLinkClassName(isChatActive)}
                aria-current={isChatActive ? "page" : undefined}
              >
                {t.navChat}
              </Link>
            </li>
            <li>
              <Link
                href="/history"
                onClick={onClose}
                className={navLinkClassName(currentPath === "/history")}
                aria-current={currentPath === "/history" ? "page" : undefined}
              >
                {t.navHistoryStreaks}
              </Link>
            </li>
            <li>
              <Link
                href="/vocab"
                onClick={onClose}
                className={navLinkClassName(currentPath === "/vocab")}
                aria-current={currentPath === "/vocab" ? "page" : undefined}
              >
                <span className="flex items-center justify-between">
                  <span>{t.navVocab}</span>
                  {vocabCount !== null && vocabCount > 0 ? (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                      {vocabCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                onClick={onClose}
                className={navLinkClassName(currentPath === "/settings")}
                aria-current={currentPath === "/settings" ? "page" : undefined}
              >
                {t.navSettings}
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={onClose}
                className={navLinkClassName(currentPath === "/about")}
                aria-current={currentPath === "/about" ? "page" : undefined}
              >
                {t.navAbout}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-stone-100 px-2 py-3">
          {supabaseEnabled && !signedIn ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignIn();
              }}
              className="block w-full rounded-lg bg-blue-600 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t.signInWithGoogle}
            </button>
          ) : !hideCreditsNav ? (
            <Link
              href="/credits"
              onClick={onClose}
              className="block w-full rounded-lg bg-blue-600 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t.navBuyCredits}
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
