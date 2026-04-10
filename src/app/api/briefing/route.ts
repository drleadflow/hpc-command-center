import { NextResponse } from "next/server";
import { getAllStats, getTasks, getActiveProjects } from "@/lib/db";

// 60-second module-level cache
let cachedBriefing: {
  briefing: string;
  generated_at: string;
  stats: { tasksToday: number; blocked: number; activeProjects: number };
} | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  const now = Date.now();

  if (cachedBriefing && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedBriefing);
  }

  try {
    const [allStats, todayTasks, activeTasks, blockedTasks, activeProjects] = await Promise.all([
      getAllStats(),
      getTasks({ status: "today" }),
      getTasks({ status: "in-progress" }),
      getTasks({ status: "waiting" }),
      getActiveProjects(),
    ]);

    const tasksToday = todayTasks.length;
    const blocked = blockedTasks.length;
    const activeProjectCount = activeProjects.length;

    const highPriority = [...todayTasks, ...activeTasks]
      .filter((t) => t.priority === "high")
      .slice(0, 3)
      .map((t) => `"${t.title}" (${t.department})`)
      .join(", ");

    const blockerTitles = blockedTasks
      .slice(0, 2)
      .map((t) => `"${t.title}"`)
      .join(", ");

    const deptSummary = Object.entries(allStats)
      .map(([dept, s]) => `${dept}: ${s.today} due, ${s.inProgress} in-progress, ${s.waiting} waiting`)
      .join(" | ");

    const prompt = `You are a concise executive assistant. Generate a morning briefing for Dr. Blade (CEO).

Operational data:
- Tasks due today: ${tasksToday}
- Blocked tasks: ${blocked}${blockerTitles ? ` (${blockerTitles})` : ""}
- Active projects: ${activeProjectCount}
- High-priority items: ${highPriority || "none"}
- Department summary: ${deptSummary}

Write exactly 3-4 sentences in this style:
"Good morning Dr. Blade. You have ${tasksToday} task${tasksToday !== 1 ? "s" : ""} due today with ${blocked} blocked. [Most important thing to know]. [One clear, actionable recommendation]."

Be direct. No bullet points. No markdown. Plain sentences only.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[briefing] Anthropic error:", errText);
      throw new Error("Anthropic request failed");
    }

    const json = await res.json();
    const briefingText: string =
      json.content?.[0]?.text?.trim() ?? "Good morning Dr. Blade.";

    const result = {
      briefing: briefingText,
      generated_at: new Date().toISOString(),
      stats: {
        tasksToday,
        blocked,
        activeProjects: activeProjectCount,
      },
    };

    cachedBriefing = result;
    cacheTimestamp = now;

    return NextResponse.json(result);
  } catch (error) {
    console.error("[briefing] error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
