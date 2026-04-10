"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* ── Types ── */
interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  reach: number;
}

interface DailySpend {
  date: string;
  spend: number;
  leads: number;
}

interface ClientAdsData {
  clientName: string;
  accountId: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  leads: number;
  cpl: number;
  campaigns: Campaign[];
  dailySpend: DailySpend[];
}

/* ── Helpers ── */
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const fmtNumber = (v: number) =>
  new Intl.NumberFormat("en-US").format(v);

const fmtPct = (v: number) => `${v.toFixed(2)}%`;

const shortDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* ── Components ── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs themed-muted mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold themed-text">{value}</div>
      {sub && <div className="text-xs themed-muted mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: isActive ? "var(--accent-bg)" : "var(--border)",
        color: isActive ? "var(--accent)" : "var(--muted)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: isActive ? "var(--accent)" : "var(--muted)" }}
      />
      {status}
    </span>
  );
}

function SpendChart({ data }: { data: DailySpend[] }) {
  if (data.length === 0) return null;
  const maxSpend = Math.max(...data.map((d) => d.spend), 1);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold themed-text mb-4">Daily Spend (Last 14 Days)</h3>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {data.map((d) => {
          const pct = (d.spend / maxSpend) * 100;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  backgroundColor: "var(--accent)",
                  opacity: 0.8,
                  minHeight: 2,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = "0.8"; }}
                title={`${shortDate(d.date)}: ${fmtCurrency(d.spend)} | ${d.leads} leads`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div
            key={d.date}
            className="flex-1 text-center themed-muted"
            style={{ fontSize: 9 }}
          >
            {i % 2 === 0 ? shortDate(d.date) : ""}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 themed-muted" style={{ fontSize: 10 }}>
        <span>$0</span>
        <span>{fmtCurrency(maxSpend)}</span>
      </div>
    </div>
  );
}

function CampaignRow({ campaign, expanded, onToggle }: {
  campaign: Campaign;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <td className="py-3 px-4 text-sm themed-text">
          <div className="flex items-center gap-2">
            <span
              className="text-xs themed-muted transition-transform"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              &#9654;
            </span>
            {campaign.name}
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-right">
          <StatusBadge status={campaign.status} />
        </td>
        <td className="py-3 px-4 text-sm themed-text text-right">{fmtCurrency(campaign.spend)}</td>
        <td className="py-3 px-4 text-sm themed-text text-right">{campaign.leads}</td>
        <td className="py-3 px-4 text-sm themed-text text-right">
          {campaign.cpl > 0 ? fmtCurrency(campaign.cpl) : "--"}
        </td>
        <td className="py-3 px-4 text-sm themed-text text-right">{fmtPct(campaign.ctr)}</td>
      </tr>
      {expanded && (
        <tr style={{ borderTop: "1px solid var(--border-subtle, var(--border))" }}>
          <td colSpan={6} className="py-3 px-6" style={{ backgroundColor: "var(--bg)" }}>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <span className="themed-muted">Impressions</span>
                <div className="font-medium themed-text mt-0.5">{fmtNumber(campaign.impressions)}</div>
              </div>
              <div>
                <span className="themed-muted">Reach</span>
                <div className="font-medium themed-text mt-0.5">{fmtNumber(campaign.reach)}</div>
              </div>
              <div>
                <span className="themed-muted">Clicks</span>
                <div className="font-medium themed-text mt-0.5">{fmtNumber(campaign.clicks)}</div>
              </div>
              <div>
                <span className="themed-muted">CTR</span>
                <div className="font-medium themed-text mt-0.5">{fmtPct(campaign.ctr)}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Share Portal Button ── */
function SharePortalButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug: slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate link");
      setUrl(json.url);
      setState("done");
    } catch (err: any) {
      setState("error");
    }
  };

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (state === "idle") {
    return (
      <button
        onClick={generate}
        className="text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{
          background: "var(--accent-bg, #ede9fe)",
          color: "var(--accent, #6d28d9)",
          border: "1px solid var(--accent, #6d28d9)",
          cursor: "pointer",
        }}
      >
        Share Portal
      </button>
    );
  }

  if (state === "loading") {
    return (
      <button
        disabled
        className="text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{
          background: "var(--surface)",
          color: "var(--muted)",
          border: "1px solid var(--border)",
          cursor: "wait",
        }}
      >
        Generating...
      </button>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={generate}
        className="text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{
          background: "var(--surface)",
          color: "var(--danger, #ef4444)",
          border: "1px solid var(--danger, #ef4444)",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-1.5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <span
        className="text-xs themed-muted font-mono"
        style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={url || ""}
      >
        {url}
      </span>
      <button
        onClick={copy}
        className="text-xs font-medium px-2 py-0.5 rounded"
        style={{
          background: copied ? "var(--accent, #6d28d9)" : "var(--accent-bg, #ede9fe)",
          color: copied ? "#fff" : "var(--accent, #6d28d9)",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <button
        onClick={() => { setState("idle"); setUrl(null); }}
        className="text-xs themed-muted"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
      >
        &times;
      </button>
    </div>
  );
}

/* ── Main Page ── */
export default function ClientDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<ClientAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/client/${slug}/ads`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load client data");
        return json;
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="p-8">
        <div className="card p-12 text-center themed-muted">Loading client dashboard...</div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="p-8">
        <div
          className="card p-6"
          style={{ borderColor: "var(--danger)", backgroundColor: "var(--surface)" }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--danger)" }}>
            Error Loading Dashboard
          </h2>
          <p className="text-sm themed-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeCampaigns = data.campaigns.filter((c) => c.status === "ACTIVE");
  const pausedCampaigns = data.campaigns.filter((c) => c.status === "PAUSED");

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold themed-text">{data.clientName}</h1>
          <p className="text-sm themed-muted mt-0.5">
            Ad Account: <span className="font-mono text-xs">{data.accountId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SharePortalButton slug={slug} />
          <StatusBadge status={activeCampaigns.length > 0 ? "ACTIVE" : "PAUSED"} />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Spend" value={fmtCurrency(data.spend)} sub="Last 30 days" />
        <StatCard label="Total Leads" value={fmtNumber(data.leads)} />
        <StatCard
          label="CPL"
          value={data.cpl > 0 ? fmtCurrency(data.cpl) : "--"}
          sub={data.leads > 0 ? `${data.leads} leads` : undefined}
        />
        <StatCard label="CTR" value={fmtPct(data.ctr)} />
        <StatCard label="Impressions" value={fmtNumber(data.impressions)} />
        <StatCard label="Reach" value={fmtNumber(data.reach)} />
      </div>

      {/* ── Daily Spend Chart ── */}
      <SpendChart data={data.dailySpend} />

      {/* ── Active Campaigns ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold themed-text">
            Active Campaigns ({activeCampaigns.length})
          </h2>
        </div>
        {activeCampaigns.length === 0 ? (
          <div className="p-8 text-center text-sm themed-muted">
            No active campaigns for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--bg)" }}>
                  {["Campaign", "Status", "Spend", "Leads", "CPL", "CTR"].map((h) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-xs font-medium themed-muted uppercase tracking-wider ${
                        h !== "Campaign" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeCampaigns.map((c) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    expanded={expandedCampaigns.has(c.id)}
                    onToggle={() => toggleCampaign(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Paused Campaigns ── */}
      {pausedCampaigns.length > 0 && (
        <div className="card overflow-hidden" style={{ opacity: 0.7 }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold themed-text">
              Paused Campaigns ({pausedCampaigns.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--bg)" }}>
                  {["Campaign", "Status", "Spend", "Leads", "CPL", "CTR"].map((h) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-xs font-medium themed-muted uppercase tracking-wider ${
                        h !== "Campaign" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pausedCampaigns.map((c) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    expanded={expandedCampaigns.has(c.id)}
                    onToggle={() => toggleCampaign(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Lead Activity ── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold themed-text mb-3">Lead Activity</h2>
        <div className="text-sm themed-muted text-center py-6" style={{ backgroundColor: "var(--bg)", borderRadius: 12 }}>
          <p>Lead tracking via GHL integration coming soon.</p>
          <p className="text-xs mt-1">Connect GoHighLevel to see real-time lead activity.</p>
        </div>
      </div>
    </div>
  );
}
