"use client";

import { useState, useMemo } from "react";
import { getSpecies } from "@/lib/species";
import { getToday, inWin, statusOf, fmtDateShort, periodShort } from "@/lib/dates";
import { DEFAULT_STATE } from "@/lib/types";
import { SummaryCard } from "@/components/heute/SummaryCard";
import { DeckCarousel } from "@/components/heute/DeckCarousel";
import { JagdbarChips } from "@/components/heute/JagdbarChips";
import { ConditionList, NoList, Timeline } from "@/components/heute/ConditionList";
import { Sheet } from "@/components/ui/Sheet";
import { Silhouette } from "@/components/icons/SilhouetteSprite";
import { CheckIcon, ChevronRight } from "@/components/icons/Icons";
import Link from "next/link";

export default function HeutePage() {
  const [allSheetOpen, setAllSheetOpen] = useState(false);
  const [noOpen, setNoOpen] = useState(false);

  const { now, todayDoy, year } = getToday();
  const species = getSpecies(DEFAULT_STATE);

  const jagdbar = useMemo(() => species.filter((s) => inWin(s, todayDoy)), [species, todayDoy]);
  const cond = useMemo(() => species.filter((s) => statusOf(s, todayDoy) === "cond"), [species, todayDoy]);
  const no = useMemo(() => species.filter((s) => statusOf(s, todayDoy) === "no"), [species, todayDoy]);

  // Deck species: favorites first, then rest, max 6
  const deckSpecies = useMemo(() => {
    const defaultFavs = ["rehbock", "frischling", "altfuchs", "waschbaer", "damhirsch", "rothirsch"];
    const favGreen = defaultFavs.map((k) => jagdbar.find((s) => s.k === k)).filter(Boolean) as typeof jagdbar;
    const rest = jagdbar.filter((s) => !favGreen.includes(s));
    return [...favGreen, ...rest].slice(0, 6);
  }, [jagdbar]);

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Jagd-Deck</h1>
        <p className="text-[14px] text-ink-3 font-[650] mt-1">
          {DEFAULT_STATE} <span className="text-ink-3/50 mx-1">·</span> Heute, {fmtDateShort(now)}
        </p>
      </div>

      {/* Summary */}
      <SummaryCard jagdCount={jagdbar.length} condCount={cond.length} noCount={no.length} />

      {/* Deck */}
      <section className="mt-6">
        <div className="px-5 flex items-baseline justify-between mb-2">
          <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0">Jagd-Deck</h2>
          <span className="text-[12.5px] text-ink-3 font-[620]">{jagdbar.length} Kategorien</span>
        </div>
        <DeckCarousel species={deckSpecies} todayDoy={todayDoy} year={year} />
        <div className="text-center text-[12px] text-ink-3/60 font-[580] mt-2">
          Karte antippen für Details · ← → zum Blättern
        </div>
      </section>

      {/* Heute jagdbar chips */}
      <section className="mt-6">
        <div className="px-5 flex items-baseline justify-between mb-2">
          <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0">Heute jagdbar</h2>
          <span className="text-[12.5px] text-ink-3 font-[620]">{jagdbar.length} Kategorien</span>
        </div>
        <JagdbarChips species={jagdbar} />
        {jagdbar.length > 6 && (
          <button
            onClick={() => setAllSheetOpen(true)}
            className="mx-5 mt-3 text-[14px] text-green font-[720] bg-transparent border-0 cursor-pointer p-0"
          >
            Alle {jagdbar.length} anzeigen →
          </button>
        )}
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
        <div className="px-5 flex items-baseline justify-between mb-2">
          <button
            onClick={() => setNoOpen(!noOpen)}
            className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0 bg-transparent border-0 cursor-pointer p-0 flex items-center gap-2"
          >
            Nicht jagdbar heute ({no.length})
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
              className={`transition-transform ${noOpen ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        {noOpen && <NoList species={no} />}
      </section>

      {/* Timeline */}
      <section className="mt-6 mb-4">
        <div className="px-5 mb-2">
          <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0">Nächste Änderungen</h2>
        </div>
        <Timeline species={species} todayDoy={todayDoy} year={year} now={now} />
      </section>

      {/* Legal */}
      <div className="mx-5 mb-6 flex gap-3 px-4 py-[14px] rounded-[var(--r-md)] bg-[#EFEADF] border border-[#E0D8C7] text-[#4A4436] text-[12.5px] font-[620] leading-[1.45] [data-theme='dark']:bg-[#1E2618] [data-theme='dark']:border-[#2C3726] [data-theme='dark']:text-[#B9AE8D]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A7A55" strokeWidth="2.3" strokeLinecap="round" className="shrink-0 mt-[1px]">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />
        </svg>
        <p className="m-0">
          Die Anzeige zeigt allgemeine landesweite Jagdzeiten. Örtliche Anordnungen, Schutzgebiete und Elterntierschutz können abweichen.
        </p>
      </div>

      {/* All sheet */}
      <Sheet
        open={allSheetOpen}
        onClose={() => setAllSheetOpen(false)}
        title="Heute in Jagdzeit"
        subtitle={`${jagdbar.length} Kategorien · ${DEFAULT_STATE} · ${fmtDateShort(now)}`}
      >
        <div className="space-y-[9px]">
          {jagdbar.map((s) => (
            <Link
              key={s.k}
              href={`/wildart/${s.k}/`}
              onClick={() => setAllSheetOpen(false)}
              className="flex items-center gap-[13px] w-full bg-card border border-line rounded-[var(--r-lg)] p-[14px] shadow-[var(--shadow-s)] no-underline text-ink"
            >
              <span className="w-[44px] h-[44px] rounded-[14px] bg-green-soft grid place-items-center shrink-0">
                <Silhouette icon={s.ic} size={25} fill="var(--green)" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 text-[15px] font-[750]">
                  {s.n}
                  <span className="text-[10.5px] font-[830] tracking-[0.7px] px-2 py-[3px] rounded-[7px] bg-green text-white">JAGDZEIT</span>
                </span>
                <span className="text-[13px] text-ink-3 font-[600] block mt-[2px]">
                  {periodShort(s)} · {s.grp.split(" · ")[1] || s.grp}
                </span>
              </span>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </Sheet>
    </>
  );
}
