"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import type { ScenarioId } from "@/lib/scenarios";

interface ScenarioMenuProps {
  disabled: boolean;
  onSelect: (scenarioId: ScenarioId, customDescription?: string) => void;
}

export default function ScenarioMenu({ disabled, onSelect }: ScenarioMenuProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (showCustomModal) {
      customInputRef.current?.focus();
    }
  }, [showCustomModal]);

  function handleSelect(scenarioId: ScenarioId): void {
    setOpen(false);
    if (scenarioId === "custom") {
      setShowCustomModal(true);
      return;
    }
    onSelect(scenarioId);
  }

  function handleCustomSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed: string = customInput.trim();
    if (!trimmed) {
      return;
    }
    setShowCustomModal(false);
    setCustomInput("");
    onSelect("custom", trimmed);
  }

  function handleCustomCancel(): void {
    setShowCustomModal(false);
    setCustomInput("");
  }

  return (
    <>
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

      {showCustomModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-stone-900/40"
            onClick={handleCustomCancel}
          />
          <form
            onSubmit={handleCustomSubmit}
            className="relative w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
          >
            <h2 className="text-base font-semibold text-stone-900">
              Custom scenario
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Describe the conversation you want to have.
            </p>
            <textarea
              ref={customInputRef}
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              rows={3}
              placeholder="e.g. I'm at the doctor's office describing my symptoms…"
              className="mt-3 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCustomCancel}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-stone-300"
              >
                Start
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
