"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { TrashIcon } from "@/components/icons/Icons";
import { WildartIcon } from "@/components/icons/WildartIcon";
import { getSpecies, getSpeciesByKeyAnyState } from "@/lib/species";
import { useActiveState } from "@/components/layout/StateProvider";
import {
  MARKER_TYPE_BY_KEY,
  MARKER_TYPES,
  SCHUETZEN_NAMES,
  googleMapsUrl,
  supportsAbschuesse,
  type Abschuss,
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

const sectionLabelCls = "text-[12px] font-[810] tracking-[1.1px] uppercase text-ink-3";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDatum(datum: string): string {
  const [y, m, d] = datum.split("-");
  if (!y || !m || !d) return datum;
  return `${d}.${m}.${y}`;
}

function wildartLabel(key: string): string {
  return getSpeciesByKeyAnyState(key)?.n ?? key;
}

function wildartIcon(key: string): string {
  return getSpeciesByKeyAnyState(key)?.ic ?? "deer";
}

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
  const { state } = useActiveState();
  const species = getSpecies(state);

  const [type, setType] = useState<MarkerType>(marker.type);
  const [draftAbschuesse, setDraftAbschuesse] = useState<Abschuss[]>(marker.abschuesse ?? []);
  const [listOpen, setListOpen] = useState(false);
  const [draftWildart, setDraftWildart] = useState<string>(species[0]?.k ?? "");
  const [draftSchuetze, setDraftSchuetze] = useState("");
  const [draftDatum, setDraftDatum] = useState(todayISO());

  const meta = MARKER_TYPE_BY_KEY[marker.type];
  const eligible = supportsAbschuesse(type);
  const abschuesse = marker.abschuesse ?? [];
  const abschussDirty =
    draftAbschuesse.length !== abschuesse.length ||
    draftAbschuesse.some(
      (a, i) =>
        !abschuesse[i] ||
        a.wildart !== abschuesse[i].wildart ||
        a.schuetze !== abschuesse[i].schuetze ||
        a.datum !== abschuesse[i].datum
    );
  const dirty = type !== marker.type || abschussDirty;

  const handleSave = () => {
    onSave({
      ...marker,
      type,
      abschuesse: eligible ? draftAbschuesse : [],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddAbschuss = () => {
    if (!draftWildart || !draftSchuetze || !draftDatum) return;
    const entry: Abschuss = { wildart: draftWildart, schuetze: draftSchuetze, datum: draftDatum };
    setDraftAbschuesse((prev) => [...prev, entry]);
    setDraftSchuetze("");
  };

  const handleDeleteAbschuss = (index: number) => {
    setDraftAbschuesse((prev) => prev.filter((_, i) => i !== index));
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

      {/* Abschüsse overview (view mode) */}
      {mode === "view" && eligible && (
        <div className="space-y-2.5 pt-1 border-t border-line">
          <div className="flex items-center justify-between">
            <div className={sectionLabelCls}>Abschüsse</div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-line bg-bg-soft px-2 py-0.5 text-[12px] font-[760] text-ink-2">
                {abschuesse.length}
              </span>
              {abschuesse.length > 0 && (
                <button
                  type="button"
                  aria-label="Abschüsse ein-/ausblenden"
                  onClick={() => setListOpen((o) => !o)}
                  className="w-8 h-8 grid place-items-center rounded-full border border-line bg-bg-soft text-ink-2"
                >
                  <span
                    className="grid place-items-center transition-transform"
                    style={{ transform: listOpen ? "rotate(180deg)" : "none" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </div>
          {abschuesse.length === 0 ? (
            <p className="text-[13.5px] text-ink-3 font-[620] m-0">Keine Abschüsse eingetragen.</p>
          ) : (
            listOpen && (
              <ul className="list-none m-0 p-0 space-y-2">
                {abschuesse.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-[14px] border border-line bg-bg-soft px-3 py-2.5">
                    <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center bg-white/60 shrink-0">
                      <WildartIcon icon={wildartIcon(a.wildart)} size={24} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-[720] text-ink leading-tight truncate">{wildartLabel(a.wildart)}</div>
                      <div className="text-[12.5px] text-ink-3 font-[620]">{a.schuetze} · {fmtDatum(a.datum)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      )}

      {/* Admin editor */}
      {mode === "edit" && (
        <div className="space-y-3 pt-1 border-t border-line">
          <div>
            <label className={sectionLabelCls + " block mb-1.5"}>Marker-Typ</label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as MarkerType)}>
              {MARKER_TYPES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          {eligible && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className={sectionLabelCls}>Abschüsse</div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full border border-line bg-bg-soft px-2 py-0.5 text-[12px] font-[760] text-ink-2">
                    {draftAbschuesse.length}
                  </span>
                  {draftAbschuesse.length > 0 && (
                    <button
                      type="button"
                      aria-label="Abschüsse ein-/ausblenden"
                      onClick={() => setListOpen((o) => !o)}
                      className="w-8 h-8 grid place-items-center rounded-full border border-line bg-bg-soft text-ink-2"
                    >
                      <span
                        className="grid place-items-center transition-transform"
                        style={{ transform: listOpen ? "rotate(180deg)" : "none" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {listOpen && draftAbschuesse.length > 0 && (
                <ul className="list-none m-0 p-0 space-y-2">
                  {draftAbschuesse.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-[14px] border border-line bg-bg-soft px-3 py-2.5">
                      <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center bg-white/60 shrink-0">
                        <WildartIcon icon={wildartIcon(a.wildart)} size={24} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-[720] text-ink leading-tight truncate">{wildartLabel(a.wildart)}</div>
                        <div className="text-[12.5px] text-ink-3 font-[620]">{a.schuetze} · {fmtDatum(a.datum)}</div>
                      </div>
                      <button
                        type="button"
                        aria-label="Abschuss löschen"
                        onClick={() => handleDeleteAbschuss(i)}
                        className="w-8 h-8 shrink-0 grid place-items-center rounded-full bg-red-soft text-red"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2.5 rounded-[16px] border border-dashed border-line bg-bg-soft/60 p-3">
                <div>
                  <label className="block text-[12px] font-[700] text-ink-2 mb-1">Wildart</label>
                  <select aria-label="Wildart" className={inputCls} value={draftWildart} onChange={(e) => setDraftWildart(e.target.value)}>
                    {species.map((s) => (
                      <option key={s.k} value={s.k}>{s.n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2.5">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[12px] font-[700] text-ink-2 mb-1">Schütze</label>
                    <select aria-label="Schütze" className={inputCls} value={draftSchuetze} onChange={(e) => setDraftSchuetze(e.target.value)}>
                      <option value="" disabled>Schütze wählen</option>
                      {SCHUETZEN_NAMES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-[150px] sm:w-[190px] shrink-0">
                    <label className="block text-[12px] font-[700] text-ink-2 mb-1">Datum</label>
                    <input
                      type="date"
                      value={draftDatum}
                      onChange={(e) => setDraftDatum(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddAbschuss}
                  disabled={!draftWildart || !draftSchuetze || !draftDatum}
                  className="w-full rounded-[14px] bg-green text-white px-3.5 py-2.5 text-[14px] font-[740] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Abschuss hinzufügen
                </button>
              </div>
            </div>
          )}

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
