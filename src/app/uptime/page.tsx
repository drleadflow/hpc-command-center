"use client";

import { useEffect, useState } from "react";

interface UptimeMonitor {
  id: number;
  friendly_name: string;
  url: string;
  status: number;
  custom_uptime_ratio: string;
  average_response_time: number;
}

interface UptimeData {
  monitors: UptimeMonitor[];
  lastChecked: string;
}

const STATUS_COLORS = {
  up: "#10b981",
  down: "#ef4444",
  degraded: "#f59e0b",
  paused: "#6b7280",
};

function getStatusInfo(status: number): { label: string; color: string; dotColor: string } {
  switch (status) {
    case 2:
      return { label: "Up", color: STATUS_COLORS.up, dotColor: STATUS_COLORS.up };
    case 8:
      return { label: "Seems Down", color: STATUS_COLORS.degraded, dotColor: STATUS_COLORS.degraded };
    case 9:
      return { label: "Down", color: STATUS_COLORS.down, dotColor: STATUS_COLORS.down };
    case 0:
      return { label: "Paused", color: STATUS_COLORS.paused, dotColor: STATUS_COLORS.paused };
    default:
      return { label: "Unknown", color: STATUS_COLORS.paused, dotColor: STATUS_COLORS.paused };
  }
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function UptimePage() {
  const [data, setData] = useState<UptimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/uptime");
      const json = await res.json();
      if (json.error && !json.monitors?.length) {
        setError(json.error);
      } else {
        setData(json);
        setError(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const monitors = data?.monitors || [];
  const totalMonitors = monitors.length;
  const upCount = monitors.filter((m) => m.status === 2).length;
  const downCount = monitors.filter((m) => m.status === 9 || m.status === 8).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          INFRASTRUCTURE
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Uptime Monitor
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {data?.lastChecked
            ? `Last checked at ${formatTime(data.lastChecked)} · Auto-refreshes every 60s`
            : "Loading..."}
        </p>
      </div>

      {/* Stats Row */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div
            className="text-center p-4 rounded-2xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-2xl font-serif mb-1" style={{ fontWeight: 300, color: "var(--text)" }}>
              {totalMonitors}
            </div>
            <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Total Monitors
            </div>
          </div>
          <div
            className="text-center p-4 rounded-2xl"
            style={{ backgroundColor: "var(--accent-bg)" }}
          >
            <div className="text-2xl font-serif mb-1" style={{ fontWeight: 300, color: STATUS_COLORS.up }}>
              {upCount}
            </div>
            <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              All Up
            </div>
          </div>
          <div
            className="text-center p-4 rounded-2xl"
            style={{
              backgroundColor: downCount > 0 ? "#fef2f2" : "var(--surface)",
              border: downCount > 0 ? `1px solid ${STATUS_COLORS.down}` : "1px solid var(--border)",
            }}
          >
            <div
              className="text-2xl font-serif mb-1"
              style={{ fontWeight: 300, color: downCount > 0 ? STATUS_COLORS.down : "var(--text)" }}
            >
              {downCount}
            </div>
            <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Down
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card p-5 animate-pulse"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px" }}
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" style={{ backgroundColor: "var(--border)" }} />
              <div className="h-3 bg-gray-200 rounded w-1/2" style={{ backgroundColor: "var(--border)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className="p-5 rounded-2xl text-center"
          style={{ backgroundColor: "#fef2f2", border: `1px solid ${STATUS_COLORS.down}` }}
        >
          <p style={{ color: STATUS_COLORS.down }}>Failed to load uptime data: {error}</p>
        </div>
      )}

      {/* Monitor Cards Grid */}
      {!loading && !error && monitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monitors.map((monitor) => {
            const statusInfo = getStatusInfo(monitor.status);
            const uptimeRatios = monitor.custom_uptime_ratio.split("-").map((r) => parseFloat(r));
            const [uptime1d, uptime7d, uptime30d] = uptimeRatios;

            return (
              <div
                key={monitor.id}
                className="p-5"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                }}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusInfo.dotColor }}
                    />
                    <div>
                      <h3 className="font-medium" style={{ color: "var(--text)" }}>
                        {monitor.friendly_name}
                      </h3>
                      <p
                        className="text-xs truncate max-w-[200px]"
                        style={{ color: "var(--muted)" }}
                        title={monitor.url}
                      >
                        {monitor.url}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor:
                        monitor.status === 2
                          ? "var(--accent-bg)"
                          : monitor.status === 9 || monitor.status === 8
                          ? "#fef2f2"
                          : "var(--bg)",
                      color: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Uptime Stats */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "var(--bg)" }}>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {uptime1d?.toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      1d
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "var(--bg)" }}>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {uptime7d?.toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      7d
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "var(--bg)" }}>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {uptime30d?.toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      30d
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ backgroundColor: "var(--bg)" }}>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {monitor.average_response_time}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      ms
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && monitors.length === 0 && (
        <div
          className="p-8 rounded-2xl text-center"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p style={{ color: "var(--muted)" }}>No monitors configured in UptimeRobot.</p>
        </div>
      )}
    </div>
  );
}
