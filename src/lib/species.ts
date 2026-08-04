import type { Species, BundeslandName } from "./types";
import nrwData from "../../data/species/nrw.json";
import niedersachsenData from "../../data/species/niedersachsen.json";
import hessenData from "../../data/species/hessen.json";
import brandenburgData from "../../data/species/brandenburg.json";
import berlinData from "../../data/species/berlin.json";

export const SUPPORTED_STATES: BundeslandName[] = [
  "Nordrhein-Westfalen",
  "Niedersachsen",
  "Hessen",
  "Brandenburg",
  "Berlin",
];

const speciesByState: Record<string, Species[]> = {
  "Nordrhein-Westfalen": nrwData as Species[],
  "Niedersachsen": niedersachsenData as Species[],
  "Hessen": hessenData as Species[],
  "Brandenburg": brandenburgData as Species[],
  "Berlin": berlinData as Species[],
};

const deCollator = new Intl.Collator("de", { sensitivity: "base" });

export function getSpecies(state: string): Species[] {
  return [...(speciesByState[state] ?? [])].sort(
    (a, b) => deCollator.compare(a.n, b.n) || a.k.localeCompare(b.k)
  );
}

export function getSpeciesByKey(state: string, key: string): Species | undefined {
  return getSpecies(state).find((s) => s.k === key);
}

export function getAllKeys(state: string): string[] {
  return getSpecies(state).map((s) => s.k);
}

export function getByKey(state: string): Record<string, Species> {
  const map: Record<string, Species> = {};
  for (const s of getSpecies(state)) {
    map[s.k] = s;
  }
  return map;
}

export function getAllKeysAcrossStates(): string[] {
  const keys: string[] = [];
  for (const state of SUPPORTED_STATES) {
    for (const s of getSpecies(state)) {
      if (!keys.includes(s.k)) keys.push(s.k);
    }
  }
  return keys;
}

export function getSpeciesByKeyAnyState(key: string): Species | undefined {
  for (const state of SUPPORTED_STATES) {
    const s = getSpeciesByKey(state, key);
    if (s) return s;
  }
  return undefined;
}
