"use client";

import { useState, useEffect } from "react";

interface FunnelStage {
  label: string;
  count: number | null;
  placeholder?: string;
  color: string;
}

function conversionRate(from: number | null, to: number | null): string | null {
  if (from === null || to === null || from === 0) return null;
  return ((to / from) * 100).toFixed(1) + "%";
}

function rateColor(from: number | null, to: number | null, goodThreshold: number, okThreshold: number): string {
  if (from === null || to === null || from === 0) return "var(--muted)";
  const pct = (to / from) * 100;
  if (pct >= goodThreshold) return "#059669";
  if (pct >= okThreshold) return "#d97706";
  return "#b91c1c";
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-2xl font-serif mb-1" style={{ color: "var(--text)", fontWeight: 300 }}>
        {value}
      </div>
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{sub}</div>}
    </div>
  );
}

export default function PipelinePage() {
  const [leadsData, setLeadsData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/leads?type=overview").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/revenue").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([leads, revenue]) => {
      setLeadsData(leads);
      setRevenueData(revenue);
      if (!leads && !revenue) setFetchError(true);
      setLoading(false);
    });
  }, []);

  const activeClients = revenueData?.clients?.filter((c: any) => c.status === "active") ?? null;
  const clientCount = activeClients?.length ?? null;
  const mrr = activeClients?.reduce((sum: number, c: any) => sum + (c.monthly || 0), 0) ?? null;
  const prospectCount = leadsData?.total ?? leadsData?.count ?? null;

  const stages: FunnelStage[] = [
    {
      label: "Prospects",
      count: prospectCount,
      color: "#6366f1",
    },
    {
      label: "Outreach Sent",
      count: null,
      placeholder: "Connect SmartLead",
      color: "#8b5cf6",
    },
    {
      label: "Replies",
      count: null,
      placeholder: "Connect SmartLead",
      color: "#a855f7",
    },
    {
      label: "Meetings Booked",
      count: null,
      placeholder: "Connect Cal.com",
      color: "#ec4899",
    },
    {
      label: "Proposals Sent",
      count: null,
      placeholder: "Manual entry",
      color: "#f59e0b",
    },
    {
      label: "Clients Won",
      count: clientCount,
      color: "#10b981",
    },
    {
      label: "MRR",
      count: mrr !== null ? mrr : null,
      color: "#059669",
    },
  ];

  // Good threshold: 30%, ok: 10%
  const convThresholds = [
    { good: 30, ok: 10 },
    { good: 50, ok: 20 },
    { good: 40, ok: 15 },
    { good: 50, ok: 20 },
    { good: 60, ok: 30 },
    { good: 80, ok: 50 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          GROWTH
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Pipeline Velocity
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Full-funnel conversion view — from cold prospects to monthly revenue
        </p>
      </div>

      {/* Top stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <StatBox
            label="Active Clients"
            value={clientCount ?? "—"}
            sub={clientCount ? "revenue generating" : undefined}
          />
          <StatBox
            label="MRR"
            value={mrr !== null ? `$${mrr.toLocaleString()}` : "—"}
            sub={mrr ? "monthly recurring" : undefined}
          />
          <StatBox
            label="Prospects in CRM"
            value={prospectCount ?? "—"}
            sub={prospectCount ? "total leads tracked" : undefined}
          />
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse" style={{ backgroundColor: "var(--bg)" }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="card p-6 text-center" style={{ borderLeft: "4px solid #ef4444" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Could not load pipeline data
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Check that the leads and revenue API routes are configured.
          </p>
        </div>
      )}

      {/* Funnel */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            CONVERSION FUNNEL
          </p>
        </div>

        <div className="p-6">
          {/* Horizontal funnel stages */}
          <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
            {stages.map((stage, idx) => {
              const isLast = idx === stages.length - 1;
              const prev = idx > 0 ? stages[idx - 1] : null;
              const rate = prev ? conversionRate(prev.count, stage.count) : null;
              const rColor = prev
                ? rateColor(prev.count, stage.count, convThresholds[idx - 1]?.good ?? 30, convThresholds[idx - 1]?.ok ?? 10)
                : "var(--muted)";

              return (
                <div key={stage.label} className="flex items-center shrink-0">
                  {/* Stage box */}
                  <div
                    className="rounded-2xl p-4 text-center flex flex-col items-center justify-center"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: `1px solid var(--border)`,
                      minWidth: "120px",
                      minHeight: "100px",
                    }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mb-2"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                      {stage.label}
                    </div>
                    {stage.count !== null ? (
                      <div className="text-xl font-serif" style={{ color: "var(--text)", fontWeight: 300 }}>
                        {stage.label === "MRR"
                          ? `$${stage.count.toLocaleString()}`
                          : stage.count.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                        {stage.placeholder || "—"}
                      </div>
                    )}
                  </div>

                  {/* Arrow with conversion rate */}
                  {!isLast && (
                    <div className="flex flex-col items-center mx-2 shrink-0">
                      {rate && (
                        <div className="text-xs font-semibold mb-1" style={{ color: rColor }}>
                          {rate}
                        </div>
                      )}
                      <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                        <path
                          d="M0 8 H20 M14 2 L20 8 L14 14"
                          stroke={rColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {!rate && (
                        <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>—</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          CONVERSION RATE HEALTH
        </p>
        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#059669" }} />
            <span className="text-xs" style={{ color: "var(--text)" }}>Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#d97706" }} />
            <span className="text-xs" style={{ color: "var(--text)" }}>Needs attention</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#b91c1c" }} />
            <span className="text-xs" style={{ color: "var(--text)" }}>Underperforming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>Not connected</span>
          </div>
        </div>
      </div>

      {/* Unconnected stages callout */}
      <div className="card p-5 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
        <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
          Connect your outreach stack to unlock full funnel visibility
        </p>
        <div className="space-y-1.5 text-xs" style={{ color: "var(--muted)" }}>
          <div>SmartLead — outreach sent, replies, positive replies</div>
          <div>Cal.com or GHL Calendar — meetings booked</div>
          <div>GHL Pipeline — proposals sent, deals won</div>
        </div>
      </div>
    </div>
  );
}
