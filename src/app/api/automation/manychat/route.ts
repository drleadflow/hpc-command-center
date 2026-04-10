import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.MANYCHAT_TOKEN;

  if (!token) {
    return NextResponse.json({
      connected: false,
      reason: "No token configured",
    });
  }

  try {
    const res = await fetch("https://api.manychat.com/fb/page/getInfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({
        connected: false,
        error: `ManyChat API error: ${res.status} - ${errorText}`,
      });
    }

    const data = await res.json();

    return NextResponse.json({
      connected: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error("ManyChat API error:", error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
