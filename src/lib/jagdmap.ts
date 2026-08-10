export type MarkerType =
  | "wildkamera"
  | "salzlecke"
  | "leitersitz"
  | "jagdkanzel"
  | "drueckjagdbock"
  | "defekt";

export interface Abschuss {
  /** Species key from data/species/*.json (e.g. "rehbock"). */
  wildart: string;
  /** Free-text hunter name. */
  schuetze: string;
  /** ISO date YYYY-MM-DD. */
  datum: string;
}

export interface MapMarker {
  id: string;
  type: MarkerType;
  name: string;
  lat: number;
  lng: number;
  createdAt: string | null;
  updatedAt: string | null;
  abschuesse?: Abschuss[];
}

export interface JagdMapData {
  version: number;
  boundary: [number, number][] | null;
  markers: MapMarker[];
  updatedAt: string | null;
}

export interface MarkerTypeMeta {
  key: MarkerType;
  label: string;
  color: string;
  /** Inner SVG markup (white strokes) shown on the pin, centered around (12,10.5). */
  icon: string;
}

export const MARKER_TYPES: MarkerTypeMeta[] = [
  {
    key: "wildkamera",
    label: "Wildkamera",
    color: "#6A4FA5",
    icon: '<path fill="#fff" fill-rule="evenodd" d="M4.5 8.5h3l1.5-2.2h6L16.5 8.5h3v8.5h-15zM15.1 13.5a3.1 3.1 0 1 1-6.2 0 3.1 3.1 0 0 1 6.2 0zM16.7 10.2h1.6v1.6h-1.6z"/>',
  },
  {
    key: "salzlecke",
    label: "Salzlecke",
    color: "#2A9D8F",
    icon: '<path fill="#fff" d="M9.2 10h5.6v3.4H9.2zM11.1 13.4h1.8v4.6h-1.8zM8.8 17.8h6.4v1.3H8.8z"/>',
  },
  {
    key: "leitersitz",
    label: "Leitersitz",
    color: "#2E7D4F",
    icon: '<path fill="#fff" d="M7.4 4.6h9.2v1.6H7.4zM8.6 6.2h1.4v10.8H8.6zM14 6.2h1.4v10.8H14zM8.6 9h6.8v1.4H8.6zM8.6 11.4h6.8v1.4H8.6zM8.6 13.8h6.8v1.4H8.6zM8.6 16.2h6.8v1.4H8.6z"/>',
  },
  {
    key: "jagdkanzel",
    label: "Jagdkanzel",
    color: "#1565C0",
    icon: '<path fill="#fff" d="M9.2 15.6h1.3v2.6H9.2zM13.5 15.6h1.3v2.6h-1.3zM8.2 9.8h7.6v6H8.2zM7.4 9.8l4.6-3.4 4.6 3.4z"/>',
  },
  {
    key: "drueckjagdbock",
    label: "Drückjagdbock",
    color: "#33691E",
    icon: '<path fill="#fff" d="M9.2 11.4h1.3v6.6H9.2zM13.5 11.4h1.3v6.6h-1.3zM7.4 10h9.2v1.7H7.4zM7.4 7.6h1.9v2.4H7.4z"/>',
  },
  {
    key: "defekt",
    label: "Defekt",
    color: "#C62828",
    icon: '<path fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round" d="M12 4.8l8 14H4z"/><path fill="#fff" d="M11.15 8.6h1.7v4.9h-1.7z"/><circle cx="12" cy="15.8" r="1.05" fill="#fff"/>',
  },
];

export const MARKER_TYPE_BY_KEY: Record<MarkerType, MarkerTypeMeta> = Object.fromEntries(
  MARKER_TYPES.map((m) => [m.key, m])
) as Record<MarkerType, MarkerTypeMeta>;

/** Marker types on which Abschüsse (harvest records) can be logged. */
export const ABSCHUSS_TYPES: MarkerType[] = ["drueckjagdbock", "leitersitz", "jagdkanzel"];

export function supportsAbschuesse(type: MarkerType): boolean {
  return ABSCHUSS_TYPES.includes(type);
}

/** Known hunter names selectable when logging an Abschuss. */
export const SCHUETZEN_NAMES: string[] = ["Michael", "Reinhard", "Wilhelm", "Heinz", "Ludwig", "Gregor"];

/* ---------------------------------------------------------------------------
 * API client
 * ------------------------------------------------------------------------- */

const TOKEN_KEY = "jd-karte-admin";

/** Base URL of the PHP backend. Same-origin in production, local dev server otherwise. */
export function apiBase(): string {
  if (typeof window === "undefined") return "";
  const override = process.env.NEXT_PUBLIC_JAGDKARTE_API;
  if (override) return override;
  // Dev mode: Next runs on :3000, PHP on :8081 of the same host (Mac uses
  // localhost, phones/tablets reach it via the LAN IP).
  if (window.location.port === "3000") {
    return `http://${window.location.hostname}:8081`;
  }
  return "";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(apiBase() + path, init);
  } catch {
    throw new Error("Backend nicht erreichbar");
  }
  if (!res.ok) {
    let msg = `Fehler ${res.status}`;
    try {
      const j = await res.json();
      if (j && typeof j.error === "string") msg = j.error;
    } catch {
      /* keep generic message */
    }
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res;
}

export async function apiFetchData(token?: string | null): Promise<JagdMapData> {
  const headers: Record<string, string> = {};
  if (token) headers["X-Jagdmap-Token"] = token;
  const res = await request("/api/jagdmap.php?action=data", { headers });
  return (await res.json()) as JagdMapData;
}

export async function apiLogin(password: string): Promise<string> {
  const res = await request("/api/jagdmap.php?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const j = await res.json();
  return j.token as string;
}

export async function apiSave(data: JagdMapData, token: string): Promise<void> {
  await request("/api/jagdmap.php?action=save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jagdmap-Token": token,
    },
    body: JSON.stringify({
      boundary: data.boundary,
      markers: data.markers,
      updatedAt: data.updatedAt,
    }),
  });
}
