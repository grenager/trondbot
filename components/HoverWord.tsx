import type { Token } from "@/lib/types";

interface HoverWordProps {
  token: Token;
}

export default function HoverWord({ token }: HoverWordProps) {
  return (
    <span className="group relative inline cursor-help border-b border-dotted border-stone-300 hover:border-blue-400">
      {token.word}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {token.gloss}
      </span>
    </span>
  );
}
