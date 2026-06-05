"use client";

import { useEffect, useRef, useState } from "react";
import type { Token } from "@/lib/types";

interface HoverWordProps {
  token: Token;
  variant?: "default" | "onDark";
}

export default function HoverWord({
  token,
  variant = "default",
}: HoverWordProps) {
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

  const underlineClass: string =
    variant === "onDark"
      ? "border-white/50 hover:border-white"
      : "border-stone-300 hover:border-blue-400";

  return (
    <span
      ref={spanRef}
      className={`relative inline cursor-help border-b border-dotted ${underlineClass}`}
      onClick={handleClick}
    >
      {token.word}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-xs text-white shadow-lg transition-opacity ${
          showGloss ? "opacity-100" : "opacity-0"
        }`}
      >
        {token.gloss}
      </span>
    </span>
  );
}
