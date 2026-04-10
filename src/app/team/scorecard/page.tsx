"use client";

import { ROLES } from "@/lib/team-data";

// Sample scorecard data — in production, from Supabase
const SCORECARD_DATA: Record<string, { value: string; status: "ok" | "warn" | "bad" }[]> = {
  "01": [{ value: "$24,500", status: "warn" }, { value: "100%", status: "ok" }, { value: "28%", status: "ok" }, { value: "$24.5K", status: "warn" }, { value: "38%", status: "warn" }],
  "02": [{ value: "1/2", status: "warn" }, { value: "89%", status: "bad" }, { value: "0", status: "ok" }, { value: "N/A", status: "ok" }, { value: "85%", status: "warn" }],
  "03": [{ value: "38%", status: "warn" }, { value: "$8.40", status: "ok" }, { value: "41%", status: "ok" }, { value: "9%", status: "ok" }, { value: "Yes", status: "ok" }],
  "04": [{ value: "4/6", status: "warn" }, { value: "On track", status: "ok" }, { value: "0", status: "ok" }, { value: "On schedule", status: "ok" }],
  "05": [{ value: "Pending", status: "bad" }, { value: "33%", status: "ok" }, { value: "72%", status: "ok" }, { value: "35%", status: "ok" }, { value: "100%", status: "ok" }],
  "06": [{ value: "33%", status: "ok" }, { value: "25%", status: "ok" }, { value: "20%", status: "ok" }, { value: "75%", status: "ok" }, { value: "100%", status: "ok" }, { value: "100%", status: "ok" }],
  "07": [{ value: "1/2", status: "bad" }, { value: "100%", status: "ok" }, { value: "Done", status: "ok" }, { value: "Yes", status: "ok" }],
  "08": [{ value: "60%+", status: "ok" }, { value: "72%", status: "ok" }, { value: "78%", status: "ok" }, { value: "8.7", status: "ok" }, { value: "1 pending", status: "warn" }, { value: "Yes", status: "ok" }],
  "09": [{ value: "4 in process", status: "ok" }, { value: "18hrs", status: "warn" }, { value: "In progress", status: "ok" }, { value: "N/A", status: "ok" }, { value: "0", status: "ok" }],
};

const STATUS_COLORS = { ok: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };

export default function ScorecardPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Team Scorecard</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Weekly performance snapshot &middot; KPIs vs targets
      </p>

      <div className="flex flex-col gap-3">
        {ROLES.map((r) => {
          const data = SCORECARD_DATA[r.num] ?? [];
          return (
            <div key={r.num} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.title}</div>
              </div>
              <div className="px-4 py-3">
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
                  {r.kpis.map((kpi, i) => (
                    <div key={i} className="rounded-md px-2.5 py-2" style={{ backgroundColor: "var(--bg)" }}>
                      <div className="text-[9px] leading-tight mb-1" style={{ color: "var(--muted)" }}>{kpi}</div>
                      <div className="text-sm font-medium" style={{ color: data[i] ? STATUS_COLORS[data[i].status] : "var(--text)" }}>
                        {data[i]?.value ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
