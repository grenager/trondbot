"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import SideDrawer from "@/components/SideDrawer";
import UserAvatar from "@/components/UserAvatar";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import LocaleHtmlLang from "@/components/LocaleHtmlLang";
import { buildLanguagePath } from "@/lib/languagePath";
import { useComfortLanguage } from "@/lib/useComfortLanguage";
import { TranslationProvider, useTranslation } from "@/lib/i18n/TranslationContext";
import type { Translations } from "@/lib/i18n/translations";
import { loadStoredState } from "@/lib/storage";
import {
  fetchUsageSnapshot,
  type UsageSnapshot,
} from "@/lib/usage/client";

type PageTitleKey =
  | "settingsTitle"
  | "historyTitle"
  | "aboutTrondbot"
  | "getMoreCredits"
  | "vocabTitle";

interface SecondaryPageShellProps {
  titleKey: PageTitleKey;
  children: ReactNode;
}

function getPageTitle(t: Translations, titleKey: PageTitleKey): string {
  return t[titleKey];
}

function SecondaryPageShellContent({
  titleKey,
  children,
}: SecondaryPageShellProps) {
  const { t } = useTranslation();
  const pathname: string = usePathname();
  const title: string = getPageTitle(t, titleKey);
  const storedState = loadStoredState();
  const chatPath: string = buildLanguagePath(
    storedState.nativeLanguage,
    storedState.targetLanguage,
  );
  const {
    user,
    profile,
    displayName,
    avatarUrl,
    supabaseEnabled,
    signInWithGoogle,
    sendEmailCode,
    verifyEmailCode,
  } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [vocabCount, setVocabCount] = useState<number | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);

  useEffect(() => {
    void fetchUsageSnapshot().then(setUsage);
    if (user) {
      void fetch("/api/vocab/count")
        .then((r) => r.json())
        .then((d: unknown) => {
          if (typeof d === "object" && d !== null && "count" in d) {
            setVocabCount((d as { count: number }).count);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const hideCreditsNav: boolean =
    (usage?.requiresSignIn ?? false) && !user;

  return (
    <>
      <LocaleHtmlLang />
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignInWithGoogle={signInWithGoogle}
        onSendEmailCode={sendEmailCode}
        onVerifyEmailCode={verifyEmailCode}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        chatPath={chatPath}
        currentPath={pathname}
        email={profile?.email ?? user?.email ?? null}
        displayName={displayName}
        avatarUrl={avatarUrl}
        signedIn={!!user}
        hideCreditsNav={hideCreditsNav}
        vocabCount={vocabCount}
        credits={usage?.remaining ?? 0}
        maxCredits={usage?.maxCredits ?? 1}
        onCreditsClick={() => setShowCreditsModal(!showCreditsModal)}
        supabaseEnabled={supabaseEnabled}
        onSignIn={() => {
          if (hideCreditsNav) {
            void signInWithGoogle();
            return;
          }
          setShowAuthModal(true);
        }}
      />
      <main className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden pb-3 pt-4">
        <header className="mb-4 shrink-0 px-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-self-start rounded-full transition-colors hover:bg-stone-100"
              aria-label={t.openMenu}
            >
              <UserAvatar
                email={profile?.email ?? user?.email ?? null}
                displayName={displayName}
                avatarUrl={avatarUrl}
                signedIn={!!user}
              />
            </button>
            <h1 className="truncate text-sm font-semibold text-stone-900">
              {title}
            </h1>
            <div aria-hidden="true" />
          </div>
        </header>
        <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-1">
          {children}
        </section>
      </main>
    </>
  );
}

export default function SecondaryPageShell({
  titleKey,
  children,
}: SecondaryPageShellProps) {
  const locale = useComfortLanguage();

  return (
    <AuthProvider>
      <TranslationProvider locale={locale}>
        <SecondaryPageShellContent titleKey={titleKey}>
          {children}
        </SecondaryPageShellContent>
      </TranslationProvider>
    </AuthProvider>
  );
}
