"use client";

import Link from "next/link";
import type { Species } from "@/lib/types";
import { periodShort, doy, dayOffsetDate, fmtDateShort } from "@/lib/dates";
import { Silhouette } from "@/components/icons/SilhouetteSprite";
import { CheckIcon, CrossIcon, BangIcon, ChevronRight } from "@/components/icons/Icons";

export function ConditionList({ species }: { species: Species[] }) {
  if (species.length === 0) return null;
  return (
    <div className="px-5 space-y-[10px]">
      {species.map((s) => (
        <Link
          key={s.k}
          href={`/wildart/${s.k}/`}
          className="flex items-center gap-[13px] w-full bg-gradient-to-b from-[#FFF9F0] to-[#FFF6EA] [data-theme='dark']:from-[#241B08] [data-theme='dark']:to-[#201807] border border-[rgba(197,106,17,.25)] rounded-[var(--r-lg)] p-[14px] shadow-[var(--shadow-s)] no-underline text-ink"
        >
          <span className="w-[44px] h-[44px] rounded-[14px] bg-orange-soft grid place-items-center shrink-0">
            <Silhouette icon={s.ic} size={26} fill="var(--orange)" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-2 text-[15px] font-[750]">
              {s.n}
              <span className="text-[10.5px] font-[830] tracking-[0.7px] px-2 py-[3px] rounded-[7px] bg-orange text-white">
                BEDINGT
              </span>
            </span>
            <span className="text-[13px] text-ink-3 font-[600] block mt-[2px]">
              {periodShort(s)}
            </span>
          </span>
          <ChevronRight />
        </Link>
      ))}
    </div>
  );
}

export function NoList({ species }: { species: Species[] }) {
  if (species.length === 0) return null;
  return (
    <div className="px-5 space-y-1">
      {species.map((s) => (
        <Link
          key={s.k}
          href={`/wildart/${s.k}/`}
          className="flex items-center gap-3 py-[9px] no-underline text-ink"
        >
          <span className="w-[30px] h-[30px] rounded-[10px] bg-red-soft grid place-items-center shrink-0">
            <CrossIcon color="var(--red)" size={10} />
          </span>
          <span className="flex-1 text-[14px] font-[680]">{s.n}</span>
        </Link>
      ))}
    </div>
  );
}

interface TimelineEvent {
  off: number;
  green: boolean;
  list: Species[];
}

export function Timeline({
  species,
  todayDoy,
  year,
  now,
}: {
  species: Species[];
  todayDoy: number;
  year: number;
  now: Date;
}) {
  const ev: Record<number, { starts: Species[]; ends: Species[] }> = {};
  species.forEach((s) => {
    if (s.cond || (s.win.length === 1 && s.win[0][0] === 1 && s.win[0][1] === 1 && s.win[0][2] === 12 && s.win[0][3] === 31)) return;
    s.win.forEach((w) => {
      const st = doy(w[0], w[1]);
      const en = doy(w[2], w[3]);
      let dS = st - todayDoy;
      let dE = en - todayDoy;
      if (dS < 0) dS += year;
      if (dE < 0) dE += year;
      if (dS > 0) {
        if (!ev[dS]) ev[dS] = { starts: [], ends: [] };
        ev[dS].starts.push(s);
      }
      if (dE > 0) {
        if (!ev[dE]) ev[dE] = { starts: [], ends: [] };
        ev[dE].ends.push(s);
      }
    });
  });

  const items: TimelineEvent[] = [];
  const keys = Object.keys(ev).map(Number).sort((a, b) => a - b);
  keys.forEach((off) => {
    const e = ev[off];
    if (e.starts.length) items.push({ off, green: true, list: e.starts });
    if (e.ends.length) items.push({ off, green: false, list: e.ends });
  });

  const visible = items.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0">
      {visible.map(({ off, green, list }, i) => {
        const d = dayOffsetDate(now, off);
        const names = list.map((s) => s.n).join(", ");
        return (
          <div key={`${off}-${green}-${i}`} className="flex gap-3 px-5 py-[10px]">
            <div className="flex flex-col items-center">
              <span className={`w-[22px] h-[22px] rounded-full grid place-items-center ${green ? "bg-green" : "bg-red"}`}>
                {green ? <CheckIcon color="#fff" size={8} /> : <CrossIcon color="#fff" size={8} />}
              </span>
              {i < visible.length - 1 && <div className="w-[2px] flex-1 bg-line mt-1" />}
            </div>
            <div className="pb-2">
              <div className="text-[11px] font-[700] tracking-[0.6px] uppercase text-ink-3">
                In {off} Tagen
              </div>
              <div className="text-[14.5px] font-[740] mt-[2px]">
                {green ? "Jagdzeit beginnt" : "Jagdzeit endet"}: {names}
              </div>
              <div className="text-[12.5px] text-ink-3 font-[600] mt-[2px]">
                {fmtDateShort(d)} · {list[0].grp.split(" · ")[0]}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
