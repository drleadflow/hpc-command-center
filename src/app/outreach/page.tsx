"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SourceState = "live" | "configured" | "mock" | "missing" | "error";

type HotLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  campaign: string;
  lastActivity: string;
};

type OutreachResponse = {
  source: "upstream" | "airtable" | "supabase" | "mock";
  summary: {
    activeCampaigns: number;
    leadsQueued: number;
    leadsContacted: number;
    openRate: number;
    replyRate: number;
    positiveReplyRate: number;
    meetingsBooked: number;
    pipelineValue: number;
    warmLeads: number;
    deliverabilityScore: number;
    lastSync: string;
  };
  campaigns: {
    id: string;
    name: string;
    client: string;
    status: string;
    channel: string;
    owner: string;
    leadsQueued: number;
    leadsContacted: number;
    openRate: number;
    replyRate: number;
    positiveReplies: number;
    meetingsBooked: number;
    pipelineValue: number;
    health: "strong" | "watch" | "at-risk";
    updatedAt: string;
  }[];
  pipeline: {
    id: string;
    label: string;
    count: number;
    value: number;
    color: string;
    conversionRate?: number;
  }[];
  hotLeads: HotLead[];
  activity: {
    id: string;
    type: string;
    title: string;
    detail: string;
    happenedAt: string;
  }[];
  sourceStatus: {
    id: string;
    label: string;
    state: SourceState;
    detail: string;
  }[];
  links: {
    airtableUrl?: string;
    upstreamUrl?: string;
  };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatAgo(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sourceTone(source: OutreachResponse["source"]) {
  if (source === "upstream") return { label: "Live upstream", bg: "var(--success-bg)", color: "var(--success)" };
  if (source === "airtable") return { label: "Airtable live", bg: "var(--accent-bg)", color: "var(--accent-text)" };
  if (source === "supabase") return { label: "Supabase live", bg: "var(--accent-bg)", color: "var(--accent-text)" };
  return { label: "Fallback data", bg: "var(--warning-bg)", color: "var(--warning)" };
}

function sourceStateTone(state: SourceState) {
  if (state === "live") return { bg: "var(--success-bg)", color: "var(--success)" };
  if (state === "configured") return { bg: "var(--accent-bg)", color: "var(--accent-text)" };
  if (state === "mock") return { bg: "var(--warning-bg)", color: "var(--warning)" };
  if (state === "error") return { bg: "var(--danger-bg)", color: "var(--danger)" };
  return { bg: "var(--bg)", color: "var(--muted)" };
}

function healthTone(health: "strong" | "watch" | "at-risk") {
  if (health === "strong") return { label: "Strong", bg: "var(--success-bg)", color: "var(--success)" };
  if (health === "watch") return { label: "Watch", bg: "var(--warning-bg)", color: "var(--warning)" };
  return { label: "At risk", bg: "var(--danger-bg)", color: "var(--danger)" };
}

function hotLeadTone(status: string) {
  if (status === "Hot Lead") return { bg: "var(--danger-bg)", color: "var(--danger)" };
  if (status === "Booked") return { bg: "var(--success-bg)", color: "var(--success)" };
  return { bg: "var(--warning-bg)", color: "var(--warning)" };
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className="card p-5"
      style={{
        background: accent ? "linear-gradient(135deg, var(--accent-bg) 0%, var(--surface) 100%)" : "var(--surface)",
      }}
    >
      <div className="text-3xl font-serif" style={{ color: accent ? "var(--accent-text)" : "var(--text)", fontWeight: 400 }}>
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest mt-2" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
        {hint}
      </div>
    </div>
  );
}

export default function OutreachPage() {
  const [data, setData] = useState<OutreachResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);

  async function load() {
    setError(null);
    const res = await fetch("/api/outreach", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load outreach data");
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setRefreshing(false);
  }

  function handleRunPipeline() {
    setPipelineRunning(true);
    // Placeholder — will connect to lead-engine / Modal cron trigger
    setTimeout(() => {
      setPipelineRunning(false);
      alert("Pipeline trigger queued. Connect OUTREACH_API_URL to route this to lead-engine.");
    }, 1200);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-8 animate-pulse h-40" />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="card p-6 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-10 text-center">
        <div className="text-2xl font-serif" style={{ color: "var(--text)" }}>Outreach dashboard unavailable</div>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{error || "No data returned."}</p>
        <button
          onClick={refresh}
          className="mt-5 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          Retry
        </button>
      </div>
    );
  }

  const tone = sourceTone(data.source);
  const contactedToReplyRate = data.summary.leadsContacted
    ? (data.summary.replyRate / 100) * data.summary.leadsContacted
    : 0;
  const positiveToMeetingRate = data.summary.warmLeads
    ? (data.summary.meetingsBooked / data.summary.warmLeads) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="card p-8"
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              OUTREACH OS
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
                Cold-email command center
              </h1>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: tone.bg, color: tone.color }}
              >
                {tone.label}
              </span>
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
              Pipeline velocity, hot leads, and campaign health — sourced live from Airtable.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 text-xs" style={{ color: "var(--muted)" }}>
              <span>Last sync {formatAgo(data.summary.lastSync)}</span>
              <span>•</span>
              <span>{data.summary.activeCampaigns} active campaigns</span>
              <span>•</span>
              <span>{formatCurrency(data.summary.pipelineValue)} in pipeline</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunPipeline}
              disabled={pipelineRunning}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{
                backgroundColor: pipelineRunning ? "var(--muted)" : "var(--accent)",
                color: "#fff",
                opacity: pipelineRunning ? 0.7 : 1,
              }}
            >
              {pipelineRunning ? "Running..." : "Run Pipeline"}
            </button>
            <button
              onClick={refresh}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href="/leads-os"
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Open Leads OS
            </Link>
            {data.links.airtableUrl ? (
              <a
                href={data.links.airtableUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                Open Airtable
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(data.summary.pipelineValue)}
          hint={`${data.summary.meetingsBooked} meetings booked`}
          accent
        />
        <StatCard
          label="Leads Contacted"
          value={formatNumber(data.summary.leadsContacted)}
          hint={`${formatNumber(data.summary.leadsQueued)} queued across active campaigns`}
        />
        <StatCard
          label="Reply Rate"
          value={formatPercent(data.summary.replyRate)}
          hint={`${formatNumber(Math.round(contactedToReplyRate))} total replies`}
        />
        <StatCard
          label="Deliverability"
          value={`${data.summary.deliverabilityScore}/100`}
          hint={`${formatPercent(data.summary.openRate)} weighted open rate`}
        />
        <StatCard
          label="Positive Replies"
          value={formatNumber(data.summary.warmLeads)}
          hint={`${formatPercent(data.summary.positiveReplyRate)} of contacted leads`}
        />
        <StatCard
          label="Meetings"
          value={formatNumber(data.summary.meetingsBooked)}
          hint={`${positiveToMeetingRate ? formatPercent(positiveToMeetingRate) : "0.0%"} of warm replies converted`}
        />
        <StatCard
          label="Campaigns Live"
          value={formatNumber(data.summary.activeCampaigns)}
          hint={`${data.campaigns.length - data.summary.activeCampaigns} campaigns paused or drifting`}
        />
        <StatCard
          label="Next Best Move"
          value={data.campaigns[0]?.health === "strong" ? "Scale winners" : "Refresh copy"}
          hint={data.campaigns[0]?.name || "No campaigns available"}
        />
      </div>

      {/* Pipeline Funnel + Hot Leads */}
      <div className="grid xl:grid-cols-[1.45fr_0.85fr] gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Pipeline Velocity
              </p>
              <h2 className="text-xl font-serif mt-1" style={{ color: "var(--text)", fontWeight: 400 }}>
                Funnel by stage · New → Won
              </h2>
            </div>
            <Link href="/leads" className="text-sm" style={{ color: "var(--accent)" }}>
              See website leads
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {data.pipeline.map((stage, index) => (
              <div key={stage.id} className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-1 rounded-full mb-3" style={{ backgroundColor: stage.color }} />
                <div className="text-xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
                  {formatNumber(stage.count)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>
                  {stage.label}
                </div>
                {index > 0 && stage.conversionRate !== undefined && (
                  <div className="text-xs mt-2" style={{ color: stage.conversionRate >= 5 ? "var(--success)" : "var(--muted)" }}>
                    {formatPercent(stage.conversionRate)} from prev
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hot Leads */}
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Hot Leads
          </p>
          <h2 className="text-xl font-serif mt-1 mb-4" style={{ color: "var(--text)", fontWeight: 400 }}>
            Interested &amp; Hot Lead
          </h2>
          {data.hotLeads.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No hot leads yet. When leads move to Interested, Hot Lead, or Booked in Airtable they will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {data.hotLeads.slice(0, 6).map((lead) => {
                const lt = hotLeadTone(lead.status);
                return (
                  <div
                    key={lead.id}
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                          {lead.name}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                          {lead.company || lead.email || "No company"}
                        </div>
                      </div>
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: lt.bg, color: lt.color }}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {lead.campaign || "Cold Email"}
                      </span>
                      <span className="text-xs shrink-0 ml-2" style={{ color: "var(--muted)" }}>
                        {formatAgo(lead.lastActivity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Health + Activity + Wiring */}
      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b themed-border">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Campaign Health
            </p>
            <h2 className="text-xl font-serif mt-1" style={{ color: "var(--text)", fontWeight: 400 }}>
              Per-campaign performance
            </h2>
          </div>
          <div className="divide-y themed-border">
            {data.campaigns.map((campaign) => {
              const health = healthTone(campaign.health);
              return (
                <div key={campaign.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium" style={{ color: "var(--text)" }}>{campaign.name}</h3>
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: health.bg, color: health.color }}
                        >
                          {health.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: "var(--muted)" }}>
                        <span>{campaign.client}</span>
                        <span>•</span>
                        <span>{campaign.channel}</span>
                        <span>•</span>
                        <span>{campaign.owner}</span>
                        <span>•</span>
                        <span>{campaign.status}</span>
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>
                      Updated {formatAgo(campaign.updatedAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
                    {[
                      { label: "Queued", value: formatNumber(campaign.leadsQueued) },
                      { label: "Contacted", value: formatNumber(campaign.leadsContacted) },
                      { label: "Open", value: formatPercent(campaign.openRate) },
                      { label: "Reply", value: formatPercent(campaign.replyRate) },
                      { label: "Positive", value: formatNumber(campaign.positiveReplies) },
                      { label: "Pipeline", value: formatCurrency(campaign.pipelineValue) },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg)" }}>
                        <div className="text-lg font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
                          {stat.value}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Recent Activity
            </p>
            <h2 className="text-xl font-serif mt-1 mb-5" style={{ color: "var(--text)", fontWeight: 400 }}>
              Latest outreach signals
            </h2>
            <div className="space-y-3">
              {data.activity.map((event) => (
                <div key={event.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                      {event.type}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatAgo(event.happenedAt)}
                    </span>
                  </div>
                  <div className="text-sm font-medium mt-2" style={{ color: "var(--text)" }}>{event.title}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{event.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Quick Actions
            </p>
            <h2 className="text-xl font-serif mt-1 mb-4" style={{ color: "var(--text)", fontWeight: 400 }}>
              Adjacent systems
            </h2>
            <div className="space-y-2">
              {[
                { href: "/content", label: "Research offers", detail: "Turn outreach wins into new topic and script angles." },
                { href: "/ads", label: "Hand off warm angles", detail: "Promote winning copy into paid creative testing." },
                { href: "/automation", label: "Audit automations", detail: "Review GHL and ManyChat workflows tied to booked calls." },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl p-3 transition-colors"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.label}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{item.detail}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Wiring Status
            </p>
            <h2 className="text-xl font-serif mt-1 mb-4" style={{ color: "var(--text)", fontWeight: 400 }}>
              What is live vs. next to connect
            </h2>
            <div className="space-y-3">
              {data.sourceStatus.map((source) => {
                const st = sourceStateTone(source.state);
                return (
                  <div key={source.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{source.label}</div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={{ backgroundColor: st.bg, color: st.color }}
                      >
                        {source.state}
                      </span>
                    </div>
                    <div className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                      {source.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
