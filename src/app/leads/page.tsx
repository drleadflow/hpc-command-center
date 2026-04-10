"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/hooks";

const PAGE_LABELS: Record<string, string> = {
  "apply": "Apply Page",
  "webinar-v3": "Webinar V3",
  "webinar-v4": "Webinar V4",
  "webinar": "Webinar",
  "sales": "Sales Page",
  "masterclass": "Masterclass",
  "pipeline-offer": "Pipeline Offer",
  "book-session": "Book Session",
  "agency": "Agency",
};

export default function LeadsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "funnel" | "leads">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/leads?type=overview").then(r => r.json()),
      fetch("/api/leads?type=analytics").then(r => r.json()),
      fetch("/api/leads?type=leads").then(r => r.json()),
    ]).then(([ov, an, ld]) => {
      setOverview(ov);
      setAnalytics(an);
      setLeads(ld.leads || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="card p-6 animate-pulse">
        <div className="h-8 rounded-xl w-48 mb-2" style={{ backgroundColor: "var(--border)" }} />
        <div className="h-4 rounded-xl w-32" style={{ backgroundColor: "var(--border)" }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          WEBSITE
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Leads & Funnel
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          healthproceo.com · Live data from Railway
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: overview?.totalLeads || 0, color: "var(--accent)" },
          { label: "/apply Views (7d)", value: analytics?.topPages?.find((p: any) => p.pageSlug === "apply")?.views || 0, color: "var(--warning)" },
          { label: "Checkout Starts (7d)", value: analytics?.topPages?.find((p: any) => p.pageSlug === "apply")?.checkouts || 0, color: "#7c3aed" },
          { label: "Pages Active", value: analytics?.topPages?.length || 0, color: "#0891b2" },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <p className="text-3xl font-serif" style={{ color: s.color, fontWeight: 300 }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["overview", "funnel", "leads"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="text-sm px-4 py-2 rounded-xl border transition-colors capitalize"
            style={{
              backgroundColor: tab === t ? "var(--accent-bg)" : "var(--surface)",
              borderColor: tab === t ? "var(--accent)" : "var(--border)",
              color: tab === t ? "var(--accent-text)" : "var(--text-secondary)",
              fontWeight: tab === t ? "500" : "400",
            }}>
            {t === "overview" ? "Overview" : t === "funnel" ? "Funnel" : "Leads"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="card p-6">
            <h3 className="text-base font-serif mb-4" style={{ color: "var(--text)", fontWeight: 400 }}>
              Top Pages (7 days)
            </h3>
            <div className="space-y-3">
              {analytics?.topPages?.map((p: any) => (
                <div key={p.pageSlug} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                    <span className="text-sm" style={{ color: "var(--text)" }}>
                      {PAGE_LABELS[p.pageSlug] || `/${p.pageSlug}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                    <span>{p.views} views</span>
                    {p.checkouts > 0 && (
                      <span className="px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                        {p.checkouts} starts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="card p-6">
            <h3 className="text-base font-serif mb-4" style={{ color: "var(--text)", fontWeight: 400 }}>
              Recent Leads
            </h3>
            <div className="space-y-3">
              {overview?.recentLeads?.length === 0 && (
                <p className="text-sm themed-muted">No leads yet — funnel is live though!</p>
              )}
              {overview?.recentLeads?.map((lead: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {lead.firstName} — {lead.practiceType}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {lead.email} · {lead.leadSource}
                    </p>
                  </div>
                  <span className="text-xs themed-muted">{timeAgo(lead.leadCreatedAt)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6 col-span-2">
            <h3 className="text-base font-serif mb-4" style={{ color: "var(--text)", fontWeight: 400 }}>
              Live Activity Feed
            </h3>
            <div className="space-y-2">
              {analytics?.recentActivity?.map((event: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-2xl px-4 py-2.5"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                      {event.eventType}
                    </span>
                    <span className="text-sm" style={{ color: "var(--text)" }}>
                      /{event.pageSlug}
                    </span>
                  </div>
                  <span className="text-xs themed-muted">{timeAgo(event.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Funnel Tab */}
      {tab === "funnel" && (
        <div className="card p-6">
          <h3 className="text-base font-serif mb-6" style={{ color: "var(--text)", fontWeight: 400 }}>
            Funnel Performance (7 days)
          </h3>
          <div className="space-y-4">
            {analytics?.topPages?.map((p: any) => {
              const convRate = p.views > 0 ? ((p.checkouts / p.views) * 100).toFixed(1) : "0";
              return (
                <div key={p.pageSlug}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {PAGE_LABELS[p.pageSlug] || `/${p.pageSlug}`}
                    </span>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                      <span>{p.sessions} sessions</span>
                      <span>{p.views} views</span>
                      {p.checkouts > 0 && <span style={{ color: "var(--accent)" }}>{p.checkouts} checkouts ({convRate}%)</span>}
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((p.views / 250) * 100, 100)}%`,
                        backgroundColor: "var(--accent)",
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leads Tab */}
      {tab === "leads" && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b themed-border flex items-center justify-between">
            <h3 className="text-base font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
              All Leads ({leads.length})
            </h3>
          </div>
          <div className="divide-y themed-border">
            {leads.length === 0 && (
              <div className="p-8 text-center themed-muted text-sm">
                No leads yet — your funnel is live and getting traffic!
              </div>
            )}
            {leads.map((lead: any) => (
              <div key={lead.id} className="p-4 hover:opacity-80 transition-opacity">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {lead.firstName} — {lead.practiceType || "Unknown practice"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {lead.email} {lead.phone ? `· ${lead.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                      {lead.leadSource}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {timeAgo(lead.leadCreatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
