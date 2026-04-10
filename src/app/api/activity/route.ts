import { NextResponse } from "next/server";
import { getFile } from "@/lib/github";

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_5701kmm49zjkfnb9jg79h8bfrtv4";

export const dynamic = "force-dynamic";

async function getLyraHistory() {
  if (!ELEVENLABS_KEY) return [];
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}&page_size=10`,
      { headers: { "xi-api-key": ELEVENLABS_KEY } }
    );
    const data = await res.json();
    const convos = data.conversations || [];

    const activities = [];
    for (const c of convos.slice(0, 5)) {
      const cid = c.conversation_id;
      const ts = c.start_time_unix_secs * 1000;
      
      try {
        const detail = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${cid}`,
          { headers: { "xi-api-key": ELEVENLABS_KEY } }
        );
        const d = await detail.json();
        const transcript = d.transcript || [];
        const userMsgs = transcript.filter((m: any) => m.role === "user").map((m: any) => m.message);
        const agentMsgs = transcript.filter((m: any) => m.role === "agent").map((m: any) => m.message);

        if (userMsgs.length > 0) {
          activities.push({
            id: cid,
            source: "lyra",
            timestamp: ts,
            duration: c.call_duration_secs,
            userMessage: userMsgs[0]?.substring(0, 120),
            agentMessage: agentMsgs[0]?.substring(0, 150),
            messageCount: c.message_count,
          });
        }
      } catch {}
    }
    return activities;
  } catch {
    return [];
  }
}

async function getJadeLog() {
  // Read from blade-ops/logs/jade-activity.json
  try {
    const file = await getFile("logs/jade-activity.json");
    if (file) {
      const entries = JSON.parse(file.content);
      return entries.slice(-20).reverse();
    }
  } catch {}
  return [];
}


async function getDevLog() {
  try {
    const file = await getFile("logs/dev-activity.json");
    if (file) {
      const entries = JSON.parse(file.content);
      return entries.slice(0, 15).map((e: any) => ({
        id: e.commit || String(Date.now()),
        source: "code" as const,
        timestamp: new Date(e.timestamp).getTime(),
        action: `[${(e.repo || "code").split("/")[1] || "code"}] ${e.message}`,
        summary: e.details || "",
        userMessage: e.message,
        agentMessage: e.details || "",
      }));
    }
  } catch {}
  return [];
}

export async function GET() {
  const [lyraHistory, jadeLog, devLog] = await Promise.all([
    getLyraHistory(),
    getJadeLog(),
    getDevLog(),
  ]);

  // Combine and sort by timestamp
  const combined = [
    ...lyraHistory.map(a => ({ ...a, source: "lyra" as const })),
    ...jadeLog.map((e: any) => ({ ...e, source: "jade" as const })),
    ...devLog,
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return NextResponse.json({
    activities: combined.slice(0, 20),
    lyraCount: lyraHistory.length,
    jadeCount: jadeLog.length,
  });
}
