import { NextRequest, NextResponse } from "next/server";
import pool, { initVideoTables } from "@/lib/db-mysql";
import { v4 as uuid } from "uuid";
import type { RowDataPacket } from "mysql2";

interface CommentRow extends RowDataPacket {
  id: string;
  video_id: string;
  name: string;
  comment: string;
  timestamp_secs: number;
  resolved: boolean;
  parent_id: string | null;
  created_at: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    await initVideoTables();

    const [rows] = await pool.execute<CommentRow[]>(
      "SELECT * FROM video_comments WHERE video_id = ? ORDER BY timestamp_secs ASC, created_at ASC",
      [params.videoId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    await initVideoTables();

    const body = await req.json();
    const { name, comment, timestamp_secs, parent_id } = body;

    if (!name || !comment || timestamp_secs === undefined) {
      return NextResponse.json(
        { error: "name, comment, and timestamp_secs are required" },
        { status: 400 }
      );
    }

    const id = uuid();
    await pool.execute(
      `INSERT INTO video_comments (id, video_id, name, comment, timestamp_secs, parent_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, params.videoId, name, comment, timestamp_secs, parent_id || null]
    );

    return NextResponse.json({
      id,
      video_id: params.videoId,
      name,
      comment,
      timestamp_secs,
      resolved: false,
      parent_id: parent_id || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
