import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Review — Dr. Lead Flow",
  description: "Leave timestamped feedback on video content",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          try {
            const t = localStorage.getItem('theme');
            const d = window.matchMedia('(prefers-color-scheme:dark)').matches;
            if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
          } catch(e){}
        `,
          }}
        />
      </head>
      <body className="min-h-screen themed-bg themed-text">{children}</body>
    </html>
  );
}
