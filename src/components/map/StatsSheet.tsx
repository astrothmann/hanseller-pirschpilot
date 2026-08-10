"use client";

import { useMemo } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { WildartIcon } from "@/components/icons/WildartIcon";
import { getSpeciesByKeyAnyState } from "@/lib/species";
import { supportsAbschuesse, type JagdMapData } from "@/lib/jagdmap";

interface WildartCount {
  key: string;
  label: string;
  icon: string;
  count: number;
}

interface YearGroup {
  year: number;
  total: number;
  byWildart: WildartCount[];
}

function buildStats(data: JagdMapData | null): { years: YearGroup[]; total: number } {
  const byYear = new Map<number, Map<string, number>>();
  if (data) {
    for (const m of data.markers) {
      if (!supportsAbschuesse(m.type)) continue;
      for (const a of m.abschuesse ?? []) {
        const y = Number(a.datum.slice(0, 4));
        if (!Number.isFinite(y)) continue;
        const byWildart = byYear.get(y) ?? new Map<string, number>();
        byWildart.set(a.wildart, (byWildart.get(a.wildart) ?? 0) + 1);
        byYear.set(y, byWildart);
      }
    }
  }
  const currentYear = new Date().getFullYear();
  if (!byYear.has(currentYear)) byYear.set(currentYear, new Map());

  const years = [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, m]) => ({
      year,
      total: [...m.values()].reduce((s, c) => s + c, 0),
      byWildart: [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
          key,
          count,
          label: getSpeciesByKeyAnyState(key)?.n ?? key,
          icon: getSpeciesByKeyAnyState(key)?.ic ?? "deer",
        })),
    }));

  const total = years.reduce((s, y) => s + y.total, 0);
  return { years, total };
}

export function StatsSheet({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: JagdMapData | null;
}) {
  const { years, total } = useMemo(() => buildStats(data), [data]);
  const currentYear = new Date().getFullYear();

  return (
    <Sheet open={open} onClose={onClose} title="Abschüsse" subtitle="Strecke nach Jahr">
      <div className="pb-2 max-w-[560px] mx-auto">
        <div className="flex items-end justify-between rounded-[16px] bg-forest-700 text-white px-5 py-4 mb-4"
          style={{ boxShadow: "var(--shadow-s)" }}>
          <span className="text-[13px] font-[720] tracking-[0.4px] uppercase opacity-90">Gesamt</span>
          <span data-testid="stats-total" className="text-[34px] font-[830] tracking-[-1px] leading-none">
            {total}
          </span>
        </div>

        {total === 0 && (
          <p className="text-[14px] text-ink-3 font-[650] text-center m-0 py-6">
            Noch keine Abschüsse erfasst.
          </p>
        )}

        <div className="space-y-3">
          {years.map((g) => (
            <section
              key={g.year}
              data-testid={`stats-year-${g.year}`}
              className="bg-card border border-line rounded-[var(--r-lg)] p-[18px] shadow-[var(--shadow-s)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="m-0 text-[17px] font-[820] tracking-[-0.3px]">{g.year}</h3>
                {g.year === currentYear && (
                  <span className="text-[11px] font-[760] tracking-[0.4px] uppercase text-forest-700 bg-green-soft rounded-full px-2 py-[3px]">
                    lfd. Jahr
                  </span>
                )}
                <span className="ml-auto text-[14px] font-[760] text-ink-2">{g.total} Stück</span>
              </div>

              {g.byWildart.length === 0 ? (
                <p className="text-[13.5px] text-ink-3 font-[620] m-0">Keine Abschüsse.</p>
              ) : (
                <ul className="list-none m-0 p-0 space-y-[7px]">
                  {g.byWildart.map((w) => (
                    <li
                      key={w.key}
                      data-testid={`stats-wildart-${w.key}`}
                      className="flex items-center gap-3"
                    >
                      <span className="w-[30px] h-[30px] rounded-[9px] grid place-items-center bg-bg-soft border border-line shrink-0">
                        <WildartIcon icon={w.icon} size={20} />
                      </span>
                      <span className="flex-1 min-w-0 text-[14px] font-[680] text-ink leading-tight truncate">{w.label}</span>
                      <span className="shrink-0 min-w-[28px] text-center rounded-full bg-green-soft text-forest-700 text-[12.5px] font-[780] px-2 py-[3px]">
                        {w.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
