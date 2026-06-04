"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { storeReferralCode } from "@/lib/referral/client";

export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode: string | null = searchParams.get("ref");
    if (refCode) {
      storeReferralCode(refCode);
    }
  }, [searchParams]);

  return null;
}
