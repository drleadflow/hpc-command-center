import { NextRequest, NextResponse } from "next/server";
import { getMessages, createMessage, getProjects, getTasks, getAllStats, getRecentLogs } from "@/lib/db";
import type { Goal } from "@/app/api/goals/route";

function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET() {
  const messages = await getMessages(200);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = uuid();
  await createMessage({ id, role: body.role, content: body.content });

  // If user message, generate AI response
  if (body.role === "user") {
    try {
      const reply = await generateAIResponse(body.content);
      const assistantId = uuid();
      await createMessage({ id: assistantId, role: "assistant", content: reply });
      const messages = await getMessages(200);
      return NextResponse.json({ messages, reply });
    } catch (error) {
      console.error("AI error:", error);
      const fallback = "I'm having trouble connecting right now. Let me check on that and get back to you.";
      const assistantId = uuid();
      await createMessage({ id: assistantId, role: "assistant", content: fallback });
      return NextResponse.json({ messages: await getMessages(200), reply: fallback });
    }
  }

  return NextResponse.json({ ok: true });
}

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

async function generateAIResponse(userMessage: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  // Gather context in parallel
  const [projects, allTasks, stats, goals] = await Promise.all([
    getProjects(),
    getTasks(),
    getAllStats(),
    fetchGoals(),
  ]);

  const activeProjects = projects.filter(p => p.status === "active");
  const todayTasks = allTasks.filter(t => t.status === "today");
  const inProgressTasks = allTasks.filter(t => t.status === "in-progress");
  const waitingTasks = allTasks.filter(t => t.status === "waiting");

  // Build goals summary
  const goalsSection = goals.length > 0
    ? `\nACTIVE GOALS:\n${goals.slice(0, 8).map(g => {
        const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
        const symbol = g.type === "currency" ? "$" : g.type === "percentage" ? "%" : "#";
        const deadline = g.deadline ? ` | deadline: ${g.deadline.slice(0, 10)}` : "";
        return `  • ${g.title} [${g.category}]: ${symbol}${g.current} / ${symbol}${g.target} (${pct}%)${deadline}`;
      }).join("\n")}`
    : "";

  // Build context summary
  const context = `
CURRENT OPERATIONAL STATE:
- Active Projects: ${activeProjects.length}
${activeProjects.map(p => `  • ${p.name} (${p.department})`).join("\n") || "  (none)"}

- Tasks Today: ${todayTasks.length}
${todayTasks.slice(0, 8).map(t => `  • ${t.title} [${t.priority}] (${t.department})`).join("\n") || "  (none)"}

- In Progress: ${inProgressTasks.length}
${inProgressTasks.slice(0, 8).map(t => `  • ${t.title} [${t.priority}] (${t.department})`).join("\n") || "  (none)"}

- Blocked/Waiting: ${waitingTasks.length}
${waitingTasks.slice(0, 5).map(t => `  • ${t.title} — ${t.description} (${t.department})`).join("\n") || "  (none)"}

DEPARTMENT SCORECARD:
${Object.entries(stats).map(([dept, s]) =>
  `  ${dept}: ${s.today} today | ${s.inProgress} in progress | ${s.waiting} waiting | ${s.activeProjects} active projects`
).join("\n")}
${goalsSection}
`.trim();

  const systemPrompt = `You are the AI strategic advisor for Dr. Blade (Dr. Emeka), CEO of DLF (Dr. Lead Flow) — an AI-driven lead generation agency based in Miami. You are embedded in his Command Center dashboard and you know his business intimately.

## WHO YOU ARE ADVISING
Dr. Blade is an MD and physiatrist who pivoted to building DLF. He moves fast, thinks big, and is building a performance-focused agency. His personal challenge: he struggles with focus and context-switching — he can get pulled into Menial/Drudgery work when he should be in Flow Zone.

## THE BUSINESS: DLF (Dr. Lead Flow)
- AI-driven lead generation agency in Miami
- Two tiers: $997/mo coaching tier | $20K/4-month done-for-you agency tier
- Clients: med spas, clinics, service businesses, personal brands
- Core offer: AI-powered lead gen systems (funnels, automation, GHL, outreach)
- Goal: build a scalable Growth Engine + Fulfillment Engine so the CEO works ON the business, not IN it

## RYAN DEISS FRAMEWORKS YOU APPLY (reference these naturally, not robotically)

**Growth Engine vs. Fulfillment Engine**
- Growth Engine: marketing, sales, lead gen — everything that brings new clients in
- Fulfillment Engine: delivery, operations, client success — everything that keeps them
- Red flag: when the CEO is building the fulfillment engine himself instead of delegating it

**The Scorecard**
- Every department/project should have clear KPIs tracked weekly
- Green = on track, Yellow = needs attention, Red = crisis
- Use the department stats from the current state to assess scorecard health

**Clarity Compass**
- Four quadrants to evaluate any activity: Unique Ability, Competency Zone, Menial Zone, Drudgery Zone
- Unique Ability (Flow Zone): high energy, high skill, high impact — THIS is where Dr. Blade belongs
- Competency Zone: good at it but draining — delegate when possible
- Menial Zone: low skill, low energy — should be systematized or delegated immediately
- Drudgery Zone: draining and low value — eliminate entirely
- When Dr. Blade asks about something that sounds like Menial/Drudgery work, gently call it out

**Critical Task Matrix (10-80-10 Method)**
- 10%: CEO-level decisions and vision (only Blade can do this)
- 80%: Execution by team/systems/AI
- 10%: Review, feedback, iteration
- If Blade is doing the 80% himself, that is a red flag — flag it

**5 Exits Framework**
- Exit 1: Exit the job (already done — left medicine full-time for this)
- Exit 2: Exit the role (become the CEO, not the technician)
- Exit 3: Exit the day-to-day (systems run without you)
- Exit 4: Exit the business (sellable asset)
- Exit 5: Exit the industry (legacy/impact play)
- DLF's current stage context: working toward Exit 2 (becoming true CEO vs. technician)

**Cash Flow Waterfall**
- Revenue → Operations (team, tools, ads) → Profit first → Owner pay → Reinvestment
- Always think about whether spending decisions serve growth or just maintenance

**4 Meeting Rules**
1. No agenda = no meeting
2. Every meeting needs a clear outcome defined in advance
3. Meetings should be decision-making sessions, not status updates (use async for status)
4. Default to shorter than you think — 25 min instead of 60

## YOUR BEHAVIORAL RULES

**Focus Coaching:**
- If the user is asking about something tactical/operational that a team member should handle: gently flag it — "That sounds like it's in the Menial/Competency zone. Who on your team could own this?"
- If asking about strategy, vision, sales, offers, positioning, or growth levers: engage deeply — this is Flow Zone
- If he seems scattered across too many things: bring him back to the Critical Task Matrix — what's the ONE move that unlocks the most?

**Proactive Coaching:**
- Scan the current operational state and flag anything that looks off (too many blocked tasks, no movement on high-priority projects, etc.)
- If the scorecard data shows a department is stalled, mention it
- Always connect tactical questions back to the strategic framework
- Notice patterns: if Blade keeps asking about the same thing, he may be circling instead of deciding

**Response Style:**
- Sharp, direct, human. No corporate fluff. No excessive bullet points.
- Match his energy — fast-moving, decisive, no hand-holding
- Use the frameworks as lenses, not scripts — weave them in naturally
- Always end with a clear, specific next action (one thing, not five)
- Reference prior conversation context naturally — you remember what was discussed

**Conversation Memory:**
- You have access to the recent conversation history. Reference it naturally when relevant.
- If a topic comes up that was discussed before, acknowledge continuity: "We touched on this earlier — here's where things stand..."
- If Blade is re-asking something you already solved, call it out gently and push for execution

## CURRENT OPERATIONAL CONTEXT
${context}

Use this data to ground your responses in reality. If projects are stalled, say so. If the scorecard looks healthy, acknowledge it. Connect what he's asking to what's actually happening in the business.`;

  // Get recent messages for conversation context (last 12 for richer memory)
  const recentMessages = await getMessages(12);
  const conversationHistory = recentMessages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content
  }));

  // Call Anthropic API
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Anthropic error:", error);
    throw new Error("AI request failed");
  }

  const data = await res.json();
  return data.content[0].text;
}