import type { Correction } from "@/lib/types";

interface CorrectionProps {
  correction: Correction;
}

export default function CorrectionDisplay({ correction }: CorrectionProps) {
  return (
    <div className="group relative mt-1.5 max-w-[85%] self-end">
      <p className="cursor-help text-xs text-stone-500 underline decoration-dotted decoration-stone-300 underline-offset-2 hover:text-stone-700">
        {correction.corrected}
      </p>
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-64 rounded-lg bg-stone-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {correction.explanation}
      </div>
    </div>
  );
}
