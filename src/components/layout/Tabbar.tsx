"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Heute", href: "/", icon: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /> },
  { label: "Prüfen", href: "/pruefen", icon: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8.5 11l2 2 4-4" /></> },
  { label: "Kalender", href: "/kalender", icon: <><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></> },
  { label: "Meine Arten", href: "/arten", icon: <path d="m12 20-1.3-1.2C6 14.7 3.5 12.4 3.5 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.4c0 3-2.5 5.3-7.2 9.4z" /> },
  { label: "Mehr", href: "/mehr", icon: <><circle cx="5.5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="18.5" cy="12" r="1.4" fill="currentColor" /></> },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Tabbar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden flex border-t border-line bg-[rgba(251,249,244,.93)] [data-theme='dark']:bg-[rgba(18,26,20,.93)] backdrop-blur-[12px] safe-area-bottom"
      style={{ WebkitBackdropFilter: "blur(12px)" }}
      aria-label="Hauptnavigation"
    >
      {NAV.map(({ label, href, icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center gap-[3px] py-[7px] px-[2px] no-underline text-ink-3 ${
              active ? "!text-forest-700 [&_[data-theme='dark']]:!text-[#6FCE9A]" : ""
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
