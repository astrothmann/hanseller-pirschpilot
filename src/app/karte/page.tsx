"use client";

import dynamic from "next/dynamic";

const KarteContent = dynamic(() => import("./KarteContent"), {
  ssr: false,
  loading: () => (
    <div className="px-5 pt-5">
      <h1 className="text-[26px] font-[850] tracking-[-0.5px] m-0 leading-[1.2]">Jagdkarte</h1>
    </div>
  ),
});

export default function KartePage() {
  return <KarteContent />;
}
