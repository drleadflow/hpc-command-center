import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SlackNotifySchema = z.object({
  assignees: z.array(z.union([
    z.object({ id: z.string(), name: z.string() }),
    z.string(),
  ])).min(1),
  cardTitle: z.string().optional(),
  cardType: z.string().optional(),
  cardClient: z.string().optional(),
  message: z.string().optional(),
  schedule: z.enum(["now", "morning"]).optional(),
});

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

async function lookupSlackUser(slackUserId: string): Promise<string | null> {
  // Already a Slack user ID — just return it directly
  return slackUserId || null;
}

async function openDM(userId: string): Promise<string | null> {
  const res = await fetch("https://slack.com/api/conversations.open", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ users: userId }),
  });
  const data = await res.json();
  return data.ok ? data.channel?.id : null;
}

async function sendSlackMessage(channelId: string, text: string, scheduleTs?: number) {
  const endpoint = scheduleTs
    ? "https://slack.com/api/chat.scheduleMessage"
    : "https://slack.com/api/chat.postMessage";

  const body: any = { channel: channelId, text };
  if (scheduleTs) body.post_at = scheduleTs;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  if (!SLACK_BOT_TOKEN) return NextResponse.json({ error: "SLACK_BOT_TOKEN not configured" }, { status: 500 });

  try {
    const body = await req.json();
    const result = SlackNotifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    const { assignees, cardTitle, cardType, cardClient, message, schedule } = result.data;

    // Build schedule timestamp if "morning" (9:00 AM ET next occurrence)
    let scheduleTs: number | undefined;
    if (schedule === "morning") {
      const now = new Date();
      // 9am ET = UTC-4 (EDT) = 13:00 UTC, or UTC-5 (EST) = 14:00 UTC
      const etOffset = -4; // assuming EDT; adjust as needed
      const morning = new Date();
      morning.setUTCHours(13 - etOffset, 0, 0, 0); // 9am ET
      if (morning <= now) morning.setUTCDate(morning.getUTCDate() + 1); // push to tomorrow
      scheduleTs = Math.floor(morning.getTime() / 1000);
    }

    const defaultMsg = message ||
      `👋 Hey! You've been assigned to a media piece on the Command Center.\n\n` +
      `*📋 ${cardTitle}*\n` +
      `Type: ${cardType} | Client: ${cardClient}\n\n` +
      `Check the media board: https://blade-command-center.vercel.app/media`;

    // assignees is now array of { id, name } objects from Slack members API
    const results: { member: string; status: string; error?: string }[] = [];

    for (const assignee of assignees) {
      const userId = typeof assignee === "string" ? assignee : assignee.id;
      const memberName = typeof assignee === "string" ? assignee : assignee.name;

      if (!userId) {
        results.push({ member: memberName, status: "error", error: "No Slack user ID" });
        continue;
      }

      const dmChannel = await openDM(userId);
      if (!dmChannel) {
        results.push({ member: memberName, status: "error", error: "Could not open DM" });
        continue;
      }

      const slackRes = await sendSlackMessage(dmChannel, defaultMsg, scheduleTs);
      if (slackRes.ok) {
        results.push({ member: memberName, status: schedule === "morning" ? "scheduled" : "sent" });
      } else {
        results.push({ member: memberName, status: "error", error: slackRes.error });
      }
    }

    return NextResponse.json({ results, scheduleTs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
