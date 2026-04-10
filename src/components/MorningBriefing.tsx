"use client";

import { useState, useEffect, useCallback } from "react";

interface BriefingData {
  briefing: string;
  generated_at: string;
  stats: {
    tasksToday: number;
    blocked: number;
    activeProjects: number;
  };
}

export function MorningBriefing() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing");
      if (!res.ok) throw new Error("Failed to fetch briefing");
      const json: BriefingData = await res.json();
      setData(json);
    } catch {
      setError("Could not load briefing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const formattedTime = data?.generated_at
    ? new Date(data.generated_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      style={{
        borderLeft: "3px solid var(--accent)",
        background: "var(--surface)",
        borderRadius: "6px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          Morning Briefing
        </span>
        <button
          onClick={fetchBriefing}
          disabled={loading}
          title="Refresh briefing"
          style={{
            background: "none",
            border: "none",
            cursor: loading ? "default" : "pointer",
            color: "var(--muted)",
            fontSize: "13px",
            padding: "2px 4px",
            borderRadius: "4px",
            lineHeight: 1,
            opacity: loading ? 0.4 : 1,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
          }}
        >
          ↻
        </button>
      </div>

      {/* Briefing text */}
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "1.55",
          color: loading ? "var(--muted)" : error ? "var(--danger)" : "var(--text)",
          minHeight: "20px",
        }}
      >
        {loading ? "..." : error ? error : data?.briefing}
      </p>

      {/* Stats row */}
      {!loading && !error && data && (
        <div
          style={{
            display: "flex",
            gap: "14px",
            paddingTop: "6px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <StatChip label="Due today" value={data.stats.tasksToday} />
          <StatChip label="Blocked" value={data.stats.blocked} highlight={data.stats.blocked > 0} />
          <StatChip label="Projects" value={data.stats.activeProjects} />
        </div>
      )}

      {/* Timestamp */}
      {formattedTime && !loading && (
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
          Generated at {formattedTime}
        </span>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <span
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: highlight ? "var(--warning)" : "var(--text)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: "10px", color: "var(--muted)", letterSpacing: "0.04em" }}>
        {label}
      </span>
    </div>
  );
}
