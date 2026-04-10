import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createContentItem,
  listContentItems,
  type ContentRoutePatchInput,
  updateContentItem,
} from "@/lib/data/content";

const PatchContentSchema = z.object({
  id: z.string().min(1),
  fields: z.record(z.any()).optional(),
  status: z.string().optional(),
}).refine((data) => data.fields !== undefined || data.status !== undefined, {
  message: "Either fields or status must be provided",
});

const PUBLISH_READY_STATUSES = ["✅ Approved", "Approved", "Ready to Publish", "Ready"];

function clean(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map((item) => clean(item)).filter(Boolean).join(", ");
  return String(val);
}

async function notifySlackPublishReady(title: string, hook: string, copy: string, contentType: string, postTime: string | null) {
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  if (!slackBotToken) return;

  const channelName = process.env.SLACK_CONTENT_CHANNEL || "advisors";

  try {
    const listRes = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200", {
      headers: { Authorization: `Bearer ${slackBotToken}` },
    });
    const listData = await listRes.json();
    const channel = listData.channels?.find((entry: any) => entry.name === channelName);
    if (!channel) {
      console.error(`Slack channel #${channelName} not found`);
      return;
    }

    const scheduleNote = postTime
      ? `\n📅 Scheduled: ${new Date(postTime).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`
      : "";
    const hookNote = hook ? `\n🪝 Hook: ${hook}` : "";
    const copyPreview = copy ? `\n✍️ Copy: ${copy.slice(0, 200)}${copy.length > 200 ? "..." : ""}` : "";

    const text =
      `🚀 *Content Ready to Publish*\n\n` +
      `*${title}*\n` +
      `Type: ${contentType || "—"}${scheduleNote}${hookNote}${copyPreview}\n\n` +
      `👉 Review & publish from Content OS: https://blade-command-center.vercel.app/content`;

    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: channel.id, text }),
    });
  } catch (error) {
    console.error("Slack publish notify error:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const items = await listContentItems({ status, limit });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = clean(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const item = await createContentItem(title);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const result = PatchContentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const payload = result.data as ContentRoutePatchInput;
    const updated = await updateContentItem(payload);

    const routeFields = payload.fields || { "⭐️ Status": payload.status };
    const newStatus = clean(routeFields["⭐️ Status"] ?? routeFields.status);

    if (newStatus && PUBLISH_READY_STATUSES.some((status) => newStatus.includes(status))) {
      void notifySlackPublishReady(
        updated.name || updated.title || "Untitled",
        updated.hook,
        updated.copy,
        updated.contentType,
        updated.postTime,
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
