"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UptimeMonitor {
  id: number;
  friendly_name: string;
  status: number;
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

function getStatusColor(status: number): string {
  switch (status) {
    case 2:
      return STATUS_COLORS.up;
    case 8:
      return STATUS_COLORS.degraded;
    case 9:
      return STATUS_COLORS.down;
    case 0:
      return STATUS_COLORS.paused;
    default:
      return STATUS_COLORS.paused;
  }
}

export function UptimePanel() {
  const [data, setData] = useState<UptimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/uptime")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const monitors = data?.monitors || [];
  const allUp = monitors.length > 0 && monitors.every((m) => m.status === 2);

  return (
    <div className="card p-5" style={{ borderRadius: "20px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: allUp ? STATUS_COLORS.up : STATUS_COLORS.down }}
          />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Uptime Status
          </h3>
        </div>
        <Link
          href="/uptime"
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{
            backgroundColor: "var(--accent-bg)",
            color: "var(--accent-text)",
          }}
        >
          View All
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--border)" }} />
              <div className="h-3 rounded w-24" style={{ backgroundColor: "var(--border)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Monitor List */}
      {!loading && monitors.length > 0 && (
        <div className="space-y-2">
          {monitors.map((monitor) => (
            <div
              key={monitor.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "var(--bg)" }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getStatusColor(monitor.status) }}
              />
              <span
                className="text-sm truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {monitor.friendly_name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && monitors.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
          No monitors configured
        </p>
      )}
    </div>
  );
}
