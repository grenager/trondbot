"use client";

import { useEffect, useState } from "react";
import CreditsPanel from "@/components/CreditsPanel";
import PaywallPrompt from "@/components/PaywallPrompt";
import SecondaryPageShell from "@/components/SecondaryPageShell";
import { useAuth } from "@/components/AuthProvider";
import { MAX_TOTAL_CREDITS } from "@/lib/storage";
import {
  fetchUsageSnapshot,
  type UsageSnapshot,
} from "@/lib/usage/client";

function CreditsContent() {
  const { user, profile, signInWithGoogle } = useAuth();
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  useEffect(() => {
    void fetchUsageSnapshot().then(setUsage);
  }, [profile?.credits, user]);

  const credits: number = usage?.remaining ?? 0;
  const requiresSignIn: boolean =
    (usage?.requiresSignIn ?? false) && !user;

  function handleCreditsPurchase(creditsToAdd: number): number {
    const creditsAdded: number = Math.min(
      creditsToAdd,
      MAX_TOTAL_CREDITS - credits,
    );
    if (creditsAdded <= 0) {
      return 0;
    }

    setUsage((previous) =>
      previous
        ? { ...previous, remaining: previous.remaining + creditsAdded }
        : previous,
    );

    return creditsAdded;
  }

  if (requiresSignIn) {
    return (
      <div className="py-8">
        <PaywallPrompt onSignInWithGoogle={signInWithGoogle} />
      </div>
    );
  }

  return (
    <CreditsPanel
      credits={credits}
      inviteCode={profile?.invite_code}
      onPurchase={handleCreditsPurchase}
    />
  );
}

export default function CreditsPage() {
  return (
    <SecondaryPageShell titleKey="getMoreCredits">
      <CreditsContent />
    </SecondaryPageShell>
  );
}
