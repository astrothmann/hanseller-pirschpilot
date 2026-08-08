"use client";

import { useMemo, useState } from "react";
import { getSpecies } from "@/lib/species";
import { useFavorites } from "@/lib/favorites";
import { useActiveState } from "@/components/layout/StateProvider";
import { getToday, inWin, statusOf, fmtDateShort, periodShort } from "@/lib/dates";
import { SummaryCard } from "@/components/heute/SummaryCard";
import { DeckCarousel } from "@/components/heute/DeckCarousel";
import { DeckSheet } from "@/components/heute/DeckSheet";
import { ConditionList, NoList } from "@/components/heute/ConditionList";
import { WildartIcon } from "@/components/icons/WildartIcon";
import { ChevronRight, StarIcon } from "@/components/icons/Icons";
import { BundeslandPicker } from "@/components/layout/BundeslandPicker";
import Link from "next/link";

export default function HeuteContent() {
  const { now, todayDoy, year } = getToday();
  const { state } = useActiveState();
  const species = getSpecies(state);
  const { favorites, toggle } = useFavorites(state);
  const [deckOpen, setDeckOpen] = useState(false);

  const jagdbar = useMemo(() => species.filter((s) => inWin(s, todayDoy)), [species, todayDoy]);
  const cond = useMemo(() => species.filter((s) => statusOf(s, todayDoy) === "cond"), [species, todayDoy]);
  const no = useMemo(() => species.filter((s) => statusOf(s, todayDoy) === "no"), [species, todayDoy]);

  const deckSpecies = useMemo(() => {
    return species.filter((s) => favorites.includes(s.k));
  }, [favorites, species]);

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Hanseller Pirschpilot</h1>
        <div className="mt-1 flex items-center gap-[6px] text-[14px] text-ink-3 font-[650]">
          <BundeslandPicker />
          <span className="text-ink-3/50 mx-1">·</span>
          <span>Heute, {fmtDateShort(now)}</span>
        </div>
      </div>

      {/* Summary */}
      <SummaryCard jagdCount={jagdbar.length} condCount={cond.length} noCount={no.length} />

      {/* Deck */}
      <section className="mt-6">
        <div className="px-5 flex items-baseline justify-between mb-2">
          <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0">Pirsch-Deck</h2>
          <div className="flex items-center gap-[10px]">
            <span className="text-[12.5px] text-ink-3 font-[620]">{deckSpecies.length} Kategorien</span>
            <button
              onClick={() => setDeckOpen(true)}
              className="flex items-center gap-[6px] px-[13px] py-[7px] rounded-full bg-forest-700 text-[#EAF3EC] text-[12.5px] font-[720] border-none cursor-pointer active:scale-[.96] transition-transform"
            >
              <StarIcon size={13} filled />
              Anpassen
            </button>
          </div>
        </div>
        <DeckCarousel species={deckSpecies} todayDoy={todayDoy} year={year} />
        <div className="text-center text-[12px] text-ink-3/60 font-[580] mt-2">
          Karte antippen für Details · ← → zum Blättern
        </div>
      </section>

      <DeckSheet open={deckOpen} onClose={() => setDeckOpen(false)} favorites={favorites} toggle={toggle} />

      {/* Heute jagdbar */}
      <section className="mt-6">
        <details className="group">
          <summary className="px-5 flex items-center gap-2 mb-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">
            Heute jagdbar ({jagdbar.length})
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
              className="transition-transform group-open:rotate-180">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="px-5 space-y-[10px]">
            {jagdbar.map((s) => (
              <Link
                key={s.k}
                href={`/wildart/${s.k}/`}
                className="flex items-center gap-[13px] w-full bg-gradient-to-b from-[#F0F7F2] to-[#E6F0E9] border border-[rgba(46,125,79,.25)] rounded-[var(--r-lg)] p-[14px] shadow-[var(--shadow-s)] no-underline text-ink"
              >
                <span className="w-[44px] h-[44px] rounded-[14px] bg-green-soft grid place-items-center shrink-0">
                  <WildartIcon icon={s.ic} size={25} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-[15px] font-[750]">
                    {s.n}
                    <span className="text-[10.5px] font-[830] tracking-[0.7px] px-2 py-[3px] rounded-[7px] bg-green text-white">JAGDZEIT</span>
                  </span>
                  <span className="text-[13px] text-ink-3 font-[600] block mt-[2px]">
                    {periodShort(s)}
                  </span>
                </span>
                <ChevronRight />
              </Link>
            ))}
          </div>
        </details>
      </section>

      {/* Bedingt */}
      <section className="mt-6">
        <div className="px-5 flex items-baseline justify-between mb-2">
          <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0">Bedingt / prüfen</h2>
          <span className="text-[12.5px] text-ink-3 font-[620]">{cond.length} Einträge</span>
        </div>
        <ConditionList species={cond} />
      </section>

      {/* Nicht jagdbar */}
      <section className="mt-6">
        <details className="group">
          <summary className="px-5 flex items-center gap-2 mb-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">
            Nicht jagdbar heute ({no.length})
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
              className="transition-transform group-open:rotate-180">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <NoList species={no} />
        </details>
      </section>
    </>
  );
}
