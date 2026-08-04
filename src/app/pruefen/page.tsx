"use client";

import { useState, useMemo, useEffect } from "react";
import { getSpecies } from "@/lib/species";
import { useActiveState } from "@/components/layout/StateProvider";
import { StateSheet } from "@/components/layout/StateSheet";
import { doy, inPeriod, getToday, fmtDateShort } from "@/lib/dates";
import { CheckIcon, CrossIcon, BangIcon } from "@/components/icons/Icons";
import Link from "next/link";

export default function PruefenPage() {
  const { state } = useActiveState();
  const species = getSpecies(state);
  const { now } = getToday();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [selectedKey, setSelectedKey] = useState(species[0]?.k ?? "");
  const [dateStr, setDateStr] = useState(todayISO);
  const [stateSheetOpen, setStateSheetOpen] = useState(false);

  const chosenDate = useMemo(() => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return isNaN(dt.getTime()) ? now : dt;
  }, [dateStr, now]);

  useEffect(() => {
    setSelectedKey((k) => (species.some((s) => s.k === k) ? k : (species[0]?.k ?? "")));
  }, [species]);

  const result = useMemo(() => {
    const s = species.find((sp) => sp.k === selectedKey);
    if (!s || !dateStr) return null;
    const chosen = new Date(dateStr);
    if (isNaN(chosen.getTime())) return null;
    const n = doy(chosen.getMonth() + 1, chosen.getDate());
    const hit = s.win.some((w) => inPeriod(n, w[0], w[1], w[2], w[3]));
    const ok = hit && !s.cond;
    const cond = hit && s.cond;
    const status = !hit ? "no" : cond ? "cond" : "ok";
    const text = !hit
      ? "Schonzeit"
      : cond
      ? "bedingt bejagbar – Voraussetzungen prüfen"
      : "Jagdzeit";
    return { s, status, text, ok, cond };
  }, [selectedKey, dateStr, species]);

  const verdictClasses = !result
    ? ""
    : result.status === "ok"
    ? "bg-green-soft border-[rgba(46,125,79,.2)] text-green-ink"
    : result.status === "cond"
    ? "bg-orange-soft border-[rgba(197,106,17,.2)] text-[#8A4C0E]"
    : "bg-red-soft border-[rgba(181,55,47,.2)] text-red";

  return (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Prüfen</h1>
      <p className="text-[14px] text-ink-3 font-[650] mt-1">
        <button
          onClick={() => setStateSheetOpen(true)}
          aria-label="Bundesland wählen"
          className="bg-transparent border-0 cursor-pointer p-0 inline-flex items-center gap-[5px] text-[14px] font-[650] active:opacity-60"
        >
          <span className="text-green font-[700] underline underline-offset-[3px] decoration-green/40">{state}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <span> · {fmtDateShort(chosenDate)}</span>
      </p>

      <div className="mt-6 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Schnellprüfung</h3>

        <label className="block text-[13px] font-[700] text-ink-2 mb-1">Wildart</label>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="w-full p-3 rounded-[var(--r-md)] border border-line bg-bg text-ink text-[15px] font-[680] mb-4 appearance-none"
        >
          {species.map((s) => (
            <option key={s.k} value={s.k}>{s.n}</option>
          ))}
        </select>

        <label className="block text-[13px] font-[700] text-ink-2 mb-1">Datum</label>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="w-full p-3 rounded-[var(--r-md)] border border-line bg-bg text-ink text-[15px] font-[680]"
        />
      </div>

      {/* Verdict */}
      {result && (
        <div className={`flex items-start gap-[11px] mt-4 px-[18px] py-4 rounded-[var(--r-lg)] border text-[15.5px] font-[740] leading-[1.45] ${verdictClasses}`}>
          {result.ok ? (
            <CheckIcon color="var(--green-ink)" size={18} />
          ) : result.cond ? (
            <BangIcon size={18} color="var(--orange)" />
          ) : (
            <CrossIcon color="var(--red)" size={18} />
          )}
          <span>Nach allgemeiner Jagdzeit des Bundeslandes: {result.text}.</span>
        </div>
      )}

      {result && (
        <Link
          href={`/wildart/${result.s.k}/`}
          className="mt-4 flex items-center justify-center gap-2 w-full p-[15px] rounded-[15px] bg-forest-700 text-[#EAF3EC] text-[15.5px] font-[770] no-underline text-center"
        >
          Details zu {result.s.n} anzeigen
        </Link>
      )}

      {/* Notes */}
      <div className="mt-6 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Immer beachten</h3>
        <ul className="list-none m-0 p-0 space-y-[10px]">
          <li className="flex gap-[10px] text-[14.5px] font-[660] leading-[1.42]">
            <BangIcon size={17} />
            <span>Elterntierschutz beachten</span>
          </li>
          <li className="flex gap-[10px] text-[14.5px] font-[660] leading-[1.42]">
            <BangIcon size={17} />
            <span>Örtliche Anordnungen und Schutzgebiete können abweichen</span>
          </li>
        </ul>
      </div>

      <StateSheet open={stateSheetOpen} onClose={() => setStateSheetOpen(false)} />
    </div>
  );
}
