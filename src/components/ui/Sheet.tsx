"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useIosKeyboardGuard } from "./useIosKeyboardGuard";

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  headerAction,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useIosKeyboardGuard(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first focusable element inside the dialog; a
      // focused <select> pops the native picker on mobile. Redirect focus to
      // the dialog so the Marker-Typ dropdown stays closed until tapped.
      if (document.activeElement instanceof HTMLSelectElement) {
        dialog.focus();
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  // Close on backdrop click (click on the dialog element itself, not its children)
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      onClick={handleClick}
      onPointerUp={(e) => { if (e.target === dialogRef.current) onClose(); }}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="fixed inset-0 m-0 p-0 w-full h-full max-w-full max-h-full bg-transparent border-0 outline-none z-[100] open:flex items-end justify-center backdrop:bg-[rgba(10,24,16,.45)] backdrop:backdrop-blur-[1.5px]"
    >
      <div
        className="w-full max-h-[80%] bg-bg rounded-t-[28px] flex flex-col"
        style={{ boxShadow: "0 -14px 40px rgba(10,24,16,.22)" }}
      >
        <div className="w-[38px] h-[5px] rounded-[5px] bg-[#D5CFC1] mx-auto mt-[10px] mb-1 shrink-0" />
        <div className="relative z-10 bg-bg rounded-t-[28px] px-5 py-2 pb-3 shrink-0">
          <div className="text-[20px] font-[810] tracking-[-0.5px]">{title}</div>
          {subtitle && <div className="text-[13px] text-ink-3 font-[630] mt-[3px]">{subtitle}</div>}
          {headerAction && (
            <div className="absolute top-1/2 -translate-y-1/2 right-4">{headerAction}</div>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-1 no-scrollbar" style={{ paddingBottom: "max(30px, env(safe-area-inset-bottom, 30px))" }}>
          {children}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
