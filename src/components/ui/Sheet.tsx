"use client";

import { useEffect, useRef } from "react";

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-[70] transition-opacity duration-250 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(10,24,16,.45)", backdropFilter: "blur(1.5px)" }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed left-0 right-0 bottom-0 z-[95] max-h-[80%] bg-bg rounded-t-[28px] flex flex-col transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ boxShadow: "0 -14px 40px rgba(10,24,16,.22)", transitionTimingFunction: "cubic-bezier(.32,.72,0,1)" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="w-[38px] h-[5px] rounded-[5px] bg-[#D5CFC1] [data-theme='dark']:bg-[#3A4A3E] mx-auto mt-[10px] mb-1 shrink-0" />
        <div className="px-5 py-2 pb-3 shrink-0">
          <div className="text-[20px] font-[810] tracking-[-0.5px]">{title}</div>
          {subtitle && <div className="text-[13px] text-ink-3 font-[630] mt-[3px]">{subtitle}</div>}
        </div>
        <div className="overflow-y-auto px-5 pb-[30px] no-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
}
