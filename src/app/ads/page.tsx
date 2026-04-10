"use client";

import { useState, useEffect } from "react";

const CLIENTS = [
  { id: "act_2549125178703715", name: "HealthProceo", color: "#2d5a4e" },
  { id: "act_744129051650635", name: "Vitality Med Spa", color: "#7c3aed" },
  { id: "act_1707066474017114", name: "IV Wellness", color: "#0891b2" },
  { id: "act_361114249531815", name: "Corrective Skincare", color: "#d97706" },
];

function Score({ value, good, bad, suffix = "" }: { value: number | null; good: number; bad: number; suffix?: string }) {
  if (value === null || value === undefined) return <span className="themed-muted text-sm">—</span>;
  const color = value <= good ? "#059669" : value >= bad ? "#b91c1c" : "#d97706";
  return <span style={{ color }} className="font-medium">{value}{suffix}</span>;
}

function Metric({ label, value, hint, highlight }: { label: string; value: any; hint?: string; highlight?: boolean }) {
  return (
    <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: highlight ? "var(--accent-bg)" : "var(--bg)" }}>
      <div className="text-2xl font-serif mb-1" style={{ color: highlight ? "var(--accent-text)" : "var(--text)", fontWeight: 300 }}>
        {value ?? "—"}
      </div>
      <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</div>
      {hint && <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{hint}</div>}
    </div>
  );
}

export default function AdsPage() {
  const [activeClient, setActiveClient] = useState(CLIENTS[0].id);
  const [cache, setCache] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("last_30d");
  const [activating, setActivating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedAd, setExpandedAd] = useState<number | null>(null);

  const client = CLIENTS.find(c => c.id === activeClient)!;
  const cacheKey = activeClient + period;
  const data = cache[cacheKey];

  useEffect(() => {
    if (cache[cacheKey]) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ads?period=${period}&accountId=${activeClient}`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
      .then(d => { setCache(p => ({ ...p, [cacheKey]: d })); setLoading(false); })
      .catch(() => { setError("Could not load ad data."); setLoading(false); });
  }, [activeClient, period]);

  const handleToggle = async (id: string, name: string, status: string) => {
    const newStatus = status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    if (!confirm(`${newStatus === "ACTIVE" ? "Activate" : "Pause"} "${name}"?`)) return;
    setActivating(id);
    try {
      const res = await fetch("/api/ads/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id, status: newStatus }),
      });
      const r = await res.json();
      if (r.success) {
        setToast(`✅ "${name}" ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
        setCache(p => ({
          ...p,
          [cacheKey]: {
            ...p[cacheKey],
            campaigns: p[cacheKey].campaigns.map((c: any) => c.id === id ? { ...c, status: newStatus } : c),
          },
        }));
      } else {
        setToast(`❌ ${r.error || "Failed"}`);
      }
    } catch { setToast("❌ Network error"); }
    setActivating(null);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium card"
          style={{ color: "var(--text)" }}>{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>META ADS</p>
          <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>Ad Performance</h1>
        </div>
        <div className="flex gap-2">
          {[{ id: "last_7d", label: "7d" }, { id: "last_30d", label: "30d" }, { id: "last_90d", label: "90d" }].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className="text-xs px-4 py-2 rounded-xl border transition-colors"
              style={{
                backgroundColor: period === p.id ? "var(--accent-bg)" : "var(--surface)",
                borderColor: period === p.id ? "var(--accent)" : "var(--border)",
                color: period === p.id ? "var(--accent-text)" : "var(--text-secondary)",
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CLIENTS.map(c => (
          <button key={c.id} onClick={() => setActiveClient(c.id)}
            className="px-5 py-2.5 rounded-2xl border transition-all text-sm font-medium"
            style={{
              backgroundColor: activeClient === c.id ? c.color + "15" : "var(--surface)",
              borderColor: activeClient === c.id ? c.color : "var(--border)",
              color: activeClient === c.id ? c.color : "var(--text-secondary)",
            }}>
            <span className="w-2 h-2 rounded-full inline-block mr-2"
              style={{ backgroundColor: c.color, opacity: activeClient === c.id ? 1 : 0.3 }} />
            {c.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse h-20" style={{ backgroundColor: "var(--bg)" }} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 text-center">
          <p className="text-sm mb-3" style={{ color: "var(--danger)" }}>{error}</p>
          <button
            onClick={() => { setCache(p => { const c = { ...p }; delete c[cacheKey]; return c; }); }}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Core Metrics Grid */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              ACCOUNT OVERVIEW · {period.replace("last_", "").replace("d", " DAYS")}
            </p>
            <div className="grid grid-cols-5 gap-3">
              <Metric label="Spend" value={`$${Number(data.spend || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} highlight />
              <Metric label="Leads" value={data.leads || 0} highlight />
              <Metric label="CPL" value={data.cpl ? `$${data.cpl.toFixed(2)}` : "—"} hint={data.cpl < 10 ? "✅ On target" : data.cpl > 20 ? "⚠️ High" : undefined} />
              <Metric label="CTR (All)" value={`${(data.ctr_all || 0).toFixed(2)}%`} hint="> 2% = good" />
              <Metric label="CTR (Link)" value={`${(data.ctr_link || 0).toFixed(2)}%`} hint="> 1% = good" />
              <Metric label="CPM" value={`$${(data.cpm || 0).toFixed(2)}`} hint="$10-30 = normal" />
              <Metric label="CPC" value={`$${(data.cpc || 0).toFixed(2)}`} />
              <Metric label="Frequency" value={(data.frequency || 0).toFixed(2)} hint={data.frequency > 3 ? "⚠️ Fatigue risk" : "✅ Healthy"} />
              <Metric label="Reach" value={Number(data.reach || 0).toLocaleString()} />
              <Metric label="Impressions" value={Number(data.impressions || 0).toLocaleString()} />
            </div>

            {/* Video metrics if available */}
            {(data.hookRate || data.holdRate) && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {data.hookRate !== null && (
                  <Metric label="Hook Rate (3s)" value={`${data.hookRate}%`} hint="> 30% = strong hook" />
                )}
                {data.holdRate !== null && (
                  <Metric label="Hold Rate (ThruPlay)" value={`${data.holdRate}%`} hint="> 20% = engaging" />
                )}
                {data.cvr !== null && (
                  <Metric label="CVR (click→lead)" value={`${data.cvr}%`} hint="> 5% = good LP" />
                )}
              </div>
            )}
          </div>

          {/* Campaigns */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b themed-border">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>CAMPAIGNS</p>
            </div>
            {data.campaigns?.length === 0 && <div className="p-6 text-center text-sm themed-muted">No campaigns</div>}
            <div className="divide-y themed-border">
              {data.campaigns?.map((c: any) => (
                <div key={c.id} className="p-4 flex items-center gap-4">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: c.status === "ACTIVE" ? "#059669" : "var(--border)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                    <p className="text-xs themed-muted mt-0.5">
                      ${c.budget > 0 ? `${(c.budget / 100).toFixed(0)}/day` : "no budget"} budget
                    </p>
                  </div>
                  {/* Metrics inline */}
                  <div className="hidden md:flex items-center gap-6 text-xs" style={{ color: "var(--muted)" }}>
                    <div className="text-center">
                      <div className="font-medium" style={{ color: "var(--text)" }}>${(c.spend || 0).toFixed(0)}</div>
                      <div>spend</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{c.leads || 0}</div>
                      <div>leads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium" style={{ color: c.cpl < 10 ? "#059669" : c.cpl > 20 ? "#b91c1c" : "#d97706" }}>
                        {c.cpl ? `$${c.cpl}` : "—"}
                      </div>
                      <div>CPL</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{c.ctr.toFixed(2)}%</div>
                      <div>CTR</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium" style={{ color: c.frequency > 3 ? "#b91c1c" : "var(--text)" }}>
                        {c.frequency.toFixed(1)}x
                      </div>
                      <div>freq</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium" style={{ color: "var(--text)" }}>${c.cpm.toFixed(2)}</div>
                      <div>CPM</div>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(c.id, c.name, c.status)}
                    disabled={activating === c.id}
                    className="text-xs px-4 py-2 rounded-xl border transition-all font-medium shrink-0 disabled:opacity-40"
                    style={{
                      backgroundColor: c.status === "ACTIVE" ? "var(--danger-bg)" : "var(--accent-bg)",
                      borderColor: c.status === "ACTIVE" ? "#fecaca" : "var(--accent)",
                      color: c.status === "ACTIVE" ? "#b91c1c" : "var(--accent-text)",
                    }}>
                    {activating === c.id ? "..." : c.status === "ACTIVE" ? "Pause" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top Creatives */}
          {data.topAds?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b themed-border">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  CREATIVES (CPL RANKED)
                </p>
              </div>
              {/* Column headers */}
              <div className="px-5 py-2.5 grid grid-cols-8 gap-2 text-xs font-semibold uppercase tracking-wide border-b themed-border"
                style={{ color: "var(--muted)", backgroundColor: "var(--bg)" }}>
                <div className="col-span-2">Creative</div>
                <div className="text-right">Spend</div>
                <div className="text-right">Leads</div>
                <div className="text-right">CPL</div>
                <div className="text-right">CTR</div>
                <div className="text-right">Freq</div>
                <div className="text-right">CPM</div>
              </div>
              <div className="divide-y themed-border">
                {data.topAds.map((ad: any, i: number) => (
                  <div key={i}>
                    <div className="px-5 py-3.5 grid grid-cols-8 gap-2 items-center cursor-pointer hover:opacity-80"
                      onClick={() => setExpandedAd(expandedAd === i ? null : i)}>
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ad.status === "ACTIVE" ? "#059669" : "var(--muted)" }} />
                        <span className="text-sm truncate" style={{ color: "var(--text)" }}>{ad.name}</span>
                      </div>
                      <div className="text-right text-sm" style={{ color: "var(--text-secondary)" }}>${(ad.spend || 0).toFixed(0)}</div>
                      <div className="text-right text-sm font-medium" style={{ color: "var(--text)" }}>{ad.leads}</div>
                      <div className="text-right text-sm font-medium"
                        style={{ color: !ad.cpl ? "var(--muted)" : ad.cpl < 10 ? "#059669" : ad.cpl > 20 ? "#b91c1c" : "#d97706" }}>
                        {ad.cpl ? `$${ad.cpl}` : "—"}
                      </div>
                      <div className="text-right text-sm" style={{ color: ad.ctr > 2 ? "#059669" : "var(--text-secondary)" }}>
                        {ad.ctr.toFixed(2)}%
                      </div>
                      <div className="text-right text-sm" style={{ color: ad.frequency > 3 ? "#b91c1c" : "var(--text-secondary)" }}>
                        {ad.frequency.toFixed(1)}x
                      </div>
                      <div className="text-right text-sm" style={{ color: "var(--text-secondary)" }}>
                        ${(ad.cpm || 0).toFixed(2)}
                      </div>
                    </div>
                    {expandedAd === i && (ad.hookRate || ad.holdRate) && (
                      <div className="px-5 pb-3 flex gap-6" style={{ backgroundColor: "var(--bg)" }}>
                        {ad.hookRate !== null && (
                          <div className="text-xs">
                            <span className="themed-muted">Hook Rate: </span>
                            <span style={{ color: ad.hookRate > 30 ? "#059669" : "var(--text)" }}>{ad.hookRate}%</span>
                          </div>
                        )}
                        {ad.holdRate !== null && (
                          <div className="text-xs">
                            <span className="themed-muted">Hold Rate: </span>
                            <span style={{ color: ad.holdRate > 20 ? "#059669" : "var(--text)" }}>{ad.holdRate}%</span>
                          </div>
                        )}
                        <div className="text-xs">
                          <span className="themed-muted">Reach: </span>
                          <span style={{ color: "var(--text)" }}>{Number(ad.reach).toLocaleString()}</span>
                        </div>
                        <div className="text-xs">
                          <span className="themed-muted">CTR (link): </span>
                          <span style={{ color: "var(--text)" }}>{ad.ctrLink?.toFixed(2)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
                RECOMMENDED ACTIONS
              </p>
              <div className="space-y-3">
                {data.recommendations.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl p-4 border themed-border"
                    style={{ backgroundColor: "var(--bg)" }}>
                    <span className="shrink-0 mt-0.5 text-base">
                      {r.type === "scale" ? "⬆️" : r.type === "refresh" ? "🔄" : "⏸"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.action}</p>
                      <p className="text-xs mt-0.5 themed-muted">{r.reason}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full shrink-0 font-medium"
                      style={{
                        backgroundColor: r.type === "scale" ? "var(--accent-bg)" : r.type === "refresh" ? "var(--warning-bg)" : "var(--danger-bg)",
                        color: r.type === "scale" ? "var(--accent-text)" : r.type === "refresh" ? "#d97706" : "#b91c1c",
                      }}>
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
