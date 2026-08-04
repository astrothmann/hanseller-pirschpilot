"use client";

import { useRef, useEffect } from "react";
import { useActiveState } from "./StateProvider";
import { SUPPORTED_STATES } from "@/lib/species";

/**
 * Bundesland picker using a native <select> element.
 * Native selects work on mobile without React event delegation —
 * the onChange is attached via a raw DOM addEventListener as a safety net.
 */
export function BundeslandPicker() {
  const { state, setState } = useActiveState();
  const selectRef = useRef<HTMLSelectElement>(null);

  // Attach native event listener as fallback in case React's onChange doesn't fire
  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const handler = () => {
      setState(el.value as typeof state);
    };
    el.addEventListener("change", handler);
    return () => el.removeEventListener("change", handler);
  }, [setState]);

  return (
    <span className="relative inline-flex items-center gap-[5px]">
      <select
        ref={selectRef}
        value={state}
        onChange={(e) => setState(e.target.value as typeof state)}
        className="appearance-none bg-transparent border-0 cursor-pointer p-0 pr-[18px] text-green font-[700] text-[14px] underline underline-offset-[3px] decoration-green/40 outline-none"
      >
        {SUPPORTED_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        className="absolute right-0 pointer-events-none text-ink-3"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
