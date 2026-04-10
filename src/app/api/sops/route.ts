import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SOPStep {
  id: string;
  description: string;
  assignee?: string;
}

export interface SOPRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  checkedSteps: string[]; // step IDs that are checked
}

export interface SOP {
  id: string;
  title: string;
  osSection: string; // links to OS section id e.g. "fulfillment-ONBOARDING"
  steps: SOPStep[];
  runs: SOPRun[];
  createdAt: string;
  updatedAt: string;
}

// ── In-memory store (survives hot-reload in dev, resets on cold boot) ─────────

let sopStore: SOP[] = [];
let initialized = false;

function seedDefaults() {
  if (initialized) return;
  initialized = true;

  const now = new Date().toISOString();

  const seed: Omit<SOP, "runs">[] = [
    {
      id: "sop-client-onboarding",
      title: "Client Onboarding",
      osSection: "fulfillment-ONBOARDING",
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
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

  sopStore = seed.map(s => ({ ...s, runs: [] }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findSOP(id: string): SOP | undefined {
  return sopStore.find(s => s.id === id);
}

// ── GET /api/sops ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  seedDefaults();
  const { searchParams } = new URL(req.url);
  const osSection = searchParams.get("osSection");
  const id = searchParams.get("id");

  if (id) {
    const sop = findSOP(id);
    if (!sop) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sop });
  }

  const result = osSection
    ? sopStore.filter(s => s.osSection === osSection)
    : sopStore;

  return NextResponse.json({ sops: result });
}

// ── POST /api/sops ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  seedDefaults();
  const body = await req.json();
  const { title, osSection, steps } = body as {
    title: string;
    osSection: string;
    steps: { description: string; assignee?: string }[];
  };

  if (!title || !osSection || !Array.isArray(steps)) {
    return NextResponse.json({ error: "Missing required fields: title, osSection, steps" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = `sop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newSOP: SOP = {
    id,
    title,
    osSection,
    steps: steps.map((s, i) => ({
      id: `${id}-step-${i + 1}`,
      description: s.description,
      assignee: s.assignee,
    })),
    runs: [],
    createdAt: now,
    updatedAt: now,
  };

  sopStore.push(newSOP);
  return NextResponse.json({ sop: newSOP }, { status: 201 });
}

// ── PATCH /api/sops ───────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  seedDefaults();
  const body = await req.json();
  const { id, action, runId, stepId, title, steps } = body as {
    id: string;
    action: "start_run" | "check_step" | "uncheck_step" | "complete_run" | "update";
    runId?: string;
    stepId?: string;
    title?: string;
    steps?: { description: string; assignee?: string }[];
  };

  const sop = findSOP(id);
  if (!sop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();

  if (action === "start_run") {
    const newRun: SOPRun = {
      id: `run-${Date.now()}`,
      startedAt: now,
      checkedSteps: [],
    };
    sop.runs = [...sop.runs, newRun];
    sop.updatedAt = now;
    return NextResponse.json({ sop, runId: newRun.id });
  }

  if ((action === "check_step" || action === "uncheck_step") && runId && stepId) {
    const run = sop.runs.find(r => r.id === runId);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    if (action === "check_step") {
      if (!run.checkedSteps.includes(stepId)) {
        run.checkedSteps = [...run.checkedSteps, stepId];
      }
    } else {
      run.checkedSteps = run.checkedSteps.filter(s => s !== stepId);
    }

    // Auto-complete run if all steps checked
    if (run.checkedSteps.length === sop.steps.length && !run.completedAt) {
      run.completedAt = now;
    }

    sop.updatedAt = now;
    return NextResponse.json({ sop });
  }

  if (action === "complete_run" && runId) {
    const run = sop.runs.find(r => r.id === runId);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    run.completedAt = now;
    sop.updatedAt = now;
    return NextResponse.json({ sop });
  }

  if (action === "update") {
    if (title) sop.title = title;
    if (steps) {
      sop.steps = steps.map((s, i) => ({
        id: `${sop.id}-step-${i + 1}`,
        description: s.description,
        assignee: s.assignee,
      }));
    }
    sop.updatedAt = now;
    return NextResponse.json({ sop });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
