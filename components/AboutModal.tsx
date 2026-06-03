"use client";

import AboutContent from "@/components/AboutContent";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <AboutContent />
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
