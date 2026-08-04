"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function HistoryTracker() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (prev.current !== null && prev.current !== pathname) {
      sessionStorage.setItem("jd-prev", prev.current);
    }
    prev.current = pathname;
  }, [pathname]);

  return null;
}
