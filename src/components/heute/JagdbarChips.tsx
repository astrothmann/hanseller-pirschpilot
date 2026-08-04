"use client";

import Link from "next/link";
import type { Species } from "@/lib/types";
import { CheckIcon } from "@/components/icons/Icons";

export function JagdbarChips({ species }: { species: Species[] }) {
  return (
    <div className="flex flex-wrap gap-[9px] px-5">
      {species.slice(0, 6).map((s) => (
        <Link
          key={s.k}
          href={`/wildart/${s.k}/`}
          className="inline-flex items-center gap-2 px-[14px] py-[10px] pl-[10px] rounded-full bg-green-soft border border-[rgba(46,125,79,.18)] text-green-ink text-[14.5px] font-[740] no-underline active:scale-[.97] transition-transform"
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
