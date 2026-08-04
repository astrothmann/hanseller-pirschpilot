"use client";

import { useRouter } from "next/navigation";
import type { Species } from "@/lib/types";
import { getSpeciesByKey, getSpeciesByKeyAnyState } from "@/lib/species";
import { useActiveState } from "@/components/layout/StateProvider";
import {
  getToday, statusOf, inWin, isYearLong, isProtected,
  periodFull, metaFor, doy, fmtDateShort,
} from "@/lib/dates";
import { Silhouette } from "@/components/icons/SilhouetteSprite";
import { CheckIcon, CrossIcon, BangIcon, ArrowLeft } from "@/components/icons/Icons";

function YearBar({ species, todayDoy, year }: { species: Species; todayDoy: number; year: number }) {
  if (isYearLong(species) || isProtected(species)) return null;
  return (
    <div className="mt-[14px]">
      <div className="relative h-3 rounded-full bg-grey-soft overflow-hidden">
        {species.win.map((w, i) => {
          const a = (doy(w[0], w[1]) / year) * 100;
          const b = (doy(w[2], w[3]) / year) * 100;
          if (b > a) {
            return (
              <div key={i} className="absolute top-0 bottom-0 rounded-full"
                style={{ left: `${a}%`, width: `${b - a}%`, background: "linear-gradient(90deg,var(--green),#4FA96F)" }} />
            );
          }
          return (
            <div key={i}>
              <div className="absolute top-0 bottom-0 rounded-full"
                style={{ left: `${a}%`, width: `${100 - a}%`, background: "linear-gradient(90deg,var(--green),#4FA96F)" }} />
              <div className="absolute top-0 bottom-0 rounded-full"
                style={{ left: "0", width: `${b}%`, background: "linear-gradient(90deg,var(--green),#4FA96F)" }} />
            </div>
          );
        })}
        <div className="absolute top-[-4px] w-[3px] h-5 rounded-[3px] bg-forest-900"
          style={{ left: `${(todayDoy / year) * 100}%` }} />
      </div>
      <div className="flex justify-between text-[10.5px] font-[650] text-ink-3 mt-[6px]">
        <span>JAN</span><span>APR</span><span>JUL</span><span>OKT</span><span>DEZ</span>
      </div>
    </div>
  );
}

export function WildartDetail({ slug }: { slug: string }) {
  const { state } = useActiveState();
  const { now, todayDoy, year } = getToday();
  const router = useRouter();

  const goBack = () => {
    const prev = sessionStorage.getItem("jd-prev");
    if (prev && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const s = getSpeciesByKey(state, slug);
  if (!s) {
    const any = getSpeciesByKeyAnyState(slug);
    return (
      <div className="flex flex-col min-h-full">
        <div className="relative px-[22px] pt-14 pb-[26px] text-[#EAF3EC] overflow-hidden"
          style={{ background: "linear-gradient(160deg,#4B5563 0%,#2A303A 55%,#161A20 100%)" }}>
          <button
            onClick={goBack}
            className="absolute top-[14px] left-[14px] w-[38px] h-[38px] rounded-full grid place-items-center z-[3] text-[#EAF3EC] no-underline active:scale-[.92] border-0 p-0 cursor-pointer"
            style={{ background: "rgba(255,255,255,.14)" }}
            aria-label="Zurück"
          >
            <ArrowLeft size={18} />
          </button>
          {any && <Silhouette icon={any.ic} size={190} fill="#fff" className="absolute right-[-24px] bottom-[-24px] opacity-[.16]" />}
          <div className="text-[34px] font-[850] tracking-[-1.2px] mt-[14px] mb-1 relative">{any?.n ?? slug}</div>
          <div className="text-[14px] text-[#B6D2C1] font-[650] relative">
            {state} · Heute, {fmtDateShort(now)}
          </div>
          <div className="inline-flex items-center gap-[10px] mt-[18px] px-[18px] py-[11px] pl-3 rounded-full text-[16px] font-[800] tracking-[0.3px] relative"
            style={{ background: "rgba(255,255,255,.14)" }}>
            <span className="w-5 h-5 rounded-full grid place-items-center bg-[#6B7280]">
              <CrossIcon color="#fff" size={13} />
            </span>
            Keine Jagdzeit
          </div>
        </div>

        <div className="mx-5 mt-4 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
          <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Hinweise</h3>
          <ul className="list-none m-0 p-0 space-y-[10px]">
            <li className="flex gap-[10px] text-[14.5px] font-[660] leading-[1.42]">
              <BangIcon size={17} />
              <span>Für diese Art ist im Bundesland {state} keine Jagdzeit hinterlegt.</span>
            </li>
            <li className="flex gap-[10px] text-[14.5px] font-[660] leading-[1.42]">
              <BangIcon size={17} />
              <span>Örtliche Anordnungen und Schutzgebiete können abweichen</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const st = statusOf(s, todayDoy);
  const isRed = st === "no";
  const isCond = st === "cond";

  const statusText = isRed ? "Schonzeit" : isCond ? "Jagdzeit · Bedingung" : "Jagdzeit";
  const statusIcon = isRed ? <CrossIcon color="#fff" size={13} /> : <CheckIcon color="#fff" size={13} />;

  const verdict = isRed
    ? "Nach allgemeiner Jagdzeit des Bundeslandes: Schonzeit."
    : isCond
    ? "Nach allgemeiner Jagdzeit des Bundeslandes: Jagdzeit – Bedingungen beachten."
    : "Nach allgemeiner Jagdzeit des Bundeslandes: Jagdzeit.";

  const notes: string[] = [];
  if (s.hint) notes.push(s.hint);
  if (s.note) notes.push(s.note);
  if (!s.hint && !isRed) notes.push("Elterntierschutz beachten");
  notes.push("Örtliche Anordnungen und Schutzgebiete können abweichen");

  const toneGradient = isRed
    ? "linear-gradient(160deg,#7A2C26 0%,#4A1C18 60%,#2A100E 100%)"
    : isCond
    ? "linear-gradient(160deg,#8A4C0E 0%,#553009 60%,#2E1A05 100%)"
    : "linear-gradient(160deg,#28613F 0%,#173B27 55%,#0F281B 100%)";

  const badgeBg = isRed ? "bg-red" : isCond ? "bg-orange" : "bg-green";

  const verdictClasses = isRed
    ? "bg-red-soft border-[rgba(181,55,47,.2)] text-red"
    : isCond
    ? "bg-orange-soft border-[rgba(197,106,17,.2)] text-[#8A4C0E]"
    : "bg-green-soft border-[rgba(46,125,79,.2)] text-green-ink";

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="relative px-[22px] pt-14 pb-[26px] text-[#EAF3EC] overflow-hidden" style={{ background: toneGradient }}>
        <button
          onClick={goBack}
          className="absolute top-[14px] left-[14px] w-[38px] h-[38px] rounded-full grid place-items-center z-[3] text-[#EAF3EC] no-underline active:scale-[.92] border-0 p-0 cursor-pointer"
          style={{ background: "rgba(255,255,255,.14)" }}
          aria-label="Zurück"
        >
          <ArrowLeft size={18} />
        </button>
        <Silhouette icon={s.ic} size={190} fill="#fff" className="absolute right-[-24px] bottom-[-24px] opacity-[.16]" />
        <div className="text-[34px] font-[850] tracking-[-1.2px] mt-[14px] mb-1 relative">{s.n}</div>
        <div className="text-[14px] text-[#B6D2C1] font-[650] relative">
          {state} · Heute, {fmtDateShort(now)}
        </div>
        <div className="inline-flex items-center gap-[10px] mt-[18px] px-[18px] py-[11px] pl-3 rounded-full text-[16px] font-[800] tracking-[0.3px] relative"
          style={{ background: "rgba(255,255,255,.14)" }}>
          <span className={`w-5 h-5 rounded-full grid place-items-center ${badgeBg}`}>
            {statusIcon}
          </span>
          {statusText}
        </div>
      </div>

      {/* Verdict */}
      <div className={`flex items-start gap-[11px] mx-5 mt-4 px-[18px] py-4 rounded-[var(--r-lg)] border text-[15.5px] font-[740] leading-[1.45] ${verdictClasses}`}>
        {isRed ? <CrossIcon color="var(--red)" size={18} /> : <CheckIcon color="var(--green-ink)" size={18} />}
        <span>{verdict}</span>
      </div>

      {/* Zeitraum */}
      <div className="mx-5 mt-4 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Zeitraum</h3>
        <div className="flex justify-between items-baseline gap-[14px] py-[9px]">
          <span className="text-[14px] text-ink-2 font-[650]">Allgemeine Jagdzeit</span>
          <span className="text-[16px] font-[780] tracking-[-0.2px] text-right">{periodFull(s)}</span>
        </div>
        <div className="flex justify-between items-baseline gap-[14px] py-[9px] border-t border-line">
          <span className="text-[14px] text-ink-2 font-[650]">Status heute</span>
          <span className="text-[16px] font-[780] tracking-[-0.2px] text-right">{metaFor(s, todayDoy, year)}</span>
        </div>
        <div className="flex justify-between items-baseline gap-[14px] py-[9px] border-t border-line">
          <span className="text-[14px] text-ink-2 font-[650]">Rechtsgrundlage</span>
          <span className="text-[16px] font-[780] tracking-[-0.2px] text-right">{s.src}</span>
        </div>
        <div className="flex justify-between items-baseline gap-[14px] py-[9px] border-t border-line">
          <span className="text-[14px] text-ink-2 font-[650]">Kategorie</span>
          <span className="text-[16px] font-[780] tracking-[-0.2px] text-right">{s.grp}</span>
        </div>
        <YearBar species={s} todayDoy={todayDoy} year={year} />
      </div>

      {/* Hinweise */}
      <div className="mx-5 mt-4 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Hinweise</h3>
        <ul className="list-none m-0 p-0 space-y-[10px]">
          {notes.map((note, i) => (
            <li key={i} className="flex gap-[10px] text-[14.5px] font-[660] leading-[1.42]">
              <BangIcon size={17} />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal */}
      <div className="mx-5 mt-4 mb-8 flex gap-3 px-4 py-[14px] rounded-[var(--r-md)] bg-[#EFEADF] border border-[#E0D8C7] text-[#4A4436] text-[12.5px] font-[620] leading-[1.45]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A7A55" strokeWidth="2.3" strokeLinecap="round" className="shrink-0 mt-[1px]">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />
        </svg>
        <p className="m-0">
          Die Anzeige zeigt allgemeine landesweite Jagdzeiten. Örtliche Anordnungen, Schutzgebiete und Elterntierschutz können abweichen.
        </p>
      </div>
    </div>
  );
}
