import type { Correction, LanguageCode } from "@/lib/types";
import SpeakButton from "./SpeakButton";

interface CorrectionProps {
  correction: Correction;
  language: LanguageCode;
}

export default function CorrectionDisplay({
  correction,
  language,
}: CorrectionProps) {
  return (
    <div className="group relative mt-1.5 max-w-[85%] self-end">
      <div
        className="flex items-center justify-end gap-1"
        aria-label="Correction needed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 text-red-600"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <p className="cursor-help text-xs text-stone-500 underline decoration-dotted decoration-stone-300 underline-offset-2 hover:text-stone-700">
          {correction.corrected}
        </p>
        <SpeakButton
          text={correction.corrected}
          language={language}
          variant="correction"
        />
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-64 rounded-lg bg-stone-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {correction.explanation}
      </div>
    </div>
  );
}
