"use client";

import { useMemo } from "react";
import { getSpecies } from "@/lib/species";
import { DEFAULT_STATE } from "@/lib/types";
import { getToday, doy, fmtDateShort } from "@/lib/dates";
import Link from "next/link";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export default function KalenderPage() {
  const { now, todayDoy, year } = getToday();

  const species = useMemo(() => {
    const all = getSpecies(DEFAULT_STATE);
    // Filter out year-long species (single window spanning ~365 days)
    return all
      .filter((s) => {
        if (s.win.length === 0) return false;
        // keep species whose total hunting window < 360 days
        const total = s.win.reduce((sum, w) => {
          const a = doy(w[0], w[1]);
          const b = doy(w[2], w[3]);
          return sum + (b >= a ? b - a : year - a + b);
        }, 0);
        return total < 360;
      })
      .sort((a, b) => {
        const aStart = doy(a.win[0][0], a.win[0][1]);
        const bStart = doy(b.win[0][0], b.win[0][1]);
        return aStart - bStart;
      });
  }, [year]);

  const y = now.getFullYear();
  const m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();

  const dayStrip = useMemo(() => {
    const strip = [];
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d);
      const isToday = d === now.getDate();
      strip.push({ d, wd: WD[dt.getDay()], isToday });
    }
    return strip;
  }, [y, m, days, now]);

  const todayPct = (todayDoy / year) * 100;

  return (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Kalender</h1>
      <p className="text-[14px] text-ink-3 font-[650] mt-1">
        {DEFAULT_STATE} · {fmtDateShort(now)}
      </p>

      {/* Day strip */}
      <div className="mt-5 flex gap-[6px] overflow-x-auto no-scrollbar pb-2">
        {dayStrip.map(({ d, wd, isToday }) => (
          <div
            key={d}
            className={`flex flex-col items-center gap-[2px] px-[10px] py-[8px] rounded-[14px] text-[12px] font-[700] shrink-0 ${
              isToday
                ? "bg-forest-700 text-white"
                : "text-ink-2"
            }`}
          >
            <span className="text-[10px] font-[600]">{wd}</span>
            <b className="text-[15px]">{String(d).padStart(2, "0")}</b>
          </div>
        ))}
      </div>

      {/* Year bar chart */}
      <section className="mt-6">
        <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0 mb-3">
          Jahresverlauf · {species.length} Arten
        </h2>

        <div className="relative">
          {/* Today vertical line spanning full chart */}
          <div
            className="absolute top-0 bottom-0 z-10 pointer-events-none w-[2px] rounded-full bg-forest-700 opacity-70 -translate-x-1/2"
            style={{ left: `calc(90px + 12px + (100% - 90px - 12px) * ${todayPct / 100})` }}
          />

          {/* Species rows */}
          <div className="space-y-[6px]">
            {species.map((s) => (
              <Link
                key={s.k}
                href={`/wildart/${s.k}/`}
                className="flex items-center gap-3 no-underline group"
              >
                <div className="w-[90px] shrink-0 text-[13px] font-[700] text-ink truncate group-hover:text-green transition-colors">
                  {s.n}
                </div>
                <div className="relative flex-1 h-[10px] rounded-full bg-grey-soft overflow-hidden">
                  {s.win.map((w, i) => {
                    const a = (doy(w[0], w[1]) / year) * 100;
                    const b = (doy(w[2], w[3]) / year) * 100;
                    const grad = "linear-gradient(90deg,#2E7D4F,#4FA96F)";
                    if (b > a) {
                      return <div key={i} className="absolute top-0 bottom-0 rounded-full" style={{ left: `${a}%`, width: `${b - a}%`, background: grad }} />;
                    }
                    return (
                      <div key={i}>
                        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: `${a}%`, width: `${100 - a}%`, background: grad }} />
                        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: "0", width: `${b}%`, background: grad }} />
                      </div>
                    );
                  })}
                </div>
              </Link>
            ))}
          </div>

          {/* Month axis */}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-[90px] shrink-0" />
            <div className="flex-1 flex">
              {MONTHS.map((label, i) => (
                <div key={i} className="flex-1 text-center text-[10px] font-[650] text-ink-3/60">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Legal */}
      <div className="mt-6 mb-6 flex gap-3 px-4 py-[14px] rounded-[var(--r-md)] bg-[#EFEADF] border border-[#E0D8C7] text-[#4A4436] text-[12.5px] font-[620] leading-[1.45]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A7A55" strokeWidth="2.3" strokeLinecap="round" className="shrink-0 mt-[1px]">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />
        </svg>
        <p className="m-0">Örtliche Anordnungen, Schutzgebiete und Elterntierschutz können abweichen.</p>
      </div>
    </div>
  );
}
