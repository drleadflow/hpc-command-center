"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type ZoneType = "Flow" | "Captive" | "Menial" | "Drudgery";
type TimerState = "idle" | "running" | "paused" | "done";

interface TimeBlock {
  id: string;
  name: string;
  description: string;
  hourStart: number; // 24h
  hourEnd: number;
  activities: string[];
  color: string;
}

interface ZoneLog {
  zone: ZoneType;
  timestamp: number;
}

interface CompletedSession {
  label: string;
  durationSeconds: number;
  completedAt: number; // unix ms
}

interface TodayZoneData {
  date: string; // "YYYY-MM-DD"
  logs: ZoneLog[];
}

// ── localStorage helpers ────────────────────────────────────────────────────

const LS_SESSIONS = "dlf-focus-sessions";
const LS_TODAY = "dlf-focus-today"; // stores today's zone logs with date stamp; key "dlf-focus-zones" per spec maps here

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadZoneLogs(): ZoneLog[] {
  try {
    const raw = localStorage.getItem(LS_TODAY);
    if (!raw) return [];
    const parsed: TodayZoneData = JSON.parse(raw);
    if (parsed.date !== todayDateStr()) return []; // new day — discard
    return Array.isArray(parsed.logs) ? parsed.logs : [];
  } catch {
    return [];
  }
}

function saveZoneLogs(logs: ZoneLog[]): void {
  try {
    const data: TodayZoneData = { date: todayDateStr(), logs };
    localStorage.setItem(LS_TODAY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function loadSessions(): CompletedSession[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: CompletedSession[]): void {
  try {
    localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  } catch {
    // silently ignore
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const TIME_BLOCKS: TimeBlock[] = [
  {
    id: "focus",
    name: "FOCUS TIME",
    description: "Deep strategic work only YOU can do",
    hourStart: 6,
    hourEnd: 10,
    activities: [
      "Write the strategy memo no one else can write",
      "Build the vision deck / Clarity Compass update",
      "Work on the highest-leverage project",
      "Record the video only you can record",
    ],
    color: "#6366f1",
  },
  {
    id: "strategy",
    name: "STRATEGY TIME",
    description: "Review scorecard, analyze trends",
    hourStart: 10,
    hourEnd: 12,
    activities: [
      "Review weekly scorecard metrics",
      "Analyze funnel data and trends",
      "Identify the one constraint to break this week",
      "Reply to high-leverage messages",
    ],
    color: "#2d5a4e",
  },
  {
    id: "people",
    name: "PEOPLE TIME",
    description: "1:1s with team, partners, clients",
    hourStart: 12,
    hourEnd: 16,
    activities: [
      "Run structured 1:1s with direct reports",
      "Client check-in calls",
      "Partner strategy calls",
      "Team meetings (with agenda)",
    ],
    color: "#f59e0b",
  },
  {
    id: "development",
    name: "PERSONAL DEVELOPMENT",
    description: "Learn, grow, recover",
    hourStart: 16,
    hourEnd: 20,
    activities: [
      "Read 30 pages of a business book",
      "Watch one educational video",
      "Journal: wins, lessons, tomorrow's priorities",
      "Workout / movement",
    ],
    color: "#10b981",
  },
];

const WEEK_ALLOCATION = [
  { label: "Focus Time", hours: 4, pct: 33, color: "#6366f1" },
  { label: "Strategy", hours: 1.5, pct: 12.5, color: "#2d5a4e" },
  { label: "People", hours: 2, pct: 17, color: "#f59e0b" },
  { label: "Development", hours: 2, pct: 17, color: "#10b981" },
  { label: "Recovery", hours: 2.5, pct: 20.5, color: "#ec4899" },
];

const PRESET_DURATIONS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

const ZONES: { zone: ZoneType; color: string; description: string }[] = [
  { zone: "Flow", color: "#10b981", description: "Deep, energized work" },
  { zone: "Captive", color: "#6366f1", description: "Necessary but not energizing" },
  { zone: "Menial", color: "#f59e0b", description: "Admin / low-skill tasks" },
  { zone: "Drudgery", color: "#ef4444", description: "Draining, no value" },
];

const QUICK_LINKS = [
  { label: "Need to decide something?", href: "/compass", cta: "Open Compass" },
  { label: "Need to delegate?", href: "/delegation", cta: "Delegation Map" },
  { label: "Check the scorecard", href: "/scorecard", cta: "View Scorecard" },
  { label: "Talk to Advisor", href: "/advisor", cta: "Open Advisor" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getCurrentBlock(): TimeBlock {
  const hour = new Date().getHours();
  return (
    TIME_BLOCKS.find((b) => hour >= b.hourStart && hour < b.hourEnd) ??
    TIME_BLOCKS[3]
  );
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning, Blade.";
  if (h < 17) return "Good afternoon, Blade.";
  return "Good evening, Blade.";
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FocusPage() {
  const [currentBlock] = useState<TimeBlock>(getCurrentBlock);
  const [inFlow, setInFlow] = useState(false);

  // Timer
  const [selectedPreset, setSelectedPreset] = useState(PRESET_DURATIONS[0].seconds);
  const [timeLeft, setTimeLeft] = useState(PRESET_DURATIONS[0].seconds);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [sessionLabel, setSessionLabel] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Zone logging — seeded from localStorage on mount
  const [zoneLogs, setZoneLogs] = useState<ZoneLog[]>([]);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on first mount (client-side only)
  useEffect(() => {
    setZoneLogs(loadZoneLogs());
    setCompletedSessions(loadSessions());
    setHydrated(true);
  }, []);

  // Persist zone logs whenever they change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveZoneLogs(zoneLogs);
  }, [zoneLogs, hydrated]);

  // Persist completed sessions whenever the list changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveSessions(completedSessions);
  }, [completedSessions, hydrated]);

  // Timer controls
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setTimerState("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setTimerState("paused");
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(selectedPreset);
    setTimerState("idle");
    setCompletionNote("");
  }, [clearTimer, selectedPreset]);

  function selectPreset(seconds: number) {
    clearTimer();
    setSelectedPreset(seconds);
    setTimeLeft(seconds);
    setTimerState("idle");
    setCompletionNote("");
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const timerPct =
    timerState === "idle" ? 0 : Math.round(((selectedPreset - timeLeft) / selectedPreset) * 100);

  // Save completed session to localStorage when timer finishes
  const prevTimerStateRef = useRef<TimerState>("idle");
  useEffect(() => {
    if (prevTimerStateRef.current !== "done" && timerState === "done") {
      const session: CompletedSession = {
        label: sessionLabel.trim() || "Untitled session",
        durationSeconds: selectedPreset,
        completedAt: Date.now(),
      };
      setCompletedSessions((prev) => [session, ...prev]);
    }
    prevTimerStateRef.current = timerState;
  }, [timerState, sessionLabel, selectedPreset]);

  // Zone logging
  function logZone(zone: ZoneType) {
    setZoneLogs((prev) => [{ zone, timestamp: Date.now() }, ...prev]);
  }

  const zoneCounts = ZONES.map((z) => ({
    ...z,
    count: zoneLogs.filter((l) => l.zone === z.zone).length,
  }));
  const totalLogs = zoneLogs.length;
  const flowCount = zoneCounts.find((z) => z.zone === "Flow")?.count ?? 0;
  const flowPct = totalLogs > 0 ? Math.round((flowCount / totalLogs) * 100) : 0;

  return (
    <div className="space-y-8" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          CEO FOCUS MODE
        </p>
        <h1
          className="text-4xl font-serif mb-2"
          style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}
        >
          Your 12-Hour Week
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          React less. Measure impact, not effort.
        </p>
      </div>

      {/* Today's Block — prominent */}
      <div
        className="card p-6"
        style={{
          borderLeft: `4px solid ${currentBlock.color}`,
          background: "var(--surface)",
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{
                  background: `${currentBlock.color}18`,
                  color: currentBlock.color,
                  border: `1px solid ${currentBlock.color}30`,
                }}
              >
                {getGreeting()}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h2
              className="text-2xl font-serif mb-1"
              style={{ color: currentBlock.color, fontWeight: 400 }}
            >
              {currentBlock.name}
            </h2>
            <p className="text-base mb-4" style={{ color: "var(--text-secondary)" }}>
              {currentBlock.description}
            </p>
            <div className="space-y-1.5">
              {currentBlock.activities.map((act, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: currentBlock.color, fontSize: "12px", marginTop: "3px", flexShrink: 0 }}>
                    ▸
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {act}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Flow toggle */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              In Flow?
            </p>
            <button
              onClick={() => setInFlow((v) => !v)}
              style={{
                width: "64px",
                height: "34px",
                borderRadius: "17px",
                border: "none",
                background: inFlow ? "#10b981" : "var(--border)",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  left: inFlow ? "34px" : "4px",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
            <span
              className="text-xs font-semibold"
              style={{ color: inFlow ? "#10b981" : "var(--muted)" }}
            >
              {inFlow ? "FLOWING" : "OFF"}
            </span>
          </div>
        </div>
      </div>

      {/* Focus Timer */}
      <div className="card p-6">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-5"
          style={{ color: "var(--muted)" }}
        >
          Focus Timer
        </p>

        {/* Preset Buttons */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {PRESET_DURATIONS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => selectPreset(p.seconds)}
              disabled={timerState === "running"}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background:
                  selectedPreset === p.seconds ? "var(--accent)" : "var(--bg)",
                color:
                  selectedPreset === p.seconds ? "var(--accent-text)" : "var(--text-secondary)",
                border: `1px solid ${selectedPreset === p.seconds ? "var(--accent)" : "var(--border)"}`,
                cursor: timerState === "running" ? "not-allowed" : "pointer",
                opacity: timerState === "running" ? 0.6 : 1,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Session Label */}
        <div className="mb-5">
          <input
            type="text"
            value={sessionLabel}
            onChange={(e) => setSessionLabel(e.target.value)}
            placeholder="Working on: ___________"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Big Timer Display */}
        <div className="flex flex-col items-center mb-5">
          {/* Circular progress ring */}
          <div style={{ position: "relative", width: "180px", height: "180px", marginBottom: "16px" }}>
            <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="90"
                cy="90"
                r="80"
                fill="none"
                stroke="var(--border)"
                strokeWidth="6"
              />
              <circle
                cx="90"
                cy="90"
                r="80"
                fill="none"
                stroke={timerState === "done" ? "#10b981" : currentBlock.color}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - timerPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="font-serif"
                style={{
                  fontSize: "38px",
                  fontWeight: 300,
                  color: timerState === "done" ? "#10b981" : "var(--text)",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {formatSeconds(timeLeft)}
              </span>
              <span
                className="text-xs uppercase tracking-widest mt-1"
                style={{ color: "var(--muted)" }}
              >
                {timerState === "done"
                  ? "Complete"
                  : timerState === "running"
                  ? "Running"
                  : timerState === "paused"
                  ? "Paused"
                  : "Ready"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {timerState !== "running" && timerState !== "done" && (
              <button
                onClick={startTimer}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-80"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {timerState === "paused" ? "Resume" : "Start"}
              </button>
            )}
            {timerState === "running" && (
              <button
                onClick={pauseTimer}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-80"
                style={{
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                Pause
              </button>
            )}
            {timerState !== "idle" && (
              <button
                onClick={resetTimer}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "var(--bg)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Completion Card */}
        {timerState === "done" && (
          <div
            className="rounded-2xl p-5"
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "#15803d" }}
            >
              Well done. What did you accomplish?
            </p>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Describe what you completed in this session..."
              rows={2}
              className="w-full rounded-xl px-4 py-2.5 text-sm resize-none outline-none"
              style={{
                background: "#fff",
                border: "1px solid #bbf7d0",
                color: "#15803d",
              }}
            />
          </div>
        )}
      </div>

      {/* Weekly Time Allocation */}
      <div className="card p-6">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-5"
          style={{ color: "var(--muted)" }}
        >
          Ideal 12-Hour CEO Week
        </p>
        <div className="space-y-3">
          {WEEK_ALLOCATION.map((block) => (
            <div key={block.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: block.color,
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {block.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {block.hours}h
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: block.color, minWidth: "36px", textAlign: "right" }}
                  >
                    {block.pct}%
                  </span>
                </div>
              </div>
              <div
                className="w-full rounded-full"
                style={{ height: "6px", background: "var(--border)" }}
              >
                <div
                  className="rounded-full"
                  style={{
                    height: "6px",
                    width: `${block.pct}%`,
                    background: block.color,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p
          className="text-xs mt-4"
          style={{ color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "12px" }}
        >
          Total: 12 hours / week · Based on Ryan Deiss's CEO Schedule framework
        </p>
      </div>

      {/* Today's Zones */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            Today&apos;s Zones
          </p>
          {totalLogs > 0 && (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: flowPct >= 50 ? "#f0fdf4" : "var(--accent-bg)",
                color: flowPct >= 50 ? "#15803d" : "var(--accent)",
              }}
            >
              {flowPct}% Flow
            </span>
          )}
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Where are you spending time today?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {ZONES.map(({ zone, color, description }) => {
            const count = zoneCounts.find((z) => z.zone === zone)?.count ?? 0;
            return (
              <button
                key={zone}
                onClick={() => logZone(zone)}
                className="rounded-xl p-4 text-left transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: count > 0 ? `${color}12` : "var(--bg)",
                  border: `1px solid ${count > 0 ? color : "var(--border)"}`,
                  cursor: "pointer",
                }}
              >
                <p
                  className="text-sm font-semibold mb-0.5"
                  style={{ color: count > 0 ? color : "var(--text)" }}
                >
                  {zone}
                </p>
                <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                  {description}
                </p>
                <p
                  className="text-2xl font-serif"
                  style={{ color: count > 0 ? color : "var(--muted)", fontWeight: 300 }}
                >
                  {count}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tally */}
        {totalLogs > 0 && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ color: "var(--muted)" }}>Today: </span>
            {zoneCounts
              .filter((z) => z.count > 0)
              .map((z, i, arr) => (
                <span key={z.zone}>
                  <span style={{ color: z.color, fontWeight: 600 }}>
                    {z.count} {z.zone}
                  </span>
                  {i < arr.length - 1 && <span style={{ color: "var(--muted)" }}>, </span>}
                </span>
              ))}
            {totalLogs > 0 && (
              <span style={{ color: "var(--muted)" }}>
                {" "}· Flow Zone: {flowPct}%
              </span>
            )}
            <button
              onClick={() => {
                setZoneLogs([]);
                saveZoneLogs([]);
              }}
              className="ml-3 text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--muted)", textDecoration: "underline" }}
            >
              reset
            </button>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="card p-6">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted)" }}
        >
          Quick Navigation
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ label, href, cta }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition-opacity hover:opacity-80"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {label}
              </span>
              <span
                className="text-xs font-semibold ml-3 flex-shrink-0"
                style={{ color: "var(--accent)" }}
              >
                {cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
