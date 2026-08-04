import type { Species } from "./types";
import nrwData from "../../data/species/nrw.json";

const speciesByState: Record<string, Species[]> = {
  "Nordrhein-Westfalen": nrwData as Species[],
};

export function getSpecies(state: string): Species[] {
  return speciesByState[state] ?? [];
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
