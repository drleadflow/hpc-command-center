import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CacheEntry {
  data: YouTubeStats;
  timestamp: number;
}

interface YouTubeStats {
  subscribers: number;
  totalViews: number;
  videoCount: number;
  channelTitle: string;
  thumbnail: string;
  connected: boolean;
  error?: string;
}

// Module-level cache (5 minutes)
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: "YOUTUBE_API_KEY not configured",
      connected: false,
    });
  }

  // Return cached result if still fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?forHandle=doctablademd&part=statistics,snippet&key=${apiKey}`
    );

    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message, connected: false },
        { status: 400 }
      );
    }

    const channel = data.items?.[0];
    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found", connected: false },
        { status: 404 }
      );
    }

    const stats: YouTubeStats = {
      subscribers: parseInt(channel.statistics?.subscriberCount || "0", 10),
      totalViews: parseInt(channel.statistics?.viewCount || "0", 10),
      videoCount: parseInt(channel.statistics?.videoCount || "0", 10),
      channelTitle: channel.snippet?.title || "doctablademd",
      thumbnail: channel.snippet?.thumbnails?.default?.url || "",
      connected: true,
    };

    cache = { data: stats, timestamp: Date.now() };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: String(error), connected: false },
      { status: 500 }
    );
  }
}
