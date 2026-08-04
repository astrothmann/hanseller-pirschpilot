"use client";

import { getSpecies } from "@/lib/species";
import { useActiveState } from "@/components/layout/StateProvider";
import { useFavorites } from "@/lib/favorites";
import { Silhouette } from "@/components/icons/SilhouetteSprite";

export default function ArtenContent() {
  const { state } = useActiveState();
  const species = getSpecies(state);
  const { favorites, toggle } = useFavorites(state);

  return (
    <div className="px-5 pt-5 pb-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Meine Arten</h1>
      <p className="text-[14px] text-ink-3 font-[650] mt-1">Wählt, welche Arten als Karten im Pirsch-Deck auf der Startseite erscheinen – auch außerhalb ihrer Jagdzeit</p>

      <div className="mt-5 bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]">
        <h3 className="m-0 mb-3 text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3">Im Deck anzeigen</h3>
        <div className="space-y-[2px]">
          {species.map((s) => {
             const isFav = favorites.includes(s.k);
             return (
               <div
                 key={s.k}
                 className="flex items-center gap-3 w-full py-[10px] text-left text-ink"
               >
                 <span className="w-[36px] h-[36px] rounded-[12px] bg-grey-soft grid place-items-center shrink-0">
                   <Silhouette icon={s.ic} size={20} fill="var(--ink-2)" />
                 </span>
                 <span className="flex-1 text-[15px] font-[710]">{s.n}</span>
                 {/* Clickable toggle button */}
                 <button
                   onClick={() => toggle(s.k)}
                   aria-pressed={isFav}
                   aria-label={`Toggle ${s.n} in deck`}
                   className={`w-[44px] h-[26px] rounded-full relative transition-colors border-none cursor-pointer p-0 ${
                     isFav ? "bg-green" : "bg-grey-soft"
                   }`}
                 >
                   <span
                     className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform ${
                       isFav ? "left-[21px]" : "left-[3px]"
                     }`}
                   />
                 </button>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}
