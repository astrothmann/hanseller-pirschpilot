"use client";

import dynamic from "next/dynamic";

const KalenderContent = dynamic(() => import("./KalenderContent"), {
  ssr: false,
  loading: () => (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Kalender</h1>
    </div>
  ),
});

export default function KalenderPage() {
  return <KalenderContent />;
}
