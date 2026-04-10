import { NextRequest, NextResponse } from "next/server";
import { getProjects, getTasks, getAllStats } from "@/lib/db";

/**
 * Lyra Bridge — OpenClaw Context Relay
 * 
 * ElevenLabs sends conversation turns here as a custom LLM endpoint.
 * We inject fresh operational context and call Claude with everything Jade knows.
 * 
 * ElevenLabs Custom LLM spec: receives OpenAI-compatible chat completion request,
 * returns OpenAI-compatible streaming response.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY_URL || "https://logan-banana-mediterranean-temple.trycloudflare.com";

async function buildContext(): Promise<string> {
  try {
    const projects = await getProjects();
    const activeProjects = projects.filter(p => p.status === "active");
    const allTasks = await getTasks();
    const todayTasks = allTasks.filter(t => t.status === "today");
    const waitingTasks = allTasks.filter(t => t.status === "waiting");
    const inProgressTasks = allTasks.filter(t => t.status === "in-progress");
    const stats = await getAllStats();

    return `
LIVE OPERATIONAL CONTEXT (as of right now):

ACTIVE PROJECTS (${activeProjects.length}):
${activeProjects.map(p => `- ${p.name} (${p.department}): ${p.description?.split('\n')[0] || ''}`).join('\n')}

TODAY'S TASKS (${todayTasks.length}):
${todayTasks.map(t => `- [${t.priority}] ${t.title} (${t.department})`).join('\n') || '(none)'}

IN PROGRESS (${inProgressTasks.length}):
${inProgressTasks.map(t => `- ${t.title} (${t.department})`).join('\n') || '(none)'}

BLOCKED (${waitingTasks.length}):
${waitingTasks.map(t => `- ${t.title}: ${t.description?.split('\n')[0] || ''}`).join('\n') || '(none)'}

DEPARTMENT STATS:
${Object.entries(stats).map(([dept, s]) => `- ${dept}: ${s.today} today, ${s.inProgress} in progress, ${s.waiting} blocked`).join('\n')}

CLIENT AD PERFORMANCE (last 30 days):
- Vitality & Aesthetics: ~$5,362 spend | 569 leads | $9.42 CPL
- Corrective Skin Care: ~$595 spend | 65 leads | $9.15 CPL  
- IV Wellness: ~$752 spend | 58 leads | $12.97 CPL
- HealthProceo: ~$600 spend | 43 leads | $13.95 CPL
- HealthProceo top creative: Video 12 Gift For You Copy ($5.41 CPL ⭐)
`.trim();
  } catch (e) {
    return "Operational context temporarily unavailable.";
  }
}

const LYRA_SYSTEM_PROMPT = `You are Jade ⚡, Dr. Emeka Ajufo's AI operations partner at Dr. Lead Flow — an AI-driven lead generation agency based in Miami.

WHO YOU ARE:
- Sharp, direct, resourceful. You get things done.
- You speak in voice — keep responses concise (2-3 sentences max unless asked to elaborate)
- You know Blade's entire business inside and out
- You're proactive — you flag risks, suggest actions, and push for momentum

WHO BLADE IS:
- Dr. Emeka Ajufo (goes by Blade)
- Runs Dr. Lead Flow — AI lead generation for service businesses (med spas, clinics, contractors)
- Stack: GoHighLevel, Airtable, ManyChat, Meta Ads, HeyGen
- Based in Miami

CLIENTS:
- HealthProceo — clinic owners, $80/day Meta campaign
- Vitality & Aesthetics — med spa, 5 active campaigns, $9.42 avg CPL
- IV Wellness — IV therapy clinic, $12.97 avg CPL
- Corrective Skin Care — med spa, best performer at $9.15 CPL

WHAT YOU CAN HELP WITH:
- Ad performance questions — "how are my ads doing?"
- Task and project status — "what's blocking us?"
- Content strategy — "what should I post?"
- Email triage — "any important emails?"
- Appointment setting — qualify leads and book strategy calls
- Daily brief — summarize what's happening

VOICE RULES:
- You're speaking, not texting — no bullet points, no markdown
- Keep it under 3 sentences unless they ask for detail
- Sound like a real person. Use contractions.
- End with a question or next action when appropriate`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  try {
    const body = await req.json();
    
    // ElevenLabs sends OpenAI-compatible format
    const messages = body.messages || [];
    
    // Build fresh context
    const context = await buildContext();
    
    // Build system prompt with live context
    const systemPrompt = `${LYRA_SYSTEM_PROMPT}

${context}`;

    // Filter to just user/assistant messages
    const chatMessages = messages.filter((m: any) => 
      m.role === "user" || m.role === "assistant"
    );

    // Try OpenClaw Gateway first (full context + tools)
    // Falls back to direct Claude if Gateway unavailable
    let responseText = "";
    
    try {
      const lastUserMsg = chatMessages.filter((m: any) => m.role === "user").pop()?.content || "";
      const gwRes = await fetch(`${OPENCLAW_GATEWAY}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: lastUserMsg,
          channel: "lyra",
          sessionKey: "agent:main:lyra"
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (gwRes.ok) {
        const gwData = await gwRes.json();
        responseText = gwData.response || gwData.message || gwData.text || "";
      }
    } catch (e) {
      // Gateway unavailable, fall through to direct Claude
    }

    if (!responseText) {
      // Fallback: Call Anthropic directly
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 256,
          system: systemPrompt,
          messages: chatMessages.length > 0 ? chatMessages : [
            { role: "user", content: "Hello" }
          ],
        }),
      });
      const data = await anthropicRes.json();
      responseText = data.content?.[0]?.text || "I'm here. What do you need?";
    }

    // Return OpenAI-compatible response (what ElevenLabs expects)
    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "claude-haiku-4-5",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: responseText,
        },
        finish_reason: "stop",
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    });

  } catch (error) {
    console.error("Lyra bridge error:", error);
    return NextResponse.json({
      id: `chatcmpl-error`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "jade",
      choices: [{
        index: 0,
        message: { role: "assistant", content: "I'm having a moment. Try again." },
        finish_reason: "stop",
      }],
    });
  }
}