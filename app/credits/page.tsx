"use client";

import { useEffect, useState } from "react";
import CreditsPanel from "@/components/CreditsPanel";
import SecondaryPageShell from "@/components/SecondaryPageShell";
import { useAuth } from "@/components/AuthProvider";
import {
  INITIAL_FREE_CREDITS,
  loadCredits,
  MAX_TOTAL_CREDITS,
  saveCredits,
} from "@/lib/storage";

function CreditsContent() {
  const { user, profile, updateProfileCredits } = useAuth();
  const [credits, setCredits] = useState<number>(INITIAL_FREE_CREDITS);

  useEffect(() => {
    setCredits(profile?.credits ?? loadCredits());
  }, [profile?.credits]);

  function handleCreditsPurchase(creditsToAdd: number): number {
    const creditsAdded: number = Math.min(
      creditsToAdd,
      MAX_TOTAL_CREDITS - credits,
    );
    if (creditsAdded <= 0) {
      return 0;
    }

    const newCredits: number = credits + creditsAdded;
    setCredits(newCredits);

    if (user) {
      void updateProfileCredits(newCredits);
    } else {
      saveCredits(newCredits);
    }

    return creditsAdded;
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
