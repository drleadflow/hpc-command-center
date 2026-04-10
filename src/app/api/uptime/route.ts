import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface UptimeMonitor {
  id: number;
  friendly_name: string;
  url: string;
  status: number;
  custom_uptime_ratio: string;
  average_response_time: number;
}

interface UptimeResponse {
  monitors: UptimeMonitor[];
  lastChecked: string;
}

export async function GET() {
  if (!process.env.UPTIMEROBOT_API_KEY) {
    return NextResponse.json(
      { error: "UPTIMEROBOT_API_KEY not configured", monitors: [], lastChecked: new Date().toISOString() },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: process.env.UPTIMEROBOT_API_KEY || "",
        format: "json",
        response_times: "1",
        response_times_limit: "1",
        custom_uptime_ratios: "1-7-30",
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`UptimeRobot API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.stat !== "ok") {
      throw new Error(data.error?.message || "UptimeRobot API returned error");
    }

    const monitors: UptimeMonitor[] = (data.monitors || []).map((m: any) => ({
      id: m.id,
      friendly_name: m.friendly_name,
      url: m.url,
      status: m.status,
      custom_uptime_ratio: m.custom_uptime_ratio || "100-100-100",
      average_response_time: m.average_response_time || 0,
    }));

    const result: UptimeResponse = {
      monitors,
      lastChecked: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Uptime API error:", error);
    return NextResponse.json(
      { error: String(error), monitors: [], lastChecked: new Date().toISOString() },
      { status: 500 }
    );
  }
}
