"use client";

import Link from "next/link";
import type { Species } from "@/lib/types";
import { periodShort, metaFor } from "@/lib/dates";
import { Silhouette } from "@/components/icons/SilhouetteSprite";
import { CheckIcon } from "@/components/icons/Icons";

export function DeckCarousel({
  species,
  todayDoy,
  year,
}: {
  species: Species[];
  todayDoy: number;
  year: number;
}) {
  return (
    <div className="flex gap-[14px] overflow-x-auto snap-x snap-mandatory px-5 py-[2px] pb-[6px] cursor-grab no-scrollbar"
      style={{ scrollPaddingLeft: "20px" }}>
      {species.map((s) => {
        const isHero = s.hero;
        return (
          <Link
            key={s.k}
            href={`/wildart/${s.k}/`}
            className={`snap-start shrink-0 rounded-[var(--r-xl)] p-[18px] flex flex-col no-underline transition-transform active:scale-[.975] ${
              isHero
                ? "basis-[296px] h-[246px] text-[#EDF5EF] border-0"
                : "basis-[274px] h-[246px] text-ink border border-line bg-card"
            } lg:basis-[290px] lg:h-[258px]`}
            style={{
              background: isHero
                ? "linear-gradient(160deg,#28613F 0%,#173B27 60%,#102A1C 100%)"
                : undefined,
              boxShadow: "var(--shadow-m)",
            }}
          >
            <Silhouette
              icon={s.ic}
              size={isHero ? 150 : 132}
              fill={isHero ? "#fff" : "#1C4630"}
              className="absolute right-[-24px] bottom-[-24px] opacity-[.16] pointer-events-none"
            />
            <div className={`text-[11.5px] font-[750] tracking-[1.2px] uppercase ${
              isHero ? "text-[#9FC4AC]" : "text-ink-3"
            }`}>
              {s.grp.split(" · ")[1] || s.grp}
            </div>
            <div className="text-[26px] font-[830] tracking-[-0.8px] mt-[3px] mb-3">{s.n}</div>
            <div className={`inline-flex items-center gap-[9px] self-start px-[13px] py-2 pr-[13px] pl-[10px] rounded-full text-[13.5px] font-[800] tracking-[0.6px] ${
              isHero
                ? "bg-[rgba(115,224,158,.16)] text-[#8DEBB4]"
                : "bg-green-soft text-green-ink"
            }`}>
              <span className="w-5 h-5 rounded-full bg-green grid place-items-center">
                <CheckIcon color="#fff" size={11} />
              </span>
              JAGDZEIT
            </div>
            <div className="mt-auto text-[17px] font-[750] tracking-[-0.3px]">{periodShort(s)}</div>
            <div className={`text-[13px] font-[600] mt-[3px] ${
              isHero ? "text-[#A8C9B5]" : "text-ink-3"
            }`}>
              {metaFor(s, todayDoy, year)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
