"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── types ───────────────────────────────────────────────────────────────────

type StageVariant = "trigger" | "power" | "end" | "default";

interface StageCard {
  name: string;
  subtitle: string;
  items: string[];
  variant: StageVariant;
}

type ExitStatus = "COMPLETE" | "IN PROGRESS" | "NOT STARTED";

interface Exit {
  number: number;
  title: string;
  description: string;
  status: ExitStatus;
  note: string;
}

interface TeamMember {
  name: string;
  role: string;
  bullets: string[];
  color: string;
}

interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  tab: TabId;
  tabLabel: string;
}

interface DiagramNode {
  id: string;
  label: string;
  subtitle: string;
  color: string;
  icon: string;
}

interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
}

interface DiagramKPI {
  label: string;
  value: string;
  color: string;
}

interface DiagramData {
  title: string;
  type: "flow" | "funnel" | "grid" | "timeline";
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  kpis: DiagramKPI[];
  summary: string;
}

// ── localStorage helpers ────────────────────────────────────────────────────

function loadNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dlf-os-notes");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveNotes(notes: Record<string, string>) {
  try { localStorage.setItem("dlf-os-notes", JSON.stringify(notes)); } catch {}
}

function loadTimestamps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dlf-os-timestamps");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveTimestamps(ts: Record<string, string>) {
  try { localStorage.setItem("dlf-os-timestamps", JSON.stringify(ts)); } catch {}
}

function loadExitStatuses(): Record<number, ExitStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dlf-exit-statuses");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveExitStatuses(statuses: Record<number, ExitStatus>) {
  try { localStorage.setItem("dlf-exit-statuses", JSON.stringify(statuses)); } catch {}
}

function loadDiagrams(): Record<string, DiagramData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dlf-os-diagrams");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDiagrams(diagrams: Record<string, DiagramData>) {
  try { localStorage.setItem("dlf-os-diagrams", JSON.stringify(diagrams)); } catch {}
}

// ── SOP types ────────────────────────────────────────────────────────────────

interface SOPStep {
  id: string;
  description: string;
  assignee?: string;
}

interface SOPRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  checkedSteps: string[];
}

interface SOP {
  id: string;
  title: string;
  osSection: string;
  steps: SOPStep[];
  runs: SOPRun[];
  createdAt: string;
  updatedAt: string;
}

// ── SOP localStorage helpers ─────────────────────────────────────────────────

function loadSOPs(): SOP[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("dlf-os-sops");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSOPs(sops: SOP[]) {
  try { localStorage.setItem("dlf-os-sops", JSON.stringify(sops)); } catch {}
}

// ── default SOP seed data ────────────────────────────────────────────────────

const DEFAULT_SOPS: SOP[] = [
  {
    id: "sop-client-onboarding",
    title: "Client Onboarding",
    osSection: "fulfillment-ONBOARDING",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    runs: [],
    steps: [
      { id: "co-1", description: "Send welcome email with login credentials" },
      { id: "co-2", description: "Schedule kickoff call" },
      { id: "co-3", description: "Collect brand assets and access credentials" },
      { id: "co-4", description: "Set up GHL sub-account" },
      { id: "co-5", description: "Build initial funnel" },
      { id: "co-6", description: "Launch first ad campaign" },
      { id: "co-7", description: "Set up reporting dashboard" },
      { id: "co-8", description: "Send 7-day check-in" },
    ],
  },
  {
    id: "sop-new-ad-campaign",
    title: "New Ad Campaign Launch",
    osSection: "growth-AWARENESS",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    runs: [],
    steps: [
      { id: "ac-1", description: "Define campaign objective and KPIs" },
      { id: "ac-2", description: "Research target audience" },
      { id: "ac-3", description: "Create ad copy variations (3 minimum)" },
      { id: "ac-4", description: "Design creative assets" },
      { id: "ac-5", description: "Set up tracking (pixel, UTMs, conversions)" },
      { id: "ac-6", description: "Configure campaign in Meta Ads" },
      { id: "ac-7", description: "Set budget and bid strategy" },
      { id: "ac-8", description: "Launch and monitor first 48 hours" },
      { id: "ac-9", description: "Optimize after initial data" },
    ],
  },
  {
    id: "sop-weekly-client-report",
    title: "Weekly Client Report",
    osSection: "fulfillment-WEEKLY TRACKING",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    runs: [],
    steps: [
      { id: "wr-1", description: "Pull ad performance data" },
      { id: "wr-2", description: "Calculate KPIs (CPL, ROAS, CTR)" },
      { id: "wr-3", description: "Write performance summary" },
      { id: "wr-4", description: "Note optimizations made" },
      { id: "wr-5", description: "Identify next week's priorities" },
      { id: "wr-6", description: "Send report to client" },
    ],
  },
  {
    id: "sop-content-production",
    title: "Content Production",
    osSection: "support-Ad Management",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    runs: [],
    steps: [
      { id: "cp-1", description: "Review content calendar for the week" },
      { id: "cp-2", description: "Write hooks and scripts" },
      { id: "cp-3", description: "Record raw footage" },
      { id: "cp-4", description: "Edit and add captions" },
      { id: "cp-5", description: "Create thumbnails" },
      { id: "cp-6", description: "Schedule posts" },
      { id: "cp-7", description: "Monitor engagement after publish" },
    ],
  },
];

function getInitialSOPs(): SOP[] {
  const stored = loadSOPs();
  if (stored.length === 0) {
    saveSOPs(DEFAULT_SOPS);
    return DEFAULT_SOPS;
  }
  // Merge in any default SOPs not yet in storage
  const storedIds = new Set(stored.map(s => s.id));
  const merged = [...stored];
  for (const def of DEFAULT_SOPS) {
    if (!storedIds.has(def.id)) merged.push(def);
  }
  return merged;
}

// ── SOP Panel component ───────────────────────────────────────────────────────

function SOPChecklistIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "var(--border-subtle)", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "3px", transition: "width 0.3s ease" }} />
    </div>
  );
}

function SOPCard({
  sop,
  onUpdate,
}: {
  sop: SOP;
  onUpdate: (updated: SOP) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(() => {
    // Resume last incomplete run if any
    const last = sop.runs[sop.runs.length - 1];
    return last && !last.completedAt ? last.id : null;
  });
  const [showNewSOPModal, setShowNewSOPModal] = useState(false);

  const activeRun = activeRunId ? sop.runs.find(r => r.id === activeRunId) : null;
  const checkedCount = activeRun ? activeRun.checkedSteps.length : 0;
  const totalSteps = sop.steps.length;
  const pct = totalSteps > 0 ? Math.round((checkedCount / totalSteps) * 100) : 0;

  const runStatus = !activeRun
    ? "not started"
    : activeRun.completedAt
    ? "complete"
    : "in progress";

  const statusColor =
    runStatus === "complete" ? "#10b981" : runStatus === "in progress" ? "#f59e0b" : "var(--muted)";
  const statusBg =
    runStatus === "complete" ? "#10b98118" : runStatus === "in progress" ? "#f59e0b18" : "var(--bg)";
  const statusBorder =
    runStatus === "complete" ? "#10b98140" : runStatus === "in progress" ? "#f59e0b40" : "var(--border)";

  const startRun = () => {
    const now = new Date().toISOString();
    const newRun: SOPRun = { id: `run-${Date.now()}`, startedAt: now, checkedSteps: [] };
    const updated: SOP = { ...sop, runs: [...sop.runs, newRun], updatedAt: now };
    setActiveRunId(newRun.id);
    onUpdate(updated);
  };

  const toggleStep = (stepId: string) => {
    if (!activeRun) return;
    const now = new Date().toISOString();
    const isChecked = activeRun.checkedSteps.includes(stepId);
    const newChecked = isChecked
      ? activeRun.checkedSteps.filter(s => s !== stepId)
      : [...activeRun.checkedSteps, stepId];

    const newRun: SOPRun = {
      ...activeRun,
      checkedSteps: newChecked,
      completedAt: newChecked.length === sop.steps.length ? now : undefined,
    };

    const updated: SOP = {
      ...sop,
      runs: sop.runs.map(r => (r.id === activeRun.id ? newRun : r)),
      updatedAt: now,
    };
    onUpdate(updated);
  };

  const lastRunDate = sop.runs.length > 0
    ? new Date(sop.runs[sop.runs.length - 1].startedAt).toLocaleDateString()
    : null;

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "10px",
      overflow: "hidden",
      backgroundColor: "var(--surface)",
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{sop.title}</span>
            <span style={{
              fontSize: "10px",
              padding: "1px 7px",
              borderRadius: "999px",
              backgroundColor: statusBg,
              color: statusColor,
              border: `1px solid ${statusBorder}`,
              fontWeight: 500,
              flexShrink: 0,
              textTransform: "capitalize",
            }}>
              {runStatus}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ProgressBar pct={pct} color={statusColor} />
            <span style={{ fontSize: "10px", color: "var(--muted)", flexShrink: 0 }}>
              {checkedCount}/{totalSteps}
            </span>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px 14px" }}>
          {/* Action row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            {runStatus !== "in progress" && (
              <button
                onClick={startRun}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #10b981",
                  backgroundColor: "#10b98118",
                  color: "#10b981",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                {sop.runs.length === 0 ? "Start SOP Run" : "Start New Run"}
              </button>
            )}
            {runStatus === "in progress" && (
              <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 500 }}>
                Run in progress — check off steps below
              </span>
            )}
            {lastRunDate && (
              <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "auto" }}>
                Last run: {lastRunDate}
              </span>
            )}
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sop.steps.map((step, i) => {
              const isChecked = activeRun ? activeRun.checkedSteps.includes(step.id) : false;
              const canCheck = !!activeRun && !activeRun.completedAt;
              return (
                <div
                  key={step.id}
                  onClick={() => canCheck && toggleStep(step.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    backgroundColor: isChecked ? "#10b98110" : "var(--bg)",
                    border: `1px solid ${isChecked ? "#10b98130" : "var(--border-subtle)"}`,
                    cursor: canCheck ? "pointer" : "default",
                    transition: "background-color 0.15s",
                  }}
                >
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    border: `2px solid ${isChecked ? "#10b981" : "var(--border)"}`,
                    backgroundColor: isChecked ? "#10b981" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                    transition: "all 0.15s",
                  }}>
                    {isChecked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: "12px",
                      color: isChecked ? "var(--muted)" : "var(--text)",
                      textDecoration: isChecked ? "line-through" : "none",
                      lineHeight: 1.4,
                    }}>
                      <span style={{ color: "var(--muted)", marginRight: "4px", fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span>
                      {step.description}
                    </span>
                    {step.assignee && (
                      <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                        Assignee: {step.assignee}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion message */}
          {runStatus === "complete" && (
            <div style={{
              marginTop: "10px",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: "#10b98118",
              border: "1px solid #10b98140",
              fontSize: "12px",
              color: "#10b981",
              fontWeight: 500,
            }}>
              All steps complete — SOP run finished!
            </div>
          )}

          {/* Run history */}
          {sop.runs.length > 1 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Run History ({sop.runs.length} runs)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {sop.runs.slice(-5).reverse().map((run, idx) => (
                  <div key={run.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: "var(--muted)" }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                      backgroundColor: run.completedAt ? "#10b981" : "#f59e0b",
                    }} />
                    <span>{new Date(run.startedAt).toLocaleDateString()}</span>
                    <span>{run.completedAt ? `Completed (${run.checkedSteps.length}/${sop.steps.length})` : `In progress (${run.checkedSteps.length}/${sop.steps.length})`}</span>
                    {idx === 0 && run.id === activeRunId && <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>active</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SOPSection({
  osSection,
  sops,
  onSOPsChange,
}: {
  osSection: string;
  sops: SOP[];
  onSOPsChange: (sops: SOP[]) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSteps, setNewSteps] = useState<string[]>(["", ""]);

  const sectionSOPs = sops.filter(s => s.osSection === osSection);

  const handleUpdate = (updated: SOP) => {
    const next = sops.map(s => s.id === updated.id ? updated : s);
    onSOPsChange(next);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const validSteps = newSteps.filter(s => s.trim());
    if (validSteps.length === 0) return;
    const now = new Date().toISOString();
    const id = `sop-custom-${Date.now()}`;
    const newSOP: SOP = {
      id,
      title: newTitle.trim(),
      osSection,
      steps: validSteps.map((desc, i) => ({ id: `${id}-step-${i + 1}`, description: desc.trim() })),
      runs: [],
      createdAt: now,
      updatedAt: now,
    };
    onSOPsChange([...sops, newSOP]);
    setNewTitle("");
    setNewSteps(["", ""]);
    setShowCreate(false);
  };

  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <SOPChecklistIcon />
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            SOPs
          </span>
          {sectionSOPs.length > 0 && (
            <span style={{
              fontSize: "10px",
              padding: "0 6px",
              borderRadius: "999px",
              backgroundColor: "var(--accent-bg)",
              color: "var(--accent-text)",
              border: "1px solid var(--accent)",
              fontWeight: 500,
            }}>
              {sectionSOPs.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(c => !c)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            padding: "3px 9px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg)",
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          {showCreate ? "Cancel" : "+ New SOP"}
        </button>
      </div>

      {sectionSOPs.length === 0 && !showCreate && (
        <div style={{
          padding: "12px",
          borderRadius: "8px",
          border: "1px dashed var(--border)",
          backgroundColor: "var(--bg)",
          fontSize: "12px",
          color: "var(--muted)",
          textAlign: "center",
        }}>
          No SOPs linked to this section yet. Create one with the button above.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sectionSOPs.map(sop => (
          <SOPCard key={sop.id} sop={sop} onUpdate={handleUpdate} />
        ))}
      </div>

      {showCreate && (
        <div style={{
          marginTop: "10px",
          padding: "14px",
          borderRadius: "10px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>
            Create Custom SOP
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="SOP title (e.g. New Client Setup)"
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              fontSize: "12px",
              fontFamily: "inherit",
              outline: "none",
              marginBottom: "8px",
            }}
          />
          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px", fontWeight: 500 }}>Steps</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
            {newSteps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", minWidth: "16px", textAlign: "right" }}>{i + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={e => {
                    const next = [...newSteps];
                    next[i] = e.target.value;
                    setNewSteps(next);
                  }}
                  placeholder={`Step ${i + 1}`}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                {newSteps.length > 1 && (
                  <button
                    onClick={() => setNewSteps(newSteps.filter((_, idx) => idx !== i))}
                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "14px", padding: "0 2px" }}
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setNewSteps([...newSteps, ""])}
              style={{
                fontSize: "11px",
                color: "var(--accent-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              + Add step
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || newSteps.every(s => !s.trim())}
              style={{
                marginLeft: "auto",
                padding: "5px 14px",
                borderRadius: "8px",
                border: "1px solid var(--accent)",
                backgroundColor: "var(--accent-bg)",
                color: "var(--accent-text)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                opacity: (!newTitle.trim() || newSteps.every(s => !s.trim())) ? 0.5 : 1,
              }}
            >
              Create SOP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── data ────────────────────────────────────────────────────────────────────

const growthStages: StageCard[] = [
  { name: "AWARENESS", subtitle: "First touchpoint", items: ["Social Media Content", "Cold Email", "Paid Ads", "Podcasts/Webinars", "Case Studies/Reviews"], variant: "trigger" },
  { name: "CAPTURE", subtitle: "Lead enters ecosystem", items: ["Lead Magnet Download", "Resource Registration", "Skool Community (10K Side Hustle)", "VSL + Scaling Blueprint"], variant: "default" },
  { name: "CRM ENTRY", subtitle: "GoHighLevel", items: ["Auto-sync from all capture points"], variant: "default" },
  { name: "NURTURE", subtitle: "Automated sequences", items: ["Email Nurture Sequence", "SMS/Text Sequence"], variant: "default" },
  { name: "SETTER ENGAGEMENT", subtitle: "Human touch begins", items: ["IG DMs + SMS", "Audit & Analysis", "Loom Video Sent", "Phone Call Booked"], variant: "power" },
  { name: "QUALIFY & CLOSE", subtitle: "Two paths", items: ["< $20K → $997 Coaching", "\u2265 $20K → $5K/mo Agency ($20K total, 4-mo min)"], variant: "power" },
  { name: "HANDOFF", subtitle: "Into fulfillment", items: ["Onboarding begins", "Tech Team + Customer Success"], variant: "end" },
];

const fulfillmentStages: StageCard[] = [
  { name: "CLOSE", subtitle: "Payment link sent (both tiers)", items: [], variant: "trigger" },
  { name: "ONBOARDING", subtitle: "Seamless start", items: ["Contract signed", "Training watched", "Kickoff/Intake"], variant: "power" },
  { name: "DELIVERY \u2014 $997 Coaching", subtitle: "Quick wins track", items: ["Launch first Facebook ads", "Audit marketing campaigns", "First leads in 7-14 days", "Group Slack channel", "Weekly group community calls"], variant: "default" },
  { name: "DELIVERY \u2014 $20K Agency", subtitle: "Full service track", items: ["Full ad campaign management", "AI chatbot install (custom)", "AI voice appointment center", "Individual Slack channel", "Dedicated team access"], variant: "default" },
  { name: "WEEKLY TRACKING", subtitle: "Both tiers", items: ["Progress reports", "Metric reviews"], variant: "default" },
  { name: "RETENTION / UPSELL", subtitle: "Long-term value", items: ["Upsell coaching \u2192 agency", "Renewal / expansion"], variant: "end" },
];

const SOP_ROOT = "https://drive.google.com/drive/folders/1sO9ahnoxjGVU6pMTelGSvCO28wFtsd6Q";

const powerStages = [
  { name: "Setter Engagement", why: "No response = no calls booked", owner: "Sales Ops", sopExists: true, sopNote: "Setter Script folder in Drive" },
  { name: "Loom Video + Call Booking", why: "The conversion hinge point", owner: "Sales Ops", sopExists: false, sopNote: "Needs dedicated SOP" },
  { name: "Follow-Up After Link/Close", why: "Money dies in the gap between yes and payment", owner: "Sales Ops", sopExists: false, sopNote: "Needs dedicated SOP" },
  { name: "Qualify & Close", why: "Wrong offer = churn in 30 days", owner: "CEO", sopExists: true, sopNote: "Lead Flow SOP Phases in Drive" },
  { name: "Onboarding", why: "Must be seamless: contracts, training, kickoff", owner: "Client Success", sopExists: true, sopNote: "Contracts + Course Modules in Drive" },
  { name: "Handoff to Fulfillment", why: "Bad handoff = confused client from day 1", owner: "Client Success", sopExists: false, sopNote: "Needs dedicated SOP" },
];

const airtableBases = [
  { domain: "Setter Performance", base: "Daily Setter Tracking", desc: "DM/Phone logs, rep metrics, AI coaching", dept: "Sales", deptColor: "#3b82f6", url: "https://airtable.com/appVAWhm6pbPfJFpx/tbloh86Ilrgjyrgfl/viwNj8wTcfW6j3ogp?blocks=hide" },
  { domain: "Lead Gen (IG)", base: "IG Leads Database", desc: "Enriched leads with ICP scores", dept: "Marketing", deptColor: "#3b82f6", url: "https://airtable.com/appedqFJJyjpcU3bi" },
  { domain: "Lead Gen (Email)", base: "Cold Email Marketing", desc: "SmartLead campaigns, replies", dept: "Marketing", deptColor: "#3b82f6", url: "https://airtable.com/appAYbV61FCOkWi1Y" },
  { domain: "Bot QA", base: "Bot Audit Daddy", desc: "Client accounts, test scenarios, grades", dept: "Tech", deptColor: "#10b981", url: "https://airtable.com/appsxF8UMX2d3wKnh" },
  { domain: "Content Engine", base: "Lead Flow Content Engine", desc: "AI content pipeline", dept: "Media", deptColor: "#ec4899", url: "https://airtable.com/appY8U0x6J5LPbXhH" },
  { domain: "ContentOS", base: "Lead Flow ScaleOS \u2014 ContentOS", desc: "Full content operations table", dept: "Media", deptColor: "#ec4899", url: "https://airtable.com/app93tcET7pw7UUTx/tblwH8cA11yfZcz7m/viwAfcHgwvAyifdwe?blocks=hide" },
  { domain: "Ad Intel", base: "Digital Marketing Strategy", desc: "Meta campaigns, copy bank", dept: "Marketing", deptColor: "#3b82f6", url: "https://airtable.com/appYVTYNOR8s0Sv2m" },
  { domain: "Community Hunting", base: "Community Hunting Tracker", desc: "Groups, opportunities", dept: "Marketing", deptColor: "#3b82f6", url: "https://airtable.com/appFS4hlx7d6IVHwX" },
  { domain: "Financial", base: "FinancialOS", desc: "P&L, budget, transactions", dept: "CEO", deptColor: "#f59e0b", url: "https://airtable.com/appA9QPYwGt9Q83HD" },
  { domain: "Master CRM", base: "Lead Flow ScaleOS", desc: "130+ tables, everything", dept: "CEO", deptColor: "#f59e0b", url: "https://airtable.com/app93tcET7pw7UUTx" },
  { domain: "Scraped Leads", base: "Scraped Leads", desc: "Google Maps leads with enrichment", dept: "Marketing", deptColor: "#3b82f6", url: "https://airtable.com/appQZWiZjAGG3wipj" },
  { domain: "Ad Creative", base: "Creative Content Engine", desc: "Ad creative pipeline with QA scoring", dept: "Media", deptColor: "#ec4899", url: "https://airtable.com/appiEkUpqO3NiOP0w" },
  { domain: "Ad Intel (Competitor)", base: "Ad Intel", desc: "Competitor ads, landing pages, roadmap", dept: "Marketing", deptColor: "#3b82f6", url: "https://airtable.com/appBZZaCkLDaM4Eu4" },
];

const supportDepts = [
  { name: "Ad Management", desc: "Campaign SOPs, ad creation, optimization playbooks", color: "#3b82f6", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "AI Agents & GHL", desc: "AI agent builds, GHL/AI Secrets, automation SOPs", color: "#10b981", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Setter Scripts", desc: "DM scripts, phone scripts, objection handling", color: "#6366f1", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Lead Flow SOP Phases", desc: "End-to-end lead flow process documentation", color: "#f59e0b", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Contracts & Legal", desc: "Client contracts, agreements, compliance docs", color: "#ef4444", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Course Modules", desc: "Coaching program content, training materials", color: "#8b5cf6", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Masterclass", desc: "Masterclass recordings, presentation decks", color: "#ec4899", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Website Builds", desc: "Client website templates, build SOPs", color: "#14b8a6", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Affiliates", desc: "Affiliate program docs, partner onboarding", color: "#f97316", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Skool Community", desc: "10K Side Hustle community \u2014 member hub", color: "#22c55e", icon: "\ud83d\udcc1", driveUrl: "https://www.skool.com/10ksidehustle" },
  { name: "Passwords & Security", desc: "Credential management, access controls", color: "#dc2626", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
  { name: "Clickup / Project Mgmt", desc: "Task management, project tracking SOPs", color: "#a855f7", icon: "\ud83d\udcc1", driveUrl: SOP_ROOT },
];

const teamMembers: TeamMember[] = [
  { name: "Dr. Blade", role: "CEO", bullets: ["Close $20K deals", "Strategic partnerships", "Brand content creation", "Quarterly planning"], color: "#f59e0b" },
  { name: "Sales Ops", role: "Setter Team", bullets: ["IG DM outreach", "Phone call booking", "Lead qualification", "Follow-up sequences", "Loom video sends"], color: "#3b82f6" },
  { name: "Marketing", role: "Growth Team", bullets: ["Meta ad campaigns", "Landing page optimization", "Email nurture sequences", "Content distribution"], color: "#3b82f6" },
  { name: "Client Success", role: "Delivery Team", bullets: ["Client onboarding", "Weekly reports", "Campaign monitoring", "Escalation handling"], color: "#8b5cf6" },
  { name: "Tech", role: "AI & Automation", bullets: ["GHL automation builds", "AI chatbot deployment", "Voice agent setup", "Integration maintenance"], color: "#10b981" },
  { name: "Media", role: "Content Team", bullets: ["Video production", "Thumbnail creation", "Social media scheduling", "B-roll library management"], color: "#ec4899" },
];

const DEFAULT_EXITS: Exit[] = [
  { number: 1, title: "EXIT THE LINE", description: "Stop doing the daily grunt work", status: "COMPLETE", note: "Setters, delivery team, and tech team handle daily operations." },
  { number: 2, title: "EXIT THE STAFF", description: "Stop managing people directly", status: "IN PROGRESS", note: "Needs a team lead or ops manager to own daily team management." },
  { number: 3, title: "EXIT THE CEO CHAIR", description: "Bring in a President/GM", status: "NOT STARTED", note: "Hire a President or General Manager to run the business day-to-day." },
  { number: 4, title: "EXIT THE BOARD", description: "Step away from governance", status: "NOT STARTED", note: "Install an advisory board and step back from strategic oversight." },
  { number: 5, title: "EXIT OWNERSHIP", description: "Sell or transfer the business", status: "NOT STARTED", note: "Position for acquisition, partnership buyout, or ownership transfer." },
];

const STATUS_CYCLE: ExitStatus[] = ["NOT STARTED", "IN PROGRESS", "COMPLETE"];

// ── build searchable index ──────────────────────────────────────────────────

type TabId = "growth" | "fulfillment" | "power" | "ops" | "support" | "canvas" | "exits";

const TABS: { id: TabId; label: string }[] = [
  { id: "growth", label: "Growth Engine" },
  { id: "fulfillment", label: "Fulfillment Engine" },
  { id: "power", label: "Power Stages" },
  { id: "ops", label: "Operation Hub" },
  { id: "support", label: "Support Functions" },
  { id: "canvas", label: "Team Canvas" },
  { id: "exits", label: "Exits" },
];

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  const addItem = (id: string, name: string, subtitle: string, tab: TabId, tabLabel: string) =>
    results.push({ id, name, subtitle, tab, tabLabel });

  growthStages.forEach(s => addItem(`growth-${s.name}`, s.name, `${s.subtitle} | ${s.items.join(", ")}`, "growth", "Growth Engine"));
  fulfillmentStages.forEach(s => addItem(`fulfillment-${s.name}`, s.name, `${s.subtitle} | ${s.items.join(", ")}`, "fulfillment", "Fulfillment Engine"));
  powerStages.forEach(s => addItem(`power-${s.name}`, s.name, `${s.why} | Owner: ${s.owner}`, "power", "Power Stages"));
  airtableBases.forEach(b => addItem(`ops-${b.domain}`, b.domain, `${b.base} | ${b.desc} | ${b.dept}`, "ops", "Operation Hub"));
  supportDepts.forEach(d => addItem(`support-${d.name}`, d.name, d.desc, "support", "Support Functions"));
  teamMembers.forEach(m => addItem(`canvas-${m.name}`, m.name, `${m.role} | ${m.bullets.join(", ")}`, "canvas", "Team Canvas"));
  DEFAULT_EXITS.forEach(e => addItem(`exits-${e.number}`, e.title, `${e.description} | ${e.note}`, "exits", "Exits"));

  return results;
}

const SEARCH_INDEX = buildSearchIndex();

// ── voice hook ──────────────────────────────────────────────────────────────

function useVoice(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [preview, setPreview] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);
  const manualStop = useRef(false);
  const restartOnEnd = useRef(false);
  const transcriptRef = useRef("");

  const finalize = useCallback(() => {
    const text = transcriptRef.current.trim();
    if (text) onResult(text);
    transcriptRef.current = "";
    setPreview("");
  }, [onResult]);

  const start = useCallback((shouldRestart = true) => {
    if (listening) return;
    const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SR) { alert("Speech recognition not supported. Try Chrome."); return; }
    const rec = new SR() as any;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    manualStop.current = false;
    restartOnEnd.current = shouldRestart;
    transcriptRef.current = "";
    setPreview("");

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }
      transcriptRef.current = finalText.trim();
      setPreview((finalText + interimText).trim());
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech" && !manualStop.current) {
        try { rec.start(); } catch {}
        return;
      }
      if (manualStop.current) {
        finalize();
      }
      setListening(false);
      setPreview("");
    };

    rec.onend = () => {
      // Auto-restart if user didn't manually stop (browser times out after ~60s)
      if (!manualStop.current && restartOnEnd.current) {
        try { rec.start(); } catch { setListening(false); }
        return;
      }
      finalize();
      setListening(false);
      setPreview("");
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [finalize, listening]);

  const stop = useCallback(() => {
    if (!listening) return;
    manualStop.current = true;
    restartOnEnd.current = false;
    recRef.current?.stop();
  }, [listening]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    start(true);
  }, [listening, start, stop]);

  const holdStart = useCallback(() => {
    if (listening) return;
    start(false);
  }, [listening, start]);

  const holdEnd = useCallback(() => {
    if (!listening) return;
    if (!restartOnEnd.current) {
      stop();
    }
  }, [listening, stop]);

  return { listening, preview, toggle, holdStart, holdEnd };
}

// ── mic button ──────────────────────────────────────────────────────────────

function MicButton({ listening, onClick, size = 32 }: { listening: boolean; onClick: () => void; size?: number }) {
  return (
    <button
      onClick={onClick}
      title={listening ? "Stop listening" : "Voice input"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: listening ? "#ef4444" : "var(--border)",
        color: listening ? "#fff" : "var(--muted)",
        transition: "all 0.2s",
        animation: listening ? "mic-pulse 1.2s infinite" : "none",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  );
}

function HoldToRecordButton({
  listening,
  onHoldStart,
  onHoldEnd,
}: {
  listening: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onHoldStart(); }}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={(e) => { e.preventDefault(); onHoldStart(); }}
      onTouchEnd={onHoldEnd}
      onTouchCancel={onHoldEnd}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "10px",
        border: `1px solid ${listening ? "#ef4444" : "var(--border)"}`,
        backgroundColor: listening ? "#ef444418" : "var(--surface)",
        color: listening ? "#ef4444" : "var(--text-secondary)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: listening ? "#ef4444" : "var(--muted)",
        animation: listening ? "mic-pulse 1.2s infinite" : "none",
      }} />
      {listening ? "Release to save dictation" : "Hold to record"}
    </button>
  );
}

// ── sparkle icon ────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

function DiagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="8" y="14" width="7" height="7" rx="1" />
      <path d="M6.5 10v1.5a1 1 0 0 0 1 1h4" />
      <path d="M17.5 10v1.5a1 1 0 0 1-1 1h-4" />
    </svg>
  );
}

// ── diagram view ─────────────────────────────────────────────────────────────

function KPIBar({ kpis }: { kpis: DiagramKPI[] }) {
  return (
    <div style={{
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: "1px solid var(--border)",
    }}>
      {kpis.map((kpi, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "8px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          fontSize: "11px",
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: kpi.color,
            flexShrink: 0,
          }} />
          <span style={{ color: "var(--muted)" }}>{kpi.label}</span>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>{kpi.value}</span>
        </div>
      ))}
    </div>
  );
}

function FlowDiagram({ nodes, connections, kpis }: { nodes: DiagramNode[]; connections: DiagramConnection[]; kpis: DiagramKPI[] }) {
  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0",
        overflowX: "auto",
        paddingBottom: "8px",
      }}>
        {nodes.map((node, i) => {
          const conn = connections.find(c => c.from === node.id);
          return (
            <div key={node.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "var(--surface)",
                border: `2px solid ${node.color}`,
                minWidth: "100px",
                maxWidth: "140px",
                textAlign: "center",
              }}>
                <span style={{ fontSize: "20px" }}>{node.icon}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{node.label}</span>
                <span style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.3 }}>{node.subtitle}</span>
              </div>
              {i < nodes.length - 1 && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "0 4px",
                  flexShrink: 0,
                }}>
                  {conn?.label && (
                    <span style={{ fontSize: "9px", color: "var(--muted)", whiteSpace: "nowrap", marginBottom: "2px" }}>{conn.label}</span>
                  )}
                  <span style={{ color: "var(--muted)", fontSize: "16px" }}>{"\u2192"}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <KPIBar kpis={kpis} />
    </div>
  );
}

function FunnelDiagram({ nodes, kpis }: { nodes: DiagramNode[]; kpis: DiagramKPI[] }) {
  const maxWidth = 100;
  const minWidth = 50;
  const step = nodes.length > 1 ? (maxWidth - minWidth) / (nodes.length - 1) : 0;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
        {nodes.map((node, i) => {
          const widthPct = maxWidth - step * i;
          return (
            <div key={node.id} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <div style={{
                width: `${widthPct}%`,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 14px",
                backgroundColor: "var(--surface)",
                borderLeft: `3px solid ${node.color}`,
                borderRight: `3px solid ${node.color}`,
                borderTop: i === 0 ? `2px solid ${node.color}` : "1px solid var(--border-subtle)",
                borderBottom: i === nodes.length - 1 ? `2px solid ${node.color}` : "none",
                borderRadius: i === 0 ? "10px 10px 0 0" : i === nodes.length - 1 ? "0 0 10px 10px" : "0",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{node.icon}</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{node.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>{node.subtitle}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <KPIBar kpis={kpis} />
    </div>
  );
}

function GridDiagram({ nodes, kpis }: { nodes: DiagramNode[]; kpis: DiagramKPI[] }) {
  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "8px",
      }}>
        {nodes.map((node) => (
          <div key={node.id} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            padding: "12px 10px",
            borderRadius: "10px",
            backgroundColor: "var(--surface)",
            border: `2px solid ${node.color}`,
            textAlign: "center",
          }}>
            <span style={{ fontSize: "22px" }}>{node.icon}</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{node.label}</span>
            <span style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.3 }}>{node.subtitle}</span>
          </div>
        ))}
      </div>
      <KPIBar kpis={kpis} />
    </div>
  );
}

function TimelineDiagram({ nodes, kpis }: { nodes: DiagramNode[]; kpis: DiagramKPI[] }) {
  return (
    <div>
      <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", position: "relative", minWidth: "fit-content" }}>
          {/* Horizontal line */}
          <div style={{
            position: "absolute",
            top: "28px",
            left: "20px",
            right: "20px",
            height: "2px",
            backgroundColor: "var(--border)",
          }} />
          {nodes.map((node, i) => (
            <div key={node.id} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              minWidth: "110px",
              padding: "0 6px",
              position: "relative",
            }}>
              {/* Dot on line */}
              <span style={{ fontSize: "18px", zIndex: 1 }}>{node.icon}</span>
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: node.color,
                border: "2px solid var(--bg)",
                zIndex: 1,
              }} />
              {/* Card below */}
              <div style={{
                padding: "6px 8px",
                borderRadius: "8px",
                backgroundColor: "var(--surface)",
                border: `1px solid ${node.color}`,
                textAlign: "center",
                width: "100%",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>{node.label}</div>
                <div style={{ fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>{node.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <KPIBar kpis={kpis} />
    </div>
  );
}

function DiagramView({ diagram, onRemove, onRegenerate, regenerating }: {
  diagram: DiagramData;
  onRemove: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <div style={{
      marginTop: "12px",
      padding: "14px",
      borderRadius: "10px",
      backgroundColor: "var(--bg)",
      border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{diagram.title}</div>
          <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{diagram.summary}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            style={{
              fontSize: "10px",
              color: "var(--muted)",
              background: "none",
              border: "none",
              cursor: regenerating ? "wait" : "pointer",
              textDecoration: "underline",
              opacity: regenerating ? 0.5 : 1,
            }}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "14px",
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            x
          </button>
        </div>
      </div>
      {diagram.type === "flow" && <FlowDiagram nodes={diagram.nodes} connections={diagram.connections} kpis={diagram.kpis} />}
      {diagram.type === "funnel" && <FunnelDiagram nodes={diagram.nodes} kpis={diagram.kpis} />}
      {diagram.type === "grid" && <GridDiagram nodes={diagram.nodes} kpis={diagram.kpis} />}
      {diagram.type === "timeline" && <TimelineDiagram nodes={diagram.nodes} kpis={diagram.kpis} />}
    </div>
  );
}

// ── expandable panel ────────────────────────────────────────────────────────

function ExpandedPanel({
  itemId,
  itemName,
  itemContext,
  notes,
  timestamp,
  onNotesChange,
  onClose,
  diagrams,
  onDiagramsChange,
  sops,
  onSOPsChange,
}: {
  itemId: string;
  itemName: string;
  itemContext: string;
  notes: string;
  timestamp: string | undefined;
  onNotesChange: (id: string, value: string) => void;
  onClose: () => void;
  diagrams: Record<string, DiagramData>;
  onDiagramsChange: (diagrams: Record<string, DiagramData>) => void;
  sops: SOP[];
  onSOPsChange: (sops: SOP[]) => void;
}) {
  const [enhancing, setEnhancing] = useState(false);
  const [inventing, setInventing] = useState(false);
  const [prevNotes, setPrevNotes] = useState<string | null>(null);
  const [generatingDiagram, setGeneratingDiagram] = useState(false);

  const voiceHandler = useCallback((text: string) => {
    onNotesChange(itemId, notes ? notes + " " + text : text);
  }, [itemId, notes, onNotesChange]);

  const {
    listening: dictating,
    preview: dictationPreview,
    toggle: toggleDictation,
    holdStart: startHoldDictation,
    holdEnd: stopHoldDictation,
  } = useVoice(voiceHandler);

  const handleEnhance = async () => {
    setEnhancing(true);
    setPrevNotes(notes);
    try {
      const res = await fetch("/api/os-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, itemContext, notes }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      onNotesChange(itemId, data.enhanced);
    } catch {
      alert("AI enhancement failed. Please try again.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleInvent = async () => {
    setInventing(true);
    setPrevNotes(notes);
    try {
      const res = await fetch("/api/os-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, itemContext, notes, mode: "invent" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      onNotesChange(itemId, notes ? `${notes.trim()}\n\n${data.enhanced}` : data.enhanced);
    } catch {
      alert("AI invent failed. Please try again.");
    } finally {
      setInventing(false);
    }
  };

  const handleUndo = () => {
    if (prevNotes !== null) {
      onNotesChange(itemId, prevNotes);
      setPrevNotes(null);
    }
  };

  const handleGenerateDiagram = async () => {
    setGeneratingDiagram(true);
    try {
      const res = await fetch("/api/os-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, itemContext, notes, sectionType: itemId.split("-")[0] }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const updated = { ...diagrams, [itemId]: data.diagram };
      onDiagramsChange(updated);
    } catch {
      alert("Diagram generation failed. Please try again.");
    } finally {
      setGeneratingDiagram(false);
    }
  };

  const handleRemoveDiagram = () => {
    const updated = { ...diagrams };
    delete updated[itemId];
    onDiagramsChange(updated);
  };

  const currentDiagram = diagrams[itemId];

  return (
    <div
      style={{
        backgroundColor: "var(--bg)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "8px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <HoldToRecordButton listening={dictating} onHoldStart={startHoldDictation} onHoldEnd={stopHoldDictation} />
            <button
              onClick={toggleDictation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "10px",
                border: `1px solid ${dictating ? "#ef4444" : "var(--border)"}`,
                backgroundColor: dictating ? "#ef444418" : "var(--surface)",
                color: dictating ? "#ef4444" : "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dictating ? "#ef4444" : "var(--muted)" }} />
              {dictating ? "Stop dictation" : "Tap to start dictation"}
            </button>
            <button
              onClick={handleInvent}
              disabled={inventing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #8b5cf6",
                backgroundColor: "rgba(139,92,246,0.1)",
                color: "#8b5cf6",
                fontSize: "12px",
                fontWeight: 600,
                cursor: inventing ? "wait" : "pointer",
                opacity: inventing ? 0.6 : 1,
              }}
            >
              {inventing ? (
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 14, height: 14, border: "2px solid #8b5cf6", borderTopColor: "transparent", borderRadius: "50%" }} />
              ) : (
                <SparkleIcon />
              )}
              {inventing ? "Inventing..." : "Invent with AI"}
            </button>
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid var(--accent)",
              backgroundColor: "var(--accent-bg)",
              color: "var(--accent-text)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: enhancing ? "wait" : "pointer",
              opacity: enhancing ? 0.6 : 1,
            }}
          >
            {enhancing ? (
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 14, height: 14, border: "2px solid var(--accent-text)", borderTopColor: "transparent", borderRadius: "50%" }} />
            ) : (
              <SparkleIcon />
            )}
            {enhancing ? "Enhancing..." : "AI Enhance"}
          </button>
          <button
            onClick={handleGenerateDiagram}
            disabled={generatingDiagram}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #3b82f6",
              backgroundColor: "rgba(59,130,246,0.1)",
              color: "#3b82f6",
              fontSize: "12px",
              fontWeight: 600,
              cursor: generatingDiagram ? "wait" : "pointer",
              opacity: generatingDiagram ? 0.6 : 1,
            }}
          >
            {generatingDiagram ? (
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 14, height: 14, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%" }} />
            ) : (
              <DiagramIcon />
            )}
            {generatingDiagram ? "Generating..." : currentDiagram ? "Regenerate Diagram" : "Generate Diagram"}
          </button>
          {prevNotes !== null && !enhancing && !inventing && (
            <button
              onClick={handleUndo}
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Undo
            </button>
          )}
        </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Hold to dictate for quick capture, or tap once to keep the mic running until you stop it. Use AI to invent missing pieces or enhance the notes you already have.
          </div>
          {dictationPreview && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--accent-text)" }}>Live transcript:</span> {dictationPreview}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
            padding: "0 4px",
          }}
        >
          x
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(itemId, e.target.value)}
        placeholder="Dictate or type the operating notes, SOP ideas, owners, blockers, metrics, and next steps for this part of the system..."
        rows={10}
        style={{
          width: "100%",
          backgroundColor: "var(--surface)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "14px",
          fontSize: "14px",
          lineHeight: "1.7",
          resize: "vertical",
          fontFamily: "inherit",
          outline: "none",
          minHeight: "280px",
        }}
      />
      {timestamp && (
        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "6px" }}>
          Last edited: {new Date(timestamp).toLocaleString()}
        </div>
      )}
      <SOPSection osSection={itemId} sops={sops} onSOPsChange={onSOPsChange} />
      {currentDiagram && (
        <DiagramView
          diagram={currentDiagram}
          onRemove={handleRemoveDiagram}
          onRegenerate={handleGenerateDiagram}
          regenerating={generatingDiagram}
        />
      )}
    </div>
  );
}

// ── flow sub-components (preserved from original) ───────────────────────────

// ── localStorage helpers for item links ─────────────────────────────────────

function loadItemLinks(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("dlf-os-item-links");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveItemLinks(links: Record<string, string[]>) {
  try { localStorage.setItem("dlf-os-item-links", JSON.stringify(links)); } catch {}
}

function ExpandableItem({
  itemName,
  parentId,
  notes,
  timestamps,
  onNotesChange,
  itemLinks,
  onItemLinksChange,
}: {
  itemName: string;
  parentId: string;
  notes: Record<string, string>;
  timestamps: Record<string, string>;
  onNotesChange: (id: string, val: string) => void;
  itemLinks: Record<string, string[]>;
  onItemLinksChange: (links: Record<string, string[]>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newLink, setNewLink] = useState("");
  const itemId = `${parentId}-item-${itemName.replace(/\s+/g, "-").toLowerCase()}`;
  const itemNotes = notes[itemId] || "";
  const links = itemLinks[itemId] || [];

  const voiceHandler = useCallback((text: string) => {
    onNotesChange(itemId, itemNotes ? itemNotes + " " + text : text);
  }, [itemId, itemNotes, onNotesChange]);

  const { listening, toggle } = useVoice(voiceHandler);

  const addLink = () => {
    if (!newLink.trim()) return;
    const updated = { ...itemLinks, [itemId]: [...links, newLink.trim()] };
    onItemLinksChange(updated);
    setNewLink("");
  };

  const removeLink = (idx: number) => {
    const updated = { ...itemLinks, [itemId]: links.filter((_, i) => i !== idx) };
    onItemLinksChange(updated);
  };

  const hasContent = !!itemNotes || links.length > 0;

  return (
    <li style={{ listStyle: "none" }}>
      <div
        onClick={(e) => { e.stopPropagation(); setExpanded(ex => !ex); }}
        className="text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition-all"
        style={{
          backgroundColor: expanded ? "var(--accent-bg)" : "var(--bg)",
          color: expanded ? "var(--accent-text)" : "var(--text-secondary)",
          border: `1px solid ${expanded ? "var(--accent)" : "var(--border-subtle)"}`,
          cursor: "pointer",
        }}
      >
        <span style={{ flex: 1 }}>{itemName}</span>
        {hasContent && !expanded && (
          <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "var(--accent)", flexShrink: 0 }} />
        )}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", opacity: 0.5 }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: "4px",
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Notes + Voice */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</span>
            <MicButton listening={listening} onClick={toggle} size={22} />
          </div>
          <textarea
            value={itemNotes}
            onChange={(e) => onNotesChange(itemId, e.target.value)}
            placeholder={`Notes for ${itemName}...`}
            rows={3}
            style={{
              width: "100%",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              padding: "8px",
              fontSize: "11px",
              lineHeight: "1.5",
              resize: "vertical",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          {timestamps[itemId] && (
            <div style={{ fontSize: "9px", color: "var(--muted)", marginTop: "3px" }}>
              Last edited: {new Date(timestamps[itemId]).toLocaleString()}
            </div>
          )}

          {/* Links/Files */}
          <div style={{ marginTop: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Links & Files
            </span>
            {links.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                {links.map((link, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "11px", color: "var(--accent-text)", textDecoration: "underline", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link}
                    </a>
                    <button
                      onClick={() => removeLink(idx)}
                      style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "12px", padding: "0 2px", flexShrink: 0 }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addLink(); }}
                placeholder="Paste a link or file URL..."
                style={{
                  flex: 1,
                  padding: "5px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "11px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={addLink}
                disabled={!newLink.trim()}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--accent)",
                  backgroundColor: "var(--accent-bg)",
                  color: "var(--accent-text)",
                  fontSize: "10px",
                  fontWeight: 500,
                  cursor: newLink.trim() ? "pointer" : "default",
                  opacity: newLink.trim() ? 1 : 0.4,
                  flexShrink: 0,
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function FlowCard({
  stage,
  isExpanded,
  onToggle,
  notes,
  timestamp,
  onNotesChange,
  diagrams,
  onDiagramsChange,
  tabPrefix,
  allNotes,
  allTimestamps,
  onAllNotesChange,
  itemLinks,
  onItemLinksChange,
}: {
  stage: StageCard;
  isExpanded: boolean;
  onToggle: () => void;
  notes: string;
  timestamp: string | undefined;
  onNotesChange: (id: string, val: string) => void;
  diagrams: Record<string, DiagramData>;
  onDiagramsChange: (d: Record<string, DiagramData>) => void;
  tabPrefix: string;
  allNotes: Record<string, string>;
  allTimestamps: Record<string, string>;
  onAllNotesChange: (id: string, val: string) => void;
  itemLinks: Record<string, string[]>;
  onItemLinksChange: (links: Record<string, string[]>) => void;
}) {
  const borderColor =
    stage.variant === "trigger" ? "#10b981"
    : stage.variant === "end" ? "var(--danger)"
    : stage.variant === "power" ? "var(--warning)"
    : "var(--border)";

  const itemId = `${tabPrefix}-${stage.name}`;

  return (
    <div style={{ minWidth: "180px", maxWidth: "220px", flexShrink: 0 }}>
      <div
        className="card p-5"
        onClick={onToggle}
        style={{
          borderLeft: `3px solid ${borderColor}`,
          cursor: "pointer",
          transition: "box-shadow 0.15s",
          ...(isExpanded ? { boxShadow: `0 0 0 2px var(--accent)` } : {}),
        }}
      >
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
          {stage.variant === "power" && <span style={{ marginRight: "4px" }}>&#9889;</span>}
          {stage.name}
        </div>
        <div className="text-xs mb-3" style={{ color: "var(--muted)" }}>{stage.subtitle}</div>
        <ul className="space-y-1">
          {stage.items.map((item) => (
            <ExpandableItem
              key={item}
              itemName={item}
              parentId={itemId}
              notes={allNotes}
              timestamps={allTimestamps}
              onNotesChange={onAllNotesChange}
              itemLinks={itemLinks}
              onItemLinksChange={onItemLinksChange}
            />
          ))}
        </ul>
        {notes && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", marginTop: 8 }} />}
      </div>
    </div>
  );
}

function FlowArrow({ mobile }: { mobile?: boolean }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center font-light"
      style={{ color: "var(--muted)", fontSize: mobile ? "20px" : "22px", padding: mobile ? "4px 0" : "0 4px", alignSelf: "flex-start", paddingTop: mobile ? undefined : "20px" }}
    >
      {mobile ? "\u2193" : "\u2192"}
    </div>
  );
}

// ── highlight helper ────────────────────────────────────────────────────────

function highlightText(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)", borderRadius: "2px", padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── main page ───────────────────────────────────────────────────────────────

export default function OSPage() {
  const [activeTab, setActiveTab] = useState<TabId>("growth");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [exitStatuses, setExitStatuses] = useState<Record<number, ExitStatus>>({});
  const [diagrams, setDiagrams] = useState<Record<string, DiagramData>>({});
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [itemLinks, setItemLinks] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setNotes(loadNotes());
    setTimestamps(loadTimestamps());
    setExitStatuses(loadExitStatuses());
    setDiagrams(loadDiagrams());
    setSOPs(getInitialSOPs());
    setItemLinks(loadItemLinks());
  }, []);

  useEffect(() => {
    debounceRef.current && clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => { debounceRef.current && clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Handle hash navigation from sidebar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    const validTabs: TabId[] = ["growth", "fulfillment", "power", "ops", "support", "canvas", "exits"];
    if (hash && validTabs.includes(hash as TabId)) {
      setActiveTab(hash as TabId);
    }
  }, []);

  const handleNotesChange = useCallback((id: string, value: string) => {
    setNotes(prev => {
      const next = { ...prev, [id]: value };
      saveNotes(next);
      return next;
    });
    setTimestamps(prev => {
      const next = { ...prev, [id]: new Date().toISOString() };
      saveTimestamps(next);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleDiagramsChange = useCallback((updated: Record<string, DiagramData>) => {
    setDiagrams(updated);
    saveDiagrams(updated);
  }, []);

  const handleSOPsChange = useCallback((updated: SOP[]) => {
    setSOPs(updated);
    saveSOPs(updated);
  }, []);

  const handleItemLinksChange = useCallback((updated: Record<string, string[]>) => {
    setItemLinks(updated);
    saveItemLinks(updated);
  }, []);

  const cycleExitStatus = useCallback((exitNumber: number) => {
    setExitStatuses(prev => {
      const current = prev[exitNumber] ?? DEFAULT_EXITS.find(e => e.number === exitNumber)!.status;
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      const updated = { ...prev, [exitNumber]: next };
      saveExitStatuses(updated);
      return updated;
    });
  }, []);

  const exits: Exit[] = DEFAULT_EXITS.map(e => ({ ...e, status: exitStatuses[e.number] ?? e.status }));

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return SEARCH_INDEX.filter(item => {
      const noteText = notes[item.id] || "";
      return item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || noteText.toLowerCase().includes(q);
    });
  }, [debouncedQuery, notes]);

  const isSearching = debouncedQuery.trim().length > 0;

  const searchVoiceHandler = useCallback((text: string) => setSearchQuery(text), []);
  const { listening: searchListening, toggle: toggleSearchVoice } = useVoice(searchVoiceHandler);

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* pulse + spin keyframes */}
      <style>{`
        @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>DR. LEAD FLOW</p>
        <h1 className="text-4xl font-serif" style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}>Operating System</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>End-to-end business playbook &mdash; acquisition through retention</p>
      </div>

      {/* Search + Voice Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all tabs..."
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "16px" }}
            >
              x
            </button>
          )}
        </div>
        <MicButton listening={searchListening} onClick={toggleSearchVoice} size={38} />
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            {searchResults.length} RESULT{searchResults.length !== 1 ? "S" : ""} FOR &ldquo;{debouncedQuery}&rdquo;
          </p>
          {searchResults.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No matching items found. Try a different search term.</p>
          )}
          {searchResults.map(result => (
            <div key={result.id}>
              <div
                className="card p-4"
                onClick={() => toggleExpand(result.id)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)", border: "1px solid var(--accent)", fontWeight: 500, flexShrink: 0 }}
                  >
                    {result.tabLabel}
                  </span>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {highlightText(result.name, debouncedQuery)}
                  </div>
                  {notes[result.id] && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", flexShrink: 0 }} />}
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {highlightText(result.subtitle.length > 120 ? result.subtitle.slice(0, 120) + "..." : result.subtitle, debouncedQuery)}
                </p>
              </div>
              {expandedId === result.id && (
                <ExpandedPanel
                  itemId={result.id}
                  itemName={result.name}
                  itemContext={result.subtitle}
                  notes={notes[result.id] || ""}
                  timestamp={timestamps[result.id]}
                  onNotesChange={handleNotesChange}
                  onClose={() => toggleExpand(result.id)}
                  diagrams={diagrams}
                  onDiagramsChange={handleDiagramsChange}
                  sops={sops}
                  onSOPsChange={handleSOPsChange}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Tab Bar */}
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-shrink-0 text-sm px-4 py-2 rounded-xl border transition-all"
                  style={{
                    backgroundColor: active ? "var(--accent-bg)" : "var(--surface)",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    color: active ? "var(--accent-text)" : "var(--muted)",
                    fontWeight: active ? "500" : "400",
                    borderBottomWidth: active ? "2px" : "1px",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Growth Engine */}
          {activeTab === "growth" && (
            <div className="space-y-4">
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>CUSTOMER ACQUISITION JOURNEY</p>
                {/* Desktop: horizontal */}
                <div className="hidden md:flex items-start gap-0 overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
                  {growthStages.map((stage, i) => (
                    <div key={stage.name} className="flex items-start gap-0">
                      <FlowCard stage={stage} isExpanded={expandedId === `growth-${stage.name}`} onToggle={() => toggleExpand(`growth-${stage.name}`)} notes={notes[`growth-${stage.name}`] || ""} timestamp={timestamps[`growth-${stage.name}`]} onNotesChange={handleNotesChange} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} tabPrefix="growth" allNotes={notes} allTimestamps={timestamps} onAllNotesChange={handleNotesChange} itemLinks={itemLinks} onItemLinksChange={handleItemLinksChange} />
                      {i < growthStages.length - 1 && <FlowArrow />}
                    </div>
                  ))}
                </div>
                {/* Mobile: vertical */}
                <div className="flex flex-col items-stretch gap-0 md:hidden">
                  {growthStages.map((stage, i) => (
                    <div key={stage.name} className="flex flex-col items-center">
                      <FlowCard stage={stage} isExpanded={expandedId === `growth-${stage.name}`} onToggle={() => toggleExpand(`growth-${stage.name}`)} notes={notes[`growth-${stage.name}`] || ""} timestamp={timestamps[`growth-${stage.name}`]} onNotesChange={handleNotesChange} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} tabPrefix="growth" allNotes={notes} allTimestamps={timestamps} onAllNotesChange={handleNotesChange} itemLinks={itemLinks} onItemLinksChange={handleItemLinksChange} />
                      {i < growthStages.length - 1 && <FlowArrow mobile />}
                    </div>
                  ))}
                </div>
                {/* Expanded panel renders full-width below the flow */}
                {growthStages.map((stage) => {
                  const id = `growth-${stage.name}`;
                  return expandedId === id ? (
                    <ExpandedPanel
                      key={id}
                      itemId={id}
                      itemName={stage.name}
                      itemContext={`${stage.subtitle} | Items: ${stage.items.join(", ")}`}
                      notes={notes[id] || ""}
                      timestamp={timestamps[id]}
                      onNotesChange={handleNotesChange}
                      onClose={() => toggleExpand(id)}
                      diagrams={diagrams}
                      onDiagramsChange={handleDiagramsChange}
                      sops={sops}
                      onSOPsChange={handleSOPsChange}
                    />
                  ) : null;
                })}
              </div>
              <div className="rounded-2xl px-5 py-3 text-xs" style={{ backgroundColor: "var(--accent-bg)", border: "1px solid var(--accent)", color: "var(--accent-text)" }}>
                &#9889; Power stages are critical conversion points. Missing SOPs at these stages are the primary revenue leak.
              </div>
            </div>
          )}

          {/* Tab 2: Fulfillment Engine */}
          {activeTab === "fulfillment" && (
            <div className="space-y-4">
              <div className="card p-6">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>CLIENT DELIVERY JOURNEY</p>
                <div className="hidden md:flex items-start gap-0 overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
                  {fulfillmentStages.map((stage, i) => {
                    const id = `fulfillment-${stage.name}`;
                    return (
                      <div key={stage.name} className="flex items-start gap-0">
                        <FlowCard stage={stage} isExpanded={expandedId === id} onToggle={() => toggleExpand(id)} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} tabPrefix="fulfillment" allNotes={notes} allTimestamps={timestamps} onAllNotesChange={handleNotesChange} itemLinks={itemLinks} onItemLinksChange={handleItemLinksChange} />
                        {i < fulfillmentStages.length - 1 && <FlowArrow />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-col items-stretch gap-0 md:hidden">
                  {fulfillmentStages.map((stage, i) => {
                    const id = `fulfillment-${stage.name}`;
                    return (
                      <div key={stage.name} className="flex flex-col items-center">
                        <FlowCard stage={stage} isExpanded={expandedId === id} onToggle={() => toggleExpand(id)} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} tabPrefix="fulfillment" allNotes={notes} allTimestamps={timestamps} onAllNotesChange={handleNotesChange} itemLinks={itemLinks} onItemLinksChange={handleItemLinksChange} />
                        {i < fulfillmentStages.length - 1 && <FlowArrow mobile />}
                      </div>
                    );
                  })}
                </div>
                {/* Expanded panel renders full-width below the flow */}
                {fulfillmentStages.map((stage) => {
                  const id = `fulfillment-${stage.name}`;
                  return expandedId === id ? (
                    <ExpandedPanel
                      key={id}
                      itemId={id}
                      itemName={stage.name}
                      itemContext={`${stage.subtitle} | Items: ${stage.items.join(", ")}`}
                      notes={notes[id] || ""}
                      timestamp={timestamps[id]}
                      onNotesChange={handleNotesChange}
                      onClose={() => toggleExpand(id)}
                      diagrams={diagrams}
                      onDiagramsChange={handleDiagramsChange}
                      sops={sops}
                      onSOPsChange={handleSOPsChange}
                    />
                  ) : null;
                })}
              </div>
              <div className="rounded-2xl px-5 py-3 text-xs" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Note: Delivery splits into two parallel tracks after onboarding. Both tracks converge at Weekly Tracking.
              </div>
            </div>
          )}

          {/* Tab 3: Power Stages */}
          {activeTab === "power" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>&#9889; CRITICAL CONVERSION POINTS</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {powerStages.map(stage => {
                  const id = `power-${stage.name}`;
                  return (
                    <div key={stage.name}>
                      <div className="card p-5" onClick={() => toggleExpand(id)} style={{ borderLeft: "3px solid var(--warning)", cursor: "pointer" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>&#9889; {stage.name}</div>
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.sopExists ? "#10b98118" : "#ef444418", color: stage.sopExists ? "#10b981" : "#ef4444", border: `1px solid ${stage.sopExists ? "#10b98140" : "#ef444440"}` }}>
                            {stage.sopExists ? "SOP Exists" : "Needs SOP"}
                          </span>
                        </div>
                        <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{stage.why}</p>
                        <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>Owner: <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{stage.owner}</span></div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "var(--muted)" }}>{stage.sopNote}</span>
                          {stage.sopExists && (
                            <a href={SOP_ROOT} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: "var(--accent-text)" }} onClick={e => e.stopPropagation()}>View SOP &rarr;</a>
                          )}
                        </div>
                        {notes[id] && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", marginTop: 8 }} />}
                      </div>
                      {expandedId === id && (
                        <ExpandedPanel itemId={id} itemName={stage.name} itemContext={`${stage.why} | Owner: ${stage.owner} | ${stage.sopNote}`} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} onClose={() => toggleExpand(id)} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} sops={sops} onSOPsChange={handleSOPsChange} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Operation Hub */}
          {activeTab === "ops" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>AIRTABLE BASE CONNECTIONS</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {airtableBases.map(base => {
                  const id = `ops-${base.domain}`;
                  return (
                    <div key={base.domain}>
                      <div className="card p-5" onClick={() => toggleExpand(id)} style={{ cursor: "pointer" }}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>{base.domain}</div>
                            <div className="text-xs" style={{ color: "var(--muted)" }}>{base.base}</div>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: base.deptColor }} />
                        </div>
                        <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{base.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${base.deptColor}15`, color: base.deptColor, border: `1px solid ${base.deptColor}30` }}>{base.dept}</span>
                          <a href={base.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 rounded-lg border transition-colors" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text-secondary)" }} onClick={e => e.stopPropagation()}>Open in Airtable &rarr;</a>
                        </div>
                        {notes[id] && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", marginTop: 8 }} />}
                      </div>
                      {expandedId === id && (
                        <ExpandedPanel itemId={id} itemName={base.domain} itemContext={`${base.base} | ${base.desc} | Dept: ${base.dept}`} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} onClose={() => toggleExpand(id)} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} sops={sops} onSOPsChange={handleSOPsChange} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 5: Support Functions */}
          {activeTab === "support" && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>DEPARTMENT FOLDERS</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supportDepts.map(dept => {
                  const id = `support-${dept.name}`;
                  return (
                    <div key={dept.name}>
                      <div className="card p-5" onClick={() => toggleExpand(id)} style={{ borderLeft: `3px solid ${dept.color}`, cursor: "pointer" }}>
                        <div className="flex items-start gap-3">
                          <span style={{ fontSize: "24px" }}>{dept.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{dept.name}</div>
                            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted)" }}>{dept.desc}</p>
                            <a href={dept.driveUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium transition-colors" style={{ color: dept.color }} onClick={e => e.stopPropagation()}>
                              {dept.driveUrl.includes("skool.com") ? "Open Community \u2192" : "View SOPs \u2192"}
                            </a>
                          </div>
                        </div>
                        {notes[id] && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", marginTop: 8 }} />}
                      </div>
                      {expandedId === id && (
                        <ExpandedPanel itemId={id} itemName={dept.name} itemContext={dept.desc} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} onClose={() => toggleExpand(id)} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} sops={sops} onSOPsChange={handleSOPsChange} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 6: Team Canvas */}
          {activeTab === "canvas" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>HIGH OUTPUT TEAM CANVAS</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Critical Accountability Bullets &mdash; your goal is ZERO with your name</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map(member => {
                  const id = `canvas-${member.name}`;
                  const isCEO = member.name === "Dr. Blade";
                  return (
                    <div key={member.name}>
                      <div
                        className="card p-5"
                        onClick={() => toggleExpand(id)}
                        style={{ borderLeft: `3px solid ${member.color}`, cursor: "pointer", ...(isCEO ? { boxShadow: `0 0 0 1px ${member.color}40` } : {}) }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{member.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{member.role}</div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: `${member.color}20`, color: member.color, border: `1px solid ${member.color}40` }}>
                            {member.bullets.length}
                          </span>
                        </div>
                        {isCEO && (
                          <div className="rounded-lg px-3 py-2 mb-3 text-xs font-medium" style={{ backgroundColor: "#f59e0b18", border: "1px solid #f59e0b40", color: "#f59e0b" }}>
                            TARGET: 0 bullets &mdash; currently {member.bullets.length}
                          </div>
                        )}
                        <ul className="space-y-1.5">
                          {member.bullets.map(bullet => (
                            <li key={bullet} className="text-xs flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: member.color }} />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4">
                          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-subtle)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((member.bullets.length / 8) * 100, 100)}%`, backgroundColor: member.color }} />
                          </div>
                          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                            {member.bullets.length} accountability bullet{member.bullets.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        {notes[id] && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", marginTop: 8 }} />}
                      </div>
                      {expandedId === id && (
                        <ExpandedPanel itemId={id} itemName={member.name} itemContext={`${member.role} | ${member.bullets.join(", ")}`} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} onClose={() => toggleExpand(id)} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} sops={sops} onSOPsChange={handleSOPsChange} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl px-5 py-3 text-xs" style={{ backgroundColor: "var(--accent-bg)", border: "1px solid var(--accent)", color: "var(--accent-text)" }}>
                Ryan Deiss framework: every bullet with your name is work only YOU can do. Delegate, automate, or eliminate everything else until the CEO card reads zero.
              </div>
            </div>
          )}

          {/* Tab 7: Exits */}
          {activeTab === "exits" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>THE 5 EXITS</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your journey from operator to owner</p>
              </div>
              <div className="max-w-2xl space-y-0">
                {exits.map((exit, i) => {
                  const id = `exits-${exit.number}`;
                  const statusColor = exit.status === "COMPLETE" ? "#10b981" : exit.status === "IN PROGRESS" ? "#f59e0b" : "var(--muted)";
                  const statusBg = exit.status === "COMPLETE" ? "#10b98118" : exit.status === "IN PROGRESS" ? "#f59e0b18" : "var(--bg)";
                  const statusBorder = exit.status === "COMPLETE" ? "#10b98140" : exit.status === "IN PROGRESS" ? "#f59e0b40" : "var(--border)";
                  const isLast = i === exits.length - 1;

                  return (
                    <div key={exit.number}>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: "40px" }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: exit.status === "NOT STARTED" ? "var(--surface)" : `${statusColor}20`, border: `2px solid ${statusColor}`, color: statusColor }}>
                            {exit.status === "COMPLETE" ? "\u2713" : exit.number}
                          </div>
                          {!isLast && <div className="w-0.5 flex-1 my-1" style={{ minHeight: "32px", backgroundColor: exit.status === "COMPLETE" ? "#10b981" : "var(--border)" }} />}
                        </div>
                        <div
                          className="card p-4 flex-1 mb-3"
                          onClick={() => toggleExpand(id)}
                          style={{ borderLeft: `3px solid ${statusColor}`, opacity: exit.status === "NOT STARTED" ? 0.65 : 1, cursor: "pointer" }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{exit.title}</div>
                            <button
                              onClick={(e) => { e.stopPropagation(); cycleExitStatus(exit.number); }}
                              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium transition-transform hover:scale-105 active:scale-95"
                              style={{ backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, cursor: "pointer" }}
                              title="Click to change status"
                            >
                              {exit.status}
                            </button>
                          </div>
                          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>{exit.description}</p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{exit.note}</p>
                          {notes[id] && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", marginTop: 8 }} />}
                        </div>
                      </div>
                      {expandedId === id && (
                        <div style={{ marginLeft: "56px", marginBottom: "12px" }}>
                          <ExpandedPanel itemId={id} itemName={exit.title} itemContext={`${exit.description} | ${exit.note}`} notes={notes[id] || ""} timestamp={timestamps[id]} onNotesChange={handleNotesChange} onClose={() => toggleExpand(id)} diagrams={diagrams} onDiagramsChange={handleDiagramsChange} sops={sops} onSOPsChange={handleSOPsChange} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl px-5 py-3 text-xs max-w-2xl" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Framework by Ryan Deiss. Each exit unlocks more freedom. You cannot exit a later stage until the previous one is stable.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
