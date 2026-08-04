"use client";

import { getSpecies } from "@/lib/species";
import { DEFAULT_STATE } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { Silhouette } from "@/components/icons/SilhouetteSprite";
import { CheckIcon } from "@/components/icons/Icons";

export default function ArtenPage() {
  const species = getSpecies(DEFAULT_STATE);
  const { favorites, toggle } = useFavorites();

  return (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Meine Arten</h1>
      <p className="text-[14px] text-ink-3 font-[650] mt-1">Bestimmt, was oben im Deck erscheint</p>

      <div className="mt-5 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Im Deck anzeigen</h3>
        <div className="space-y-[2px]">
          {species.map((s) => {
            const isFav = favorites.includes(s.k);
            return (
              <button
                key={s.k}
                onClick={() => toggle(s.k)}
                className="flex items-center gap-3 w-full py-[10px] bg-transparent border-0 cursor-pointer text-left text-ink"
              >
                <span className="w-[36px] h-[36px] rounded-[12px] bg-grey-soft grid place-items-center shrink-0">
                  <Silhouette icon={s.ic} size={20} fill="var(--ink-2)" />
                </span>
                <span className="flex-1 text-[15px] font-[710]">{s.n}</span>
                <span
                  className={`w-[44px] h-[26px] rounded-full relative transition-colors ${
                    isFav ? "bg-green" : "bg-grey-soft"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform ${
                      isFav ? "left-[21px]" : "left-[3px]"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Benachrichtigungen</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[15px] font-[700]">Beginn einer Jagdzeit</div>
              <div className="text-[13px] text-ink-3 font-[600]">7 Tage vorher</div>
            </div>
            <span className="w-[44px] h-[26px] rounded-full bg-green relative">
              <span className="absolute top-[3px] left-[21px] w-[20px] h-[20px] rounded-full bg-white shadow-sm" />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[15px] font-[700]">Ende einer Jagdzeit</div>
              <div className="text-[13px] text-ink-3 font-[600]">14 Tage vorher</div>
            </div>
            <span className="w-[44px] h-[26px] rounded-full bg-green relative">
              <span className="absolute top-[3px] left-[21px] w-[20px] h-[20px] rounded-full bg-white shadow-sm" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
