"use client";

import { getSpecies } from "@/lib/species";
import { useActiveState } from "@/components/layout/StateProvider";
import { BundeslandPicker } from "@/components/layout/BundeslandPicker";
import { getToday, doy, fmtDateShort } from "@/lib/dates";
import { Timeline } from "@/components/heute/ConditionList";
import Link from "next/link";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const NAME_W = 150;

export default function KalenderContent() {
  const { now, todayDoy, year } = getToday();
  const { state } = useActiveState();
  const species = getSpecies(state);

  const y = now.getFullYear();
  const m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();

  const dayStrip = [];
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d);
    const isToday = d === now.getDate();
    dayStrip.push({ d, wd: WD[dt.getDay()], isToday });
  }

  const todayPct = (todayDoy / year) * 100;

  return (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Kalender</h1>
      <p className="text-[14px] text-ink-3 font-[650] mt-1">
        <BundeslandPicker />
        <span> · {fmtDateShort(now)}</span>
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
            style={{ left: `calc(${NAME_W}px + 12px + (100% - ${NAME_W}px - 12px) * ${todayPct / 100})` }}
          />

          {/* Species rows */}
          <div className="space-y-[6px]">
            {species.map((s) => (
              <Link
                key={s.k}
                href={`/wildart/${s.k}/`}
                className="flex items-center gap-3 no-underline group"
              >
                <div className="shrink-0 text-[13px] font-[700] text-ink truncate group-hover:text-green transition-colors"
                  style={{ width: NAME_W }}>
                  {s.n}
                </div>
                <div className="relative flex-1 h-[10px] rounded-full bg-grey-soft overflow-hidden">
                  {s.win.length === 0 && (
                    <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(135deg, rgba(181,55,47,.5) 0 6px, transparent 6px 12px)" }} />
                  )}
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
            <div className="shrink-0" style={{ width: NAME_W }} />
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

      {/* Next changes */}
      <section className="mt-6">
        <h2 className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 m-0 mb-3">Nächste Änderungen</h2>
        <Timeline species={species} todayDoy={todayDoy} year={year} now={now} />
      </section>
    </div>
  );
}
