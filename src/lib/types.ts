/** Window tuple: [startMonth, startDay, endMonth, endDay] */
export type HuntingWindow = [number, number, number, number];

export interface Species {
  /** Unique key/slug */
  k: string;
  /** Display name */
  n: string;
  /** Subtitle / description */
  sub: string;
  /** Icon key (matches SVG sprite symbol id) */
  ic: string;
  /** Category group, e.g. "Schalenwild · Rehwild" */
  grp: string;
  /** Hunting windows for the year */
  win: HuntingWindow[];
  /** Legal source reference */
  src: string;
  /** Condition flag — hunting allowed only under conditions */
  cond?: boolean;
  /** Hint text shown on cards */
  hint?: string;
  /** Additional note text */
  note?: string;
  /** Whether this species should appear in the deck by default */
  deck?: boolean;
}

export type Status = "ok" | "cond" | "no";

export const STATES = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

export type BundeslandName = (typeof STATES)[number];

export const DEFAULT_STATE: BundeslandName = "Nordrhein-Westfalen";
