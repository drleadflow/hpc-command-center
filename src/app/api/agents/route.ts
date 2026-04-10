import { NextRequest, NextResponse } from "next/server";

const PAPERCLIP_URL = process.env.PAPERCLIP_URL || "http://localhost:3100";
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || "67c5a7fc-3871-4a6f-a749-b6aaa2216082";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") || "agents";

  try {
    const url =
      endpoint === "dashboard"
        ? `${PAPERCLIP_URL}/api/companies/${COMPANY_ID}/dashboard`
        : `${PAPERCLIP_URL}/api/companies/${COMPANY_ID}/agents`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Paperclip returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Paperclip unreachable", detail: err?.message },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const res = await fetch(
      `${PAPERCLIP_URL}/api/agents/${agentId}/wakeup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Paperclip returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Paperclip unreachable", detail: err?.message },
      { status: 503 }
    );
  }
}
