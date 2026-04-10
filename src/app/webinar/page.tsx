"use client";

import { useState, useEffect, useMemo } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

type FunnelStage =
  | "purchased"
  | "cart-open"
  | "attended"
  | "replay-watched"
  | "no-buy"
  | "no-show"
  | "day-of"
  | "registered"
  | "nurture"
  | "old-lead";

interface Registrant {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  dateAdded: string;
  stage: FunnelStage;
  cohort: "new" | "old";
  score: number;
  signals: string[];
  activeWorkflow: string;
  company: string;
  website: string;
}

interface Stats {
  total: number;
  newWebinar: number;
  oldLeads: number;
  purchased: number;
  attended: number;
  noShow: number;
  noBuy: number;
  cartOpen: number;
  replayWatched: number;
  registered: number;
  dayOf: number;
  nurture: number;
  hotLeads: number;
}

interface FunnelStep {
  stage: FunnelStage;
  count: number;
}

import { timeAgo } from "@/lib/hooks";

// ── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<FunnelStage, { label: string; color: string; bg: string; workflow: string }> = {
  purchased:       { label: "Purchased",  color: "#16a34a", bg: "rgba(22,163,106,0.12)",  workflow: "08. Purchase Exit" },
  "cart-open":     { label: "Cart Open",  color: "#7c3aed", bg: "rgba(124,58,237,0.12)",  workflow: "06. Cart Close" },
  attended:        { label: "Attended",   color: "#2563eb", bg: "rgba(37,99,235,0.12)",   workflow: "04. Follow-Up" },
  "replay-watched":{ label: "Replay",    color: "#0891b2", bg: "rgba(8,145,178,0.12)",   workflow: "05. Replay" },
  "no-buy":        { label: "No Buy",    color: "#d97706", bg: "rgba(217,119,6,0.12)",   workflow: "07. Post-Cart" },
  "no-show":       { label: "No Show",   color: "#dc2626", bg: "rgba(220,38,38,0.12)",   workflow: "05. Replay" },
  "day-of":        { label: "Day Of",    color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  workflow: "03. Day-Of" },
  registered:      { label: "Registered", color: "#6366f1", bg: "rgba(99,102,241,0.12)", workflow: "02. Confirmation" },
  nurture:         { label: "Nurture",    color: "#64748b", bg: "rgba(100,116,139,0.12)", workflow: "01. Nurture" },
  "old-lead":      { label: "Old Lead",   color: "#71717a", bg: "rgba(113,113,122,0.12)", workflow: "—" },
};

function priorityLabel(score: number): { text: string; color: string } {
  if (score >= 60) return { text: "HOT", color: "#dc2626" };
  if (score >= 40) return { text: "WARM", color: "#d97706" };
  if (score >= 20) return { text: "ENGAGED", color: "#6366f1" };
  return { text: "COLD", color: "#71717a" };
}

// ── Component ───────────────────────────────────────────────────────────────

export default function WebinarPage() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<"all" | "new" | "old">("all");
  const [stageFilter, setStageFilter] = useState<FunnelStage | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/webinar/registrants")
      .then((r) => r.json())
      .then((d) => {
        setRegistrants(d.registrants || []);
        setStats(d.stats || null);
        setFunnel(d.funnel || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return registrants.filter((r) => {
      if (cohortFilter !== "all" && r.cohort !== cohortFilter) return false;
      if (stageFilter !== "all" && r.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [registrants, cohortFilter, stageFilter, search]);

  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          WEBINAR COMMAND
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}>
          Predictable Patient Pipeline
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          8 workflows &middot; {stats?.total ?? "—"} contacts &middot; sorted by engagement score
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats?.total, color: "var(--text)" },
          { label: "New Webinar", value: stats?.newWebinar, color: "var(--text)" },
          { label: "Old Leads", value: stats?.oldLeads, color: "var(--text)" },
          { label: "Attended", value: stats?.attended, color: "#2563eb" },
          { label: "Purchased", value: stats?.purchased, color: "#16a34a" },
          { label: "Hot Leads", value: stats?.hotLeads, color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl font-serif mb-0.5" style={{ color: s.color, fontWeight: 300 }}>
              {loading ? "—" : (s.value ?? 0)}
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Funnel Visualization */}
      {!loading && funnel.length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
            FUNNEL — 8 WORKFLOW STAGES
          </p>
          <div className="space-y-2">
            {funnel.filter((f) => f.count > 0).map((f) => {
              const cfg = STAGE_CONFIG[f.stage];
              const pct = Math.max(3, (f.count / maxFunnel) * 100);
              return (
                <button
                  key={f.stage}
                  onClick={() => setStageFilter(stageFilter === f.stage ? "all" : f.stage)}
                  className="w-full flex items-center gap-3 group"
                >
                  <span className="text-xs w-20 text-right shrink-0" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
                    <div
                      className="h-full rounded-lg flex items-center px-3 transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: stageFilter === f.stage ? cfg.color : cfg.bg,
                        minWidth: "40px",
                      }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: stageFilter === f.stage ? "white" : cfg.color }}
                      >
                        {f.count}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs w-28 shrink-0 hidden sm:block" style={{ color: "var(--muted)" }}>
                    {cfg.workflow}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl outline-none flex-1 w-full sm:w-auto"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <div className="flex gap-2 flex-wrap">
            {(["all", "new", "old"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCohortFilter(c)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: cohortFilter === c ? "var(--accent)" : "var(--bg)",
                  color: cohortFilter === c ? "white" : "var(--muted)",
                  border: `1px solid ${cohortFilter === c ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {c === "all" ? "All" : c === "new" ? "New Webinar" : "Old Leads"}
              </button>
            ))}
            {stageFilter !== "all" && (
              <button
                onClick={() => setStageFilter("all")}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: STAGE_CONFIG[stageFilter].color,
                  color: "white",
                }}
              >
                {STAGE_CONFIG[stageFilter].label} &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Registrant Table */}
      <div className="card overflow-hidden">
        <div
          className="grid px-4 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "2fr 1fr 0.8fr 0.6fr 1fr 1fr",
            color: "var(--muted)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span>Contact</span>
          <span>Stage</span>
          <span>Priority</span>
          <span>Score</span>
          <span className="hidden lg:block">Workflow</span>
          <span className="text-right">Registered</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "var(--muted)" }}>
            {search || stageFilter !== "all" || cohortFilter !== "all" ? "No matching registrants" : "No webinar data yet"}
          </p>
        ) : (
          <div>
            {filtered.map((r) => {
              const stageCfg = STAGE_CONFIG[r.stage];
              const priority = priorityLabel(r.score);
              const isExpanded = expanded === r.id;

              return (
                <div key={r.id}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                    className="w-full grid items-center px-4 py-3 text-left transition-colors hover:opacity-90"
                    style={{
                      gridTemplateColumns: "2fr 1fr 0.8fr 0.6fr 1fr 1fr",
                      borderBottom: "1px solid var(--border)",
                      backgroundColor: isExpanded ? "var(--bg)" : "transparent",
                    }}
                  >
                    {/* Contact */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{
                          backgroundColor: r.score >= 40 ? "#dc2626" : r.score >= 20 ? "#d97706" : "var(--accent)",
                        }}
                      >
                        {(r.name || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{r.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{r.email}</p>
                      </div>
                    </div>

                    {/* Stage */}
                    <div>
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: stageCfg.bg, color: stageCfg.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageCfg.color }} />
                        {stageCfg.label}
                      </span>
                    </div>

                    {/* Priority */}
                    <div>
                      <span className="text-xs font-bold" style={{ color: priority.color }}>{priority.text}</span>
                    </div>

                    {/* Score */}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full flex-1 max-w-[50px]" style={{ backgroundColor: "var(--border)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, r.score))}%`, backgroundColor: priority.color }}
                          />
                        </div>
                        <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{r.score}</span>
                      </div>
                    </div>

                    {/* Workflow */}
                    <div className="hidden lg:block">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{r.activeWorkflow}</span>
                    </div>

                    {/* Date */}
                    <div className="text-right">
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(r.dateAdded)}</span>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div
                      className="px-4 py-4 space-y-3"
                      style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                            Contact
                          </p>
                          <p className="text-sm" style={{ color: "var(--text)" }}>{r.email}</p>
                          <p className="text-sm" style={{ color: "var(--text)" }}>{r.phone || "No phone"}</p>
                          {r.company && <p className="text-sm" style={{ color: "var(--text)" }}>{r.company}</p>}
                          <div className="flex gap-3 text-xs" style={{ color: "var(--muted)" }}>
                            <span>
                              Cohort: <span style={{ color: "var(--text)" }}>{r.cohort === "new" ? "New Webinar" : "Previous Campaign"}</span>
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            Active Workflow: <span style={{ color: stageCfg.color }}>{r.activeWorkflow}</span>
                          </div>
                        </div>

                        {/* Signals */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                            Engagement Signals
                          </p>
                          {r.signals.length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--muted)" }}>No signals yet</p>
                          ) : (
                            <div className="space-y-1">
                              {r.signals.map((s) => (
                                <div key={s} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text)" }}>
                                  <span style={{ color: "#16a34a" }}>+</span> {s}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                            GHL Tags
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {r.tags.map((t) => (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 text-xs" style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
            Showing {filtered.length} of {registrants.length} contacts
          </div>
        )}
      </div>

      {/* Workflow Map */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
          PPP CAMPAIGN — 8 WORKFLOW MAP
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          From ghl-superspeed-v3. Tags trigger workflows automatically in GHL.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { num: "01", name: "List Nurture", tag: "nurture-start", color: "#64748b", desc: "Mon-Thu email sequence" },
            { num: "02", name: "Confirmation", tag: "webinar-registered", color: "#6366f1", desc: "SMS + email on signup" },
            { num: "03", name: "Day-Of", tag: "webinar-registered", color: "#8b5cf6", desc: "Thu reminders + LIVE alert" },
            { num: "04", name: "Attendee Follow-Up", tag: "webinar-attended", color: "#2563eb", desc: "Thu-Sun with cart deadline" },
            { num: "05", name: "No-Show Replay", tag: "webinar-no-show", color: "#dc2626", desc: "72hr replay sequence" },
            { num: "06", name: "Cart Close", tag: "webinar-cart-open", color: "#7c3aed", desc: "Sun deadline urgency" },
            { num: "07", name: "Post-Cart Nurture", tag: "webinar-no-buy", color: "#d97706", desc: "Quick win + re-engage" },
            { num: "08", name: "Purchase Exit", tag: "pipeline-purchased", color: "#16a34a", desc: "Welcome + remove all" },
          ].map((wf) => (
            <div
              key={wf.num}
              className="rounded-2xl p-3"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold" style={{ color: wf.color }}>{wf.num}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{wf.name}</span>
              </div>
              <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>{wf.desc}</p>
              <code
                className="text-xs px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}
              >
                {wf.tag}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Link */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>ZOOM LINK</p>
          <p className="text-sm font-mono" style={{ color: "var(--text)" }}>https://zoom.us/j/92039978057</p>
        </div>
        <a
          href="https://zoom.us/j/92039978057?pwd=FJhBaVbiIQK4za9CanJkLxcbNkAC7s.1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-xl font-medium"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          Open Zoom
        </a>
      </div>
    </div>
  );
}
