import { NextResponse } from "next/server";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

export async function GET() {
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return NextResponse.json({ error: "Mux credentials not configured" }, { status: 500 });
  }

  try {
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");

    const res = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ["public"],
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Mux upload URL error:", text);
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data.url, id: data.data.id });
  } catch (error) {
    console.error("Error creating upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
