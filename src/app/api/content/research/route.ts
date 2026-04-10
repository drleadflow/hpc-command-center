import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

export const dynamic = "force-dynamic";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Cache research results for 2 hours
let cache: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: "FIRECRAWL_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const niche = body.niche || "medical aesthetics marketing";
  const count = body.count || 5;
  const forceRefresh = body.refresh === true;

  // Serve from cache if valid
  if (cache && !forceRefresh && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  const fc = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });

  try {
    const result = await (fc as any).agent({
      prompt: `Find the top ${count} trending content topics in "${niche}" right now. For each topic:
1. The topic/theme name
2. Why it's trending (what's driving interest)
3. 2-3 example content hooks that would work for social media (Instagram Reels, TikTok, YouTube Shorts)
4. Recommended content format (Reel, carousel, long-form video, thread)
5. Target platforms

Focus on topics that a lead generation agency serving health professionals could create content about. Look at what's performing well on social media, industry blogs, and news.`,
      model: "spark-1-mini",
    });

    const data = {
      niche,
      topics: result?.data || result,
      researchedAt: new Date().toISOString(),
      cached: false,
    };

    cache = { data, fetchedAt: Date.now() };

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[content/research]", err);

    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ ...cache.data, cached: true, stale: true });
    }

    return NextResponse.json({ error: err.message || "Research failed" }, { status: 502 });
  }
}

// GET for quick status check
export async function GET() {
  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ configured: false, error: "FIRECRAWL_API_KEY not set" });
  }

  return NextResponse.json({
    configured: true,
    cached: cache ? {
      niche: cache.data.niche,
      researchedAt: cache.data.researchedAt,
      ageMinutes: Math.round((Date.now() - cache.fetchedAt) / 60000),
      topicCount: Array.isArray(cache.data.topics) ? cache.data.topics.length : "unknown",
    } : null,
  });
}
