"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Meta account → war room client mapping ───────────────────────────────────
// Add / edit entries here when you onboard a new client.
// lastContact uses today's date as default — will be overridden by CRM data when available.
const today = new Date().toISOString().slice(0, 10);
const META_ACCOUNTS = [
  {
    id: "act_2549125178703715",
    name: "HealthProceo",
    slug: "healthproceo",
    industry: "Health",
    tier: "$20K Agency",
    cplTarget: 30,
    leadsTarget: 40,
    lastContact: today,
    notes: "Live Meta account — data from API.",
  },
  {
    id: "act_744129051650635",
    name: "Vitality Med Spa",
    slug: "vitality-med-spa",
    industry: "Med Spa",
    tier: "$20K Agency",
    cplTarget: 35,
    leadsTarget: 50,
    lastContact: today,
    notes: "Live Meta account — data from API.",
  },
  {
    id: "act_1707066474017114",
    name: "IV Wellness",
    slug: "iv-wellness",
    industry: "Med Spa",
    tier: "$20K Agency",
    cplTarget: 35,
    leadsTarget: 50,
    lastContact: today,
    notes: "Live Meta account — data from API.",
  },
  {
    id: "act_361114249531815",
    name: "Corrective Skincare",
    slug: "corrective-skincare",
    industry: "Medical Aesthetics",
    tier: "$997 Coaching",
    cplTarget: 40,
    leadsTarget: 35,
    lastContact: today,
    notes: "Live Meta account — data from API.",
  },
];

// No fallback fake clients — only show real Meta account data.
// If all API calls fail, the page shows an empty state with a retry button.

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  name: string;
  slug: string;
  industry: string;
  tier: string;
  healthScore: number;
  cpl: number;
  cplTarget: number;
  leads: number;
  leadsTarget: number;
  roas: number;
  spend: number;
  lastContact: string;
  status: "active" | "at-risk" | "churning";
  notes: string;
  isLive: boolean;
}

// ─── Health score algorithm ────────────────────────────────────────────────────
// 40 pts: CPL vs target  — at or below target = 40, 2x target = 0
// 40 pts: Leads vs goal  — at or above goal  = 40, 0% progress = 0
// 20 pts: ROAS           — 3x+ = 20, 1x = 0 (linear)
function calcHealthScore(cpl: number, cplTarget: number, leads: number, leadsTarget: number, roas: number): number {
  const cplScore = cplTarget > 0 ? Math.max(0, Math.min(40, 40 * (1 - (cpl - cplTarget) / cplTarget))) : 20;
  const leadsScore = leadsTarget > 0 ? Math.min(40, (leads / leadsTarget) * 40) : 20;
  const roasScore = Math.min(20, (roas / 3) * 20);
  return Math.round(cplScore + leadsScore + roasScore);
}

function deriveStatus(healthScore: number): Client["status"] {
  if (healthScore >= 70) return "active";
  if (healthScore >= 45) return "at-risk";
  return "churning";
}

// ROAS estimate — avg ticket varies by industry; $400 is a conservative med-spa default.
// TODO: pull per-client avg ticket from CRM once available.
const AVG_TICKET_USD = 400;
function estimateRoas(spend: number, leads: number): number {
  if (spend <= 0 || leads <= 0) return 0;
  const revenue = leads * AVG_TICKET_USD;
  return parseFloat((revenue / spend).toFixed(1));
}

// ─── Colour helpers ────────────────────────────────────────────────────────────
function healthColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function healthBg(score: number): string {
  if (score >= 80) return "rgba(34,197,94,0.12)";
  if (score >= 50) return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}

function statusConfig(status: Client["status"]): { label: string; color: string; bg: string } {
  if (status === "active") return { label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (status === "at-risk") return { label: "At Risk", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { label: "Churning", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
}

function cardBorderColor(status: Client["status"]): string {
  if (status === "at-risk") return "#f59e0b";
  if (status === "churning") return "#ef4444";
  return "transparent";
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

type FilterType = "all" | "active" | "at-risk" | "churning";
type SortType = "health" | "cpl" | "lastContact";

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClientWarRoomPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("health");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(false);

    try {
      // Fetch all accounts in parallel
      const results = await Promise.allSettled(
        META_ACCOUNTS.map((acct) =>
          fetch(`/api/ads?period=last_30d&accountId=${acct.id}`).then((r) => r.json())
        )
      );

      const liveClients: Client[] = [];
      let anySuccess = false;

      results.forEach((result, i) => {
        const acct = META_ACCOUNTS[i];
        if (result.status === "fulfilled" && !result.value.error) {
          anySuccess = true;
          const data = result.value;
          const spend: number = data.spend || 0;
          const leads: number = data.leads || 0;
          const cpl: number = data.cpl ? Math.round(data.cpl) : leads > 0 ? Math.round(spend / leads) : 0;
          const roas = estimateRoas(spend, leads);
          const healthScore = cpl > 0
            ? calcHealthScore(cpl, acct.cplTarget, leads, acct.leadsTarget, roas)
            : leads > 0
            ? calcHealthScore(acct.cplTarget, acct.cplTarget, leads, acct.leadsTarget, roas)
            : 40; // no spend yet → neutral

          liveClients.push({
            name: acct.name,
            slug: acct.slug,
            industry: acct.industry,
            tier: acct.tier,
            healthScore,
            cpl,
            cplTarget: acct.cplTarget,
            leads,
            leadsTarget: acct.leadsTarget,
            roas,
            spend,
            lastContact: acct.lastContact,
            status: deriveStatus(healthScore),
            notes: cpl > acct.cplTarget
              ? `CPL $${cpl} vs $${acct.cplTarget} target. Monitor creative performance.`
              : leads >= acct.leadsTarget
              ? `Hitting lead goal (${leads}/${acct.leadsTarget}). Strong performance.`
              : `${leads} leads this month — tracking toward ${acct.leadsTarget} goal.`,
            isLive: true,
          });
        }
      });

      if (anySuccess) {
        setClients(liveClients);
        setLastUpdated(new Date());
      } else {
        setApiError(true);
        setClients([]);
      }
    } catch {
      setApiError(true);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived summary metrics ──────────────────────────────────────────────
  const avgHealth = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length)
    : 0;
  const atRiskCount = clients.filter((c) => c.status === "at-risk" || c.status === "churning").length;
  const mrr = clients.reduce((s, c) => s + (c.tier === "$20K Agency" ? 20000 : 997), 0);
  const summaryColor = avgHealth >= 75 ? "#22c55e" : avgHealth >= 60 ? "#f59e0b" : "#ef4444";
  const hasLiveData = clients.some((c) => c.isLive);

  const filtered = clients
    .filter((c) => filter === "all" || c.status === filter)
    .sort((a, b) => {
      if (sort === "health") return a.healthScore - b.healthScore;
      if (sort === "cpl") return b.cpl - a.cpl;
      return daysSince(b.lastContact) - daysSince(a.lastContact);
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)" }}
          >
            CLIENT WAR ROOM
          </p>
          <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
            Client Health Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Every client has a score. Green means winning. Red means intervene.
          </p>
        </div>

        {/* Live badge + last updated + refresh */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {hasLiveData && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
              >
                LIVE
              </span>
            )}
            {apiError && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}
              >
                API UNAVAILABLE
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                background: "var(--surface)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>
          {lastUpdated && (
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="card p-5 animate-pulse h-24"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      )}

      {/* Summary Bar */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Clients", value: clients.length, color: "var(--accent)" },
            { label: "Avg Health Score", value: avgHealth, color: summaryColor },
            { label: "At Risk / Churning", value: atRiskCount, color: atRiskCount > 0 ? "#ef4444" : "#22c55e" },
            {
              label: "Portfolio MRR",
              value: `$${mrr.toLocaleString()}`,
              color: "var(--accent)",
            },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-3xl font-serif" style={{ color: s.color, fontWeight: 300 }}>
                {s.value}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "at-risk", "churning"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
              style={{
                background: filter === f ? "var(--accent)" : "var(--surface)",
                color: filter === f ? "var(--accent-text)" : "var(--muted)",
                border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {f === "all" ? "All" : f === "at-risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Sort by:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="text-xs rounded-lg px-3 py-1.5"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="health">Health Score</option>
            <option value="cpl">CPL</option>
            <option value="lastContact">Last Contact</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!loading && clients.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-2xl mb-2">📊</p>
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
            {apiError ? "Could not reach Meta Ads API" : "No client data yet"}
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            {apiError
              ? "Check that META_USER_TOKEN is set and the ad accounts are accessible."
              : "Client data will appear here once Meta ad accounts have active campaigns."}
          </p>
          <button
            onClick={loadData}
            className="text-xs px-4 py-2 rounded-lg font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((client) => {
          const days = daysSince(client.lastContact);
          const isExpanded = expandedSlug === client.slug;
          const sc = statusConfig(client.status);
          const borderColor = cardBorderColor(client.status);
          const hColor = healthColor(client.healthScore);
          const hBg = healthBg(client.healthScore);
          const leadsProgress = Math.min((client.leads / client.leadsTarget) * 100, 100);
          const cplOk = client.cpl > 0 && client.cpl <= client.cplTarget;

          return (
            <div
              key={client.slug}
              className="card overflow-hidden cursor-pointer transition-all"
              style={{ borderLeft: `4px solid ${borderColor}` }}
              onClick={() => setExpandedSlug(isExpanded ? null : client.slug)}
            >
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: name + tags */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2
                        className="text-base font-semibold truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {client.name}
                      </h2>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "var(--accent-bg)",
                          color: "var(--accent-text)",
                        }}
                      >
                        {client.industry}
                      </span>
                      {client.isLive && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e", fontSize: "0.65rem" }}
                        >
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {client.tier}
                    </p>
                  </div>

                  {/* Right: Health Score Circle */}
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: hBg }}
                  >
                    <span className="text-xl font-serif font-semibold" style={{ color: hColor }}>
                      {client.healthScore}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>CPL</p>
                    <p
                      className="text-base font-semibold"
                      style={{ color: client.cpl === 0 ? "var(--muted)" : cplOk ? "#22c55e" : "#ef4444" }}
                    >
                      {client.cpl > 0 ? `$${client.cpl}` : "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      target ${client.cplTarget}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Leads</p>
                    <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
                      {client.leads}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      goal {client.leadsTarget}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>ROAS</p>
                    <p
                      className="text-base font-semibold"
                      style={{
                        color:
                          client.roas === 0
                            ? "var(--muted)"
                            : client.roas >= 3
                            ? "#22c55e"
                            : client.roas >= 2
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    >
                      {client.roas > 0 ? `${client.roas}x` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Spend</p>
                    <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
                      {client.spend > 0 ? `$${client.spend.toLocaleString()}` : "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>30d</p>
                  </div>
                </div>

                {/* Goal Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      Lead Goal Progress
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      {client.leads}/{client.leadsTarget}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: "var(--border)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${leadsProgress}%`,
                        background:
                          leadsProgress >= 100 ? "#22c55e" : leadsProgress >= 60 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>

                {/* Footer: last contact + status */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs"
                      style={{ color: days > 10 ? "#ef4444" : "var(--muted)" }}
                    >
                      {days > 10 ? "⚠ " : ""}Last contact {days}d ago
                    </span>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {sc.label}
                  </span>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div
                  className="border-t px-5 py-4 space-y-4"
                  style={{ borderColor: "var(--border-subtle)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Full Metrics Table */}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "var(--muted)" }}
                    >
                      Full Metrics
                    </p>
                    <table className="w-full text-sm">
                      <tbody>
                        {[
                          {
                            label: "CPL",
                            value: client.cpl > 0 ? `$${client.cpl}` : "—",
                            target: `Target: $${client.cplTarget}`,
                            ok: cplOk,
                          },
                          {
                            label: "Leads This Month",
                            value: client.leads,
                            target: `Goal: ${client.leadsTarget}`,
                            ok: client.leads >= client.leadsTarget,
                          },
                          {
                            label: "ROAS",
                            value: client.roas > 0 ? `${client.roas}x` : "—",
                            target: "Goal: 3x+",
                            ok: client.roas >= 3,
                          },
                          {
                            label: "Ad Spend (30d)",
                            value: client.spend > 0 ? `$${client.spend.toLocaleString()}` : "—",
                            target: "—",
                            ok: true,
                          },
                          {
                            label: "Health Score",
                            value: client.healthScore,
                            target: "Goal: 80+",
                            ok: client.healthScore >= 80,
                          },
                        ].map((row) => (
                          <tr key={row.label}>
                            <td className="py-1.5 pr-4" style={{ color: "var(--muted)", width: "40%" }}>
                              {row.label}
                            </td>
                            <td
                              className="py-1.5 font-semibold"
                              style={{ color: row.ok ? "#22c55e" : "#ef4444" }}
                            >
                              {row.value}
                            </td>
                            <td className="py-1.5 text-right text-xs" style={{ color: "var(--muted)" }}>
                              {row.target}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Goal Tracking */}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "var(--muted)" }}
                    >
                      Goal Tracking
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          label: `Leads: ${client.leads}/${client.leadsTarget}/mo`,
                          progress: leadsProgress,
                        },
                        {
                          label: `CPL: ${client.cpl > 0 ? `$${client.cpl}` : "—"} vs $${client.cplTarget} target`,
                          progress:
                            client.cpl > 0
                              ? Math.min((client.cplTarget / client.cpl) * 100, 100)
                              : 0,
                        },
                        {
                          label: `ROAS: ${client.roas > 0 ? `${client.roas}x` : "—"} vs 3x target`,
                          progress: client.roas > 0 ? Math.min((client.roas / 3) * 100, 100) : 0,
                        },
                      ].map((g) => (
                        <div key={g.label}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {g.label}
                            </span>
                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                              {Math.round(g.progress)}%
                            </span>
                          </div>
                          <div className="w-full rounded-full h-1.5" style={{ background: "var(--border)" }}>
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${g.progress}%`,
                                background:
                                  g.progress >= 100
                                    ? "#22c55e"
                                    : g.progress >= 60
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data source note */}
                  <div
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: client.isLive ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
                      color: client.isLive ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    {client.isLive
                      ? "Live data from Meta Ads API · last 30 days"
                      : "Fallback data — Meta API unavailable"}
                  </div>

                  {/* Notes */}
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "var(--muted)" }}
                    >
                      Notes
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {client.notes}
                    </p>
                  </div>

                  {/* Last Contact Urgency */}
                  <div
                    className="rounded-lg px-3 py-2 text-xs flex items-center justify-between"
                    style={{
                      background:
                        days > 10 ? "rgba(239,68,68,0.08)" : "var(--accent-bg)",
                      color: days > 10 ? "#ef4444" : "var(--accent-text)",
                    }}
                  >
                    <span>Last contacted {days} days ago</span>
                    {days > 10 && <span className="font-semibold">ACTION REQUIRED</span>}
                  </div>

                  {/* Quick Action */}
                  <Link
                    href={`/client/${client.slug}`}
                    className="block text-center text-sm font-semibold py-2 rounded-lg transition-all"
                    style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Portal →
                  </Link>
                </div>
              )}

              {/* Collapsed quick-action footer */}
              {!isExpanded && (
                <div
                  className="px-5 pb-4 pt-1 flex justify-between items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Click to expand
                  </span>
                  <Link
                    href={`/client/${client.slug}`}
                    className="text-xs font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    View Portal →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Client Portals ── */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            CLIENT PORTALS
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Share portal links with clients to show their ad performance and content status.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { slug: "healthproceo", name: "HealthPro CEO", driveUrl: null },
            { slug: "tvaai", name: "TVAAI", driveUrl: "https://drive.google.com/drive/folders/1eeMRWiQK6qR5oe41A1PIiGCo1MoCa6Os" },
            { slug: "iv-wellness", name: "IV Wellness", driveUrl: "https://drive.google.com/drive/folders/19CZ-ZQrZoLjU9_9TBIHcQ4G0A1CCXk65" },
            { slug: "amazing-skin-care", name: "Amazing Skin Care", driveUrl: "https://drive.google.com/drive/folders/136KoBPtgLAb2hHy1gym4yx2jwtuhduNK" },
            { slug: "global-icon", name: "Global Icon", driveUrl: "https://drive.google.com/drive/folders/1nxjlmRGMUkp2H8DrVC_-5K3rZ0rV6N41" },
            { slug: "dunamis-xp", name: "Dunamis XP", driveUrl: "https://drive.google.com/drive/folders/1HnuSYqEgnX7_TiLf11UiMoxBkw_-cnts" },
          ].map(portal => (
            <div key={portal.slug} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: "var(--accent)" }}>
                  {portal.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{portal.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>/client/{portal.slug}</div>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {portal.driveUrl && (
                  <a href={portal.driveUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                    Drive
                  </a>
                )}
                <Link href={`/client/${portal.slug}`} target="_blank"
                  className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)", border: "1px solid var(--accent)" }}>
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
