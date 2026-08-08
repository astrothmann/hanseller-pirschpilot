"use client";

import L from "leaflet";
import { MARKER_TYPE_BY_KEY, type MarkerType } from "@/lib/jagdmap";

export function markerIcon(type: MarkerType, active = false): L.DivIcon {
  const meta = MARKER_TYPE_BY_KEY[type];
  const html =
    `<div class="jm-badge${active ? " is-active" : ""}" style="--pin:${meta.color}">` +
    `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">` +
    `<g>${meta.icon}</g>` +
    `</svg></div>`;

  return L.divIcon({
    className: "jm-divicon",
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}
