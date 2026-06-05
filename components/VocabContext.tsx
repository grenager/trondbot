"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { saveVocabEntry, type VocabSaveParams, type VocabSaveResult } from "@/lib/vocab";

type VocabNotifyFn = (result: VocabSaveResult) => void;
type SaveAndNotifyFn = (params: VocabSaveParams) => void;

const VocabContext = createContext<SaveAndNotifyFn | null>(null);

interface VocabProviderProps {
  onNotify: VocabNotifyFn;
  children: ReactNode;
}

export function VocabProvider({ onNotify, children }: VocabProviderProps) {
  const saveAndNotify: SaveAndNotifyFn = useCallback(
    (params: VocabSaveParams) => {
      void saveVocabEntry(params).then(onNotify);
    },
    [onNotify],
  );

  return (
    <VocabContext.Provider value={saveAndNotify}>
      {children}
    </VocabContext.Provider>
  );
}

export function useVocabSave(): SaveAndNotifyFn {
  const ctx = useContext(VocabContext);
  if (!ctx) {
    return () => {};
  }
  return ctx;
}
