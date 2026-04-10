import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationType,
} from "@/lib/db";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const NotificationTypeEnum = z.enum([
  "lead_move",
  "task_overdue",
  "spend_alert",
  "deploy",
  "general",
]);

const CreateNotificationSchema = z.object({
  type: NotificationTypeEnum,
  title: z.string().min(1),
  message: z.string().min(1),
  link: z.string().optional(),
});

const PatchNotificationSchema = z.object({
  id: z.string().optional(),
  markAllRead: z.boolean().optional(),
});

async function sendSlackAlert(title: string, message: string) {
  if (!SLACK_BOT_TOKEN) return;
  // Post to #advisors or first available channel as a broadcast
  try {
    // Use chat.postMessage to a known channel — fall back silently if not configured
    const channelRes = await fetch("https://slack.com/api/conversations.list?limit=20&types=public_channel", {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    });
    const channelData = await channelRes.json();
    const advisors = channelData?.channels?.find((c: any) => c.name === "advisors");
    const channel = advisors?.id || channelData?.channels?.[0]?.id;
    if (!channel) return;

    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        text: `*${title}*\n${message}`,
      }),
    });
  } catch {
    // Non-fatal
  }
}

export async function GET() {
  const list = await getNotifications(50);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = CreateNotificationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  }
  const { type, title, message, link } = result.data;

  const notification = await createNotification({ type: type as NotificationType, title, message, link });

  // Slack integration for high-signal types
  if (type === "lead_move" || type === "spend_alert") {
    await sendSlackAlert(title, message);
  }

  return NextResponse.json(notification, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const result = PatchNotificationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  }
  const { id, markAllRead } = result.data;

  if (markAllRead) {
    await markAllNotificationsRead();
    return NextResponse.json({ ok: true });
  }

  if (id) {
    const updated = await markNotificationRead(id);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 });
}
