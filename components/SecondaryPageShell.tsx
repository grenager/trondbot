"use client";

import { useState, type ReactNode } from "react";
import AuthModal from "@/components/AuthModal";
import SideDrawer from "@/components/SideDrawer";
import UserAvatar from "@/components/UserAvatar";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import LocaleHtmlLang from "@/components/LocaleHtmlLang";
import { useComfortLanguage } from "@/lib/useComfortLanguage";
import { TranslationProvider, useTranslation } from "@/lib/i18n/TranslationContext";
import type { Translations } from "@/lib/i18n/translations";

type PageTitleKey =
  | "settingsTitle"
  | "historyTitle"
  | "aboutTrondbot"
  | "getMoreCredits";

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
  const title: string = getPageTitle(t, titleKey);
  const {
    user,
    profile,
    displayName,
    avatarUrl,
    supabaseEnabled,
    signInWithGoogle,
    sendEmailCode,
    verifyEmailCode,
    signOut,
  } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

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
        email={profile?.email ?? user?.email ?? null}
        displayName={displayName}
        avatarUrl={avatarUrl}
        signedIn={!!user}
        supabaseEnabled={supabaseEnabled}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={() => void signOut()}
      />
      <main className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden py-3">
        <header className="mb-2 shrink-0 px-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-full p-0.5 transition-colors hover:bg-stone-100"
              aria-label={t.openMenu}
            >
              <UserAvatar
                email={profile?.email ?? user?.email ?? null}
                displayName={displayName}
                avatarUrl={avatarUrl}
                signedIn={!!user}
              />
            </button>
            <h1 className="flex-1 truncate text-center text-sm font-semibold text-stone-900">
              {title}
            </h1>
            <div className="h-9 w-9 shrink-0" aria-hidden="true" />
          </div>
        </header>
        <section className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
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
