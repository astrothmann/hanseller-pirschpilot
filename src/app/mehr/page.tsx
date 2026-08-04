"use client";

import { useState } from "react";
import { DEFAULT_STATE, STATES } from "@/lib/types";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Sheet } from "@/components/ui/Sheet";
import { CheckIcon } from "@/components/icons/Icons";

export default function MehrPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [stateSheetOpen, setStateSheetOpen] = useState(false);
  const [currentState, setCurrentState] = useState(DEFAULT_STATE);

  return (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Mehr</h1>
      <p className="text-[14px] text-ink-3 font-[650] mt-1">Daten und Einstellungen</p>

      <div className="mt-5 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Daten</h3>

        {/* Bundesland */}
        <button
          onClick={() => setStateSheetOpen(true)}
          className="flex items-center gap-3 w-full py-3 bg-transparent border-0 cursor-pointer text-left text-ink border-b border-line"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--forest-600)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
          </svg>
          <span className="flex-1 text-[15px] font-[710]">Bundesland ändern</span>
          <span className="text-[13px] text-ink-3 font-[600]">{currentState}</span>
        </button>

        {/* Dark mode */}
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1">
            <div className="text-[15px] font-[700]">Dunkler Modus</div>
            <div className="text-[13px] text-ink-3 font-[600]">Folgt sonst dem System</div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-[44px] h-[26px] rounded-full relative transition-colors border-0 cursor-pointer ${
              theme === "dark" ? "bg-green" : "bg-grey-soft"
            }`}
            role="switch"
            aria-checked={theme === "dark"}
          >
            <span
              className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform ${
                theme === "dark" ? "left-[21px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Rechtliches</h3>
        <button className="flex items-center w-full py-3 bg-transparent border-0 cursor-pointer text-left text-ink border-b border-line">
          <span className="flex-1 text-[15px] font-[710]">Haftungsausschluss</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
        <button className="flex items-center w-full py-3 bg-transparent border-0 cursor-pointer text-left text-ink">
          <span className="flex-1 text-[15px] font-[710]">Impressum</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {/* Legal */}
      <div className="mt-4 mb-6 flex gap-3 px-4 py-[14px] rounded-[var(--r-md)] bg-[#EFEADF] border border-[#E0D8C7] text-[#4A4436] text-[12.5px] font-[620] leading-[1.45]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A7A55" strokeWidth="2.3" strokeLinecap="round" className="shrink-0 mt-[1px]">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />
        </svg>
        <p className="m-0">
          Jagd-Deck ersetzt keine Rechtsauskunft. Maßgeblich sind die geltenden Verordnungen des Landes sowie örtliche Anordnungen.
        </p>
      </div>

      {/* State Sheet */}
      <Sheet
        open={stateSheetOpen}
        onClose={() => setStateSheetOpen(false)}
        title="Bundesland wählen"
        subtitle="Jagdzeiten sind Landesrecht. Aktuell hinterlegt: Nordrhein-Westfalen."
      >
        <div className="grid grid-cols-2 gap-[9px]">
          {STATES.map((state) => {
            const sel = state === currentState;
            return (
              <button
                key={state}
                onClick={() => { setCurrentState(state); setStateSheetOpen(false); }}
                className={`p-[14px] rounded-[15px] border text-left text-[14.5px] font-[710] cursor-pointer flex items-center justify-between gap-2 active:scale-[.97] transition-transform ${
                  sel
                    ? "bg-forest-700 text-[#EAF3EC] border-forest-700"
                    : "bg-card border-line text-ink"
                }`}
              >
                {state}
                {sel && <CheckIcon color="#8DEBB4" size={13} />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
