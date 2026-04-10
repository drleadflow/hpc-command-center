"use client";

import { useState, useEffect } from "react";

type Agent = {
  id: string;
  name: string;
  title?: string;
  status: "running" | "idle" | "error" | string;
  lastHeartbeat?: string;
  budgetUsed?: number;
  budgetTotal?: number;
  icon?: string;
};

type DashboardStats = {
  totalAgents?: number;
  runningCount?: number;
  monthlySpend?: number;
  pendingApprovals?: number;
};

function statusDot(status: string) {
  if (status === "running") return "#059669";
  if (status === "error") return "#b91c1c";
  return "var(--muted)";
}

function statusLabel(status: string) {
  if (status === "running") return "Running";
  if (status === "error") return "Error";
  return "Idle";
}

function formatHeartbeat(ts?: string) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  } catch {
    return ts;
  }
}

function BudgetBar({ used, total }: { used?: number; total?: number }) {
  if (!total || total === 0) return <span className="themed-muted text-xs">—</span>;
  const pct = Math.min(100, Math.round(((used || 0) / total) * 100));
  const color = pct >= 90 ? "#b91c1c" : pct >= 70 ? "#d97706" : "#059669";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
        <span>${(used || 0).toFixed(0)} used</span>
        <span>${total.toFixed(0)} total</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [wakingUp, setWakingUp] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setOffline(false);

    try {
      const [agentsRes, dashRes] = await Promise.all([
        fetch("/api/agents?endpoint=agents"),
        fetch("/api/agents?endpoint=dashboard"),
      ]);

      if (!agentsRes.ok && !dashRes.ok) {
        setOffline(true);
        setLoading(false);
        return;
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        const list = Array.isArray(agentsData)
          ? agentsData
          : agentsData.agents || agentsData.data || [];
        setAgents(list);
      }

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboard(dashData?.stats || dashData || {});
      }
    } catch {
      setOffline(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleWake = async (agentId: string, agentName: string) => {
    setWakingUp(agentId);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        setToast(`Waking up ${agentName}...`);
        setAgents((prev) =>
          prev.map((a) => (a.id === agentId ? { ...a, status: "running" } : a))
        );
      } else {
        setToast(`Failed to wake ${agentName}`);
      }
    } catch {
      setToast("Network error");
    }
    setWakingUp(null);
    setTimeout(() => setToast(null), 4000);
  };

  const runningCount = agents.filter((a) => a.status === "running").length;
  const totalCount = agents.length;

  return (
    <div className="space-y-8">
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium card"
          style={{ color: "var(--text)" }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)" }}
          >
            PAPERCLIP
          </p>
          <h1
            className="text-3xl font-serif"
            style={{ color: "var(--text)", fontWeight: 400 }}
          >
            Agent Fleet
          </h1>
        </div>
        <button
          onClick={load}
          className="text-xs px-4 py-2 rounded-xl border transition-colors"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Fleet Offline */}
      {!loading && offline && (
        <div
          className="card p-10 text-center rounded-2xl"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">⚡</div>
          <p
            className="text-lg font-medium mb-2"
            style={{ color: "var(--text)" }}
          >
            Fleet Offline
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Paperclip is unreachable at localhost:3100. Start the service to
            connect your agent fleet.
          </p>
          <button
            onClick={load}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 h-24 animate-pulse"
                style={{ backgroundColor: "var(--surface)" }}
              />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 h-20 animate-pulse"
                style={{ backgroundColor: "var(--surface)" }}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && !offline && (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Agents",
                value: dashboard.totalAgents ?? totalCount,
                highlight: false,
              },
              {
                label: "Running Now",
                value: dashboard.runningCount ?? runningCount,
                highlight: true,
              },
              {
                label: "Monthly Spend",
                value: dashboard.monthlySpend != null
                  ? `$${Number(dashboard.monthlySpend).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : "—",
                highlight: false,
              },
              {
                label: "Pending Approvals",
                value: dashboard.pendingApprovals ?? "—",
                highlight: false,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: stat.highlight
                    ? "var(--accent-bg)"
                    : "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-2xl font-serif mb-1"
                  style={{
                    color: stat.highlight ? "var(--accent-text)" : "var(--text)",
                    fontWeight: 300,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Agent Cards */}
          {agents.length === 0 ? (
            <div
              className="card p-10 text-center rounded-2xl"
              style={{ color: "var(--muted)" }}
            >
              <p className="text-sm">No agents found in this fleet.</p>
            </div>
          ) : (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--muted)" }}
              >
                AGENTS ({agents.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="card rounded-2xl p-5 flex flex-col gap-4"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {agent.icon ? (
                          <span className="text-2xl shrink-0">{agent.icon}</span>
                        ) : (
                          <div
                            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-semibold text-white"
                            style={{ backgroundColor: "var(--accent)" }}
                          >
                            {agent.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text)" }}
                          >
                            {agent.name}
                          </p>
                          {agent.title && (
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--muted)" }}
                            >
                              {agent.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: statusDot(agent.status) }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: statusDot(agent.status) }}
                        >
                          {statusLabel(agent.status)}
                        </span>
                      </div>
                    </div>

                    {/* Budget bar */}
                    <BudgetBar
                      used={agent.budgetUsed}
                      total={agent.budgetTotal}
                    />

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        Last seen:{" "}
                        <span style={{ color: "var(--text-secondary)" }}>
                          {formatHeartbeat(agent.lastHeartbeat)}
                        </span>
                      </p>

                      <button
                        onClick={() => handleWake(agent.id, agent.name)}
                        disabled={wakingUp === agent.id || agent.status === "running"}
                        className="text-xs px-4 py-1.5 rounded-xl border transition-all font-medium disabled:opacity-40"
                        style={{
                          backgroundColor:
                            agent.status === "running"
                              ? "var(--bg)"
                              : "var(--accent-bg)",
                          borderColor:
                            agent.status === "running"
                              ? "var(--border)"
                              : "var(--accent)",
                          color:
                            agent.status === "running"
                              ? "var(--muted)"
                              : "var(--accent-text)",
                        }}
                      >
                        {wakingUp === agent.id
                          ? "Waking..."
                          : agent.status === "running"
                          ? "Active"
                          : "Wake"}
                      </button>
                    </div>
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
