"use client";

import dynamic from "next/dynamic";

const WildartDetailContent = dynamic(() => import("./WildartDetailContent"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col min-h-full">
      <div
        className="px-[22px] pb-[26px] text-[#EAF3EC]"
        style={{
          background: "linear-gradient(160deg,#28613F 0%,#173B27 55%,#0F281B 100%)",
          paddingTop: "calc(56px + env(safe-area-inset-top, 0px))",
        }}
      />
    </div>
  ),
});

export function WildartDetail({ slug }: { slug: string }) {
  return <WildartDetailContent slug={slug} />;
}
