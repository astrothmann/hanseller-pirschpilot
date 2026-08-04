"use client";

import { useCallback, useEffect, useState } from "react";
import { getSpecies } from "@/lib/species";

function deckDefaults(state: string): string[] {
  return getSpecies(state).filter((s) => s.deck).map((s) => s.k);
}

export function useFavorites(state: string) {
  const [favorites, setFavorites] = useState<string[]>(() => deckDefaults(state));

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("jd-fav") || "null");
      setFavorites(Array.isArray(v) ? v : deckDefaults(state));
    } catch {
      setFavorites(deckDefaults(state));
    }
  }, [state]);

  const toggle = useCallback((key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem("jd-fav", JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggle };
}
