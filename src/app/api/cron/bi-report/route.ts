// Vercel Cron Job endpoint for weekly BI report generation.
//
// To enable automatic weekly generation, add this to vercel.json:
//
// {
//   "crons": [
//     {
//       "path": "/api/cron/bi-report",
//       "schedule": "0 9 * * 1"
//     }
//   ]
// }
//
// This runs every Monday at 9:00 AM UTC.
// Set CRON_SECRET in Vercel env vars to secure this endpoint.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  // Require secret or Vercel cron header
  if (cronSecret) {
    if (secret !== cronSecret && !isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/bi-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Cron BI report failed:", err);
      return NextResponse.json(
        { success: false, error: err.error || "Report generation failed" },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log(`[cron/bi-report] Report generated at ${data.generated}`);

    return NextResponse.json({
      success: true,
      generated: data.generated,
      saved: data.saved,
    });
  } catch (err: any) {
    console.error("[cron/bi-report] Unexpected error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
