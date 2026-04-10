"use client";

import { useState, useRef, useEffect } from "react";
import type { HpcRole, TeamStatus } from "@/lib/types";
import { useStore } from "@/lib/use-store";

// ── Types ───────────────────────────────────────────────────────────
interface CompanyMetric {
  label: string;
  value: string;
  sub: string;
  status: "ok" | "warn" | "bad" | "";
}

interface TeamKpi {
  label: string;
  value: string;
  target: string;
  status: "ok" | "warn" | "bad";
}

interface TeamCard {
  role: string;
  hpcRole: HpcRole;
  dept: string;
  status: TeamStatus;
  tracking: boolean;
  focus: string;
  priorities: string[];
  kpis: TeamKpi[];
  blocker: string | null;
}

type ViewMode = "team" | "kpi";
type DeptFilter = "All" | "CEO & Ops" | "Sales" | "Marketing" | "Fulfillment" | "Finance";

const DEPT_FILTERS: DeptFilter[] = ["All", "CEO & Ops", "Sales", "Marketing", "Fulfillment", "Finance"];
const DEPT_MAP: Record<string, string[]> = { "CEO & Ops": ["CEO", "Ops"], "Sales": ["Sales"], "Marketing": ["Marketing"], "Fulfillment": ["Fulfillment"], "Finance": ["Finance"] };
const DEPT_COLORS: Record<string, string> = { CEO: "#D85A30", Ops: "#7F77DD", Marketing: "#378ADD", Sales: "#BA7517", Fulfillment: "#639922", Finance: "#888" };
const STATUS_COLORS: Record<TeamStatus, string> = { active: "#639922", meeting: "#185FA5", blocked: "#BA7517", offline: "#888" };
const STATUS_LABELS: Record<TeamStatus, string> = { active: "Active", meeting: "In meeting", blocked: "Blocked", offline: "Offline" };
const ALL_STATUSES: TeamStatus[] = ["active", "meeting", "blocked", "offline"];

// ── Inline editable text ────────────────────────────────────────────
function EditableText({ value, onChange, className, style, placeholder }: {
  value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setEditing(false); } if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className={className}
        style={{ ...style, outline: "none", backgroundColor: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 4, padding: "1px 4px", width: "100%" }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={className}
      style={{ ...style, cursor: "pointer", borderBottom: "1px dashed transparent" }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = "var(--muted)"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = "transparent"; }}
      title="Click to edit"
    >
      {value || placeholder || "Click to edit"}
    </span>
  );
}

// ── Default Data ────────────────────────────────────────────────────
const DEFAULT_METRICS: CompanyMetric[] = [
  { label: "Monthly recurring revenue", value: "$24,500", sub: "+$3K vs last month", status: "ok" },
  { label: "Active clients", value: "9", sub: "3 Path A · 4 Path B · 2 Path C", status: "" },
  { label: "Calls booked today", value: "3", sub: "7 total in pipeline this week", status: "" },
  { label: "Open builds (B & C)", value: "2", sub: "1 blocked — access pending", status: "warn" },
  { label: "Daily tracking submitted", value: "8 / 9", sub: "1 outstanding — Setter", status: "warn" },
];

const DEFAULT_TEAM: TeamCard[] = [
  {
    role: "CEO", hpcRole: "ceo", dept: "CEO", status: "active", tracking: true,
    focus: "Month 3 renewal call — Riverside Dental · Path C",
    priorities: ["90-min renewal call — Riverside Dental (Path C). Present results snapshot.", "Final approval on yesterday's Sales Closer close — confirm handoff brief received.", "Tuesday leadership sync with Ops Manager at 2pm — pipeline and capacity review."],
    kpis: [{ label: "New MRR per month", value: "$24,500", target: "$25K+", status: "warn" }, { label: "Client retention — Path C", value: "100%", target: "75%+", status: "ok" }, { label: "Close rate maintained", value: "28% MTD", target: "25%+", status: "ok" }, { label: "Webinar show rate", value: "38%", target: "40%+", status: "warn" }],
    blocker: null,
  },
  {
    role: "Operations Manager", hpcRole: "ops_manager", dept: "Ops", status: "active", tracking: true,
    focus: "Daily tracking review + client delivery timeline oversight",
    priorities: ["Daily tracking form review — Setter has not submitted. Follow-up sent.", "Coastal Chiro (Path B) build at Day 10 — walkthrough must be scheduled this week.", "Facilitate Tuesday department sync at 1pm CST — all leads present."],
    kpis: [{ label: "Daily tracking compliance", value: "8 / 9", target: "100%", status: "bad" }, { label: "Build delivery within 7–14 days", value: "1 / 2 on track", target: "95%+", status: "warn" }, { label: "Clients missed weekly report", value: "0", target: "Zero", status: "ok" }, { label: "Level 2 crisis response", value: "N/A today", target: "Under 1 hour", status: "ok" }],
    blocker: "Appointment Setter has not submitted daily tracking form — follow-up sent.",
  },
  {
    role: "Marketing Lead", hpcRole: "marketing_lead", dept: "Marketing", status: "active", tracking: true,
    focus: "Webinar scorecard completion + 2 remaining Reels for this week",
    priorities: ["Complete Monday webinar scorecard in Notion — due by 6pm today.", "Finish copy and direction for 2 Reels — deliver to Content Editor by noon.", "Call winner on last week's A/B test — deploy winning variant."],
    kpis: [{ label: "Webinar show rate", value: "38%", target: "40%+", status: "warn" }, { label: "Webinar ad CPR", value: "$8.40", target: "Under $10", status: "ok" }, { label: "Email open rate", value: "41%", target: "35%+", status: "ok" }, { label: "Cold email reply rate", value: "9%", target: "8%+", status: "ok" }],
    blocker: null,
  },
  {
    role: "Content Editor", hpcRole: "content_editor", dept: "Marketing", status: "active", tracking: true,
    focus: "Batch editing — 2 Reels + 3 carousels from Monday content shoot",
    priorities: ["Edit and export 2 Reels from Monday shoot — deliver by 11am.", "Produce 3 carousels: lead gen explainer, AI chatbot demo, social proof.", "Upload all finished assets to Canva brand folder — tagged before EOD."],
    kpis: [{ label: "Content pieces this week", value: "4 / 6", target: "6+ per week", status: "warn" }, { label: "Asset turnaround time", value: "On track", target: "Under 24hrs", status: "ok" }, { label: "Brand standard violations", value: "0", target: "Zero", status: "ok" }, { label: "Monthly batch completion", value: "On schedule", target: "Weekly batch", status: "ok" }],
    blocker: null,
  },
  {
    role: "Appointment Setter", hpcRole: "appointment_setter", dept: "Sales", status: "blocked", tracking: false,
    focus: "3 marketing audits to deliver from Monday webinar hot leads",
    priorities: ["Submit daily tracking form — required before any other work.", "Generate and deliver 3 marketing audits to Monday hot leads.", "Complete pre-call intel sheets for booked calls."],
    kpis: [{ label: "Hot lead outreach within 2hrs", value: "Pending", target: "100%", status: "bad" }, { label: "Opener reply rate", value: "33%", target: "30%+", status: "ok" }, { label: "Audit email open rate", value: "72%", target: "70%+", status: "ok" }, { label: "Audit-to-call-booked rate", value: "35%", target: "35%+", status: "ok" }],
    blocker: "Daily tracking form not submitted by 9am CST — flagged.",
  },
  {
    role: "Sales Closer", hpcRole: "sales_closer", dept: "Sales", status: "meeting", tracking: true,
    focus: "3 strategy calls today — Path B, Path C, and Path A conversion",
    priorities: ["10am: Skyline PT — Path B close attempt. Audit reviewed.", "1pm: Premier Wellness — Path C close. Payment link queued.", "4pm: Dr. Chen Chiro — Path A conversion."],
    kpis: [{ label: "Close rate — Path A", value: "33% MTD", target: "30%+", status: "ok" }, { label: "Close rate — Path B", value: "25% MTD", target: "25%+", status: "ok" }, { label: "Close rate — Path C", value: "20% MTD", target: "20%+", status: "ok" }, { label: "Payment collected on call", value: "75%", target: "70%+", status: "ok" }],
    blocker: null,
  },
  {
    role: "AI & Tech Specialist", hpcRole: "ai_tech_specialist", dept: "Fulfillment", status: "blocked", tracking: true,
    focus: "Coastal Chiro walkthrough blocked — awaiting Meta Business Manager access",
    priorities: ["Coastal Chiro (Day 10): Meta BM access missing. QA everything else.", "Summit Wellness Path B (Day 5): chatbot config + activate 3 core sequences.", "Weekly anomaly check across all active sub-accounts."],
    kpis: [{ label: "Build within 7–14 days", value: "1 / 2 on track", target: "95%+", status: "bad" }, { label: "Zero errors at walkthrough", value: "100%", target: "100%", status: "ok" }, { label: "Weekly anomaly check", value: "Completed", target: "100%", status: "ok" }, { label: "Capacity flag raised", value: "Yes — Day 8", target: "Never reactive", status: "ok" }],
    blocker: "Coastal Chiro build blocked at Day 10 — client has not granted Meta BM access.",
  },
  {
    role: "CSM / Lead Coach", hpcRole: "csm_lead_coach", dept: "Fulfillment", status: "meeting", tracking: true,
    focus: "Weekly Path A group coaching call at 11am + milestone Loom due today",
    priorities: ["11am: Weekly Path A group coaching call — topic: first 30-day results.", "Send milestone Loom to Summit Wellness — 24hr window.", "2pm: Monthly optimization call — Peak Performance PT."],
    kpis: [{ label: "Milestone Loom within 24hrs", value: "1 pending", target: "100%", status: "warn" }, { label: "Satisfaction score avg", value: "8.7 / 10", target: "8+", status: "ok" }, { label: "Weekly group call held", value: "Yes — today", target: "Every week", status: "ok" }, { label: "Results snapshot before call", value: "100%", target: "100%", status: "ok" }],
    blocker: null,
  },
  {
    role: "Bookkeeper / Finance", hpcRole: "bookkeeper", dept: "Finance", status: "active", tracking: true,
    focus: "Bi-weekly invoice processing + commission log update from yesterday's close",
    priorities: ["Process 4 contractor bi-weekly invoices — due within 5 business days.", "Update commission log for yesterday's close — $300 entry.", "Draft monthly P&L by offer path — due by the 5th."],
    kpis: [{ label: "Invoices paid within 5 days", value: "4 in process", target: "5-day max", status: "ok" }, { label: "Commission log within 24hrs", value: "18hrs elapsed", target: "24hrs", status: "warn" }, { label: "Monthly P&L by the 5th", value: "Draft started", target: "5th", status: "ok" }, { label: "Payment discrepancies", value: "0", target: "Zero", status: "ok" }],
    blocker: null,
  },
];

// ── Component ───────────────────────────────────────────────────────
export function BridgeDashboard() {
  const [view, setView] = useState<ViewMode>("team");
  const [filter, setFilter] = useState<DeptFilter>("All");
  const [metrics, setMetrics] = useStore<CompanyMetric[]>("hpc_metrics" as "hpc_metrics", DEFAULT_METRICS);
  const [team, setTeam] = useStore<TeamCard[]>("hpc_team" as "hpc_team", DEFAULT_TEAM);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const filteredTeam = team.filter((p) => filter === "All" || (DEPT_MAP[filter] ?? []).includes(p.dept));
  const blockers = filteredTeam.filter((p) => p.blocker);

  // Helpers to update nested team data
  const updateMember = (idx: number, patch: Partial<TeamCard>) => {
    setTeam((prev) => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  };
  const updatePriority = (memberIdx: number, prioIdx: number, val: string) => {
    setTeam((prev) => prev.map((m, i) => {
      if (i !== memberIdx) return m;
      const priorities = [...m.priorities];
      priorities[prioIdx] = val;
      return { ...m, priorities };
    }));
  };
  const addPriority = (memberIdx: number) => {
    setTeam((prev) => prev.map((m, i) => i === memberIdx ? { ...m, priorities: [...m.priorities, "New priority — click to edit"] } : m));
  };
  const updateKpiValue = (memberIdx: number, kpiIdx: number, val: string) => {
    setTeam((prev) => prev.map((m, i) => {
      if (i !== memberIdx) return m;
      const kpis = m.kpis.map((k, ki) => ki === kpiIdx ? { ...k, value: val } : k);
      return { ...m, kpis };
    }));
  };
  const cycleKpiStatus = (memberIdx: number, kpiIdx: number) => {
    const cycle: Array<"ok" | "warn" | "bad"> = ["ok", "warn", "bad"];
    setTeam((prev) => prev.map((m, i) => {
      if (i !== memberIdx) return m;
      const kpis = m.kpis.map((k, ki) => {
        if (ki !== kpiIdx) return k;
        const next = cycle[(cycle.indexOf(k.status) + 1) % cycle.length];
        return { ...k, status: next };
      });
      return { ...m, kpis };
    }));
  };
  const updateMetric = (idx: number, patch: Partial<CompanyMetric>) => {
    setMetrics((prev) => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>CEO / Ops Manager Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{today}</p>
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--bg)" }}>
          {(["team", "kpi"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className="px-3 py-1 rounded-md text-xs transition-all" style={{ backgroundColor: view === v ? "var(--surface)" : "transparent", color: view === v ? "var(--text)" : "var(--muted)", fontWeight: view === v ? 500 : 400, border: view === v ? "0.5px solid var(--border)" : "none" }}>
              {v === "team" ? "Team view" : "KPI view"}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row — editable */}
      <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {metrics.map((m, idx) => (
          <div key={m.label} className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>{m.label}</div>
            <div className="text-xl font-medium leading-none mb-0.5" style={{ color: m.status === "ok" ? "var(--success)" : m.status === "warn" ? "var(--warning)" : m.status === "bad" ? "var(--danger)" : "var(--text)" }}>
              <EditableText value={m.value} onChange={(v) => updateMetric(idx, { value: v })} />
            </div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>
              <EditableText value={m.sub} onChange={(v) => updateMetric(idx, { sub: v })} />
            </div>
          </div>
        ))}
      </div>

      {/* Legend + Filters */}
      <div className="flex gap-4 flex-wrap mb-4">
        {(Object.entries(STATUS_LABELS) as [TeamStatus, string][]).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted)" }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {DEPT_FILTERS.map((d) => (
          <button key={d} onClick={() => setFilter(d)} className="px-3 py-1 rounded-full text-xs transition-all" style={{ backgroundColor: filter === d ? "var(--text)" : "var(--surface)", color: filter === d ? "var(--bg)" : "var(--muted)", border: filter === d ? "none" : "0.5px solid var(--border)" }}>
            {d}
          </button>
        ))}
      </div>

      {/* Team Grid — editable */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}>
        {filteredTeam.map((p) => {
          const memberIdx = team.findIndex((t) => t.role === p.role);
          return (
            <div key={p.role} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)", borderLeft: `3px solid ${DEPT_COLORS[p.dept] ?? "var(--border)"}` }}>
              {/* Card Header — status clickable */}
              <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <button
                  onClick={() => { const next = ALL_STATUSES[(ALL_STATUSES.indexOf(p.status) + 1) % ALL_STATUSES.length]; updateMember(memberIdx, { status: next }); }}
                  className="w-2 h-2 rounded-full flex-shrink-0 cursor-pointer"
                  style={{ backgroundColor: STATUS_COLORS[p.status] }}
                  title={`${STATUS_LABELS[p.status]} — click to change`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{p.role}</div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>{p.dept} · {STATUS_LABELS[p.status]}</div>
                </div>
                <button
                  onClick={() => updateMember(memberIdx, { tracking: !p.tracking })}
                  className="text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0 cursor-pointer"
                  style={{ backgroundColor: p.tracking ? "var(--success-bg, #EAF3DE)" : "var(--danger-bg, #FCEBEB)", color: p.tracking ? "var(--success)" : "var(--danger)" }}
                >
                  {p.tracking ? "Tracking ✓" : "No tracking"}
                </button>
              </div>

              {/* Card Body */}
              <div className="px-3 py-3">
                {/* Focus — editable */}
                <div className="text-[10px] mb-3 pb-3 flex gap-1.5 leading-relaxed" style={{ color: "var(--muted)", borderBottom: "0.5px solid var(--border-subtle)" }}>
                  <span className="text-[10px] font-medium uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-secondary)" }}>Now:</span>
                  <EditableText value={p.focus} onChange={(v) => updateMember(memberIdx, { focus: v })} style={{ color: "var(--muted)", fontSize: "10px" }} />
                </div>

                {view === "team" ? (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {p.priorities.map((pr, i) => (
                      <div key={i} className="flex gap-2 text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>{i + 1}</span>
                        <EditableText value={pr} onChange={(v) => updatePriority(memberIdx, i, v)} style={{ fontSize: "11px", color: "var(--text-secondary)" }} />
                      </div>
                    ))}
                    <button onClick={() => addPriority(memberIdx)} className="text-[10px] mt-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>+ Add priority</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {p.kpis.map((k, ki) => (
                      <div key={k.label} className="rounded-md px-2.5 py-2" style={{ backgroundColor: "var(--bg)" }}>
                        <div className="text-[9px] leading-tight mb-1" style={{ color: "var(--muted)" }}>{k.label}</div>
                        <div className="text-sm font-medium cursor-pointer" style={{ color: k.status === "ok" ? "var(--success)" : k.status === "warn" ? "var(--warning)" : "var(--danger)" }}>
                          <EditableText value={k.value} onChange={(v) => updateKpiValue(memberIdx, ki, v)} style={{ fontSize: "14px", fontWeight: 500, color: "inherit" }} />
                        </div>
                        <button onClick={() => cycleKpiStatus(memberIdx, ki)} className="text-[9px] mt-0.5 cursor-pointer" style={{ color: "var(--muted)" }} title="Click to cycle status">{k.target}</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Primary KPI */}
                <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
                  <span className="text-[10px] flex-1 leading-tight" style={{ color: "var(--muted)" }}>{p.kpis[0].label}</span>
                  <span className="text-xs font-medium" style={{ color: p.kpis[0].status === "ok" ? "var(--success)" : p.kpis[0].status === "warn" ? "var(--warning)" : "var(--danger)" }}>{p.kpis[0].value}</span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>/ {p.kpis[0].target}</span>
                </div>
              </div>

              {/* Blocker — editable */}
              <div className="px-3 py-2 flex gap-2 items-start text-[10px] leading-snug" style={{ backgroundColor: p.blocker ? "var(--warning-bg, #FDF3E3)" : "transparent", borderTop: p.blocker ? "0.5px solid var(--warning, #E8C87A)" : "none", color: "var(--warning-text, #854F0B)" }}>
                {p.blocker ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--warning)", color: "#fff" }}>!</span>
                    <EditableText value={p.blocker} onChange={(v) => updateMember(memberIdx, { blocker: v || null })} style={{ fontSize: "10px", color: "var(--warning-text, #854F0B)" }} />
                  </>
                ) : (
                  <button onClick={() => updateMember(memberIdx, { blocker: "New blocker — click to describe" })} className="opacity-40 hover:opacity-100 text-[9px] transition-opacity" style={{ color: "var(--muted)" }}>+ Add blocker</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Blockers Panel */}
      {blockers.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-5" style={{ border: "0.5px solid var(--warning, #E8C87A)", backgroundColor: "var(--warning-bg, #FDF3E3)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "0.5px solid var(--warning, #E8C87A)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--warning-text, #854F0B)" }}>Active blockers and flags today</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--warning-text, #854F0B)", color: "var(--warning-bg, #FDF3E3)" }}>{blockers.length}</span>
          </div>
          {blockers.map((p) => (
            <div key={p.role} className="px-4 py-2.5 flex gap-4 items-start text-[11px]" style={{ borderBottom: "0.5px solid var(--warning, #E8C87A)" }}>
              <span className="font-medium flex-shrink-0 w-44" style={{ color: "var(--warning-text, #854F0B)" }}>{p.role}</span>
              <span style={{ color: "var(--warning-text, #92610A)", lineHeight: 1.45 }}>{p.blocker}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
