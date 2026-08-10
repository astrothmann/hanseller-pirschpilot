"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { TrashIcon } from "@/components/icons/Icons";
import {
  MARKER_TYPE_BY_KEY,
  MARKER_TYPES,
  googleMapsUrl,
  type MapMarker,
  type MarkerType,
} from "@/lib/jagdmap";

interface MarkerSheetProps {
  open: boolean;
  marker: MapMarker | null;
  mode: "view" | "edit";
  isNew: boolean;
  onClose: () => void;
  onSave: (marker: MapMarker) => void;
  onDelete: (id: string) => void;
}

interface MarkerSheetBodyProps {
  marker: MapMarker;
  mode: "view" | "edit";
  isNew: boolean;
  onSave: (marker: MapMarker) => void;
}

const inputCls =
  "w-full rounded-[14px] border border-line bg-bg-soft px-3.5 py-2.5 text-[15px] font-[620] text-ink focus:border-green focus:outline-none";

export function MarkerSheet({
  open, marker, mode, isNew, onClose, onSave, onDelete,
}: MarkerSheetProps) {
  if (!marker) return null;
  const meta = MARKER_TYPE_BY_KEY[marker.type];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={marker.name || meta.label}
      headerAction={
        mode === "edit" && !isNew && (
          <button
            type="button"
            aria-label="Marker löschen"
            onClick={() => onDelete(marker.id)}
            className="w-10 h-10 grid place-items-center rounded-full bg-red-soft text-red"
          >
            <TrashIcon size={18} />
          </button>
        )
      }
    >
      <MarkerSheetBody
        key={`${marker.id}:${open}`}
        marker={marker}
        mode={mode}
        isNew={isNew}
        onSave={onSave}
      />
    </Sheet>
  );
}

function MarkerSheetBody({ marker, mode, isNew, onSave }: MarkerSheetBodyProps) {
  const [type, setType] = useState<MarkerType>(marker.type);

  const meta = MARKER_TYPE_BY_KEY[marker.type];
  const dirty = type !== marker.type;

  const handleSave = () => {
    onSave({ ...marker, type, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-4 pb-2">
      {/* Type */}
      <div className="flex items-center gap-2.5">
        <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center shrink-0" style={{ background: meta.color }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <g dangerouslySetInnerHTML={{ __html: meta.icon }} />
          </svg>
        </span>
        <span className="text-[13px] font-[760] text-ink-2 uppercase tracking-[0.4px]">{meta.label}</span>
        <span className="text-[12.5px] text-ink-3 font-[620] ml-auto">
          {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
        </span>
      </div>

      {/* Google Maps */}
      {mode === "view" && (
        <a
          href={googleMapsUrl(marker.lat, marker.lng)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-[14px] border border-line bg-bg-soft px-3.5 py-2.5 text-[14.5px] font-[720] text-forest-700 no-underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
          In Google Maps öffnen
        </a>
      )}

      {/* Admin editor */}
      {mode === "edit" && (
        <div className="space-y-3 pt-1 border-t border-line">
          <div>
            <label className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 block mb-1.5">Marker-Typ</label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as MarkerType)}>
              {MARKER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isNew && !dirty}
            className="w-full rounded-[14px] bg-green text-white px-3.5 py-3 text-[15px] font-[760] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Speichern
          </button>
        </div>
      )}
    </div>
  );
}
