"use client";

import { useRole } from "@/lib/role-context";
import type { HpcRole } from "@/lib/types";

interface RoleKpi {
  metric: string;
  value: string;
  target: string;
  status: "ok" | "warn" | "bad";
}

const ROLE_KPIS: Record<HpcRole, RoleKpi[]> = {
  ceo: [
    { metric: "New MRR per month", value: "$24,500", target: "$25K+", status: "warn" },
    { metric: "Client retention — Path C", value: "100%", target: "75%+", status: "ok" },
    { metric: "Close rate maintained", value: "28% MTD", target: "25%+", status: "ok" },
    { metric: "Brand reach — webinar show rate", value: "38%", target: "40%+", status: "warn" },
  ],
  ops_manager: [
    { metric: "Daily tracking compliance", value: "8 / 9", target: "100%", status: "bad" },
    { metric: "Build delivery 7–14 days", value: "1 / 2 on track", target: "95%+", status: "warn" },
    { metric: "Clients missed weekly report", value: "0", target: "Zero", status: "ok" },
    { metric: "Level 2 crisis response", value: "N/A", target: "Under 1 hour", status: "ok" },
  ],
  marketing_lead: [
    { metric: "Webinar show rate", value: "38%", target: "40%+", status: "warn" },
    { metric: "Webinar ad CPR", value: "$8.40", target: "Under $10", status: "ok" },
    { metric: "Email open rate", value: "41%", target: "35%+", status: "ok" },
    { metric: "Cold email reply rate", value: "9%", target: "8%+", status: "ok" },
  ],
  content_editor: [
    { metric: "Content pieces this week", value: "4 / 6", target: "6+ per week", status: "warn" },
    { metric: "Asset turnaround time", value: "On track", target: "Under 24hrs", status: "ok" },
    { metric: "Brand standard violations", value: "0", target: "Zero", status: "ok" },
    { metric: "Monthly batch completion", value: "On schedule", target: "Weekly batch", status: "ok" },
  ],
  appointment_setter: [
    { metric: "Hot lead outreach within 2hrs", value: "Pending", target: "100%", status: "bad" },
    { metric: "Opener reply rate", value: "33%", target: "30%+", status: "ok" },
    { metric: "Audit email open rate", value: "72%", target: "70%+", status: "ok" },
    { metric: "Audit-to-call-booked rate", value: "35%", target: "35%+", status: "ok" },
  ],
  sales_closer: [
    { metric: "Close rate — Path A", value: "33% MTD", target: "30%+", status: "ok" },
    { metric: "Close rate — Path B", value: "25% MTD", target: "25%+", status: "ok" },
    { metric: "Close rate — Path C", value: "20% MTD", target: "20%+", status: "ok" },
    { metric: "Payment collected on call", value: "75%", target: "70%+", status: "ok" },
  ],
  ai_tech_specialist: [
    { metric: "Build within 7–14 days", value: "1 / 2 on track", target: "95%+", status: "bad" },
    { metric: "Zero errors at walkthrough", value: "100%", target: "100%", status: "ok" },
    { metric: "Weekly anomaly check", value: "Completed", target: "100%", status: "ok" },
    { metric: "Capacity flag raised", value: "Yes — Day 8", target: "Never reactive", status: "ok" },
  ],
  csm_lead_coach: [
    { metric: "Milestone Loom within 24hrs", value: "1 pending", target: "100%", status: "warn" },
    { metric: "Satisfaction score avg", value: "8.7 / 10", target: "8+", status: "ok" },
    { metric: "Weekly group call held", value: "Yes — today", target: "Every week", status: "ok" },
    { metric: "Results snapshot before call", value: "100%", target: "100%", status: "ok" },
  ],
  bookkeeper: [
    { metric: "Invoices paid within 5 days", value: "4 in process", target: "5-day max", status: "ok" },
    { metric: "Commission log within 24hrs", value: "18hrs elapsed", target: "24hrs", status: "warn" },
    { metric: "Monthly P&L by the 5th", value: "Draft started", target: "5th", status: "ok" },
    { metric: "Payment discrepancies", value: "0", target: "Zero", status: "ok" },
  ],
};

const STATUS_COLORS = { ok: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };

const ROLE_LABELS: Record<HpcRole, string> = {
  ceo: "CEO", ops_manager: "Operations Manager", marketing_lead: "Marketing Lead",
  content_editor: "Content Editor", appointment_setter: "Appointment Setter",
  sales_closer: "Sales Closer", ai_tech_specialist: "AI & Tech Specialist",
  csm_lead_coach: "CSM / Lead Coach", bookkeeper: "Bookkeeper / Finance",
};

export default function NumbersPage() {
  const { role } = useRole();
  const kpis = ROLE_KPIS[role] ?? ROLE_KPIS.ceo;

  const okCount = kpis.filter((k) => k.status === "ok").length;
  const total = kpis.length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>My Numbers</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        {ROLE_LABELS[role]} &middot; {okCount}/{total} KPIs on target
      </p>

      {/* Health bar */}
      <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>Performance Health</span>
          <span className="text-sm font-medium" style={{ color: okCount === total ? "var(--success)" : okCount >= total * 0.75 ? "var(--warning)" : "var(--danger)" }}>
            {Math.round((okCount / total) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${(okCount / total) * 100}%`,
            backgroundColor: okCount === total ? "var(--success)" : okCount >= total * 0.75 ? "var(--warning)" : "var(--danger)",
          }} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {kpis.map((kpi) => (
          <div key={kpi.metric} className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>{kpi.metric}</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-medium" style={{ color: STATUS_COLORS[kpi.status] }}>{kpi.value}</div>
              <div className="text-[11px] pb-1" style={{ color: "var(--muted)" }}>Target: {kpi.target}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
