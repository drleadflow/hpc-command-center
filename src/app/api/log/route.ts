import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFile, upsertFile } from "@/lib/github";

const LogSchema = z.object({
  action: z.string().min(1),
  by: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LogSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    const { action, by } = result.data;

    const logPath = "logs/jade-activity.json";
    const file = await getFile(logPath);
    const existing = file ? JSON.parse(file.content) : [];

    const entry = {
      id: `j${Date.now()}`,
      timestamp: Date.now(),
      action: action.trim(),
      by: by?.trim() || "team",
      type: "manual",
    };

    existing.unshift(entry);
    const updated = existing.slice(0, 200); // keep last 200 entries

    const ok = await upsertFile(
      logPath,
      JSON.stringify(updated, null, 2),
      `log: ${action.trim().substring(0, 72)}`,
      file?.sha
    );

    if (!ok) {
      return NextResponse.json({ error: "Failed to push to GitHub" }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
