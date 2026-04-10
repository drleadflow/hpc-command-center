import { NextResponse } from "next/server";

interface GHLWorkflow {
  id: string;
  name: string;
  status: string;
}

export async function GET() {
  const locationId = process.env.GHL_LOCATION_ID;
  const token = process.env.GHL_API_KEY;

  if (!locationId || !token) {
    return NextResponse.json({
      connected: false,
      error: "Missing GHL credentials",
      workflows: [],
    });
  }

  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/workflows/?locationId=${locationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({
        connected: false,
        error: `GHL API error: ${res.status} - ${errorText}`,
        workflows: [],
      });
    }

    const data = await res.json();
    const workflows: GHLWorkflow[] = (data.workflows || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      status: w.status || "inactive",
    }));

    return NextResponse.json({
      connected: true,
      workflows,
    });
  } catch (error) {
    console.error("GHL API error:", error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      workflows: [],
    });
  }
}
