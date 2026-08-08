import L from "leaflet";
import { jsPDF } from "jspdf";
import { MARKER_TYPE_BY_KEY, type JagdMapData, type MarkerTypeMeta } from "@/lib/jagdmap";

const ESRI_IMG_URL = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const ESRI_LBL_URL = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`;

function loadTile(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

const badgeCache = new Map<string, HTMLImageElement>();

function loadBadgeImage(meta: MarkerTypeMeta): Promise<HTMLImageElement | null> {
  const cached = badgeCache.get(meta.key);
  if (cached) return Promise.resolve(cached);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect x="2" y="2" width="92" height="92" rx="28" fill="${meta.color}" stroke="#fff" stroke-width="6"/>` +
    `<g transform="translate(16 16) scale(2.667)">${meta.icon}</g></svg>`;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      badgeCache.set(meta.key, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitZoomForCanvas(
  map: L.Map,
  bounds: L.LatLngBounds,
  canvasW: number,
  canvasH: number,
  maxZoom = 18
): number {
  let lo = map.getMinZoom();
  let hi = maxZoom;
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const nw = map.project(bounds.getNorthWest(), mid);
    const se = map.project(bounds.getSouthEast(), mid);
    if (se.x - nw.x <= canvasW && se.y - nw.y <= canvasH) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

export async function exportMapPdf(data: JagdMapData, map: L.Map): Promise<void> {
  const scale = 4;
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const titleH = 40;
  const FILL = 0.96;

  const hasBoundary = !!data.boundary && data.boundary.length >= 3;
  const hasRevier = hasBoundary || data.markers.length > 0;
  const bounds = hasBoundary
    ? L.latLngBounds(data.boundary!.map((p) => [p[0], p[1]]))
    : hasRevier
      ? L.latLngBounds(data.markers.map((m) => [m.lat, m.lng]))
      : map.getBounds();

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageW * scale);
  canvas.height = Math.round((pageH - titleH) * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const zoom = hasRevier
    ? fitZoomForCanvas(map, bounds, canvas.width, canvas.height, 19)
    : map.getZoom();

  ctx.fillStyle = "#F6F3EC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const nw = map.project(bounds.getNorthWest(), zoom);
  const se = map.project(bounds.getSouthEast(), zoom);
  const spanW = se.x - nw.x;
  const spanH = se.y - nw.y;
  const k = Math.min((FILL * canvas.width) / spanW, (FILL * canvas.height) / spanH, 2);
  const origin = {
    x: nw.x - (canvas.width / k - spanW) / 2,
    y: nw.y - (canvas.height / k - spanH) / 2,
  };
  const minX = Math.floor(origin.x / 256);
  const minY = Math.floor(origin.y / 256);
  const maxX = Math.floor((origin.x + canvas.width / k) / 256);
  const maxY = Math.floor((origin.y + canvas.height / k) / 256);

  const loadTiles = async (url: (z: number, x: number, y: number) => string, alpha?: number) => {
    const jobs: Promise<void>[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        jobs.push(
          loadTile(url(zoom, x, y)).then((img) => {
            if (!img) return;
            ctx.globalAlpha = alpha ?? 1;
            ctx.drawImage(img, (x * 256 - origin.x) * k, (y * 256 - origin.y) * k, 256 * k, 256 * k);
            ctx.globalAlpha = 1;
          })
        );
      }
    }
    await Promise.all(jobs);
  };
  await loadTiles(ESRI_IMG_URL);
  await loadTiles(ESRI_LBL_URL, 0.8);

  if (data.boundary && data.boundary.length >= 3) {
    ctx.beginPath();
    data.boundary.forEach(([lat, lng], i) => {
      const p = map.project([lat, lng], zoom);
      const cx = (p.x - origin.x) * k;
      const cy = (p.y - origin.y) * k;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(142,36,170,.14)";
    ctx.fill();
    ctx.strokeStyle = "#8E24AA";
    ctx.lineWidth = 3 * scale;
    ctx.stroke();
  }

  for (const m of data.markers) {
    const p = map.project([m.lat, m.lng], zoom);
    const cx = (p.x - origin.x) * k;
    const cy = (p.y - origin.y) * k;
    const img = await loadBadgeImage(MARKER_TYPE_BY_KEY[m.type]);
    if (!img) continue;
    const size = 12 * scale;
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  }

    const present = new Map<string, number>();
    for (const m of data.markers) present.set(m.type, (present.get(m.type) ?? 0) + 1);
    if (present.size) {
      const lx = 14 * scale;
      const rows = [...present.entries()];
      const rowH = 22 * scale;
      const boxW = 190 * scale;
      const boxH = rows.length * rowH + 30 * scale;
      const ly = canvas.height - boxH - 14 * scale;
      ctx.fillStyle = "rgba(255,255,255,.7)";
      roundRect(ctx, lx, ly, boxW, boxH, 10 * scale);
      ctx.fill();
      ctx.font = `800 ${Math.round(11 * scale)}px -apple-system, sans-serif`;
      ctx.fillStyle = "#7C877F";
      ctx.fillText("LEGENDE", lx + 12 * scale, ly + 20 * scale);
      ctx.font = `650 ${Math.round(11 * scale)}px -apple-system, sans-serif`;
      const legendImgs = await Promise.all(
        rows.map(([type]) => loadBadgeImage(MARKER_TYPE_BY_KEY[type as keyof typeof MARKER_TYPE_BY_KEY]))
      );
      rows.forEach(([type, count], i) => {
        const y = ly + 34 * scale + i * rowH;
        const meta = MARKER_TYPE_BY_KEY[type as keyof typeof MARKER_TYPE_BY_KEY];
        const img = legendImgs[i];
        if (img) ctx.drawImage(img, lx + 6 * scale, y - 7 * scale, 14 * scale, 14 * scale);
        ctx.fillStyle = "#16211B";
        ctx.fillText(`${meta.label} (${count})`, lx + 28 * scale, y + 4 * scale);
      });
    }

  // Himmelsrichtungen (fixed at the canvas edges)
  const drawDir = (cx: number, cy: number, letter: string, north: boolean) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(124,135,127,.5)";
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = north
      ? `800 ${Math.round(11 * scale)}px -apple-system, sans-serif`
      : `700 ${Math.round(11 * scale)}px -apple-system, sans-serif`;
    ctx.fillStyle = north ? "#2E7D4F" : "#7C877F";
    ctx.fillText(letter, cx, cy + 0.5 * scale);
  };
  drawDir(canvas.width / 2, 18 * scale, "N", true);
  drawDir(canvas.width - 18 * scale, canvas.height / 2, "O", false);
  drawDir(canvas.width / 2, canvas.height - 18 * scale, "S", false);
  drawDir(18 * scale, canvas.height / 2, "W", false);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const dateStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor("#16211B");
  pdf.text(`Revier: Altenberge 5, Stand: ${dateStr}`, pageW / 2, 26, { align: "center" });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", 0, titleH, pageW, pageH - titleH);
  pdf.save("jagdkarte.pdf");
}
