import { NextResponse } from "next/server";
import { getOutreachDashboard } from "@/lib/data/outreach";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getOutreachDashboard();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
