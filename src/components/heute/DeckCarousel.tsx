"use client";

import { useRef, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Species } from "@/lib/types";
import { periodShort, metaFor, statusOf } from "@/lib/dates";
import { CheckIcon, CrossIcon, BangIcon } from "@/components/icons/Icons";

const BADGE: Record<
  "ok" | "cond" | "no",
  { pill: string; circle: string; label: string; Icon: (p: { color: string; size?: number }) => ReactNode }
> = {
  ok: { pill: "bg-green-soft text-green-ink", circle: "bg-green", label: "JAGDZEIT", Icon: CheckIcon },
  cond: { pill: "bg-orange-soft text-orange", circle: "bg-orange", label: "BEDINGT", Icon: BangIcon },
  no: { pill: "bg-grey-soft text-ink-3", circle: "bg-grey", label: "NICHT JAGDBAR", Icon: CrossIcon },
};

export function DeckCarousel({
  species,
  todayDoy,
  year,
}: {
  species: Species[];
  todayDoy: number;
  year: number;
}) {
  const deckRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0, moved: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const deck = deckRef.current;
    if (!deck) return;
    dragState.current = { down: true, startX: e.clientX, scrollLeft: deck.scrollLeft, moved: 0 };
    deck.style.scrollSnapType = "none";
    deck.style.cursor = "grabbing";
    deck.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.down) return;
    const deck = deckRef.current;
    if (!deck) return;
    const dx = e.clientX - dragState.current.startX;
    dragState.current.moved = Math.abs(dx);
    deck.scrollLeft = dragState.current.scrollLeft - dx;
  }, []);

  const onPointerEnd = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.down) return;
    dragState.current.down = false;
    const deck = deckRef.current;
    if (!deck) return;
    deck.style.scrollSnapType = "x mandatory";
    deck.style.cursor = "grab";
    // Snap to nearest card
    const cards = [...deck.children] as HTMLElement[];
    let best = 0;
    let bd = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - deck.scrollLeft - 20);
      if (d < bd) { bd = d; best = i; }
    });
    deck.scrollTo({ left: cards[best].offsetLeft - 20, behavior: "smooth" });
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragState.current.moved > 8) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = 0;
    }
  }, []);

  return (
    <div
      ref={deckRef}
      className="flex gap-[14px] overflow-x-auto snap-x snap-mandatory px-5 py-[2px] pb-[6px] cursor-grab no-scrollbar select-none"
      style={{ scrollPaddingLeft: "20px" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
    >
      {species.map((s) => {
        const badge = BADGE[statusOf(s, todayDoy)];
        return (
          <Link
            key={s.k}
            href={`/wildart/${s.k}/`}
            draggable={false}
            className="snap-start shrink-0 rounded-[var(--r-xl)] p-[18px] flex flex-col no-underline transition-transform active:scale-[.975] relative overflow-hidden basis-[274px] h-[246px] text-ink border border-line bg-card lg:basis-[290px] lg:h-[258px]"
            style={{ boxShadow: "var(--shadow-m)" }}
          >
            <div className="text-[26px] font-[830] tracking-[-0.8px] mt-[3px] mb-3">{s.n}</div>
            <div className={`inline-flex items-center gap-[9px] self-start px-[13px] py-2 pr-[13px] pl-[10px] rounded-full text-[13.5px] font-[800] tracking-[0.6px] ${badge.pill}`}>
              <span className={`w-5 h-5 rounded-full grid place-items-center ${badge.circle}`}>
                <badge.Icon color="#fff" size={11} />
              </span>
              {badge.label}
            </div>
            <div className="mt-auto text-[17px] font-[750] tracking-[-0.3px]">{periodShort(s)}</div>
            <div className="text-[13px] font-[600] mt-[3px] text-ink-3">
              {metaFor(s, todayDoy, year)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
