"use client";

import AboutContent from "@/components/AboutContent";
import SecondaryPageShell from "@/components/SecondaryPageShell";

export default function AboutPage() {
  return (
    <SecondaryPageShell titleKey="aboutTrondbot">
      <AboutContent />
    </SecondaryPageShell>
  );
}
