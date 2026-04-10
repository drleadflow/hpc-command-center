import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db-mysql";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, status, client } = body;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (client !== undefined) {
      updates.push("client = ?");
      values.push(client);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(params.id);
    await pool.execute(
      `UPDATE video_assets SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating video asset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
