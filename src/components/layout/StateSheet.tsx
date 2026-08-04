"use client";

import { useActiveState } from "./StateProvider";
import { SUPPORTED_STATES } from "@/lib/species";
import { Sheet } from "@/components/ui/Sheet";
import { CheckIcon } from "@/components/icons/Icons";

export function StateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setState } = useActiveState();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Bundesland wählen"
      subtitle={`Jagdzeiten sind Landesrecht. Aktuell hinterlegt: ${state}.`}
    >
      <div className="grid grid-cols-2 gap-[9px]">
        {SUPPORTED_STATES.map((stateName) => {
          const sel = stateName === state;
          return (
            <button
              key={stateName}
              onClick={() => { setState(stateName); onClose(); }}
              className={`p-[14px] rounded-[15px] border text-left text-[14.5px] font-[710] cursor-pointer flex items-center justify-between gap-2 active:scale-[.97] transition-transform ${
                sel
                  ? "bg-forest-700 text-[#EAF3EC] border-forest-700"
                  : "bg-card border-line text-ink"
              }`}
            >
              {stateName}
              {sel && <CheckIcon color="#8DEBB4" size={13} />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
