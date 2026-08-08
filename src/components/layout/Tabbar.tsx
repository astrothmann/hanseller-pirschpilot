"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function Tabbar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden flex border-t border-line bg-[rgba(251,249,244,.93)] backdrop-blur-[12px] safe-area-bottom"
      style={{ WebkitBackdropFilter: "blur(12px)" }}
      aria-label="Hauptnavigation"
    >
      {NAV.map(({ label, href, icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center gap-[3px] py-[7px] px-[2px] no-underline text-ink-3 ${
              active ? "!text-forest-700" : ""
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className={`w-[46px] h-[28px] rounded-full grid place-items-center transition-colors ${
              active ? "bg-green-soft" : ""
            }`}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
            </span>
            <span className="text-[10.5px] font-[700] tracking-[-0.1px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
