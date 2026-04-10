"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Client definitions ───────────────────────────────────────────────────────
const CLIENTS = [
  { id: "act_2549125178703715", name: "HealthProceo" },
  { id: "act_744129051650635", name: "Vitality Med Spa" },
  { id: "act_1707066474017114", name: "IV Wellness" },
  { id: "act_361114249531815", name: "Corrective Skincare" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApifySocialData {
  tiktok: {
    followers: number;
    likes: number;
    videos: number;
    username: string;
    connected: boolean;
    error?: string;
  };
  instagram: {
    followers: number;
    posts: number;
    username: string;
    connected: boolean;
    error?: string;
  };
  youtube: {
    subscribers: number;
    views: number;
    videos: number;
    channelTitle: string;
    connected: boolean;
    error?: string;
  };
  linkedin: {
    followers: number;
    connections: number;
    name: string;
    connected: boolean;
    error?: string;
  };
  twitter?: {
    followers: number;
    tweets: number;
    username: string;
    verified: boolean;
    connected: boolean;
    error?: string;
  };
  cached: boolean;
  lastFetched: string;
}

interface PageInsights {
  impressions: number;
  reach: number;
  engagement: number;
  follower_growth: number;
  total_followers: number;
}

interface YouTubeStats {
  subscribers: number;
  totalViews: number;
  videoCount: number;
  channelTitle: string;
  thumbnail: string;
  connected: boolean;
  error?: string;
}

interface InstagramStats {
  followers: number;
  mediaCount: number;
  username: string;
  profilePic: string;
  connected: boolean;
  error?: string;
}

interface ClientData {
  spend: number;
  leads: number;
  cpl: number | null;
  ctr_all: number;
  impressions: number;
}

type PlatformStatus = "connected" | "disconnected" | "error" | "loading";

// ─── Shared sub-components ────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className="text-center p-5 rounded-2xl"
      style={{ backgroundColor: highlight ? "var(--accent-bg)" : "var(--bg)" }}
    >
      <div
        className="text-2xl font-serif mb-1"
        style={{
          color: highlight ? "var(--accent-text)" : "var(--text)",
          fontWeight: 300,
        }}
      >
        {value}
      </div>
      <div
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: PlatformStatus }) {
  const colorMap: Record<PlatformStatus, string> = {
    connected: "#22c55e",
    disconnected: "var(--muted)",
    error: "var(--danger, #ef4444)",
    loading: "var(--muted)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: colorMap[status],
        flexShrink: 0,
      }}
    />
  );
}

interface PlatformCardProps {
  icon: string;
  name: string;
  status: PlatformStatus;
  primaryValue: string | number;
  primaryLabel: string;
  secondaryValue?: string | number;
  secondaryLabel?: string;
  hint?: string;
}

function PlatformCard({
  icon,
  name,
  status,
  primaryValue,
  primaryLabel,
  secondaryValue,
  secondaryLabel,
  hint,
}: PlatformCardProps) {
  const isActive = status === "connected";
  return (
    <div
      className="card p-4 flex flex-col gap-3"
      style={{
        opacity: isActive ? 1 : 0.6,
        borderColor: isActive ? "var(--border)" : "var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            {name}
          </span>
        </div>
        <StatusDot status={status} />
      </div>

      {/* Primary metric */}
      <div>
        <div
          className="text-3xl font-serif"
          style={{ color: "var(--text)", fontWeight: 300 }}
        >
          {status === "loading" ? (
            <span
              className="inline-block w-20 h-7 rounded animate-pulse"
              style={{ backgroundColor: "var(--bg)" }}
            />
          ) : isActive ? (
            typeof primaryValue === "number"
              ? primaryValue.toLocaleString()
              : primaryValue
          ) : (
            "—"
          )}
        </div>
        <div
          className="text-xs font-medium uppercase tracking-widest mt-0.5"
          style={{ color: "var(--muted)" }}
        >
          {primaryLabel}
        </div>
      </div>

      {/* Secondary metric */}
      {secondaryLabel && (
        <div
          className="text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {isActive && secondaryValue !== undefined
            ? `${typeof secondaryValue === "number" ? secondaryValue.toLocaleString() : secondaryValue} ${secondaryLabel}`
            : hint ?? "Not connected"}
        </div>
      )}

      {/* Hint for disconnected */}
      {!isActive && hint && status === "disconnected" && (
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          className="text-xs rounded px-2 py-1"
          style={{
            backgroundColor: "var(--bg)",
            color: "var(--danger, #ef4444)",
          }}
        >
          Error fetching data
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);

  // Per-platform data states
  const [pageInsights, setPageInsights] = useState<PageInsights | null>(null);
  const [fbStatus, setFbStatus] = useState<PlatformStatus>("loading");

  const [youtubeStats, setYoutubeStats] = useState<YouTubeStats | null>(null);
  const [ytStatus, setYtStatus] = useState<PlatformStatus>("loading");

  const [igStats, setIgStats] = useState<InstagramStats | null>(null);
  const [igStatus, setIgStatus] = useState<PlatformStatus>("loading");

  const [apifyData, setApifyData] = useState<ApifySocialData | null>(null);

  const [clientData, setClientData] = useState<Record<string, ClientData>>({});
  const [adsLoading, setAdsLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [globalLoading, setGlobalLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setGlobalLoading(true);
    setFbStatus("loading");
    setYtStatus("loading");
    setIgStatus("loading");
    setAdsLoading(true);

    const periodMap: Record<number, string> = {
      7: "last_7d",
      30: "last_30d",
      90: "last_90d",
    };
    const metaPeriod = periodMap[period];

    // Launch all fetches in parallel
    const [fbResult, ytResult, igResult, apifyResult, ...adsResults] =
      await Promise.allSettled([
        fetch(`/api/analytics/page-insights?days=${period}`).then((r) =>
          r.json()
        ),
        fetch(`/api/analytics/youtube`).then((r) => r.json()),
        fetch(`/api/analytics/instagram`).then((r) => r.json()),
        fetch(`/api/analytics/apify-social`).then((r) => r.json()),
        ...CLIENTS.map((c) =>
          fetch(`/api/ads?period=${metaPeriod}&accountId=${c.id}`).then((r) =>
            r.json()
          )
        ),
      ]);

    // Facebook
    if (fbResult.status === "fulfilled") {
      const d = fbResult.value;
      if (d.error) {
        setFbStatus("error");
      } else {
        setPageInsights(d);
        setFbStatus("connected");
      }
    } else {
      setFbStatus("error");
    }

    // YouTube
    if (ytResult.status === "fulfilled") {
      const d = ytResult.value;
      if (d.connected === false) {
        setYtStatus(d.error === "YOUTUBE_API_KEY not configured" ? "disconnected" : "error");
      } else {
        setYoutubeStats(d);
        setYtStatus("connected");
      }
    } else {
      setYtStatus("error");
    }

    // Instagram
    if (igResult.status === "fulfilled") {
      const d = igResult.value;
      if (d.connected === false) {
        setIgStatus("error");
      } else {
        setIgStats(d);
        setIgStatus("connected");
      }
    } else {
      setIgStatus("error");
    }

    // Apify social (TikTok, LinkedIn, and fallbacks for YT/IG)
    if (apifyResult.status === "fulfilled") {
      const d = apifyResult.value as ApifySocialData;
      setApifyData(d);

      // YouTube fallback: if YouTube Data API failed, use Apify data
      if (
        (ytResult.status === "rejected" ||
          (ytResult.status === "fulfilled" &&
            ytResult.value?.connected === false)) &&
        d.youtube?.connected
      ) {
        setYoutubeStats({
          subscribers: d.youtube.subscribers,
          totalViews: d.youtube.views,
          videoCount: d.youtube.videos,
          channelTitle: d.youtube.channelTitle,
          thumbnail: "",
          connected: true,
        });
        setYtStatus("connected");
      }

      // Instagram fallback: if Meta API errored, use Apify data
      if (
        (igResult.status === "rejected" ||
          (igResult.status === "fulfilled" &&
            igResult.value?.connected === false)) &&
        d.instagram?.connected
      ) {
        setIgStats({
          followers: d.instagram.followers,
          mediaCount: d.instagram.posts,
          username: d.instagram.username,
          profilePic: "",
          connected: true,
        });
        setIgStatus("connected");
      }
    }

    // Ads
    const clientResults: Record<string, ClientData> = {};
    for (let i = 0; i < CLIENTS.length; i++) {
      const result = adsResults[i];
      if (result.status === "fulfilled") {
        const d = result.value;
        clientResults[CLIENTS[i].id] = {
          spend: d.spend || 0,
          leads: d.leads || 0,
          cpl: d.cpl ?? null,
          ctr_all: d.ctr_all || 0,
          impressions: d.impressions || 0,
        };
      } else {
        clientResults[CLIENTS[i].id] = {
          spend: 0,
          leads: 0,
          cpl: null,
          ctr_all: 0,
          impressions: 0,
        };
      }
    }
    setClientData(clientResults);
    setAdsLoading(false);

    setLastUpdated(new Date());
    setGlobalLoading(false);
  }, [period]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const totalSpend = Object.values(clientData).reduce(
    (sum, c) => sum + c.spend,
    0
  );
  const totalLeads = Object.values(clientData).reduce(
    (sum, c) => sum + c.leads,
    0
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)" }}
          >
            SOCIAL ANALYTICS
          </p>
          <h1
            className="text-3xl font-serif"
            style={{ color: "var(--text)", fontWeight: 400 }}
          >
            Analytics Overview
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Last updated + refresh */}
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchAllData}
              disabled={globalLoading}
              className="text-xs px-3 py-1.5 rounded-xl border transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                cursor: globalLoading ? "not-allowed" : "pointer",
                opacity: globalLoading ? 0.5 : 1,
              }}
            >
              {globalLoading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {/* Period selector — only affects Facebook + Ads */}
          <div className="flex gap-2">
            {[
              { days: 7, label: "7d" },
              { days: 30, label: "30d" },
              { days: 90, label: "90d" },
            ].map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className="text-xs px-4 py-2 rounded-xl border transition-colors"
                style={{
                  backgroundColor:
                    period === p.days ? "var(--accent-bg)" : "var(--surface)",
                  borderColor:
                    period === p.days ? "var(--accent)" : "var(--border)",
                  color:
                    period === p.days
                      ? "var(--accent-text)"
                      : "var(--text-secondary)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Platform Overview Cards ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--muted)" }}
        >
          PLATFORM OVERVIEW
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Facebook */}
          <PlatformCard
            icon="📘"
            name="Facebook"
            status={fbStatus}
            primaryValue={pageInsights?.total_followers ?? 0}
            primaryLabel="Followers"
            secondaryValue={pageInsights?.engagement}
            secondaryLabel="engagements"
          />

          {/* Instagram */}
          <PlatformCard
            icon="📸"
            name="Instagram"
            status={igStatus}
            primaryValue={igStats?.followers ?? 0}
            primaryLabel="Followers"
            secondaryValue={igStats?.mediaCount}
            secondaryLabel="posts"
            hint={
              igStatus === "error"
                ? "@doctablamd · Check Instagram Business account link"
                : undefined
            }
          />

          {/* YouTube */}
          <PlatformCard
            icon="▶️"
            name="YouTube"
            status={ytStatus}
            primaryValue={youtubeStats?.subscribers ?? 0}
            primaryLabel="Subscribers"
            secondaryValue={youtubeStats?.videoCount}
            secondaryLabel="videos"
            hint={
              ytStatus === "disconnected"
                ? "@doctablademd · Add YOUTUBE_API_KEY to connect"
                : undefined
            }
          />

          {/* TikTok — @doctablademd */}
          <PlatformCard
            icon="🎵"
            name="TikTok"
            status={apifyData?.tiktok?.connected ? "connected" : "disconnected"}
            primaryValue={apifyData?.tiktok?.followers ?? "—"}
            primaryLabel="Followers"
            secondaryValue={apifyData?.tiktok?.likes}
            secondaryLabel={apifyData?.tiktok?.connected ? "likes" : undefined}
            hint={
              !apifyData?.tiktok?.connected
                ? "@doctablademd · Add APIFY_API_TOKEN to connect"
                : undefined
            }
          />

          {/* Twitter/X — @MekkatronFit */}
          <PlatformCard
            icon="𝕏"
            name="Twitter / X"
            status={apifyData?.twitter?.connected ? "connected" : "disconnected"}
            primaryValue={apifyData?.twitter?.followers ?? "—"}
            primaryLabel="Followers"
            secondaryValue={apifyData?.twitter?.tweets}
            secondaryLabel={apifyData?.twitter?.tweets ? `${apifyData.twitter.tweets} tweets` : undefined}
            hint={apifyData?.twitter?.connected ? `@${apifyData.twitter.username}${apifyData.twitter.verified ? " ✓" : ""}` : "Add TWITTER_BEARER_TOKEN to connect"}
          />

          {/* LinkedIn — emekaajufo */}
          <PlatformCard
            icon="💼"
            name="LinkedIn"
            status={apifyData?.linkedin?.connected ? "connected" : "disconnected"}
            primaryValue={apifyData?.linkedin?.followers ?? "—"}
            primaryLabel="Followers"
            secondaryValue={apifyData?.linkedin?.connections}
            secondaryLabel={apifyData?.linkedin?.connected ? "connections" : undefined}
            hint={
              !apifyData?.linkedin?.connected
                ? "in/emekaajufo · Add APIFY_API_TOKEN to connect"
                : undefined
            }
          />
        </div>
      </div>

      {/* ── Connected Platform Details ── */}
      {/* Facebook details */}
      {fbStatus === "connected" && pageInsights && (
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            FACEBOOK · {period} DAYS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard
              label="Impressions"
              value={pageInsights.impressions.toLocaleString()}
            />
            <KPICard
              label="Organic Reach"
              value={pageInsights.reach.toLocaleString()}
            />
            <KPICard
              label="Engagement"
              value={pageInsights.engagement.toLocaleString()}
            />
            <KPICard
              label="Follower Growth"
              value={`+${pageInsights.follower_growth.toLocaleString()}`}
            />
          </div>
        </div>
      )}

      {/* YouTube details */}
      {ytStatus === "connected" && youtubeStats && (
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            YOUTUBE · ALL TIME
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard
              label="Subscribers"
              value={youtubeStats.subscribers.toLocaleString()}
              highlight
            />
            <KPICard
              label="Total Views"
              value={youtubeStats.totalViews.toLocaleString()}
            />
            <KPICard
              label="Videos"
              value={youtubeStats.videoCount.toLocaleString()}
            />
          </div>
        </div>
      )}

      {/* Instagram details */}
      {igStatus === "connected" && igStats && (
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            INSTAGRAM · @{igStats.username || "account"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Followers"
              value={igStats.followers.toLocaleString()}
              highlight
            />
            <KPICard
              label="Posts"
              value={igStats.mediaCount.toLocaleString()}
            />
          </div>
        </div>
      )}

      {/* TikTok details */}
      {apifyData?.tiktok?.connected && (
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            TIKTOK · @{apifyData.tiktok.username}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <KPICard
              label="Followers"
              value={apifyData.tiktok.followers.toLocaleString()}
              highlight
            />
            <KPICard
              label="Total Likes"
              value={apifyData.tiktok.likes.toLocaleString()}
            />
            <KPICard
              label="Videos"
              value={apifyData.tiktok.videos.toLocaleString()}
            />
          </div>
        </div>
      )}

      {/* LinkedIn details */}
      {apifyData?.linkedin?.connected && (
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            LINKEDIN · {apifyData.linkedin.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              label="Followers"
              value={apifyData.linkedin.followers.toLocaleString()}
              highlight
            />
            <KPICard
              label="Connections"
              value={apifyData.linkedin.connections.toLocaleString()}
            />
          </div>
        </div>
      )}

      {/* ── Ad Performance ── */}
      <div className="card overflow-hidden">
        <div
          className="p-5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              META ADS · CLIENT BREAKDOWN · {period} DAYS
            </p>
            {!adsLoading && (
              <div className="flex gap-4">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Total Spend:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    ${totalSpend.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </strong>
                </span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Total Leads:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {totalLeads.toLocaleString()}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div
          className="px-5 py-2.5 grid grid-cols-6 gap-2 text-xs font-semibold uppercase tracking-wide border-b"
          style={{
            color: "var(--muted)",
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
          }}
        >
          <div className="col-span-2">Client</div>
          <div className="text-right">Spend</div>
          <div className="text-right">Leads</div>
          <div className="text-right">CPL</div>
          <div className="text-right">CTR</div>
        </div>

        <div
          className="divide-y"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {adsLoading
            ? CLIENTS.map((c) => (
                <div
                  key={c.id}
                  className="px-5 py-4 grid grid-cols-6 gap-2 animate-pulse"
                >
                  <div
                    className="col-span-2 h-4 rounded"
                    style={{ backgroundColor: "var(--bg)" }}
                  />
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 rounded"
                      style={{ backgroundColor: "var(--bg)" }}
                    />
                  ))}
                </div>
              ))
            : CLIENTS.map((client) => {
                const data = clientData[client.id];
                if (!data) return null;
                return (
                  <div
                    key={client.id}
                    className="px-5 py-3.5 grid grid-cols-6 gap-2 items-center"
                  >
                    <div className="col-span-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {client.name}
                      </span>
                    </div>
                    <div
                      className="text-right text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      $
                      {data.spend.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                    <div
                      className="text-right text-sm font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {data.leads}
                    </div>
                    <div
                      className="text-right text-sm font-medium"
                      style={{
                        color: !data.cpl
                          ? "var(--muted)"
                          : data.cpl < 10
                            ? "#059669"
                            : data.cpl > 20
                              ? "#b91c1c"
                              : "#d97706",
                      }}
                    >
                      {data.cpl ? `$${data.cpl.toFixed(2)}` : "—"}
                    </div>
                    <div
                      className="text-right text-sm"
                      style={{
                        color:
                          data.ctr_all > 2 ? "#059669" : "var(--text-secondary)",
                      }}
                    >
                      {data.ctr_all.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
