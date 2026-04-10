import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { AuthGuardedLayout } from "@/components/AuthGuardedLayout";

export const metadata: Metadata = {
  title: "Dr. Lead Flow — Command Center",
  description: "Operations Dashboard for Dr. Lead Flow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DLF CC",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2d5a4e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            const d = window.matchMedia('(prefers-color-scheme:dark)').matches;
            if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
          } catch(e){}
        `}} />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-title" content="DLF CC" />
      </head>
      <body className="min-h-screen themed-bg themed-text">
        <SessionProvider>
          <AuthGuardedLayout>
            {children}
          </AuthGuardedLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
