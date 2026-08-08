"use client";

import { useEffect } from "react";

const EDITABLE = "input, textarea, select, [contenteditable='true']";

export function useIosKeyboardGuard(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    let savedTop = 0;
    let rafId = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const clearScheduled = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      for (const t of timeouts) clearTimeout(t);
      timeouts.length = 0;
    };

    const restoreScroll = () => {
      const el = document.getElementById("app-scroll");
      if (el && el.scrollTop !== savedTop) el.scrollTop = savedTop;
    };

    const scheduleRestore = () => {
      clearScheduled();
      rafId = requestAnimationFrame(restoreScroll);
      timeouts.push(setTimeout(restoreScroll, 120));
      timeouts.push(setTimeout(restoreScroll, 350));
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      if (!target.closest(EDITABLE)) return;
      const el = document.getElementById("app-scroll");
      savedTop = el ? el.scrollTop : 0;
      scheduleRestore();
    };

    const onFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      if (target.closest(EDITABLE)) scheduleRestore();
    };

    const onViewportResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      if (vv.height >= window.innerHeight - 1) scheduleRestore();
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.visualViewport?.addEventListener("resize", onViewportResize);

    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      clearScheduled();
    };
  }, [active]);
}
