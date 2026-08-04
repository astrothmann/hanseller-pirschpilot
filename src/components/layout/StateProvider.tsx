"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { BundeslandName } from "@/lib/types";
import { DEFAULT_STATE } from "@/lib/types";
import { SUPPORTED_STATES } from "@/lib/species";

const StateContext = createContext<{
  state: BundeslandName;
  setState: (s: BundeslandName) => void;
}>({ state: DEFAULT_STATE, setState: () => {} });

export function useActiveState() {
  return useContext(StateContext);
}

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BundeslandName>(DEFAULT_STATE);

  useEffect(() => {
    const stored = localStorage.getItem("jd-state");
    if (stored && (SUPPORTED_STATES as readonly string[]).includes(stored)) {
      setState(stored as BundeslandName);
    }
  }, []);

  const set = useCallback((s: BundeslandName) => {
    setState(s);
    localStorage.setItem("jd-state", s);
  }, []);

  return (
    <StateContext.Provider value={{ state, setState: set }}>
      {children}
    </StateContext.Provider>
  );
}
