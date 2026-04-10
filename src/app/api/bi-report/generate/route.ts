import { NextResponse } from "next/server";
import { getProjects, getTasks, getAllStats } from "@/lib/db";
import { getRevenueData } from "@/lib/db";
import type { Goal } from "@/app/api/goals/route";

export const dynamic = "force-dynamic";

const AD_ACCOUNTS = [
  { name: "HealthProceo", id: "act_2549125178703715" },
  { name: "Vitality & Aesthetics", id: "act_744129051650635" },
  { name: "IV Wellness", id: "act_1707066474017114" },
  { name: "Corrective Skin Care", id: "act_361114249531815" },
];

const BI_SYSTEM_PROMPT = `You are the BI Council for DLF (Dr. Lead Flow), an AI lead-gen agency run by Dr. Blade (Dr. Emeka Ajufo), an MD and physiatrist who pivoted from medicine to build a performance-focused AI lead generation business in Miami.

Generate a weekly executive briefing for the CEO, Dr. Blade. Structure it exactly as follows with these section headers:

## Executive Summary
3 data-backed bullet points. What happened this week, the most important number, and the most urgent issue.

## Revenue & Pipeline Health
Current MRR, active clients, pipeline value if known. Trend direction. Flag any churn risk.

## Ad Performance Scorecard
One row per client: Client | Spend | CPL | Leads | Status (Green/Yellow/Red). Flag any account burning budget with no results.

## Content Output
Posts published vs. target. Top performing content type. Content pipeline health (backlog vs. in-production vs. review).

## Team Productivity
Tasks completed vs. open. Blocked items. Which department is the bottleneck right now.

## Risks & Blockers
Top 3 risks that could derail the week. Be specific and direct — no soft language.

## Top 3 Priorities for Next Week
Exactly 3 items, ranked by impact. Each one should be specific and actionable. Frame using the Ryan Deiss 10-80-10 method — identify what Dr. Blade personally needs to own vs. what should be delegated.

Rules:
- Direct, data-driven, no fluff. Dr. Blade moves fast.
- Use Ryan Deiss frameworks naturally: Growth Engine vs. Fulfillment Engine, Clarity Compass (Unique Ability vs. Drudgery), Exit 2 progress (CEO vs. technician).
- If something is in the red, say so plainly.
- Keep each section concise — this is a brief, not a book report.`;

async function fetchGoals(): Promise<Goal[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/goals`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchAdData(accountId: string, accountName: string) {
  const token = process.env.META_USER_TOKEN;
  if (!token) return { name: accountName, error: "no token" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpm,actions,cost_per_action_type&date_preset=last_7d&access_token=${token}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { name: accountName, error: "api error" };

    const data = await res.json();
    const ins = data.data?.[0] || {};
    const spend = parseFloat(ins.spend || "0");
    const leads = parseInt(ins.actions?.find((a: any) => a.action_type === "lead")?.value || "0");
    const cplRaw = ins.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
    const cpl = cplRaw ? parseFloat(parseFloat(cplRaw).toFixed(2)) : null;
    const cpm = parseFloat(parseFloat(ins.cpm || "0").toFixed(2));

    return { name: accountName, spend, leads, cpl, cpm };
  } catch {
    return { name: accountName, error: "fetch failed" };
  }
}

async function fetchContentStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/content`, { cache: "no-store" });
    if (!res.ok) return null;
    const items = await res.json();
    if (!Array.isArray(items)) return null;

    const statusCounts: Record<string, number> = {};
    for (const item of items) {
      const s = item.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    return {
      total: items.length,
      statusCounts,
    };
  } catch {
    return null;
  }
}

function buildKPIContext(data: {
  projects: any[];
  allTasks: any[];
  stats: any;
  goals: Goal[];
  adResults: any[];
  contentStats: any;
  revenueData: any;
}): string {
  const { projects, allTasks, stats, goals, adResults, contentStats, revenueData } = data;

  const activeProjects = projects.filter(p => p.status === "active");
  const todayTasks = allTasks.filter(t => t.status === "today");
  const inProgressTasks = allTasks.filter(t => t.status === "in-progress");
  const waitingTasks = allTasks.filter(t => t.status === "waiting");
  const completedTasks = allTasks.filter(t => t.status === "completed");
  const highPriorityBlocked = waitingTasks.filter(t => t.priority === "high");

  const goalsSection = goals.length > 0
    ? `\nACTIVE GOALS:\n${goals.slice(0, 10).map(g => {
        const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
        const symbol = g.type === "currency" ? "$" : g.type === "percentage" ? "%" : "#";
        const deadline = g.deadline ? ` | deadline: ${g.deadline.slice(0, 10)}` : "";
        return `  - ${g.title} [${g.category}]: ${symbol}${g.current} / ${symbol}${g.target} (${pct}%)${deadline}`;
      }).join("\n")}`
    : "\nACTIVE GOALS: None recorded";

  const adSection = adResults.map(a => {
    if (a.error) return `  - ${a.name}: data unavailable`;
    const status = a.cpl === null
      ? "YELLOW (no leads)"
      : a.cpl < 15 ? "GREEN"
      : a.cpl < 30 ? "YELLOW"
      : "RED";
    return `  - ${a.name}: $${a.spend?.toFixed(2) || 0} spend | ${a.leads} leads | CPL $${a.cpl ?? "N/A"} | ${status}`;
  }).join("\n");

  const contentSection = contentStats
    ? `Total items: ${contentStats.total}\n${Object.entries(contentStats.statusCounts).map(([s, c]) => `  - ${s}: ${c}`).join("\n")}`
    : "Content data unavailable";

  const revenueSection = revenueData
    ? `MRR: $${revenueData.mrr || "unknown"} | Active clients: ${revenueData.activeClients || "unknown"} | Pipeline: $${revenueData.pipeline || "unknown"}`
    : "Revenue data not yet recorded in system";

  return `
REPORT DATE: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

PROJECTS:
  Active: ${activeProjects.length} / Total: ${projects.length}
${activeProjects.slice(0, 10).map(p => `  - ${p.name} (${p.department})`).join("\n") || "  (none)"}

TASKS:
  Today: ${todayTasks.length} | In Progress: ${inProgressTasks.length} | Waiting/Blocked: ${waitingTasks.length} | Completed: ${completedTasks.length}
  High-priority blocked: ${highPriorityBlocked.length}
${highPriorityBlocked.slice(0, 5).map(t => `  - [BLOCKED] ${t.title} (${t.department})`).join("\n")}

DEPARTMENT SCORECARD:
${Object.entries(stats).map(([dept, s]: [string, any]) =>
  `  ${dept}: ${s.today} today | ${s.inProgress} in-progress | ${s.waiting} waiting | ${s.activeProjects} active projects`
).join("\n")}
${goalsSection}

AD PERFORMANCE (last 7 days):
${adSection || "  No ad data available"}

CONTENT PIPELINE:
${contentSection}

REVENUE & PIPELINE:
${revenueSection}
`.trim();
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    // Gather all KPIs in parallel
    const [projects, allTasks, stats, goals, ...adResults] = await Promise.all([
      getProjects(),
      getTasks(),
      getAllStats(),
      fetchGoals(),
      ...AD_ACCOUNTS.map(a => fetchAdData(a.id, a.name)),
    ]);

    // Content stats and revenue in parallel (non-critical, don't block)
    const [contentStats, revenueData] = await Promise.all([
      fetchContentStats(),
      getRevenueData(),
    ]);

    const kpiContext = buildKPIContext({
      projects,
      allTasks,
      stats,
      goals,
      adResults,
      contentStats,
      revenueData,
    });

    // Call Anthropic Claude
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: BI_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is the current operational data for DLF. Generate the weekly BI Council executive briefing now.\n\n${kpiContext}`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic error:", errText);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const aiData = await anthropicRes.json();
    const reportContent: string = aiData.content[0].text;
    const generatedAt = new Date().toISOString();

    // Post summary to Slack (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const slackSummary = `*DLF BI Council Weekly Report* — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}\n\nReport generated. View full report in the Command Center: https://blade-command-center.vercel.app\n\n${reportContent.split("## Top 3 Priorities")[1]?.split("\n").slice(0, 8).join("\n") || ""}`;

    fetch(`${baseUrl}/api/slack/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignees: [{ id: process.env.BLADE_SLACK_USER_ID || "U08BLADE001", name: "Dr. Blade" }],
        message: slackSummary,
        schedule: "now",
      }),
    }).catch(() => {
      // Slack notification is best-effort — don't fail report generation
    });

    return NextResponse.json({
      report: reportContent,
      generated: generatedAt,
      kpiSnapshot: {
        activeProjects: projects.filter(p => p.status === "active").length,
        totalTasks: allTasks.length,
        blockedTasks: allTasks.filter(t => t.status === "waiting").length,
        adClients: adResults.length,
      },
    });
  } catch (err: any) {
    console.error("BI report generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
