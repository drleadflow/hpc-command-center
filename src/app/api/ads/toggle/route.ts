import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN = process.env.META_USER_TOKEN;

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "META_USER_TOKEN not configured" }, { status: 500 });

  try {
    const { campaignId, status } = await req.json();
    if (!campaignId || !status) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    const res = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, access_token: TOKEN }),
    });

    const data = await res.json();
    if (data.success) return NextResponse.json({ success: true, status });
    return NextResponse.json({ success: false, error: data.error?.message || "Failed" });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
