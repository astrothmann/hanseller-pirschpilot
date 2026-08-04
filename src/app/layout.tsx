import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Tabbar } from "@/components/layout/Tabbar";
import { StateProvider } from "@/components/layout/StateProvider";
import { HistoryTracker } from "@/components/layout/HistoryTracker";

export const viewport: Viewport = {
  themeColor: "#1C4630",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Hanseller Pirschpilot",
  description: "Jagdzeiten auf einen Blick. PWA für Jäger – bundesweit, offline.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hanseller Pirschpilot",
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
      <body className="min-h-dvh" suppressHydrationWarning>
        <StateProvider>
          <HistoryTracker />
          <div className="flex min-h-dvh">
            <Sidebar />
            <main className="flex-1 min-w-0 w-full max-w-[1280px] mx-auto flex flex-col h-dvh lg:max-w-[1180px]">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-3 no-scrollbar">
                {children}
              </div>
              <Tabbar />
            </main>
          </div>
        </StateProvider>
      </body>
    </html>
  );
}
