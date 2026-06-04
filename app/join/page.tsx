"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import LocaleHtmlLang from "@/components/LocaleHtmlLang";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { buildLanguagePath } from "@/lib/languagePath";
import { TranslationProvider, useTranslation } from "@/lib/i18n/TranslationContext";
import { storeReferralCode } from "@/lib/referral/client";
import { loadStoredState } from "@/lib/storage";
import { useComfortLanguage } from "@/lib/useComfortLanguage";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const {
    user,
    authReady,
    signInWithGoogle,
    sendEmailCode,
    verifyEmailCode,
  } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [refStored, setRefStored] = useState<boolean>(false);

  const chatPath: string = useMemo(() => {
    const stored = loadStoredState();
    return buildLanguagePath(stored.nativeLanguage, stored.targetLanguage);
  }, []);

  const goToChatAsGuest = useCallback((): void => {
    setShowAuthModal(false);
    router.replace(chatPath);
  }, [chatPath, router]);

  useEffect(() => {
    const refCode: string | null = searchParams.get("ref");
    if (!refCode || refCode.trim().length === 0) {
      router.replace(chatPath);
      return;
    }

    storeReferralCode(refCode);
    setRefStored(true);
    setShowAuthModal(true);
  }, [chatPath, router, searchParams]);

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }

    router.replace(chatPath);
  }, [authReady, chatPath, router, user]);

  const handleSignInWithGoogle = useCallback((): Promise<string | null> => {
    return signInWithGoogle(chatPath);
  }, [chatPath, signInWithGoogle]);

  if (!refStored) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-4">
        <p className="text-sm text-stone-500">{t.loadingAccount}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-stone-50">
      <LocaleHtmlLang />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <p className="mb-2 text-sm font-semibold text-stone-900">{t.appTitle}</p>
        <p className="max-w-sm text-center text-sm leading-relaxed text-stone-600">
          {t.joinReferralMessage}
        </p>
      </div>
      <AuthModal
        open={showAuthModal}
        referralInvite
        onClose={goToChatAsGuest}
        onTryGuest={goToChatAsGuest}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSendEmailCode={sendEmailCode}
        onVerifyEmailCode={verifyEmailCode}
      />
    </main>
  );
}

function JoinPageInner() {
  const locale = useComfortLanguage();

  return (
    <AuthProvider>
      <TranslationProvider locale={locale}>
        <JoinContent />
      </TranslationProvider>
    </AuthProvider>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-stone-50">
          <p className="text-sm text-stone-500">Loading…</p>
        </main>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
