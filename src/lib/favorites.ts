"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_FAVS = ["rehbock", "frischling", "altfuchs", "waschbaer", "damhirsch", "rothirsch"];

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVS);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("jd-fav") || "null");
      if (Array.isArray(v)) setFavorites(v);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback((key: string) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem("jd-fav", JSON.stringify(next));
      return next;
    });
  }, []);

  return { favorites, toggle };
}
