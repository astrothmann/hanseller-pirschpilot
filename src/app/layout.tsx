import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SilhouetteSprite } from "@/components/icons/SilhouetteSprite";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabbar } from "@/components/layout/Tabbar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export const viewport: Viewport = {
  themeColor: "#1C4630",
};

export const metadata: Metadata = {
  title: "Jagd-Deck – Jagdzeiten NRW",
  description: "Jagdzeiten auf einen Blick. PWA für Jäger in Nordrhein-Westfalen.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jagd-Deck",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          <SilhouetteSprite />
          <div className="flex min-h-dvh">
            <Sidebar />
            <main className="flex-1 min-w-0 w-full max-w-[1280px] mx-auto flex flex-col h-dvh lg:max-w-[1180px]">
              <div className="relative flex-1 min-h-0 overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-12 no-scrollbar">
                  {children}
                </div>
              </div>
              <Tabbar />
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
