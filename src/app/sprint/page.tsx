"use client";

import { useState, useEffect } from "react";

type MilestoneStatus = "DONE" | "IN PROGRESS" | "PENDING";

interface Milestone {
  label: string;
  status: MilestoneStatus;
}

// Default milestones — used only on first load. After that, localStorage is source of truth.
const DEFAULT_MILESTONES: Milestone[] = [
  { label: "Paperclip Agent Fleet", status: "DONE" },
  { label: "Slack Bridge", status: "DONE" },
  { label: "Telegram Bridge", status: "DONE" },
  { label: "Firecrawl Integration", status: "DONE" },
  { label: "Agent Fleet Dashboard", status: "DONE" },
  { label: "Speed Optimization (Sonnet)", status: "DONE" },
  { label: "Railway Deployment", status: "DONE" },
  { label: "Outreach OS (Airtable)", status: "DONE" },
  { label: "Content OS Superpowers", status: "IN PROGRESS" },
  { label: "Ad Creative Lab", status: "IN PROGRESS" },
  { label: "Pipeline Dashboard", status: "IN PROGRESS" },
  { label: "Supabase Migration", status: "IN PROGRESS" },
  { label: "Landing Page Builder", status: "PENDING" },
  { label: "Client Onboarding Wizard", status: "PENDING" },
  { label: "Spark Intelligence", status: "PENDING" },
  { label: "Agent SDK on Modal", status: "PENDING" },
  { label: "n8n Workflows", status: "PENDING" },
  { label: "Auth", status: "PENDING" },
];

const STORAGE_KEY = "blade-sprint-milestones";
const SPRINT_NAME = "DLF Autonomous Operations Sprint";
const DEADLINE = new Date("2026-05-01T00:00:00");

const STATUS_CYCLE: MilestoneStatus[] = ["PENDING", "IN PROGRESS", "DONE"];

function loadMilestones(): Milestone[] {
  if (typeof window === "undefined") return DEFAULT_MILESTONES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Milestone[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* corrupted storage — reset */ }
  return DEFAULT_MILESTONES;
}

function saveMilestones(milestones: Milestone[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
  } catch { /* storage full — silently fail */ }
}

function daysRemaining(): number {
  const now = new Date();
  const diff = DEADLINE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function statusBadge(status: MilestoneStatus) {
  const styles: Record<MilestoneStatus, { bg: string; color: string; label: string }> = {
    DONE: { bg: "#d1fae5", color: "#065f46", label: "Done" },
    "IN PROGRESS": { bg: "#fef3c7", color: "#92400e", label: "In Progress" },
    PENDING: { bg: "var(--bg)", color: "var(--muted)", label: "Pending" },
  };
  const s = styles[status];
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function statusIcon(status: MilestoneStatus) {
  if (status === "DONE") return <span style={{ color: "#059669", fontSize: "16px" }}>✓</span>;
  if (status === "IN PROGRESS") return <span style={{ color: "#d97706", fontSize: "14px" }}>◉</span>;
  return <span style={{ color: "var(--border)", fontSize: "14px" }}>○</span>;
}

export default function SprintPage() {
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMilestones(loadMilestones());
    setMounted(true);
  }, []);

  function cycleStatus(idx: number) {
    const updated = milestones.map((m, i) => {
      if (i !== idx) return m;
      const currentIdx = STATUS_CYCLE.indexOf(m.status);
      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
      return { ...m, status: nextStatus };
    });
    setMilestones(updated);
    saveMilestones(updated);
  }

  function resetToDefaults() {
    setMilestones(DEFAULT_MILESTONES);
    saveMilestones(DEFAULT_MILESTONES);
  }

  const done = milestones.filter(m => m.status === "DONE").length;
  const inProgress = milestones.filter(m => m.status === "IN PROGRESS").length;
  const pending = milestones.filter(m => m.status === "PENDING").length;
  const total = milestones.length;
  const pct = Math.round((done / total) * 100);
  const days = daysRemaining();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          OPERATIONS
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Sprint Tracker
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{SPRINT_NAME}</p>
      </div>

      {/* Sprint meta */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl font-serif mb-1" style={{ color: "var(--text)", fontWeight: 300 }}>{pct}%</div>
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Complete</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-serif mb-1" style={{ color: "#059669", fontWeight: 300 }}>{done}</div>
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Done</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-serif mb-1" style={{ color: "#d97706", fontWeight: 300 }}>{inProgress}</div>
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>In Progress</div>
        </div>
        <div className="card p-5 text-center">
          <div
            className="text-3xl font-serif mb-1"
            style={{ color: days <= 7 ? "#b91c1c" : days <= 14 ? "#d97706" : "var(--text)", fontWeight: 300 }}
          >
            {days}
          </div>
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>Days Left</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>May 1, 2026</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            OVERALL PROGRESS
          </p>
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {done} / {total} milestones
          </span>
        </div>
        <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--accent), #10b981)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: "var(--muted)" }}>
          <span>0%</span>
          <span>{pct}% complete</span>
          <span>100%</span>
        </div>
      </div>

      {/* Milestone checklist — click to cycle status */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            MILESTONES ({total} total)
          </p>
          {mounted && (
            <button
              onClick={resetToDefaults}
              className="text-xs px-2 py-1 rounded"
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              Reset
            </button>
          )}
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {milestones.map((m, idx) => (
            <button
              key={m.label}
              onClick={() => cycleStatus(idx)}
              className="flex items-center gap-4 px-5 py-3.5 w-full text-left hover:bg-[var(--bg)] transition-colors"
              style={{
                opacity: m.status === "PENDING" ? 0.65 : 1,
              }}
            >
              <span className="shrink-0 w-5 text-center">{statusIcon(m.status)}</span>
              <span
                className="flex-1 text-sm"
                style={{
                  color: "var(--text)",
                  textDecoration: m.status === "DONE" ? "line-through" : "none",
                  textDecorationColor: "var(--muted)",
                }}
              >
                {m.label}
              </span>
              {statusBadge(m.status)}
              <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                {String(idx + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span style={{ color: "#059669" }}>✓</span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{done} done</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#d97706", fontSize: "12px" }}>◉</span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{inProgress} in progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--border)", fontSize: "12px" }}>○</span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{pending} pending</span>
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Click a milestone to cycle its status
        </div>
      </div>
    </div>
  );
}
