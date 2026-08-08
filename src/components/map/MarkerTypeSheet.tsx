"use client";

import { Sheet } from "@/components/ui/Sheet";
import { MARKER_TYPES, type MarkerType } from "@/lib/jagdmap";

interface MarkerTypeSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: MarkerType) => void;
}

export function MarkerTypeSheet({ open, onClose, onSelect }: MarkerTypeSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Neuer Marker" subtitle="Marker-Typ wählen">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2 max-w-[480px] mx-auto">
        {MARKER_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-bg-soft px-2 py-3.5 active:scale-[0.98] transition-transform"
          >
            <span className="w-[36px] h-[36px] rounded-[11px] grid place-items-center sm:w-[44px] sm:h-[44px]" style={{ background: t.color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" className="sm:w-[26px] sm:h-[26px]">
                <g dangerouslySetInnerHTML={{ __html: t.icon }} />
              </svg>
            </span>
            <span className="text-[13px] font-[720] text-ink-2 leading-tight sm:text-[14px]">{t.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
