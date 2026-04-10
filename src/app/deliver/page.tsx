"use client";

import Link from "next/link";

interface ClientRow {
  name: string;
  slug: string;
  path: "A" | "B" | "C";
  practiceType: string;
  health: number;
  healthStatus: "ok" | "warn" | "bad";
  nextAction: string;
  onboardDate: string;
  renewalDate: string;
}

const CLIENTS: ClientRow[] = [
  { name: "Skyline PT", slug: "skyline-pt", path: "B", practiceType: "Physical Therapy", health: 92, healthStatus: "ok", nextAction: "Monthly optimization call", onboardDate: "2026-01-15", renewalDate: "2026-04-15" },
  { name: "Coastal Chiropractic", slug: "coastal-chiro", path: "B", practiceType: "Chiropractic", health: 68, healthStatus: "warn", nextAction: "Build blocked — Meta access", onboardDate: "2026-03-28", renewalDate: "2026-06-28" },
  { name: "Premier Wellness", slug: "premier-wellness", path: "C", practiceType: "Wellness", health: 88, healthStatus: "ok", nextAction: "Week 2 — ads launch", onboardDate: "2026-03-20", renewalDate: "2026-06-20" },
  { name: "Riverside Dental", slug: "riverside-dental", path: "C", practiceType: "Dental", health: 95, healthStatus: "ok", nextAction: "Month 3 renewal call", onboardDate: "2026-01-10", renewalDate: "2026-04-10" },
  { name: "Peak Performance PT", slug: "peak-pt", path: "B", practiceType: "Physical Therapy", health: 82, healthStatus: "ok", nextAction: "Month 2 optimization", onboardDate: "2026-02-05", renewalDate: "2026-05-05" },
  { name: "Summit Wellness", slug: "summit-wellness", path: "B", practiceType: "Wellness", health: 75, healthStatus: "warn", nextAction: "Day 5 — chatbot config", onboardDate: "2026-04-03", renewalDate: "2026-07-03" },
  { name: "Dr. Chen Chiropractic", slug: "dr-chen", path: "A", practiceType: "Chiropractic", health: 85, healthStatus: "ok", nextAction: "Week 2 coaching check-in", onboardDate: "2026-03-25", renewalDate: "—" },
  { name: "Harmony Medspa", slug: "harmony-medspa", path: "A", practiceType: "Medspa", health: 78, healthStatus: "ok", nextAction: "Day 30 check-in", onboardDate: "2026-03-10", renewalDate: "—" },
  { name: "Mindful Psych", slug: "mindful-psych", path: "A", practiceType: "Psychiatry", health: 90, healthStatus: "ok", nextAction: "Group coaching — active", onboardDate: "2026-02-20", renewalDate: "—" },
];

const PATH_COLORS = { A: "#639922", B: "#2D7DD2", C: "#C4860A" };
const HEALTH_COLORS = { ok: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };

export default function DeliverPage() {
  const pathCounts = { A: CLIENTS.filter((c) => c.path === "A").length, B: CLIENTS.filter((c) => c.path === "B").length, C: CLIENTS.filter((c) => c.path === "C").length };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Deliver</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Active clients: {CLIENTS.length} &middot; Path A: {pathCounts.A} &middot; Path B: {pathCounts.B} &middot; Path C: {pathCounts.C}
      </p>

      {/* Quick Links */}
      <div className="flex gap-2 mb-5">
        <Link href="/deliver/builds" className="px-3 py-1.5 rounded-full text-xs transition-all" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
          Active Builds
        </Link>
        <Link href="/deliver/coaching" className="px-3 py-1.5 rounded-full text-xs transition-all" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
          Coaching
        </Link>
      </div>

      {/* Client Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid var(--border)" }}>
        <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg)" }}>
              {["Client", "Path / Type", "Health", "Next Action", "Renewal"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)", borderBottom: "0.5px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c) => (
              <tr key={c.slug} className="transition-all" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <td className="px-3 py-3">
                  <div className="font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-sm font-medium mr-1.5" style={{ backgroundColor: `${PATH_COLORS[c.path]}18`, color: PATH_COLORS[c.path] }}>
                    Path {c.path}
                  </span>
                  <span style={{ color: "var(--muted)" }}>{c.practiceType}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="font-medium" style={{ color: HEALTH_COLORS[c.healthStatus] }}>
                    {c.health}%
                  </span>
                </td>
                <td className="px-3 py-3" style={{ color: "var(--text-secondary)" }}>{c.nextAction}</td>
                <td className="px-3 py-3" style={{ color: "var(--muted)" }}>{c.renewalDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
