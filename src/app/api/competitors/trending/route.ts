import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2/acts";
const TIMEOUT_MS = 60_000;

// 30-minute module-level cache
interface CacheEntry {
  data: TrendingResponse;
  fetchedAt: number;
}
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface GoogleTrend {
  term: string;
  value: number;
  direction: "up" | "down" | "flat";
  geo: string;
}

interface TikTokHashtag {
  hashtag: string;
  viewCount: number | null;
  videoCount: number | null;
  trending: boolean;
}

interface TrendingResponse {
  googleTrends: GoogleTrend[];
  tiktokTrending: TikTokHashtag[];
  cached: boolean;
  lastFetched: string;
}

function buildApifyUrl(actorId: string): string {
  return `${APIFY_BASE}/${actorId}/run-sync-post?token=${APIFY_TOKEN}`;
}

async function runActor(
  actorId: string,
  input: Record<string, unknown>
): Promise<unknown[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(buildApifyUrl(actorId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Apify actor ${actorId} returned ${res.status}: ${text}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeGoogleTrends(raw: unknown[]): GoogleTrend[] {
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const i = item as Record<string, unknown>;
      const term =
        (i.keyword as string) ??
        (i.term as string) ??
        (i.query as string) ??
        "";
      const value =
        typeof i.value === "number"
          ? i.value
          : typeof i.interest === "number"
          ? i.interest
          : 50;
      // Apify google-trends-scraper sometimes includes a change or delta field
      const change =
        typeof i.change === "number"
          ? i.change
          : typeof i.delta === "number"
          ? i.delta
          : 0;
      const direction: "up" | "down" | "flat" =
        change > 0 ? "up" : change < 0 ? "down" : "flat";
      const geo = (i.geo as string) ?? "US";
      return { term, value, direction, geo };
    })
    .filter((t) => t.term.length > 0);
}

function normalizeTikTokHashtags(raw: unknown[]): TikTokHashtag[] {
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const i = item as Record<string, unknown>;
      const hashtag =
        ((i.hashtag as string) ?? (i.name as string) ?? "")
          .replace(/^#/, "")
          .trim();
      const viewCount =
        typeof i.viewCount === "number"
          ? i.viewCount
          : typeof i.videoViews === "number"
          ? i.videoViews
          : null;
      const videoCount =
        typeof i.videoCount === "number"
          ? i.videoCount
          : typeof i.posts === "number"
          ? i.posts
          : null;
      const trending =
        typeof i.trending === "boolean" ? i.trending : true;
      return { hashtag, viewCount, videoCount, trending };
    })
    .filter((h) => h.hashtag.length > 0);
}

async function fetchFreshTrending(): Promise<TrendingResponse> {
  const [googleResult, tiktokResult] = await Promise.allSettled([
    runActor("apify/google-trends-scraper", {
      searchTerms: [
        "medical marketing",
        "AI lead generation",
        "healthcare automation",
        "patient acquisition",
        "med spa marketing",
      ],
      geo: "US",
      timeRange: "past7Days",
    }),
    runActor("apify/tiktok-hashtag-scraper", {
      hashtags: [
        "medicalmarketing",
        "medspa",
        "healthcarebusiness",
        "leadgeneration",
        "aiautomation",
      ],
    }),
  ]);

  const googleTrends =
    googleResult.status === "fulfilled"
      ? normalizeGoogleTrends(googleResult.value)
      : [];

  const tiktokTrending =
    tiktokResult.status === "fulfilled"
      ? normalizeTikTokHashtags(tiktokResult.value)
      : [];

  return {
    googleTrends,
    tiktokTrending,
    cached: false,
    lastFetched: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  if (!APIFY_TOKEN) {
    return NextResponse.json(
      { error: "APIFY_TOKEN environment variable is not set" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // Serve from cache if valid and not forcing refresh
  if (cache && !forceRefresh) {
    const age = Date.now() - cache.fetchedAt;
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({ ...cache.data, cached: true });
    }
  }

  try {
    const fresh = await fetchFreshTrending();
    cache = { data: fresh, fetchedAt: Date.now() };
    return NextResponse.json(fresh);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[competitors/trending]", message);

    // Return stale cache rather than failing hard
    if (cache) {
      return NextResponse.json({ ...cache.data, cached: true });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
