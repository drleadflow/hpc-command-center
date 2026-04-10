import { NextRequest, NextResponse } from "next/server";
import { getRevenueData, saveRevenueData } from "@/lib/db";

// Seed data for the 4 known clients (used when no data exists)
const SEED_DATA = {
  clients: [
    {
      id: "healthproceo",
      name: "HealthProceo",
      tier: "agency",
      monthly: 20000,
      status: "active",
      startDate: "2024-01-01",
      notes: "",
    },
    {
      id: "vitality-aesthetics",
      name: "Vitality & Aesthetics",
      tier: "agency",
      monthly: 20000,
      status: "active",
      startDate: "2024-02-01",
      notes: "",
    },
    {
      id: "iv-wellness",
      name: "IV Wellness",
      tier: "coaching",
      monthly: 997,
      status: "active",
      startDate: "2024-03-01",
      notes: "",
    },
    {
      id: "corrective-skin-care",
      name: "Corrective Skin Care",
      tier: "coaching",
      monthly: 997,
      status: "active",
      startDate: "2024-04-01",
      notes: "",
    },
  ],
  waterfall: {
    operations: 40,
    profitFirst: 15,
    ownerPay: 25,
    reinvestment: 20,
    buckets: [
      { key: "operations", label: "Operations", pct: 40, spent: 0 },
      { key: "profitFirst", label: "Profit First", pct: 15, spent: 0 },
      { key: "ownerPay", label: "Owner Pay", pct: 25, spent: 0 },
      { key: "reinvestment", label: "Reinvestment", pct: 20, spent: 0 },
    ],
  },
  monthlyHistory: generateHistory(),
  targetMrr: 50000,
  prevMonthMrr: 40994,
};

function generateHistory() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    // Start from a lower baseline and ramp up
    const base = 35000 + (5 - i) * 1500;
    months.push({ month: label, mrr: base });
  }
  return months;
}

export async function GET() {
  try {
    const data = await getRevenueData();
    if (!data) {
      return NextResponse.json(SEED_DATA);
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    await saveRevenueData(body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Add a new client
    const newClient = await req.json();
    const existing = await getRevenueData();
    const data = existing || SEED_DATA;

    const id =
      newClient.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now();

    const client = {
      id,
      name: newClient.name || "New Client",
      tier: newClient.tier || "coaching",
      monthly: Number(newClient.monthly) || 997,
      status: newClient.status || "active",
      startDate: newClient.startDate || new Date().toISOString().split("T")[0],
      notes: newClient.notes || "",
    };

    const updated = { ...data, clients: [...(data.clients || []), client] };
    await saveRevenueData(updated);
    return NextResponse.json({ ok: true, client });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const existing = await getRevenueData();
    const data = existing || SEED_DATA;
    const updated = {
      ...data,
      clients: (data.clients || []).filter((c: any) => c.id !== id),
    };
    await saveRevenueData(updated);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
