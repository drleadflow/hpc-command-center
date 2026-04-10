import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db-mysql";
import { v4 as uuid } from "uuid";
import type { RowDataPacket } from "mysql2";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

interface VideoAssetRow extends RowDataPacket {
  id: string;
  mux_asset_id: string;
  playback_id: string | null;
  title: string;
  status: "draft" | "in-review" | "revisions-needed" | "approved";
  client: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function GET() {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json({ error: "Mux credentials not configured" }, { status: 500 });
  }

  try {
    // Fetch assets from Mux API
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");
    const muxRes = await fetch("https://api.mux.com/video/v1/assets", {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!muxRes.ok) {
      console.error("Mux API error:", await muxRes.text());
      return NextResponse.json({ error: "Failed to fetch from Mux" }, { status: 500 });
    }

    const muxData = await muxRes.json();
    const muxAssets = muxData.data || [];

    // Fetch our metadata from DB
    const [rows] = await pool.execute<VideoAssetRow[]>("SELECT * FROM video_assets");
    const dbMap = new Map(rows.map((r) => [r.mux_asset_id, r]));

    // Merge Mux data with our metadata
    const combined = muxAssets.map((mux: { id: string; playback_ids?: { id: string }[]; created_at: string }) => {
      const db = dbMap.get(mux.id);
      return {
        mux_asset_id: mux.id,
        playback_id: mux.playback_ids?.[0]?.id || db?.playback_id || null,
        mux_created_at: mux.created_at,
        // Our metadata
        id: db?.id || null,
        title: db?.title || `Video ${mux.id.slice(0, 8)}`,
        status: db?.status || "draft",
        client: db?.client || null,
        created_at: db?.created_at || null,
        updated_at: db?.updated_at || null,
      };
    });

    return NextResponse.json(combined);
  } catch (error) {
    console.error("Error fetching video assets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mux_asset_id, playback_id, title, client } = body;

    if (!mux_asset_id || !title) {
      return NextResponse.json({ error: "mux_asset_id and title are required" }, { status: 400 });
    }

    const id = uuid();
    await pool.execute(
      `INSERT INTO video_assets (id, mux_asset_id, playback_id, title, client) VALUES (?, ?, ?, ?, ?)`,
      [id, mux_asset_id, playback_id || null, title, client || null]
    );

    return NextResponse.json({ id, mux_asset_id, playback_id, title, client, status: "draft" });
  } catch (error) {
    console.error("Error creating video asset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
