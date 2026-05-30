"use client";

import { useEffect, useRef, useState } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import type { ScenarioId } from "@/lib/scenarios";

interface ScenarioMenuProps {
  disabled: boolean;
  onSelect: (scenarioId: ScenarioId) => void;
}

export default function ScenarioMenu({ disabled, onSelect }: ScenarioMenuProps) {
  const [open, setOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function handleSelect(scenarioId: ScenarioId): void {
    setOpen(false);
    onSelect(scenarioId);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        New
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => handleSelect(scenario.id)}
              className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              {scenario.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
