"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import { useStore } from "@/lib/use-store";
import type { HpcRole } from "@/lib/types";

interface RoleKpi {
  id: string;
  metric: string;
  value: string;
  target: string;
  status: "ok" | "warn" | "bad";
}

type RoleKpiMap = Record<HpcRole, RoleKpi[]>;

const STATUS_COLORS = { ok: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };
const STATUS_CYCLE: Record<RoleKpi["status"], RoleKpi["status"]> = { ok: "warn", warn: "bad", bad: "ok" };

const ROLE_LABELS: Record<HpcRole, string> = {
  ceo: "CEO", ops_manager: "Operations Manager", marketing_lead: "Marketing Lead",
  content_editor: "Content Editor", appointment_setter: "Appointment Setter",
  sales_closer: "Sales Closer", ai_tech_specialist: "AI & Tech Specialist",
  csm_lead_coach: "CSM / Lead Coach", bookkeeper: "Bookkeeper / Finance",
};

const DEFAULT_ROLE_KPIS: RoleKpiMap = {
  ceo: [
    { id: "c1", metric: "New MRR per month", value: "$24,500", target: "$25K+", status: "warn" },
    { id: "c2", metric: "Client retention — Path C", value: "100%", target: "75%+", status: "ok" },
    { id: "c3", metric: "Close rate maintained", value: "28% MTD", target: "25%+", status: "ok" },
    { id: "c4", metric: "Brand reach — webinar show rate", value: "38%", target: "40%+", status: "warn" },
  ],
  ops_manager: [
    { id: "o1", metric: "Daily tracking compliance", value: "8 / 9", target: "100%", status: "bad" },
    { id: "o2", metric: "Build delivery 7–14 days", value: "1 / 2 on track", target: "95%+", status: "warn" },
    { id: "o3", metric: "Clients missed weekly report", value: "0", target: "Zero", status: "ok" },
    { id: "o4", metric: "Level 2 crisis response", value: "N/A", target: "Under 1 hour", status: "ok" },
  ],
  marketing_lead: [
    { id: "m1", metric: "Webinar show rate", value: "38%", target: "40%+", status: "warn" },
    { id: "m2", metric: "Webinar ad CPR", value: "$8.40", target: "Under $10", status: "ok" },
    { id: "m3", metric: "Email open rate", value: "41%", target: "35%+", status: "ok" },
    { id: "m4", metric: "Cold email reply rate", value: "9%", target: "8%+", status: "ok" },
  ],
  content_editor: [
    { id: "ce1", metric: "Content pieces this week", value: "4 / 6", target: "6+ per week", status: "warn" },
    { id: "ce2", metric: "Asset turnaround time", value: "On track", target: "Under 24hrs", status: "ok" },
    { id: "ce3", metric: "Brand standard violations", value: "0", target: "Zero", status: "ok" },
    { id: "ce4", metric: "Monthly batch completion", value: "On schedule", target: "Weekly batch", status: "ok" },
  ],
  appointment_setter: [
    { id: "as1", metric: "Hot lead outreach within 2hrs", value: "Pending", target: "100%", status: "bad" },
    { id: "as2", metric: "Opener reply rate", value: "33%", target: "30%+", status: "ok" },
    { id: "as3", metric: "Audit email open rate", value: "72%", target: "70%+", status: "ok" },
    { id: "as4", metric: "Audit-to-call-booked rate", value: "35%", target: "35%+", status: "ok" },
  ],
  sales_closer: [
    { id: "sc1", metric: "Close rate — Path A", value: "33% MTD", target: "30%+", status: "ok" },
    { id: "sc2", metric: "Close rate — Path B", value: "25% MTD", target: "25%+", status: "ok" },
    { id: "sc3", metric: "Close rate — Path C", value: "20% MTD", target: "20%+", status: "ok" },
    { id: "sc4", metric: "Payment collected on call", value: "75%", target: "70%+", status: "ok" },
  ],
  ai_tech_specialist: [
    { id: "at1", metric: "Build within 7–14 days", value: "1 / 2 on track", target: "95%+", status: "bad" },
    { id: "at2", metric: "Zero errors at walkthrough", value: "100%", target: "100%", status: "ok" },
    { id: "at3", metric: "Weekly anomaly check", value: "Completed", target: "100%", status: "ok" },
    { id: "at4", metric: "Capacity flag raised", value: "Yes — Day 8", target: "Never reactive", status: "ok" },
  ],
  csm_lead_coach: [
    { id: "cl1", metric: "Milestone Loom within 24hrs", value: "1 pending", target: "100%", status: "warn" },
    { id: "cl2", metric: "Satisfaction score avg", value: "8.7 / 10", target: "8+", status: "ok" },
    { id: "cl3", metric: "Weekly group call held", value: "Yes — today", target: "Every week", status: "ok" },
    { id: "cl4", metric: "Results snapshot before call", value: "100%", target: "100%", status: "ok" },
  ],
  bookkeeper: [
    { id: "bk1", metric: "Invoices paid within 5 days", value: "4 in process", target: "5-day max", status: "ok" },
    { id: "bk2", metric: "Commission log within 24hrs", value: "18hrs elapsed", target: "24hrs", status: "warn" },
    { id: "bk3", metric: "Monthly P&L by the 5th", value: "Draft started", target: "5th", status: "ok" },
    { id: "bk4", metric: "Payment discrepancies", value: "0", target: "Zero", status: "ok" },
  ],
};

function InlineEdit({
  value,
  onSave,
  style = {},
  placeholder = "—",
}: {
  value: string;
  onSave: (v: string) => void;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    onSave(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commit(); }}
        placeholder={placeholder}
        style={{ ...style, backgroundColor: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 4, outline: "none", padding: "1px 4px", minWidth: 60 }}
      />
    );
  }

  return (
    <span
      style={{ ...style, cursor: "pointer", borderBottom: "1px dashed var(--border)" }}
      title="Click to edit"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder}</span>}
    </span>
  );
}

export default function NumbersPage() {
  const { role } = useRole();
  const [allKpis, setAllKpis] = useStore<RoleKpiMap>(
    "hpc_role_kpis" as "hpc_role_kpis",
    DEFAULT_ROLE_KPIS
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetric, setNewMetric] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const kpis = allKpis[role] ?? DEFAULT_ROLE_KPIS[role] ?? [];
  const okCount = kpis.filter((k) => k.status === "ok").length;
  const total = kpis.length;

  function updateKpi(id: string, patch: Partial<RoleKpi>) {
    setAllKpis((prev) => ({
      ...prev,
      [role]: (prev[role] ?? []).map((k) => k.id === id ? { ...k, ...patch } : k),
    }));
  }

  function cycleStatus(id: string) {
    setAllKpis((prev) => ({
      ...prev,
      [role]: (prev[role] ?? []).map((k) => k.id === id ? { ...k, status: STATUS_CYCLE[k.status] } : k),
    }));
  }

  function removeKpi(id: string) {
    setAllKpis((prev) => ({
      ...prev,
      [role]: (prev[role] ?? []).filter((k) => k.id !== id),
    }));
  }

  function addKpi() {
    if (!newMetric.trim()) return;
    const kpi: RoleKpi = {
      id: `${role}_${Date.now()}`,
      metric: newMetric.trim(),
      value: newValue.trim() || "—",
      target: newTarget.trim() || "—",
      status: "ok",
    };
    setAllKpis((prev) => ({
      ...prev,
      [role]: [...(prev[role] ?? []), kpi],
    }));
    setNewMetric("");
    setNewValue("");
    setNewTarget("");
    setShowAddForm(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>My Numbers</h1>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="text-[11px] px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {showAddForm ? "Cancel" : "+ Add KPI"}
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        {ROLE_LABELS[role]} &middot; {okCount}/{total} KPIs on target &middot; click values or status to edit
      </p>

      {/* Add KPI Form */}
      {showAddForm && (
        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: "var(--muted)" }}>New KPI for {ROLE_LABELS[role]}</div>
          <div className="grid grid-cols-1 gap-3 mb-3">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Metric Name</div>
              <input placeholder="e.g. Response time under 2hrs" value={newMetric} onChange={(e) => setNewMetric(e.target.value)} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Current Value</div>
                <input placeholder="e.g. 85%" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
              </div>
              <div>
                <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Target</div>
                <input placeholder="e.g. 90%+" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addKpi(); }} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
              </div>
            </div>
          </div>
          <button onClick={addKpi} className="text-[11px] px-4 py-1.5 rounded" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>Add KPI</button>
        </div>
      )}

      {/* Health bar */}
      <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>Performance Health</span>
          <span className="text-sm font-medium" style={{ color: total === 0 ? "var(--muted)" : okCount === total ? "var(--success)" : okCount >= total * 0.75 ? "var(--warning)" : "var(--danger)" }}>
            {total === 0 ? "—" : `${Math.round((okCount / total) * 100)}%`}
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <div className="h-full rounded-full transition-all" style={{
            width: total === 0 ? "0%" : `${(okCount / total) * 100}%`,
            backgroundColor: okCount === total ? "var(--success)" : okCount >= total * 0.75 ? "var(--warning)" : "var(--danger)",
          }} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {kpis.map((kpi) => (
          <div key={kpi.id} className="rounded-xl p-4 group relative" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <button
              onClick={() => removeKpi(kpi.id)}
              className="absolute top-2 right-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--danger)" }}
              title="Remove KPI"
            >
              ✕
            </button>
            <div className="text-[10px] uppercase tracking-wider mb-2 pr-4" style={{ color: "var(--muted)" }}>
              <InlineEdit
                value={kpi.metric}
                onSave={(v) => updateKpi(kpi.id, { metric: v })}
                style={{ color: "var(--muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}
              />
            </div>
            <div className="flex items-end justify-between">
              <div
                className="text-2xl font-medium cursor-pointer"
                style={{ color: STATUS_COLORS[kpi.status] }}
                onClick={() => cycleStatus(kpi.id)}
                title="Click to cycle status"
              >
                <InlineEdit
                  value={kpi.value}
                  onSave={(v) => updateKpi(kpi.id, { value: v })}
                  style={{ color: STATUS_COLORS[kpi.status], fontSize: 24, fontWeight: 500 }}
                />
              </div>
              <div className="text-[11px] pb-1 flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <span>Target:</span>
                <InlineEdit
                  value={kpi.target}
                  onSave={(v) => updateKpi(kpi.id, { target: v })}
                  style={{ color: "var(--muted)", fontSize: 11 }}
                />
              </div>
            </div>
            <div className="mt-2">
              <button
                onClick={() => cycleStatus(kpi.id)}
                className="text-[9px] px-1.5 py-0.5 rounded-sm"
                style={{ backgroundColor: `${STATUS_COLORS[kpi.status]}18`, color: STATUS_COLORS[kpi.status], border: "none", cursor: "pointer" }}
                title="Cycle status"
              >
                {kpi.status.toUpperCase()}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
