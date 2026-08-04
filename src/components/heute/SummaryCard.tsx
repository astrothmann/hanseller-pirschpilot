"use client";

import { CheckIcon } from "@/components/icons/Icons";

export function SummaryCard({
  jagdCount,
  condCount,
  noCount,
}: {
  jagdCount: number;
  condCount: number;
  noCount: number;
}) {
  return (
    <div
      className="mx-5 mt-4 px-5 py-5 rounded-[var(--r-xl)] text-[#EAF3EC] overflow-hidden"
      style={{
        background: "linear-gradient(155deg, var(--forest-700) 0%, var(--forest-900) 100%)",
        boxShadow: "var(--shadow-m)",
      }}
    >
      <div className="flex items-center gap-[10px]">
        <span
          className="w-[14px] h-[14px] rounded-full"
          style={{ background: "#57D98A", boxShadow: "0 0 0 5px rgba(87,217,138,.18)" }}
          aria-hidden="true"
        />
        <span className="text-[13.5px] font-[720] tracking-[0.4px]">Heute in Jagdzeit</span>
      </div>
      <div className="mt-2">
        <span className="text-[44px] font-[830] tracking-[-1.8px] leading-none">{jagdCount}</span>
        <small className="text-[14px] font-[600] text-[#B3D1BE] ml-1">Kategorien</small>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full text-[12.5px] font-[650] text-[#E7F0E9] border border-white/[.09]"
          style={{ background: "rgba(255,255,255,.09)" }}>
          <span className="w-[8px] h-[8px] rounded-full bg-[#F0A24B]" />
          {condCount} mit Bedingungen
        </span>
        <span className="inline-flex items-center gap-[7px] px-3 py-[7px] rounded-full text-[12.5px] font-[650] text-[#E7F0E9] border border-white/[.09]"
          style={{ background: "rgba(255,255,255,.09)" }}>
          <span className="w-[8px] h-[8px] rounded-full bg-[#EE7A6E]" />
          {noCount} in Schonzeit
        </span>
      </div>
    </div>
  );
}
