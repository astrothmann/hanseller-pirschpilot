"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { JagdMap, fitToData } from "@/components/map/JagdMap";
import { MarkerSheet } from "@/components/map/MarkerSheet";
import { MarkerTypeSheet } from "@/components/map/MarkerTypeSheet";
import { LoginDialog } from "@/components/map/LoginDialog";
import { buildAbschussReportHtml } from "@/components/map/AbschussReport";
import { exportMapPdf } from "@/components/map/PdfExport";
import { BarChartIcon, DownloadIcon, EditIcon, EyeIcon, LogoutIcon, TargetIcon, UserIcon } from "@/components/icons/Icons";
import {
  MARKER_TYPE_BY_KEY,
  apiFetchData,
  apiSave,
  getToken,
  isInsideBoundary,
  newId,
  setToken as persistToken,
  type JagdMapData,
  type MapMarker,
  type MarkerType,
} from "@/lib/jagdmap";

export default function KarteContent() {
  const [data, setData] = useState<JagdMapData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [addingType, setAddingType] = useState<MarkerType | null>(null);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [outsideHint, setOutsideHint] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const loggedIn = token !== null;
  const mode: "public" | "view" | "edit" = !loggedIn ? "public" : editMode ? "edit" : "view";
  const selectedMarker = data?.markers.find((m) => m.id === selectedId) ?? null;

  const showBanner = useCallback((msg: string) => {
    setBanner(msg);
    window.setTimeout(() => setBanner(null), 4000);
  }, []);

  const load = useCallback(async (tk?: string | null) => {
    try {
      const d = await apiFetchData(tk === undefined ? token : tk);
      setData(d);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Kartendaten konnten nicht geladen werden");
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    apiFetchData(getToken())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Kartendaten konnten nicht geladen werden");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(() => {
    persistToken(null);
    setTokenState(null);
    setEditMode(false);
    setSelectedId(null);
    setSheetOpen(false);
    setAddingType(null);
    setTypeSheetOpen(false);
    setData((d) => (d ? { ...d, markers: [] } : d));
  }, []);

  const persist = useCallback(
    async (next: JagdMapData) => {
      setData(next);
      if (!token) return;
      try {
        await apiSave(next, token);
      } catch (err) {
        const status = (err as Error & { status?: number }).status;
        if (status === 401) {
          handleLogout();
          showBanner("Sitzung abgelaufen – bitte neu anmelden");
        } else {
          showBanner(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
          void load();
        }
      }
    },
    [token, load, showBanner, handleLogout]
  );

  const handleLogin = (t: string) => {
    persistToken(t);
    setTokenState(t);
    setEditMode(false);
    setLoginOpen(false);
    void load(t);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const handleDeselect = () => {
    setSelectedId(null);
    setSheetOpen(false);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (mode !== "edit" || !addingType || !data) return;
    if (!isInsideBoundary(latlng.lat, latlng.lng, data.boundary)) {
      setOutsideHint(true);
      window.setTimeout(() => setOutsideHint(false), 3000);
      return;
    }
    const now = new Date().toISOString();
    const marker: MapMarker = {
      id: newId(),
      type: addingType,
      name: "",
      lat: latlng.lat,
      lng: latlng.lng,
      createdAt: now,
      updatedAt: now,
    };
    const next = { ...data, markers: [...data.markers, marker] };
    setAddingType(null);
    void persist(next);
  };

  const handleMarkerMoved = (id: string, latlng: L.LatLng) => {
    if (mode !== "edit" || !data) return;
    if (!isInsideBoundary(latlng.lat, latlng.lng, data.boundary)) {
      setOutsideHint(true);
      window.setTimeout(() => setOutsideHint(false), 3000);
      void load();
      return;
    }
    const now = new Date().toISOString();
    const next = {
      ...data,
      markers: data.markers.map((m) =>
        m.id === id ? { ...m, lat: latlng.lat, lng: latlng.lng, updatedAt: now } : m
      ),
    };
    void persist(next);
  };

  const handleSaveMarker = (updated: MapMarker) => {
    if (!data) return;
    const next = { ...data, markers: data.markers.map((m) => (m.id === updated.id ? updated : m)) };
    setSheetOpen(false);
    void persist(next);
  };

  const handleDeleteMarker = (id: string) => {
    if (mode !== "edit") return;
    if (!data || !window.confirm("Diesen Marker wirklich löschen?")) return;
    const next = { ...data, markers: data.markers.filter((m) => m.id !== id) };
    setSheetOpen(false);
    setSelectedId(null);
    void persist(next);
  };

  const handlePdf = async () => {
    if (!data || !mapRef.current) return;
    setBusy(true);
    try {
      await exportMapPdf(data, mapRef.current);
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "PDF-Export fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const handleExportReport = async () => {
    if (!data) return;
    setBusy(true);
    const win = window.open("", "_blank");
    if (!win) {
      showBanner("Popup blockiert – bitte für diese Seite erlauben");
      setBusy(false);
      return;
    }
    try {
      const html = await buildAbschussReportHtml(data);
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      win.location.href = url;
      // Revoke the blob URL after the new window has loaded it
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      win.close();
      showBanner(err instanceof Error ? err.message : "Bericht konnte nicht erstellt werden");
    } finally {
      setBusy(false);
    }
  };

  const handleResetZoom = () => {
    if (!data || !mapRef.current) return;
    fitToData(mapRef.current, data);
  };

  return (
    <div className="flex flex-col h-full min-h-[70dvh]">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-[26px] font-[850] tracking-[-0.5px] m-0 leading-[1.2]">Jagdkarte</h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            type="button"
            onClick={handleResetZoom}
            title="Zurück zum Revier zoomen"
            aria-label="Zurück zum Revier zoomen"
            className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
          >
            <TargetIcon size={18} />
          </button>
          {loggedIn && (
            <button
              type="button"
              onClick={() => void handlePdf()}
              title="Karte als PDF exportieren"
              aria-label="Karte als PDF exportieren"
              className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
            >
              <DownloadIcon size={18} />
            </button>
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={() => void handleExportReport()}
              title="Abschuss-Statistik als Bericht exportieren"
              aria-label="Abschuss-Statistik"
              className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
            >
              <BarChartIcon size={18} />
            </button>
          )}
          {mode === "public" ? (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              title="Admin-Modus"
              aria-label="Admin-Modus"
              className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-green text-white shadow-[var(--shadow-s)]"
            >
              <UserIcon size={18} />
            </button>
          ) : (
            <>
              {mode === "view" ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  title="Bearbeiten-Modus aktivieren"
                  aria-label="Bearbeiten-Modus aktivieren"
                  className="flex items-center gap-1.5 rounded-full bg-green text-white px-3.5 py-2.5 text-[13px] font-[740] shadow-[var(--shadow-s)]"
                >
                  <EditIcon size={15} />
                  Bearbeiten
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  title="Bearbeiten-Modus beenden"
                  aria-label="Bearbeiten-Modus beenden"
                  className="flex items-center gap-1.5 rounded-full border border-line bg-bg-soft text-ink-2 px-3.5 py-2.5 text-[13px] font-[740]"
                >
                  <EyeIcon size={15} />
                  Ansicht
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Abmelden"
                aria-label="Abmelden"
                className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
              >
                <LogoutIcon size={18} />
              </button>
            </>
          )}
        </div>
        {(mode === "view" || mode === "edit") && (
          <div data-testid="mode-subtitle" className="text-[13px] text-ink-3 font-[630] mt-2">
            {mode === "view"
              ? "Ansicht-Modus · Marker sind schreibgeschützt"
              : "Bearbeiten-Modus · Änderungen werden live gespeichert"}
          </div>
        )}
      </div>

      {banner && (
        <div className="mx-5 mb-2 rounded-[14px] bg-ink/90 text-white text-[13px] font-[650] px-4 py-2.5">
          {banner}
        </div>
      )}

      {/* Map */}
      <div className="relative flex-1 min-h-0 mx-3 mb-3 rounded-[24px] overflow-hidden border border-line shadow-[var(--shadow-s)]">
        {data ? (
          <>
            <JagdMap
              data={data}
              mode={mode}
              selectedId={selectedId}
              addingType={addingType}
              onMapReady={(m) => {
                mapRef.current = m;
              }}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              onMapClick={handleMapClick}
              onMarkerMoved={handleMarkerMoved}
            />

            {busy && (
              <div className="absolute inset-0 z-[600] grid place-items-center bg-white/40 pointer-events-none">
                <div className="w-9 h-9 rounded-full border-[3px] border-forest-600 border-t-transparent animate-spin" />
              </div>
            )}

            {addingType && mode === "edit" && (
              <div className="absolute inset-x-0 top-3 z-[500] flex justify-center pointer-events-none">
                <span className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/85 text-white text-[12.5px] font-[700] px-3.5 py-1.5 shadow-[var(--shadow-m)]">
                  {outsideHint
                    ? "Nur innerhalb der Reviergrenzen möglich"
                    : <>Position für {MARKER_TYPE_BY_KEY[addingType].label} antippen</>}
                  <button type="button" onClick={() => setAddingType(null)} className="text-white/80 underline">
                    Abbrechen
                  </button>
                </span>
              </div>
            )}

            {/* Himmelsrichtungen */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[500] pointer-events-none select-none">
              <span className="grid place-items-center w-[22px] h-[22px] rounded-full border border-line bg-bg-soft/95 backdrop-blur text-[11px] font-[800] text-forest-700">N</span>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-[500] pointer-events-none select-none">
              <span className="grid place-items-center w-[22px] h-[22px] rounded-full border border-line bg-bg-soft/95 backdrop-blur text-[11px] font-[700] text-ink-3">O</span>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[500] pointer-events-none select-none">
              <span className="grid place-items-center w-[22px] h-[22px] rounded-full border border-line bg-bg-soft/95 backdrop-blur text-[11px] font-[700] text-ink-3">S</span>
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-[500] pointer-events-none select-none">
              <span className="grid place-items-center w-[22px] h-[22px] rounded-full border border-line bg-bg-soft/95 backdrop-blur text-[11px] font-[700] text-ink-3">W</span>
            </div>

            {mode === "edit" && (
              <button
                type="button"
                onClick={() => setTypeSheetOpen(true)}
                className="absolute left-3 bottom-3 z-[500] flex items-center gap-1.5 rounded-[14px] bg-green text-white px-3 py-2.5 text-[13px] font-[740] shadow-[var(--shadow-s)]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Marker
              </button>
            )}
          </>
        ) : loadError ? (
          <div className="h-full grid place-items-center p-6">
            <div className="text-center">
              <p className="text-[14px] font-[650] text-red m-0">{loadError}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 rounded-[14px] bg-green text-white px-4 py-2.5 text-[13.5px] font-[730]"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-ink-3 text-[14px] font-[650]">
            Lade Karte…
          </div>
        )}
      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleLogin} />
      <MarkerTypeSheet
        open={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        onSelect={(type) => {
          setAddingType(type);
          setTypeSheetOpen(false);
        }}
      />
      <MarkerSheet
        open={sheetOpen && !!selectedMarker}
        marker={selectedMarker}
        mode={mode === "edit" ? "edit" : "view"}
        isNew={false}
        onClose={handleCloseSheet}
        onSave={handleSaveMarker}
        onDelete={handleDeleteMarker}
      />
    </div>
  );
}
