import { NextResponse } from "next/server";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export async function GET() {
  if (!SLACK_BOT_TOKEN) return NextResponse.json({ error: "SLACK_BOT_TOKEN not configured" }, { status: 500 });

  try {
    const res = await fetch("https://slack.com/api/users.list", {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      next: { revalidate: 300 }, // cache 5 min
    });
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    const members = (data.members || [])
      .filter((m: any) => !m.deleted && !m.is_bot && m.id !== "USLACKBOT")
      .map((m: any) => ({
        id: m.id,
        name: m.real_name || m.name,
        display: m.profile?.display_name || m.name,
        avatar: m.profile?.image_48 || null,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
