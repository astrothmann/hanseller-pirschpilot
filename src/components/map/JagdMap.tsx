"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { markerIcon } from "./MarkerIcon";
import type { JagdMapData, MarkerType } from "@/lib/jagdmap";

const DEFAULT_CENTER: [number, number] = [51.5, 10.4];
const DEFAULT_ZOOM = 7;
const BOUNDARY_STYLE = {
  color: "#8E24AA",
  weight: 3,
  fillColor: "#8E24AA",
  fillOpacity: 0.12,
  dashArray: undefined,
};

export function fitToData(map: L.Map, data: JagdMapData): void {
  const pts: [number, number][] = [];
  if (data.boundary && data.boundary.length >= 3) pts.push(...data.boundary);
  for (const m of data.markers) pts.push([m.lat, m.lng]);
  if (pts.length) {
    const bounds = L.latLngBounds(pts.map((p) => [p[0], p[1]]));
    const zoom = map.getBoundsZoom(bounds, false, L.point(160, 160));
    map.setView(bounds.getCenter(), Math.max(13, Math.min(zoom, 17)));
  }
}

function MapAutoResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function FitOnce({ data }: { data: JagdMapData }) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    const pts: [number, number][] = [];
    if (data.boundary && data.boundary.length >= 3) pts.push(...data.boundary);
    for (const m of data.markers) pts.push([m.lat, m.lng]);
    if (pts.length) {
      didFit.current = true;
      fitToData(map, data);
    }
  }, [data, map]);
  return null;
}

function BackgroundClicks({ mode, adding, onMapClick, onDeselect }: {
  mode: "public" | "view" | "edit";
  adding: boolean;
  onMapClick: (latlng: L.LatLng) => void;
  onDeselect: () => void;
}) {
  useMapEvents({
    click: (e) => {
      if (mode === "edit" && adding) onMapClick(e.latlng);
      else onDeselect();
    },
  });
  return null;
}

export interface JagdMapProps {
  data: JagdMapData;
  mode: "public" | "view" | "edit";
  selectedId: string | null;
  addingType: MarkerType | null;
  onMapReady: (map: L.Map) => void;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  onMapClick: (latlng: L.LatLng) => void;
  onMarkerMoved: (id: string, latlng: L.LatLng) => void;
}

export function JagdMap(props: JagdMapProps) {
  const {
    data, mode, selectedId, addingType,
    onMapReady, onSelect, onDeselect, onMapClick, onMarkerMoved,
  } = props;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      ref={(m) => { if (m) onMapReady(m); }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        maxZoom={19}
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        opacity={0.8}
        maxZoom={19}
      />

      <FitOnce data={data} />

      <MapAutoResize />

      {data.boundary && data.boundary.length >= 3 && (
        <Polygon
          key="boundary"
          positions={data.boundary}
          pathOptions={BOUNDARY_STYLE}
        />
      )}

      {mode !== "public" && data.markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcon(m.type, selectedId === m.id)}
          draggable={mode === "edit"}
          eventHandlers={{
            click: () => onSelect(m.id),
            dragend: (e) => onMarkerMoved(m.id, e.target.getLatLng() as L.LatLng),
          }}
        />
      ))}

      <BackgroundClicks
        mode={mode}
        adding={addingType !== null}
        onMapClick={onMapClick}
        onDeselect={onDeselect}
      />
    </MapContainer>
  );
}
