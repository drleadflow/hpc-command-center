"use client";

import { useState, useEffect, useRef } from "react";

interface Step {
  label: string;
  critical: boolean;
}

interface Playbook {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  description: string;
  estimatedTime: string;
  lastRun: string;
  steps: Step[];
}

interface PlaybookProgress {
  checked: boolean[];
  startTime: number; // epoch ms
}

interface CompletedPlaybook {
  playbookId: string;
  completedAt: string; // ISO string
  elapsedTime: number; // seconds
}

const playbooks: Playbook[] = [
  {
    id: "new-client-onboarding",
    name: "New Client Onboarding",
    category: "Client Success",
    categoryColor: "#8b5cf6",
    description:
      "End-to-end onboarding from signed contract to first campaign live.",
    estimatedTime: "45 min",
    lastRun: "",
    steps: [
      { label: "Send welcome email with portal access", critical: true },
      { label: "Create client Slack channel", critical: false },
      {
        label: "Collect ad account access (Meta Business Manager)",
        critical: true,
      },
      { label: "Collect Google/GHL access credentials", critical: true },
      { label: "Schedule kickoff call within 48 hours", critical: true },
      { label: "Run initial ad account audit", critical: false },
      { label: "Build campaign strategy doc", critical: true },
      { label: "Set up GHL pipeline for client", critical: false },
      { label: "Configure AI chatbot for client", critical: false },
      {
        label: "Launch first campaign (draft → review → live)",
        critical: true,
      },
      { label: "Send day-7 check-in message", critical: false },
      { label: "Deliver first weekly report", critical: true },
    ],
  },
  {
    id: "campaign-launch-qa",
    name: "Campaign Launch QA",
    category: "Marketing",
    categoryColor: "#3b82f6",
    description: "30-point checklist before any ad campaign goes live.",
    estimatedTime: "20 min",
    lastRun: "",
    steps: [
      { label: "Verify targeting: location, age, interests", critical: true },
      { label: "Check pixel/conversion tracking is firing", critical: true },
      {
        label: "Review ad copy for compliance (no medical claims)",
        critical: true,
      },
      { label: "Verify landing page loads <3 seconds", critical: true },
      { label: "Test form submission end-to-end", critical: true },
      { label: "Confirm budget matches approved amount", critical: true },
      {
        label: "Check ad creative specs (size, format, quality)",
        critical: false,
      },
      { label: "Verify UTM parameters are set", critical: false },
      {
        label: "Review audience exclusions (existing clients)",
        critical: true,
      },
      { label: "Set up A/B test variants if applicable", critical: false },
      {
        label: "Confirm GHL automation triggers on form submit",
        critical: true,
      },
      { label: "Get client approval on creative", critical: true },
    ],
  },
  {
    id: "weekly-client-report",
    name: "Weekly Client Report",
    category: "Client Success",
    categoryColor: "#8b5cf6",
    description: "Standard weekly performance report for all active clients.",
    estimatedTime: "15 min per client",
    lastRun: "",
    steps: [
      {
        label: "Pull Meta Ads data (spend, leads, CPL, ROAS)",
        critical: true,
      },
      { label: "Screenshot top-performing ads", critical: false },
      { label: "Note any campaigns paused or adjusted", critical: true },
      { label: "Calculate week-over-week trends", critical: false },
      { label: "Write 2-3 sentence performance summary", critical: true },
      { label: "Add recommendations for next week", critical: true },
      { label: "Send report to client via Slack/email", critical: true },
      { label: "Log report delivery in CRM", critical: false },
    ],
  },
  {
    id: "discovery-call-flow",
    name: "Discovery Call Flow",
    category: "Sales",
    categoryColor: "#f59e0b",
    description:
      "Standard flow for qualifying and closing on discovery calls.",
    estimatedTime: "30 min",
    lastRun: "",
    steps: [
      {
        label: "Review lead's business before call (website, socials)",
        critical: true,
      },
      { label: "Open with rapport + agenda setting", critical: false },
      { label: "Identify current marketing situation", critical: true },
      { label: "Uncover pain points and goals", critical: true },
      { label: "Qualify: budget, timeline, decision-maker?", critical: true },
      { label: "Present relevant case study", critical: true },
      { label: "Match to correct tier ($997 or $20K)", critical: true },
      { label: "Handle objections", critical: false },
      { label: "Close or set follow-up within 48 hours", critical: true },
      {
        label: "Send payment link within 1 hour of verbal yes",
        critical: true,
      },
    ],
  },
  {
    id: "content-production",
    name: "Content Production Pipeline",
    category: "Media",
    categoryColor: "#ec4899",
    description: "From content idea to published across all platforms.",
    estimatedTime: "2-4 hours",
    lastRun: "",
    steps: [
      { label: "Select topic from content calendar", critical: false },
      { label: "Research: pull key stats and talking points", critical: true },
      { label: "Write script/outline (hook, body, CTA)", critical: true },
      { label: "Film raw footage", critical: true },
      { label: "Edit: cuts, captions, music, B-roll", critical: true },
      { label: "Create thumbnail(s)", critical: false },
      { label: "Write platform-specific captions", critical: false },
      {
        label: "Schedule across platforms (IG, YT, TikTok, FB)",
        critical: true,
      },
      {
        label: "Post and engage with comments for first hour",
        critical: false,
      },
    ],
  },
];

// ── localStorage helpers ───────────────────────────────────────────────────────

function loadProgress(playbookId: string): PlaybookProgress | null {
  try {
    const raw = localStorage.getItem(`dlf-playbook-progress-${playbookId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaybookProgress;
    if (!Array.isArray(parsed.checked) || typeof parsed.startTime !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress(playbookId: string, progress: PlaybookProgress) {
  try {
    localStorage.setItem(`dlf-playbook-progress-${playbookId}`, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

function clearProgress(playbookId: string) {
  try {
    localStorage.removeItem(`dlf-playbook-progress-${playbookId}`);
  } catch {
    // ignore
  }
}

function loadCompletedPlaybooks(): CompletedPlaybook[] {
  try {
    const raw = localStorage.getItem("dlf-playbooks-completed");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CompletedPlaybook[];
  } catch {
    return [];
  }
}

function saveCompletedPlaybook(entry: CompletedPlaybook) {
  try {
    const existing = loadCompletedPlaybooks();
    existing.push(entry);
    localStorage.setItem("dlf-playbooks-completed", JSON.stringify(existing));
  } catch {
    // ignore
  }
}

function getLastCompleted(playbookId: string): CompletedPlaybook | null {
  const all = loadCompletedPlaybooks();
  const matching = all.filter((e) => e.playbookId === playbookId);
  if (matching.length === 0) return null;
  // sort by completedAt descending
  matching.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  return matching[0];
}

import { timeAgo } from "@/lib/hooks";

const formatTimeAgo = timeAgo;

function formatLastRun(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Library Card ──────────────────────────────────────────────────────────────

function PlaybookCard({
  playbook,
  onRun,
  lastCompleted,
  hasInProgress,
}: {
  playbook: Playbook;
  onRun: (p: Playbook) => void;
  lastCompleted: CompletedPlaybook | null;
  hasInProgress: boolean;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      {/* header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>
            {playbook.name}
          </p>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: playbook.categoryColor + "22",
            color: playbook.categoryColor,
            border: `1px solid ${playbook.categoryColor}44`,
          }}
        >
          {playbook.category}
        </span>
      </div>

      {/* description */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {playbook.description}
      </p>

      {/* meta row */}
      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
        <span className="flex items-center gap-1">
          <span>&#9776;</span>
          {playbook.steps.length} steps
        </span>
        <span className="flex items-center gap-1">
          <span>&#128336;</span>
          {playbook.estimatedTime}
        </span>
      </div>

      {/* last completed (from localStorage) or last run (static) */}
      {lastCompleted ? (
        <div
          className="text-xs px-2 py-1 rounded-md w-fit"
          style={{
            backgroundColor: "var(--accent-bg)",
            color: "var(--accent-text)",
          }}
        >
          Last completed: {formatTimeAgo(lastCompleted.completedAt)}
        </div>
      ) : (
        <div
          className="text-xs px-2 py-1 rounded-md w-fit"
          style={{
            backgroundColor: "var(--accent-bg)",
            color: "var(--accent-text)",
          }}
        >
          Last run: {formatLastRun(playbook.lastRun)}
        </div>
      )}

      {/* in-progress indicator */}
      {hasInProgress && (
        <div
          className="text-xs px-2 py-1 rounded-md w-fit"
          style={{
            backgroundColor: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fcd34d",
          }}
        >
          In progress — resume where you left off
        </div>
      )}

      {/* run button */}
      <button
        onClick={() => onRun(playbook)}
        className="mt-auto w-full text-sm font-semibold py-2 rounded-xl transition-all"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
        }
      >
        {hasInProgress ? "Resume Playbook" : "Run Playbook"}
      </button>
    </div>
  );
}

// ── Runner View ───────────────────────────────────────────────────────────────

function PlaybookRunner({
  playbook,
  onBack,
  onCompleted,
}: {
  playbook: Playbook;
  onBack: () => void;
  onCompleted: (entry: CompletedPlaybook) => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => {
    const saved = loadProgress(playbook.id);
    if (saved && saved.checked.length === playbook.steps.length) {
      return saved.checked;
    }
    return new Array(playbook.steps.length).fill(false);
  });

  const [elapsed, setElapsed] = useState<number>(() => {
    const saved = loadProgress(playbook.id);
    if (saved) {
      return Math.floor((Date.now() - saved.startTime) / 1000);
    }
    return 0;
  });

  // Compute the start time once on mount (can't use lazy useRef, so compute inline)
  const startTimeMsRef = useRef<number>(
    (() => {
      const saved = loadProgress(playbook.id);
      return saved ? saved.startTime : Date.now();
    })()
  );

  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/resume timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeMsRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Persist progress on every check change
  useEffect(() => {
    if (!completed) {
      saveProgress(playbook.id, {
        checked,
        startTime: startTimeMsRef.current,
      });
    }
  }, [checked, playbook.id, completed]);

  const doneCount = checked.filter(Boolean).length;
  const totalCount = playbook.steps.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);
  const allDone = doneCount === totalCount;

  function toggle(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function handleComplete() {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalElapsed = Math.floor((Date.now() - startTimeMsRef.current) / 1000);
    const entry: CompletedPlaybook = {
      playbookId: playbook.id,
      completedAt: new Date().toISOString(),
      elapsedTime: finalElapsed,
    };
    saveCompletedPlaybook(entry);
    clearProgress(playbook.id);
    onCompleted(entry);
    setCompleted(true);
  }

  if (completed) {
    return (
      <div
        className="max-w-2xl mx-auto card p-10 flex flex-col items-center gap-5 text-center"
        style={{ marginTop: "3rem" }}
      >
        <div
          className="text-5xl w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
        >
          &#10003;
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Playbook Complete
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {playbook.name} finished in {formatElapsed(elapsed)}
          </p>
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {totalCount} steps executed successfully.
        </p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* top nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          <span>&#8592;</span> Back to Library
        </button>
        <span
          className="text-sm font-semibold tabular-nums px-3 py-1 rounded-lg"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* playbook header */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: playbook.categoryColor + "22",
              color: playbook.categoryColor,
              border: `1px solid ${playbook.categoryColor}44`,
            }}
          >
            {playbook.category}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {playbook.estimatedTime}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {playbook.name}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {playbook.description}
          </p>
        </div>

        {/* progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>
              {doneCount}/{totalCount} steps complete
            </span>
            <span>{progressPct}%</span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: "var(--accent)",
              }}
            />
          </div>
        </div>
      </div>

      {/* steps */}
      <div className="flex flex-col gap-2">
        {playbook.steps.map((step, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
            style={{
              backgroundColor: checked[i]
                ? "var(--accent-bg)"
                : step.critical
                ? "var(--surface)"
                : "var(--surface)",
              border: step.critical
                ? checked[i]
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)"
                : "1px solid var(--border)",
              borderLeft: step.critical && !checked[i]
                ? "3px solid var(--warning)"
                : step.critical && checked[i]
                ? "3px solid var(--accent)"
                : "1px solid var(--border)",
            }}
          >
            {/* checkbox */}
            <div
              className="w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
              style={{
                backgroundColor: checked[i] ? "var(--accent)" : "transparent",
                borderColor: checked[i] ? "var(--accent)" : "var(--border)",
              }}
            >
              {checked[i] && (
                <span className="text-white text-xs font-bold leading-none">
                  &#10003;
                </span>
              )}
            </div>

            {/* label */}
            <span
              className="text-sm leading-snug flex-1"
              style={{
                color: checked[i] ? "var(--muted)" : "var(--text)",
                textDecoration: checked[i] ? "line-through" : "none",
              }}
            >
              {step.critical && !checked[i] && (
                <span className="mr-1.5" title="Critical step">
                  &#9889;
                </span>
              )}
              {step.label}
            </span>
          </button>
        ))}
      </div>

      {/* complete button */}
      <div className="pb-8">
        <button
          onClick={handleComplete}
          disabled={!allDone}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            backgroundColor: allDone ? "var(--accent)" : "var(--border)",
            color: allDone ? "#fff" : "var(--muted)",
            cursor: allDone ? "pointer" : "not-allowed",
          }}
        >
          {allDone
            ? "Complete Playbook"
            : `${totalCount - doneCount} step${totalCount - doneCount !== 1 ? "s" : ""} remaining`}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlaybooksPage() {
  const [activePlaybook, setActivePlaybook] = useState<Playbook | null>(null);
  // Track completion history so card re-renders after completing
  const [completionTick, setCompletionTick] = useState(0);

  function handleCompleted(_entry: CompletedPlaybook) {
    setCompletionTick((t) => t + 1);
  }

  return (
    <div
      className="min-h-screen px-6 py-8 max-w-6xl mx-auto"
      style={{ color: "var(--text)" }}
    >
      {activePlaybook ? (
        <PlaybookRunner
          playbook={activePlaybook}
          onBack={() => setActivePlaybook(null)}
          onCompleted={handleCompleted}
        />
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "var(--accent)" }}
            >
              POWER STAGE PLAYBOOKS
            </p>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Executable SOPs
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Only for high-stakes, repetitive processes. Run them, don&apos;t just read them.
            </p>
          </div>

          {/* Library grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playbooks.map((p) => {
              const lastCompleted = getLastCompleted(p.id);
              const inProgressData = loadProgress(p.id);
              const hasInProgress =
                inProgressData !== null &&
                Array.isArray(inProgressData.checked) &&
                inProgressData.checked.some(Boolean);
              return (
                <PlaybookCard
                  key={`${p.id}-${completionTick}`}
                  playbook={p}
                  onRun={setActivePlaybook}
                  lastCompleted={lastCompleted}
                  hasInProgress={hasInProgress}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
