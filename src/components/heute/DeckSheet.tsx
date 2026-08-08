"use client";

import { Sheet } from "@/components/ui/Sheet";
import { WildartIcon } from "@/components/icons/WildartIcon";
import { getSpecies } from "@/lib/species";
import { useActiveState } from "@/components/layout/StateProvider";

export function DeckSheet({
  open,
  onClose,
  favorites,
  toggle,
}: {
  open: boolean;
  onClose: () => void;
  favorites: string[];
  toggle: (k: string) => void;
}) {
  const { state } = useActiveState();
  const species = getSpecies(state);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Deck anzeigen"
      subtitle={`Wählt, welche Arten als Karten im Pirsch-Deck erscheinen – auch außerhalb ihrer Jagdzeit.`}
    >
      <div className="bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)] mb-3">
        <div className="space-y-[2px]">
          {species.map((s) => {
            const isFav = favorites.includes(s.k);
            return (
              <div
                key={s.k}
                className="flex items-center gap-3 w-full py-[10px] text-left text-ink"
              >
                <span className="w-[36px] h-[36px] rounded-[12px] bg-grey-soft grid place-items-center shrink-0">
                  <WildartIcon icon={s.ic} size={20} />
                </span>
                <span className="flex-1 text-[15px] font-[710]">{s.n}</span>
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
    </Sheet>
  );
}
