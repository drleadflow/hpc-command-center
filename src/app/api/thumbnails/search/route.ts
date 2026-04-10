import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface ThumbnailResult {
  videoId: string;
  title: string;
  channel: string;
  views: string | null;
  thumbnailUrl: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") || "6"), 20);

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    // Return informative fallback when no API key is configured
    return NextResponse.json(
      {
        results: [],
        error: "YOUTUBE_API_KEY is not configured. Add it to your Vercel environment variables to enable YouTube thumbnail search.",
        fallback: true,
      },
      { status: 200 }
    );
  }

  try {
    // Run two searches in parallel: relevance (best match) + viewCount (most popular)
    const searchParams = (order: string) =>
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " thumbnail")}&type=video&maxResults=${count}&order=${order}&key=${YOUTUBE_API_KEY}`;

    const [relevanceRes, viewsRes] = await Promise.all([
      fetch(searchParams("relevance")),
      fetch(searchParams("viewCount")),
    ]);

    if (!relevanceRes.ok) {
      const errText = await relevanceRes.text();
      return NextResponse.json(
        { error: `YouTube API error: ${relevanceRes.status}`, detail: errText },
        { status: relevanceRes.status }
      );
    }

    const relevanceData = await relevanceRes.json();
    const viewsData = viewsRes.ok ? await viewsRes.json() : { items: [] };

    type SearchItem = {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; thumbnails?: Record<string, { url: string }> };
    };

    // Merge and deduplicate, viewCount results first (higher views)
    const allItems: SearchItem[] = [...(viewsData.items || []), ...(relevanceData.items || [])];
    const seen = new Set<string>();
    const items: SearchItem[] = [];
    for (const item of allItems) {
      const vid = item.id.videoId;
      if (vid && !seen.has(vid)) {
        seen.add(vid);
        items.push(item);
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Fetch video stats (view counts) for all returned video IDs
    const videoIds = items.map((item) => item.id.videoId).join(",");
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    let statsMap: Record<string, string> = {};
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      const statsItems: { id: string; statistics: { viewCount?: string } }[] =
        statsData.items || [];
      for (const s of statsItems) {
        statsMap[s.id] = s.statistics?.viewCount ?? "0";
      }
    }

    const results: ThumbnailResult[] = items.map((item) => {
      const videoId = item.id.videoId;
      const thumbs = item.snippet.thumbnails || {};
      const thumbnailUrl =
        thumbs.high?.url ||
        thumbs.medium?.url ||
        thumbs.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      return {
        videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        views: statsMap[videoId] ?? null,
        thumbnailUrl,
      };
    });

    // Sort by views descending, then trim to requested count
    results.sort((a, b) => {
      const va = parseInt(a.views || "0", 10);
      const vb = parseInt(b.views || "0", 10);
      return vb - va;
    });

    return NextResponse.json({ results: results.slice(0, count) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
