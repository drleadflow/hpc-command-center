"use client";

import { useState, useEffect } from "react";

type Zone = "flow" | "captive" | "menial" | "drudgery";

interface Task {
  id: string;
  name: string;
  zone: Zone;
}

interface ZoneConfig {
  id: Zone;
  label: string;
  axis: string;
  action: string;
  description: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
}

const ZONES: ZoneConfig[] = [
  {
    id: "captive",
    label: "CAPTIVE ZONE",
    axis: "High Impact / Low Ability",
    action: "DELEGATE to functional leaders",
    description: "These hold you captive. Highest ROI to delegate.",
    borderColor: "var(--danger)",
    badgeBg: "#fef2f2",
    badgeColor: "var(--danger)",
  },
  {
    id: "flow",
    label: "FLOW ZONE",
    axis: "High Impact / High Ability",
    action: "KEEP — This is your genius",
    description: "Spend 90% of your time here.",
    borderColor: "#10b981",
    badgeBg: "#f0fdf4",
    badgeColor: "#15803d",
  },
  {
    id: "drudgery",
    label: "DRUDGERY ZONE",
    axis: "Low Impact / Low Ability",
    action: "DELETE — Run 30-day stop test",
    description: "Stop doing these. See if anyone notices.",
    borderColor: "#6b7280",
    badgeBg: "#f9fafb",
    badgeColor: "#374151",
  },
  {
    id: "menial",
    label: "MENIAL ZONE",
    axis: "Low Impact / High Ability",
    action: "DELEGATE to existing team",
    description: "Don't hire new people for this.",
    borderColor: "#f59e0b",
    badgeBg: "#fffbeb",
    badgeColor: "#b45309",
  },
];

const ZONE_ORDER: Zone[] = ["captive", "flow", "drudgery", "menial"];

export default function DelegationPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("dlf-delegation-tasks");
      if (saved) return JSON.parse(saved) as Task[];
    } catch {
      // invalid or old data — fall back to empty
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [selectedZone, setSelectedZone] = useState<Zone>("flow");

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("dlf-delegation-tasks", JSON.stringify(tasks));
    } catch {
      // storage unavailable — silently ignore
    }
  }, [tasks]);

  function addTask() {
    if (!input.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), name: input.trim(), zone: selectedZone },
    ]);
    setInput("");
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTask();
  }

  const counts: Record<Zone, number> = {
    flow: tasks.filter((t) => t.zone === "flow").length,
    captive: tasks.filter((t) => t.zone === "captive").length,
    menial: tasks.filter((t) => t.zone === "menial").length,
    drudgery: tasks.filter((t) => t.zone === "drudgery").length,
  };

  const total = tasks.length;
  const flowPct = total > 0 ? Math.round((counts.flow / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent)" }}
        >
          DELEGATION FRAMEWORK
        </p>
        <h1
          className="text-4xl font-serif mb-2"
          style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}
        >
          Critical Task Matrix
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Plot everything you do. Goal: 90% in your Flow Zone.
        </p>
      </div>

      {/* Add Task Input */}
      <div className="card p-5">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--muted)" }}
        >
          Add a Task
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What task are you evaluating?"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value as Zone)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              minWidth: "160px",
            }}
          >
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
          <button
            onClick={addTask}
            disabled={!input.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-opacity"
            style={{
              backgroundColor: !input.trim() ? "var(--border)" : "var(--accent)",
              color: !input.trim() ? "var(--muted)" : "#ffffff",
              cursor: !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Zone Summary Bar */}
      {total > 0 && (
        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Flow:{" "}
              <strong style={{ color: "#10b981" }}>{counts.flow}</strong>
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Captive:{" "}
              <strong style={{ color: "var(--danger)" }}>{counts.captive}</strong>
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Menial:{" "}
              <strong style={{ color: "#f59e0b" }}>{counts.menial}</strong>
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Drudgery:{" "}
              <strong style={{ color: "#6b7280" }}>{counts.drudgery}</strong>
            </span>
            <span
              className="ml-auto text-xs font-semibold"
              style={{
                color: flowPct >= 90 ? "#15803d" : flowPct >= 60 ? "#b45309" : "var(--danger)",
              }}
            >
              {flowPct}% in Flow Zone
              {flowPct >= 90 ? " — On target" : " (Target: 90%)"}
            </span>
          </div>
          {/* Progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: "6px", backgroundColor: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${flowPct}%`,
                backgroundColor:
                  flowPct >= 90 ? "#10b981" : flowPct >= 60 ? "#f59e0b" : "var(--danger)",
              }}
            />
          </div>
        </div>
      )}

      {/* 2x2 Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ZONE_ORDER.map((zoneId) => {
          const zone = ZONES.find((z) => z.id === zoneId)!;
          const zoneTasks = tasks.filter((t) => t.zone === zoneId);
          return (
            <div
              key={zoneId}
              className="card p-5 flex flex-col"
              style={{
                border: `1px solid ${zone.borderColor}`,
                minHeight: "200px",
              }}
            >
              {/* Zone Header */}
              <div className="mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: zone.borderColor }}
                >
                  {zone.label}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {zone.axis}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-2 mb-4"
                style={{
                  backgroundColor: zone.badgeBg,
                  border: `1px solid ${zone.borderColor}22`,
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: zone.badgeColor }}
                >
                  {zone.action}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {zone.description}
                </p>
              </div>

              {/* Task List */}
              <div className="flex-1 space-y-1.5">
                {zoneTasks.length === 0 ? (
                  <p
                    className="text-xs italic"
                    style={{ color: "var(--border)" }}
                  >
                    No tasks here yet
                  </p>
                ) : (
                  zoneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{
                        backgroundColor: "var(--bg)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <p
                        className="text-xs flex-1 min-w-0 truncate pr-2"
                        style={{ color: "var(--text)" }}
                      >
                        {task.name}
                      </p>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
                        style={{
                          color: "var(--muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 10-80-10 Method Card */}
      <div
        className="card p-6"
        style={{ borderLeft: "3px solid var(--accent)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--accent)" }}
        >
          THE 10-80-10 METHOD
        </p>
        <div className="space-y-4">
          {[
            {
              pct: "First 10%",
              desc: "You provide vision, direction, and the playbook",
              color: "var(--accent)",
              bg: "var(--accent-bg)",
            },
            {
              pct: "Middle 80%",
              desc: "Your team executes independently",
              color: "var(--text-secondary)",
              bg: "var(--bg)",
            },
            {
              pct: "Final 10%",
              desc: "You review, polish, and provide feedback",
              color: "var(--accent)",
              bg: "var(--accent-bg)",
            },
          ].map(({ pct, desc, color, bg }) => (
            <div key={pct} className="flex items-center gap-4">
              <div
                className="rounded-xl px-3 py-2 text-center flex-shrink-0"
                style={{ backgroundColor: bg, minWidth: "90px" }}
              >
                <p
                  className="text-sm font-semibold font-serif"
                  style={{ color }}
                >
                  {pct}
                </p>
              </div>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
