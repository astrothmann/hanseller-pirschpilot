"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Species } from "@/lib/types";
import { CheckIcon } from "@/components/icons/Icons";

export function JagdbarChips({
  species,
  onFitChange,
}: {
  species: Species[];
  onFitChange?: (count: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(Infinity);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const chips = Array.from(container.querySelectorAll<HTMLAnchorElement>("a"));
      const padRight = parseFloat(getComputedStyle(container).paddingRight) || 0;
      const limit = container.getBoundingClientRect().right - padRight;
      let count = 0;
      for (const chip of chips) {
        if (chip.getBoundingClientRect().right > limit) break;
        count++;
      }
      setFit(count);
      onFitChange?.(count);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [species, onFitChange]);

  return (
    <div ref={containerRef} className="flex flex-nowrap gap-[9px] px-5 overflow-hidden">
      {species.map((s, i) => (
        <Link
          key={s.k}
          href={`/wildart/${s.k}/`}
          className={`shrink-0 inline-flex items-center gap-2 px-[14px] py-[10px] pl-[10px] rounded-full bg-green-soft border border-[rgba(46,125,79,.18)] text-green-ink text-[14.5px] font-[740] no-underline active:scale-[.97] transition-transform ${i >= fit ? "invisible" : ""}`}
          aria-label={`${s.n}, in Jagdzeit, Details öffnen`}
        >
          <span className="w-[18px] h-[18px] rounded-full bg-green grid place-items-center">
            <CheckIcon color="#fff" size={10} />
          </span>
          {s.n}
        </Link>
      ))}
    </div>
  );
}
