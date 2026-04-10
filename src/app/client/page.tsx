"use client";

import { useState } from "react";
import Link from "next/link";

const CLIENTS: { slug: string; name: string; driveUrl: string | null }[] = [
  { slug: "healthproceo", name: "HealthPro CEO", driveUrl: null },
  { slug: "tvaai", name: "TVAAI", driveUrl: "https://drive.google.com/drive/folders/1eeMRWiQK6qR5oe41A1PIiGCo1MoCa6Os" },
  { slug: "iv-wellness", name: "IV Wellness", driveUrl: "https://drive.google.com/drive/folders/19CZ-ZQrZoLjU9_9TBIHcQ4G0A1CCXk65" },
  { slug: "amazing-skin-care", name: "Amazing Skin Care", driveUrl: "https://drive.google.com/drive/folders/136KoBPtgLAb2hHy1gym4yx2jwtuhduNK" },
  { slug: "global-icon", name: "Global Icon", driveUrl: "https://drive.google.com/drive/folders/1nxjlmRGMUkp2H8DrVC_-5K3rZ0rV6N41" },
  { slug: "dunamis-xp", name: "Dunamis XP", driveUrl: "https://drive.google.com/drive/folders/1HnuSYqEgnX7_TiLf11UiMoxBkw_-cnts" },
];

export default function ClientListPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/client/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          CLIENT MANAGEMENT
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Client Portals
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Share portal links with clients to show their ad performance and content status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CLIENTS.map((client) => (
          <div
            key={client.slug}
            className="card p-6"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {client.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium" style={{ color: "var(--text)" }}>
                    {client.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    /client/{client.slug}
                  </div>
                </div>
              </div>
              {client.driveUrl && (
                <a
                  href={client.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    backgroundColor: "var(--accent-bg)",
                    color: "var(--accent-text)",
                    border: "1px solid var(--accent)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  Drive Folder
                </a>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyLink(client.slug)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: copied === client.slug ? "var(--accent)" : "var(--accent-bg)",
                  color: copied === client.slug ? "#fff" : "var(--accent-text)",
                  border: "1px solid var(--border)",
                }}
              >
                {copied === client.slug ? "Copied!" : "Copy Portal Link"}
              </button>
              <Link
                href={`/client/${client.slug}`}
                target="_blank"
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--surface)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
