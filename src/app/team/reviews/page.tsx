"use client";

import { REVIEW_CYCLES, ROLES } from "@/lib/team-data";

export default function ReviewsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Performance Reviews</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Reviews follow the contractor relationship — not an employment relationship
      </p>

      {/* Review Cycle Cards */}
      <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {REVIEW_CYCLES.map((r, i) => (
          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>{r.label}</div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--text)" }}>{r.timing}</div>
            <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.description}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Reviews */}
      <h2 className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>
        Team KPI Targets
      </h2>
      <div className="flex flex-col gap-2">
        {ROLES.map((r) => (
          <div key={r.num} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>{r.title}</div>
            <div className="flex flex-wrap gap-1.5">
              {r.kpis.map((kpi, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: "var(--bg)", color: "var(--text-secondary)" }}>
                  {kpi}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
