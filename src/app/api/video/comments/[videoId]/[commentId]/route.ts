import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db-mysql";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { videoId: string; commentId: string } }
) {
  try {
    const body = await req.json();
    const { resolved } = body;

    if (resolved === undefined) {
      return NextResponse.json({ error: "resolved field is required" }, { status: 400 });
    }

    await pool.execute(
      "UPDATE video_comments SET resolved = ? WHERE id = ?",
      [resolved ? 1 : 0, params.commentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
