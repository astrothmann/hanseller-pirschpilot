import type { Species, HuntingWindow } from "./types";

const DOY_START = [0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

const MONF = [
  "", "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const MON = [
  "", "Jan.", "Feb.", "Mär.", "Apr.", "Mai", "Jun.",
  "Jul.", "Aug.", "Sep.", "Okt.", "Nov.", "Dez.",
];

export function doy(m: number, d: number): number {
  return DOY_START[m] + d;
}

export function yearLen(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export function inPeriod(n: number, sm: number, sd: number, em: number, ed: number): boolean {
  const s = doy(sm, sd);
  const e = doy(em, ed);
  return s <= e ? n >= s && n <= e : n >= s || n <= e;
}

export function inWin(s: Species, todayDoy: number): boolean {
  return s.win.some((w) => inPeriod(todayDoy, w[0], w[1], w[2], w[3]));
}

export function statusOf(s: Species, todayDoy: number): "ok" | "cond" | "no" {
  return inWin(s, todayDoy) ? (s.cond ? "cond" : "ok") : "no";
}

export function isYearLong(s: Species): boolean {
  return (
    s.win.length === 1 &&
    s.win[0][0] === 1 && s.win[0][1] === 1 &&
    s.win[0][2] === 12 && s.win[0][3] === 31
  );
}

export function isProtected(s: Species): boolean {
  return s.win.length === 0;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function fmtWin(w: HuntingWindow, short: boolean): string {
  const m = short ? MON : MONF;
  return `${pad2(w[1])}. ${m[w[0]]} – ${pad2(w[3])}. ${m[w[2]]}`;
}

export function periodShort(s: Species): string {
  if (isProtected(s)) return "Ganzjährig geschont";
  if (isYearLong(s)) return "Ganzjährig*";
  return s.win.map((w) => fmtWin(w, true)).join("  /  ");
}

export function periodFull(s: Species): string {
  if (isProtected(s)) return "Ganzjährig geschont";
  if (isYearLong(s)) return "Ganzjährig";
  return s.win.map((w) => fmtWin(w, false)).join(" und ");
}

export function metaFor(s: Species, todayDoy: number, year: number): string {
  if (isProtected(s)) return "Ganzjährig geschont";
  if (isYearLong(s)) return "Ganzjährig bejagbar";
  if (inWin(s, todayDoy)) {
    let best = Infinity;
    s.win.forEach((w) => {
      if (inPeriod(todayDoy, w[0], w[1], w[2], w[3])) {
        let d = doy(w[2], w[3]) - todayDoy;
        if (d < 0) d += year;
        if (d < best) best = d;
      }
    });
    if (best === Infinity) return "Heute Jagdzeit";
    if (best === 0) return "Letzter Tag heute";
    if (best === 1) return "Endet morgen";
    return `Endet in ${best} Tagen`;
  }
  let best = Infinity;
  s.win.forEach((w) => {
    let d = doy(w[0], w[1]) - todayDoy;
    if (d < 0) d += year;
    if (d < best) best = d;
  });
  if (best === 0) return "Beginnt heute";
  if (best === 1) return "Beginnt morgen";
  return `Beginnt in ${best} Tagen`;
}

export function fmtDateShort(d: Date): string {
  return `${d.getDate()}. ${MON[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export function fmtDate(d: Date): string {
  return `${d.getDate()}. ${MONF[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export function dayOffsetDate(base: Date, off: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + off);
  return d;
}

export function getToday() {
  const now = new Date();
  const todayDoy = doy(now.getMonth() + 1, now.getDate());
  const year = yearLen(now.getFullYear());
  return { now, todayDoy, year };
}
