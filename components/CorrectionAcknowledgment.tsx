"use client";

import { useState } from "react";
import type { Correction, LanguageCode } from "@/lib/types";
import SpeakButton from "./SpeakButton";

interface CorrectionAcknowledgmentProps {
  original: string;
  correction: Correction;
  language: LanguageCode;
  onAcknowledge: () => void;
}

export default function CorrectionAcknowledgment({
  original,
  correction,
  language,
  onAcknowledge,
}: CorrectionAcknowledgmentProps) {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-[85%] text-xs text-stone-400">{original}</p>
      <div
        className="relative max-w-[85%] cursor-help rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 pr-8 text-sm text-white"
        onClick={() => setShowExplanation((current) => !current)}
      >
        {correction.corrected}
        <SpeakButton
          text={correction.corrected}
          language={language}
          variant="user"
        />
      </div>
      {showExplanation ? (
        <p className="max-w-[85%] text-xs leading-relaxed text-stone-500">
          {correction.explanation}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onAcknowledge}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
      >
        Accept Changes
      </button>
    </div>
  );
}
