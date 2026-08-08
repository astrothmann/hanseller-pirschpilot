"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { JagdMap, fitToData } from "@/components/map/JagdMap";
import { MarkerSheet } from "@/components/map/MarkerSheet";
import { MarkerTypeSheet } from "@/components/map/MarkerTypeSheet";
import { LoginDialog } from "@/components/map/LoginDialog";
import { exportMapPdf } from "@/components/map/PdfExport";
import { DownloadIcon, LogoutIcon, TargetIcon, UserIcon } from "@/components/icons/Icons";
import {
  MARKER_TYPE_BY_KEY,
  apiDeletePhoto,
  apiFetchData,
  apiSave,
  apiUploadPhoto,
  getToken,
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
  const [pendingNewId, setPendingNewId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const mode: "view" | "admin" = token ? "admin" : "view";
  const selectedMarker = data?.markers.find((m) => m.id === selectedId) ?? null;

  const showBanner = useCallback((msg: string) => {
    setBanner(msg);
    window.setTimeout(() => setBanner(null), 4000);
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await apiFetchData();
      setData(d);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Kartendaten konnten nicht geladen werden");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetchData()
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

  const persist = useCallback(
    async (next: JagdMapData) => {
      setData(next);
      if (!token) return;
      try {
        await apiSave(next, token);
      } catch (err) {
        showBanner(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
        void load();
      }
    },
    [token, load, showBanner]
  );

  const handleLogin = (t: string) => {
    persistToken(t);
    setTokenState(t);
    setLoginOpen(false);
  };

  const handleLogout = () => {
    persistToken(null);
    setTokenState(null);
    setSelectedId(null);
    setSheetOpen(false);
    setAddingType(null);
    setTypeSheetOpen(false);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const handleDeselect = () => {
    if (pendingNewId) {
      setData((d) => (d ? { ...d, markers: d.markers.filter((m) => m.id !== pendingNewId) } : d));
      setPendingNewId(null);
    }
    setSelectedId(null);
    setSheetOpen(false);
  };

  const handleCloseSheet = () => {
    if (pendingNewId) {
      setData((d) => (d ? { ...d, markers: d.markers.filter((m) => m.id !== pendingNewId) } : d));
      setPendingNewId(null);
      setSelectedId(null);
    }
    setSheetOpen(false);
  };

  const handleMapClick = (latlng: L.LatLng) => {
    if (!addingType || !data) return;
    const now = new Date().toISOString();
    const marker: MapMarker = {
      id: newId(),
      type: addingType,
      name: "",
      note: "",
      lat: latlng.lat,
      lng: latlng.lng,
      photos: [],
      createdAt: now,
      updatedAt: now,
    };
    const next = { ...data, markers: [...data.markers, marker] };
    setData(next);
    setPendingNewId(marker.id);
    setAddingType(null);
    setSelectedId(marker.id);
    setSheetOpen(true);
  };

  const handleMarkerMoved = (id: string, latlng: L.LatLng) => {
    if (!data) return;
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
    setPendingNewId(null);
    setSheetOpen(false);
    void persist(next);
  };

  const handleDeleteMarker = (id: string) => {
    if (mode !== "admin") return;
    if (!data || !window.confirm("Diesen Marker wirklich löschen?")) return;
    const next = { ...data, markers: data.markers.filter((m) => m.id !== id) };
    setSheetOpen(false);
    setSelectedId(null);
    void persist(next);
  };

  const handleAddPhotos = async (id: string, files: File[]) => {
    if (!token || !data) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        urls.push(await apiUploadPhoto(f, token));
      }
      const updated = {
        markers: data.markers.map((m) =>
          m.id === id
            ? { ...m, photos: [...m.photos, ...urls], updatedAt: new Date().toISOString() }
            : m
        ),
      };
      if (id === pendingNewId) {
        setData((d) => (d ? { ...d, markers: updated.markers } : d));
      } else {
        await persist({ ...data, ...updated });
      }
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Foto-Upload fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePhoto = async (id: string, url: string) => {
    if (!token || !data) return;
    try {
      await apiDeletePhoto(url, token);
      const next = {
        ...data,
        markers: data.markers.map((m) =>
          m.id === id ? { ...m, photos: m.photos.filter((p) => p !== url) } : m
        ),
      };
      void persist(next);
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Foto konnte nicht gelöscht werden");
    }
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

  const handleResetZoom = () => {
    if (!data || !mapRef.current) return;
    fitToData(mapRef.current, data);
  };

  return (
    <div className="flex flex-col h-full min-h-[70dvh]">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-[850] tracking-[-0.5px] m-0">Jagdkarte</h1>
          {mode === "admin" && (
            <div className="text-[13px] text-ink-3 font-[630] mt-[3px]">
              Admin-Modus · Änderungen werden live gespeichert
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleResetZoom}
            title="Zurück zum Revier zoomen"
            aria-label="Zurück zum Revier zoomen"
            className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
          >
            <TargetIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            title="Karte als PDF exportieren"
            aria-label="Karte als PDF exportieren"
            className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
          >
            <DownloadIcon size={18} />
          </button>
          {mode === "admin" ? (
            <button
              type="button"
              onClick={handleLogout}
              title="Abmelden"
              aria-label="Abmelden"
              className="shrink-0 grid place-items-center w-11 h-11 rounded-full border border-line bg-bg-soft text-ink-2"
            >
              <LogoutIcon size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              title="Admin-Modus"
              aria-label="Admin-Modus"
              className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-green text-white shadow-[var(--shadow-s)]"
            >
              <UserIcon size={18} />
            </button>
          )}
        </div>
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

            {addingType && mode === "admin" && (
              <div className="absolute inset-x-0 top-3 z-[500] flex justify-center pointer-events-none">
                <span className="pointer-events-auto flex items-center gap-2 rounded-full bg-ink/85 text-white text-[12.5px] font-[700] px-3.5 py-1.5 shadow-[var(--shadow-m)]">
                  Position für {MARKER_TYPE_BY_KEY[addingType].label} antippen
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

            {mode === "admin" && (
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
        mode={mode}
        isNew={selectedMarker?.id === pendingNewId}
        onClose={handleCloseSheet}
        onSave={handleSaveMarker}
        onDelete={handleDeleteMarker}
        onAddPhotos={handleAddPhotos}
        onDeletePhoto={handleDeletePhoto}
      />
    </div>
  );
}
