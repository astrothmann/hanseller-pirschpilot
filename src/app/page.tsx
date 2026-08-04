"use client";

import dynamic from "next/dynamic";

const HeuteContent = dynamic(() => import("./HeuteContent"), {
  ssr: false,
  loading: () => (
    <div className="px-5 pt-5">
      <h1 className="text-[28px] font-[850] tracking-[-1px] m-0">Hanseller Pirschpilot</h1>
    </div>
  ),
});

export default function HeutePage() {
  return <HeuteContent />;
}
