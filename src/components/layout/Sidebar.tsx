"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WildartIcon } from "../icons/WildartIcon";
import { useActiveState } from "./StateProvider";

const NAV = [
  { label: "Heute", href: "/", icon: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /> },
  { label: "Prüfen", href: "/pruefen", icon: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8.5 11l2 2 4-4" /></> },
  { label: "Kalender", href: "/kalender", icon: <><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></> },
  { label: "Jagdkarte", href: "/karte", icon: <><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z" /><path d="M9 3v15M15 6v15" /></> },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useActiveState();

  return (
    <aside className="hidden lg:flex w-[264px] shrink-0 h-dvh sticky top-0 flex-col text-[#DCEBE1]"
      style={{ background: "linear-gradient(180deg,#1B3D29 0%,#10281A 60%,#0C1F14 100%)" }}
      aria-label="Hauptnavigation"
    >
       <div className="flex items-center gap-3 px-[18px] pt-6 pb-4">
         <div className="w-[42px] h-[42px] rounded-[13px] grid place-items-center"
           style={{ background: "linear-gradient(160deg,#28613F 0%,#173B27 100%)", boxShadow: "0 6px 18px rgba(0,0,0,.35)" }}>
           <WildartIcon icon="deer" size={24} />
         </div>
        <div>
          <div className="text-[15px] font-[820] tracking-[-0.4px] whitespace-nowrap">Hanseller Pirschpilot</div>
          <div className="text-[12px] font-[600] text-[#8DAFAB] tracking-[-0.1px]">{state}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-2 mt-2 flex-1" id="side-nav">
        {NAV.map(({ label, href, icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-[10px] px-3 py-[11px] rounded-[14px] text-[14.5px] font-[710] no-underline transition-colors ${
                active
                  ? "bg-[rgba(255,255,255,.1)] text-white"
                  : "text-[#A3BFB0] hover:bg-[rgba(255,255,255,.06)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-5 text-[11px] text-[#6B9B84] leading-[1.45] font-[550]">
        <b>Hinweis:</b> Die Anzeige zeigt allgemeine landesweite Jagdzeiten. Örtliche Anordnungen, Schutzgebiete und Elterntierschutz können abweichen.
      </div>
    </aside>
  );
}
