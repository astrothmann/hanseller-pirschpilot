"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Sheet } from "@/components/ui/Sheet";
import { TrashIcon } from "@/components/icons/Icons";
import {
  MARKER_TYPE_BY_KEY,
  MARKER_TYPES,
  googleMapsUrl,
  resolveMediaUrl,
  type MapMarker,
  type MarkerType,
} from "@/lib/jagdmap";

interface MarkerSheetProps {
  open: boolean;
  marker: MapMarker | null;
  mode: "view" | "admin";
  isNew: boolean;
  onClose: () => void;
  onSave: (marker: MapMarker) => void;
  onDelete: (id: string) => void;
  onAddPhotos: (id: string, files: File[]) => void;
  onDeletePhoto: (id: string, url: string) => void;
}

interface MarkerSheetBodyProps {
  marker: MapMarker;
  mode: "view" | "admin";
  isNew: boolean;
  onSave: (marker: MapMarker) => void;
  onAddPhotos: (id: string, files: File[]) => void;
  onDeletePhoto: (id: string, url: string) => void;
}

const inputCls =
  "w-full rounded-[14px] border border-line bg-bg-soft px-3.5 py-2.5 text-[15px] font-[620] text-ink focus:border-green focus:outline-none";

export function MarkerSheet({
  open, marker, mode, isNew, onClose, onSave, onDelete, onAddPhotos, onDeletePhoto,
}: MarkerSheetProps) {
  if (!marker) return null;
  const meta = MARKER_TYPE_BY_KEY[marker.type];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={marker.name || meta.label}
      headerAction={
        mode === "admin" && !isNew && (
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
        onAddPhotos={onAddPhotos}
        onDeletePhoto={onDeletePhoto}
      />
    </Sheet>
  );
}

function MarkerSheetBody({ marker, mode, isNew, onSave, onAddPhotos, onDeletePhoto }: MarkerSheetBodyProps) {
  const [note, setNote] = useState(marker.note || "");
  const [type, setType] = useState<MarkerType>(marker.type);
  const [photoCount] = useState(marker.photos.length);
  const fileRef = useRef<HTMLInputElement>(null);

  const meta = MARKER_TYPE_BY_KEY[marker.type];
  const dirty =
    note.trim() !== (marker.note || "") || type !== marker.type || marker.photos.length !== photoCount;

  const handleFiles = (files: FileList | null) => {
    if (files && files.length) onAddPhotos(marker.id, Array.from(files));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = () => {
    onSave({ ...marker, note: note.trim(), type, updatedAt: new Date().toISOString() });
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

      {marker.note && (
        <p className="text-[14px] leading-[1.55] text-ink-2 font-[580] m-0">{marker.note}</p>
      )}

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

      {/* Photos */}
      {marker.photos.length > 0 && (
        <div>
          <div className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 mb-2">
            Fotos ({marker.photos.length})
          </div>
          <div className="grid grid-cols-3 gap-2">
            {marker.photos.map((url) => (
              <div key={url} className="relative aspect-square rounded-[14px] overflow-hidden border border-line">
                <a href={resolveMediaUrl(url)} target="_blank" rel="noreferrer" className="block w-full h-full">
                  <Image
                    src={resolveMediaUrl(url)}
                    alt={marker.name || meta.label}
                    fill
                    sizes="(max-width: 768px) 33vw, 200px"
                    className="object-cover"
                    unoptimized
                  />
                </a>
                {mode === "admin" && (
                  <button
                    type="button"
                    aria-label="Foto löschen"
                    onClick={() => onDeletePhoto(marker.id, url)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center text-[13px] leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!marker.note && (
        <p className="text-[13px] text-ink-3 font-[600] m-0">Keine Notiz hinterlegt.</p>
      )}

      {/* Admin editor */}
      {mode === "admin" && (
        <div className="space-y-3 pt-1 border-t border-line">
          <div>
            <label className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 block mb-1.5">Anmerkung</label>
            <textarea className={`${inputCls} min-h-[92px] resize-y`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anmerkungen…" />
          </div>
          <div>
            <label className="text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3 block mb-1.5">Marker-Typ</label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as MarkerType)}>
              {MARKER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 rounded-[14px] bg-green-soft text-green-ink px-3.5 py-2.5 text-[14px] font-[740]"
            >
              Foto hinzufügen
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/gif" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

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
