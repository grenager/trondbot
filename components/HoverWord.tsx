"use client";

import { useEffect, useRef, useState } from "react";
import type { Token } from "@/lib/types";

interface HoverWordProps {
  token: Token;
}

export default function HoverWord({ token }: HoverWordProps) {
  const [showGloss, setShowGloss] = useState<boolean>(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!showGloss) {
      return;
    }

    function handleOutsideClick(event: MouseEvent): void {
      if (
        spanRef.current &&
        event.target instanceof Node &&
        !spanRef.current.contains(event.target)
      ) {
        setShowGloss(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick as EventListener);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick as EventListener);
    };
  }, [showGloss]);

  function handleClick(event: React.MouseEvent): void {
    event.stopPropagation();
    setShowGloss((current) => !current);
  }

  return (
    <span
      ref={spanRef}
      className="relative inline cursor-help border-b border-dotted border-stone-300 hover:border-blue-400"
      onClick={handleClick}
    >
      {token.word}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-xs text-white shadow-lg transition-opacity ${
          showGloss ? "opacity-100" : "opacity-0"
        }`}
      >
        {token.gloss}
      </span>
    </span>
  );
}
