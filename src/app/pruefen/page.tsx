"use client";

import dynamic from "next/dynamic";

const PruefenContent = dynamic(() => import("./PruefenContent"), {
  ssr: false,
  loading: () => (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Prüfen</h1>
    </div>
  ),
});

export default function PruefenPage() {
  return <PruefenContent />;
}
