import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url } = body;
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "Could not extract video ID from URL" },
      { status: 400 }
    );
  }

  let title = "";
  let description = "";

  // Try YouTube Data API if key is available
  if (YOUTUBE_API_KEY) {
    try {
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      if (ytRes.ok) {
        const ytData = await ytRes.json();
        const snippet = ytData.items?.[0]?.snippet;
        if (snippet) {
          title = snippet.title || "";
          description = (snippet.description || "").slice(0, 500);
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback if no YouTube API key or fetch failed
  if (!title) {
    title = `YouTube Video ${videoId}`;
    description = `Video URL: ${url}`;
  }

  // Use Claude to generate thumbnail prompt suggestion
  if (!ANTHROPIC_API_KEY) {
    // Return basic prompt without AI analysis
    return NextResponse.json({
      prompt: `Create a thumbnail for: ${title}. ${description}`,
      title,
      description: description.slice(0, 200),
    });
  }

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20241022",
        max_tokens: 300,
        system:
          "You are a YouTube thumbnail expert. Given a video's title and description, suggest a detailed thumbnail concept. Include: visual composition, text overlay suggestion, color palette, mood, and key elements. Be specific and actionable. Keep it under 150 words.",
        messages: [
          {
            role: "user",
            content: `Video Title: ${title}\n\nDescription: ${description}`,
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return NextResponse.json(
        { error: `Claude API error: ${claudeRes.status}`, detail: errText },
        { status: 502 }
      );
    }

    const claudeData = await claudeRes.json();
    const suggestion =
      claudeData.content?.[0]?.text ||
      `Create a thumbnail for: ${title}`;

    return NextResponse.json({
      prompt: suggestion,
      title,
      description: description.slice(0, 200),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
