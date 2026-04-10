import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEBHOOK_SECRET = process.env.VERCEL_WEBHOOK_SECRET || "";

async function sendTelegram(text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN || !CHAT_ID) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  // Verify Vercel signature
  const rawBody = await req.text();
  if (WEBHOOK_SECRET) {
    const signature = req.headers.get("x-vercel-signature") || "";
    const expected = crypto
      .createHmac("sha1", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { type, deployment, target, url } = payload;

  // Only care about production deploys
  if (target !== "production") {
    return NextResponse.json({ ok: true });
  }

  const deployUrl = deployment?.url || url || "unknown";
  const branch = deployment?.meta?.githubCommitRef || "main";
  const commit = deployment?.meta?.githubCommitMessage || "";
  const commitShort = commit.length > 60 ? commit.slice(0, 60) + "…" : commit;

  if (type === "deployment.error" || payload.deployment?.state === "ERROR") {
    await sendTelegram(
      `🚨 <b>Command Center deploy FAILED</b>\n\n` +
      `Branch: <code>${branch}</code>\n` +
      `Commit: ${commitShort}\n` +
      `URL: ${deployUrl}\n\n` +
      `Check: https://vercel.com/dlfs-projects-2e99dbe5/blade-command-center`
    );
  } else if (type === "deployment.ready" || payload.deployment?.state === "READY") {
    await sendTelegram(
      `✅ <b>Command Center deployed</b>\n\n` +
      `Branch: <code>${branch}</code>\n` +
      `${commitShort ? `Commit: ${commitShort}\n` : ""}` +
      `Live: https://blade-command-center.vercel.app`
    );
  }

  return NextResponse.json({ ok: true });
}
