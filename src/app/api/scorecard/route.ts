import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getScorecardData, saveScorecardData } from "@/lib/db";

const ScorecardSchema = z.object({
  departments: z.array(z.any()),
}).passthrough();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekKey = searchParams.get("weekKey");
    if (!weekKey) {
      return NextResponse.json({ error: "weekKey required" }, { status: 400 });
    }
    const data = await getScorecardData(weekKey);
    return NextResponse.json(data || { departments: [] });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekKey = searchParams.get("weekKey");
    if (!weekKey) {
      return NextResponse.json({ error: "weekKey required" }, { status: 400 });
    }
    const body = await req.json();
    const result = ScorecardSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await saveScorecardData(weekKey, result.data);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
