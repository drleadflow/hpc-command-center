"use client";

import { useState, useMemo, useEffect, useRef } from "react";

type Status = "green" | "yellow" | "red" | null;
type Trend = "up" | "down" | "flat";

interface Metric {
  id: string;
  name: string;
  owner: string;
  target: string;
  current: string;
  status: Status;
  trend: Trend;
}

interface Department {
  id: string;
  label: string;
  color: string;
  metrics: Metric[];
}

const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "growth",
    label: "Growth Engine",
    color: "#f59e0b",
    metrics: [
      { id: "leads_gen", name: "Leads Generated", owner: "Marketing", target: "200/wk", current: "0", status: null, trend: "flat" },
      { id: "cpl", name: "Cost Per Lead", owner: "Marketing", target: "<$35", current: "$0", status: null, trend: "flat" },
      { id: "discovery_calls", name: "Discovery Calls Booked", owner: "Sales Ops", target: "15/wk", current: "0", status: null, trend: "flat" },
      { id: "show_rate", name: "Show Rate", owner: "Sales Ops", target: "80%", current: "0%", status: null, trend: "flat" },
      { id: "close_rate", name: "Close Rate", owner: "CEO", target: "30%", current: "0%", status: null, trend: "flat" },
    ],
  },
  {
    id: "fulfillment",
    label: "Fulfillment Engine",
    color: "#10b981",
    metrics: [
      { id: "onboarding_time", name: "Client Onboarding Time", owner: "Client Success", target: "<48hrs", current: "0", status: null, trend: "flat" },
      { id: "campaign_health", name: "Active Campaign Health", owner: "Marketing", target: "90%+ green", current: "0%", status: null, trend: "flat" },
      { id: "response_time", name: "Client Response Time", owner: "Client Success", target: "<4hrs", current: "0", status: null, trend: "flat" },
      { id: "report_delivery", name: "Weekly Report Delivery", owner: "Client Success", target: "100%", current: "0%", status: null, trend: "flat" },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    color: "#6366f1",
    metrics: [
      { id: "mrr", name: "Monthly Recurring Revenue", owner: "CEO", target: "$30,000", current: "$0", status: null, trend: "flat" },
      { id: "runway", name: "Cash Runway (months)", owner: "CEO", target: "6+", current: "0", status: null, trend: "flat" },
      { id: "churn", name: "Client Churn Rate", owner: "Client Success", target: "<5%", current: "0%", status: null, trend: "flat" },
    ],
  },
  {
    id: "content",
    label: "Content & Brand",
    color: "#ec4899",
    metrics: [
      { id: "content_published", name: "Content Pieces Published", owner: "Media", target: "5/wk", current: "0", status: null, trend: "flat" },
      { id: "engagement_rate", name: "Engagement Rate", owner: "Media", target: ">3%", current: "0%", status: null, trend: "flat" },
    ],
  },
];

const STATUS_COLORS: Record<NonNullable<Status>, string> = {
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
};

const STATUS_LABELS: Record<NonNullable<Status>, string> = {
  green: "On Track",
  yellow: "Behind — Has Plan",
  red: "Behind — No Plan",
};

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === "up") return <span style={{ color: "#10b981", fontSize: "16px" }}>↑</span>;
  if (trend === "down") return <span style={{ color: "#ef4444", fontSize: "16px" }}>↓</span>;
  return <span style={{ color: "var(--muted)", fontSize: "16px" }}>→</span>;
}

function StatusCircles({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  const statuses: NonNullable<Status>[] = ["green", "yellow", "red"];
  return (
    <div className="flex items-center gap-2">
      {statuses.map((s) => {
        const isActive = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(isActive ? null : s)}
            title={STATUS_LABELS[s]}
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: STATUS_COLORS[s],
              border: isActive ? `3px solid ${STATUS_COLORS[s]}` : "2px solid transparent",
              outline: isActive ? `2px solid ${STATUS_COLORS[s]}` : "2px solid var(--border)",
              outlineOffset: "2px",
              opacity: value !== null && !isActive ? 0.3 : 1,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isActive ? `0 0 8px ${STATUS_COLORS[s]}66` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function getISOWeekKey(offset: number): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  const year = monday.getFullYear();
  // ISO week number calculation
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((monday.getTime() - startOfYear.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `dlf-scorecard-${year}-W${String(weekNum).padStart(2, "0")}`;
}

function getWeekLabel(offset: number): string {
  const now = new Date();
  // Find Monday of current week
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + offset * 7);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ScorecardPage() {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [weekOffset, setWeekOffset] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekLabel = `Week of ${getWeekLabel(weekOffset)}`;
  const storageKey = getISOWeekKey(weekOffset);
  const isInitialMount = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data: fetch from API first, fall back to localStorage if API fails
  useEffect(() => {
    setLoading(true);
    isInitialMount.current = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/scorecard?weekKey=${encodeURIComponent(storageKey)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
            if (data.lastSaved) setLastSaved(new Date(data.lastSaved));
            else setLastSaved(null);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API failed — fall through to localStorage
      }

      // Fallback: try localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.departments) {
            setDepartments(parsed.departments);
          }
          if (parsed.lastSaved) {
            setLastSaved(new Date(parsed.lastSaved));
          } else {
            setLastSaved(null);
          }
        } else {
          setDepartments(INITIAL_DEPARTMENTS);
          setLastSaved(null);
        }
      } catch {
        setDepartments(INITIAL_DEPARTMENTS);
        setLastSaved(null);
      }

      setLoading(false);
    }

    loadData();
  }, [storageKey]);

  // Debounced auto-save to API whenever departments change (skip first render after week switch)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (loading) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const payload = {
        departments,
        lastSaved: lastSaved ? lastSaved.toISOString() : null,
      };
      try {
        await fetch(`/api/scorecard?weekKey=${encodeURIComponent(storageKey)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // API save failed — fall back to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
          // localStorage unavailable — silently skip
        }
      }
    }, 1000);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [departments, storageKey, loading]);

  // Flatten all metrics for summary counts
  const allMetrics = useMemo(() => departments.flatMap((d) => d.metrics), [departments]);
  const greenCount = allMetrics.filter((m) => m.status === "green").length;
  const yellowCount = allMetrics.filter((m) => m.status === "yellow").length;
  const redCount = allMetrics.filter((m) => m.status === "red").length;
  const totalSet = greenCount + yellowCount + redCount;

  const overallHealth: { label: string; color: string } = (() => {
    if (totalSet === 0) return { label: "Not Yet Set", color: "var(--muted)" };
    if (redCount > 0 && redCount >= greenCount) return { label: "Needs Attention", color: "#ef4444" };
    if (yellowCount > 0 && yellowCount >= greenCount) return { label: "Caution", color: "#f59e0b" };
    return { label: "Healthy", color: "#10b981" };
  })();

  function updateMetricStatus(deptId: string, metricId: string, status: Status) {
    setDepartments((prev) =>
      prev.map((dept) => {
        if (dept.id !== deptId) return dept;
        return {
          ...dept,
          metrics: dept.metrics.map((m) => (m.id === metricId ? { ...m, status } : m)),
        };
      })
    );
  }

  function updateMetricCurrent(deptId: string, metricId: string, current: string) {
    setDepartments((prev) =>
      prev.map((dept) => {
        if (dept.id !== deptId) return dept;
        return {
          ...dept,
          metrics: dept.metrics.map((m) => (m.id === metricId ? { ...m, current } : m)),
        };
      })
    );
  }

  function updateMetricTrend(deptId: string, metricId: string, trend: Trend) {
    setDepartments((prev) =>
      prev.map((dept) => {
        if (dept.id !== deptId) return dept;
        return {
          ...dept,
          metrics: dept.metrics.map((m) => (m.id === metricId ? { ...m, trend } : m)),
        };
      })
    );
  }

  async function handleSave() {
    const now = new Date();
    setLastSaved(now);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);

    const payload = {
      departments,
      lastSaved: now.toISOString(),
    };

    try {
      await fetch(`/api/scorecard?weekKey=${encodeURIComponent(storageKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Fall back to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // localStorage unavailable — silently skip
      }
    }
  }

  return (
    <div className="space-y-8" style={{ maxWidth: "1100px" }}>
      {/* Toast */}
      {toastVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid #10b981",
            borderRadius: "10px",
            padding: "14px 20px",
            zIndex: 9999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            color: "var(--text)",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Snapshot saved — {lastSaved?.toLocaleTimeString()}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            SCALABLE OPERATING SYSTEM
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}>
            Weekly Scorecard
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Manual entry forces ownership. No scorecard, no meeting.
          </p>
        </div>

        {/* Week Selector */}
        <div
          className="flex items-center gap-3 card px-4 py-3"
          style={{ background: "var(--surface)", borderRadius: "12px", height: "fit-content" }}
        >
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "var(--text)",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--text)", minWidth: "170px", textAlign: "center" }}>
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "var(--text)",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          className="card p-8"
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            Loading scorecard...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary Bar */}
          <div
            className="card p-5"
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Overall Health */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                    Overall Health
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: overallHealth.color,
                      }}
                    />
                    <span className="font-medium text-sm" style={{ color: overallHealth.color }}>
                      {overallHealth.label}
                    </span>
                  </div>
                </div>

                <div style={{ width: "1px", height: "40px", background: "var(--border)" }} />

                {/* Status Counts */}
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <div className="text-2xl font-serif" style={{ color: "#10b981", fontWeight: 300 }}>
                      {greenCount}
                    </div>
                    <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Green</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif" style={{ color: "#f59e0b", fontWeight: 300 }}>
                      {yellowCount}
                    </div>
                    <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Yellow</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif" style={{ color: "#ef4444", fontWeight: 300 }}>
                      {redCount}
                    </div>
                    <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Red</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif" style={{ color: "var(--muted)", fontWeight: 300 }}>
                      {allMetrics.length - totalSet}
                    </div>
                    <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>Unset</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {lastSaved && (
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Last updated: {lastSaved.toLocaleString()}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    letterSpacing: "0.03em",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Save Snapshot
                </button>
              </div>
            </div>
          </div>

          {/* Scorecard Grid — Desktop Table */}
          <div className="space-y-6">
            {departments.map((dept) => (
              <div key={dept.id} className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
                {/* Department Header */}
                <div
                  className="px-6 py-4 flex items-center gap-3"
                  style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: dept.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: dept.color }}
                  >
                    {dept.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--muted)", marginLeft: "auto" }}
                  >
                    {dept.metrics.filter((m) => m.status !== null).length} / {dept.metrics.length} set
                  </span>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        {["Metric", "Owner", "Target", "Current", "Status", "Trend"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 20px",
                              textAlign: "left",
                              fontSize: "10px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "var(--muted)",
                              background: "var(--bg)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dept.metrics.map((metric, idx) => (
                        <tr
                          key={metric.id}
                          style={{
                            background: idx % 2 === 0 ? "var(--surface)" : "var(--bg)",
                            borderBottom: "1px solid var(--border-subtle)",
                            transition: "background 0.1s",
                          }}
                        >
                          {/* Metric Name */}
                          <td style={{ padding: "14px 20px" }}>
                            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                              {metric.name}
                            </span>
                          </td>

                          {/* Owner */}
                          <td style={{ padding: "14px 20px" }}>
                            <span
                              className="text-xs font-medium"
                              style={{
                                color: "var(--text-secondary)",
                                background: "var(--accent-bg)",
                                padding: "3px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {metric.owner}
                            </span>
                          </td>

                          {/* Target */}
                          <td style={{ padding: "14px 20px" }}>
                            <span className="text-sm font-mono" style={{ color: "var(--muted)" }}>
                              {metric.target}
                            </span>
                          </td>

                          {/* Current (editable) */}
                          <td style={{ padding: "14px 20px" }}>
                            <input
                              type="text"
                              value={metric.current}
                              onChange={(e) => updateMetricCurrent(dept.id, metric.id, e.target.value)}
                              style={{
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                fontSize: "13px",
                                color: "var(--text)",
                                width: "90px",
                                outline: "none",
                                fontFamily: "var(--font-mono, monospace)",
                              }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                          </td>

                          {/* Status */}
                          <td style={{ padding: "14px 20px" }}>
                            <StatusCircles
                              value={metric.status}
                              onChange={(s) => updateMetricStatus(dept.id, metric.id, s)}
                            />
                          </td>

                          {/* Trend */}
                          <td style={{ padding: "14px 20px" }}>
                            <div className="flex items-center gap-1">
                              {(["up", "flat", "down"] as Trend[]).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => updateMetricTrend(dept.id, metric.id, t)}
                                  title={t}
                                  style={{
                                    background: metric.trend === t ? "var(--accent-bg)" : "transparent",
                                    border: "1px solid",
                                    borderColor: metric.trend === t ? "var(--accent)" : "var(--border)",
                                    borderRadius: "6px",
                                    width: "28px",
                                    height: "28px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "13px",
                                    color:
                                      t === "up"
                                        ? "#10b981"
                                        : t === "down"
                                        ? "#ef4444"
                                        : "var(--muted)",
                                  }}
                                >
                                  {t === "up" ? "↑" : t === "down" ? "↓" : "→"}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {dept.metrics.map((metric, idx) => (
                    <div
                      key={metric.id}
                      className="p-5 space-y-4"
                      style={{ background: idx % 2 === 0 ? "var(--surface)" : "var(--bg)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                            {metric.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            {metric.owner} · Target: {metric.target}
                          </p>
                        </div>
                        <TrendArrow trend={metric.trend} />
                      </div>

                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                            Current
                          </label>
                          <input
                            type="text"
                            value={metric.current}
                            onChange={(e) => updateMetricCurrent(dept.id, metric.id, e.target.value)}
                            style={{
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              fontSize: "13px",
                              color: "var(--text)",
                              width: "90px",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                            Status
                          </label>
                          <StatusCircles
                            value={metric.status}
                            onChange={(s) => updateMetricStatus(dept.id, metric.id, s)}
                          />
                        </div>
                      </div>

                      {/* Trend Buttons on Mobile */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                          Trend
                        </label>
                        {(["up", "flat", "down"] as Trend[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => updateMetricTrend(dept.id, metric.id, t)}
                            style={{
                              background: metric.trend === t ? "var(--accent-bg)" : "transparent",
                              border: "1px solid",
                              borderColor: metric.trend === t ? "var(--accent)" : "var(--border)",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              color:
                                t === "up" ? "#10b981" : t === "down" ? "#ef4444" : "var(--muted)",
                            }}
                          >
                            {t === "up" ? "↑" : t === "down" ? "↓" : "→"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Meeting Rules */}
          <div
            className="card p-6"
            style={{
              background: "var(--surface)",
              borderRadius: "16px",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent)" }}>
              Meeting Rules — Ryan Deiss
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { num: "01", rule: "No agenda, no meeting." },
                { num: "02", rule: "No outcome needed, no meeting." },
                { num: "03", rule: "No decision-maker present, no meeting." },
                { num: "04", rule: "No scorecard, no meeting." },
              ].map(({ num, rule }) => (
                <div key={num} className="flex items-start gap-3">
                  <span
                    className="font-serif text-lg"
                    style={{ color: "var(--accent)", fontWeight: 300, lineHeight: "1.4", flexShrink: 0 }}
                  >
                    {num}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
