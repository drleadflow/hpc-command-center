import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TikTokStats {
  followers: number;
  likes: number;
  videos: number;
  username: string;
  connected: boolean;
  error?: string;
}

interface InstagramStats {
  followers: number;
  posts: number;
  username: string;
  connected: boolean;
  error?: string;
}

interface YouTubeApifyStats {
  subscribers: number;
  views: number;
  videos: number;
  channelTitle: string;
  connected: boolean;
  error?: string;
}

interface TwitterStats {
  followers: number;
  tweets: number;
  username: string;
  name: string;
  verified: boolean;
  connected: boolean;
  error?: string;
}

interface LinkedInStats {
  followers: number;
  connections: number;
  name: string;
  connected: boolean;
  error?: string;
}

interface ApifySocialResponse {
  tiktok: TikTokStats;
  instagram: InstagramStats;
  youtube: YouTubeApifyStats;
  linkedin: LinkedInStats;
  twitter: TwitterStats;
  cached: boolean;
  lastFetched: string;
}

interface CacheEntry {
  data: ApifySocialResponse;
  timestamp: number;
}

// ─── Module-level cache (15 minutes) ─────────────────────────────────────────

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 60_000;

// ─── Apify helper ─────────────────────────────────────────────────────────────

async function runApifyActor(
  token: string,
  actorId: string,
  input: Record<string, unknown>
): Promise<unknown[]> {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&format=json&clean=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Apify responded ${res.status} for actor ${actorId}`);
    }

    const data = await res.json();
    // Apify dataset endpoint returns an array directly
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

// ─── Per-platform parsers ─────────────────────────────────────────────────────

function parseTikTok(items: unknown[]): TikTokStats {
  const item = items[0] as Record<string, unknown> | undefined;
  if (!item) throw new Error("No TikTok data returned");

  // clockworks/tiktok-profile-scraper field names
  const followers =
    (item.fans as number) ??
    (item.followerCount as number) ??
    (item.followers as number) ??
    0;
  const likes =
    (item.heart as number) ??
    (item.heartCount as number) ??
    (item.likes as number) ??
    0;
  const videos =
    (item.video as number) ??
    (item.videoCount as number) ??
    (item.videos as number) ??
    0;
  const username =
    (item.uniqueId as string) ??
    (item.username as string) ??
    "doctablademd";

  return { followers, likes, videos, username, connected: true };
}

function parseInstagram(items: unknown[]): InstagramStats {
  const item = items[0] as Record<string, unknown> | undefined;
  if (!item) throw new Error("No Instagram data returned");

  // apify/instagram-profile-scraper field names
  const followers =
    (item.followersCount as number) ??
    (item.followers as number) ??
    0;
  const posts =
    (item.postsCount as number) ??
    (item.mediaCount as number) ??
    (item.posts as number) ??
    0;
  const username =
    (item.username as string) ?? "doctablamd";

  return { followers, posts, username, connected: true };
}

function parseYouTube(items: unknown[]): YouTubeApifyStats {
  const item = items[0] as Record<string, unknown> | undefined;
  if (!item) throw new Error("No YouTube data returned");

  // streamers/youtube-channel-scraper field names
  const subscribers =
    (item.numberOfSubscribers as number) ??
    (item.subscriberCount as number) ??
    (item.subscribers as number) ??
    0;
  const views =
    (item.channelTotalViews as number) ??
    (item.viewCount as number) ??
    (item.views as number) ??
    0;
  const videos =
    (item.channelTotalVideos as number) ??
    (item.videoCount as number) ??
    (item.videos as number) ??
    0;
  const channelTitle =
    (item.channelName as string) ??
    (item.title as string) ??
    "doctablademd";

  return { subscribers, views, videos, channelTitle, connected: true };
}

function parseLinkedIn(items: unknown[]): LinkedInStats {
  const item = items[0] as Record<string, unknown> | undefined;
  if (!item) throw new Error("No LinkedIn data returned");

  // anchor/linkedin-profile-scraper field names
  const followers =
    (item.followersCount as number) ??
    (item.followers as number) ??
    0;
  const connections =
    (item.connectionsCount as number) ??
    (item.connections as number) ??
    0;
  const name =
    (item.fullName as string) ??
    (item.name as string) ??
    "Emeka Ajufo";

  return { followers, connections, name, connected: true };
}

function parseTwitter(items: unknown[]): TwitterStats {
  const item = items[0] as Record<string, unknown> | undefined;
  if (!item) throw new Error("No Twitter data returned");
  if (item.status === 'error') throw new Error(item.error as string || "Twitter scrape failed");

  return {
    followers: (item.followers_count as number) ?? 0,
    tweets: (item.tweets_count as number) ?? 0,
    username: (item.username as string) ?? "",
    name: (item.name as string) ?? "",
    verified: (item.is_blue_verified as boolean) ?? false,
    connected: true,
  };
}

// ─── Disconnected fallbacks ───────────────────────────────────────────────────

const DISCONNECTED_TWITTER: TwitterStats = {
  followers: 0, tweets: 0, username: "", name: "", verified: false, connected: false,
};

const DISCONNECTED_TIKTOK: TikTokStats = {
  followers: 0,
  likes: 0,
  videos: 0,
  username: "doctablademd",
  connected: false,
};

const DISCONNECTED_INSTAGRAM: InstagramStats = {
  followers: 0,
  posts: 0,
  username: "doctablamd",
  connected: false,
};

const DISCONNECTED_YOUTUBE: YouTubeApifyStats = {
  subscribers: 0,
  views: 0,
  videos: 0,
  channelTitle: "doctablademd",
  connected: false,
};

const DISCONNECTED_LINKEDIN: LinkedInStats = {
  followers: 0,
  connections: 0,
  name: "Emeka Ajufo",
  connected: false,
};

// ─── Route handler ────────────────────────────────────────────────────────────

// Agent-browser fallback for TikTok when Apify is unavailable
async function scrapeTikTokWithBrowser(): Promise<TikTokStats> {
  try {
    const { execFileSync } = require('child_process');
    execFileSync('agent-browser', ['navigate', 'https://www.tiktok.com/@doctablademd'], { encoding: 'utf-8', timeout: 15000 });
    const snapshot = execFileSync('agent-browser', ['snapshot'], { encoding: 'utf-8', timeout: 10000 });

    const followerMatch = snapshot.match(/([\d,.]+[KMB]?)\s*Followers/i);
    const likeMatch = snapshot.match(/([\d,.]+[KMB]?)\s*Likes/i);

    const parseCount = (s: string): number => {
      if (!s) return 0;
      const clean = s.replace(/,/g, '');
      if (clean.endsWith('K')) return parseFloat(clean) * 1000;
      if (clean.endsWith('M')) return parseFloat(clean) * 1000000;
      if (clean.endsWith('B')) return parseFloat(clean) * 1000000000;
      return parseInt(clean, 10) || 0;
    };

    return {
      followers: parseCount(followerMatch?.[1] ?? '0'),
      likes: parseCount(likeMatch?.[1] ?? '0'),
      videos: 0,
      username: 'doctablademd',
      connected: true,
    };
  } catch {
    return { ...DISCONNECTED_TIKTOK, error: 'Browser scrape failed' };
  }
}

export async function GET(): Promise<NextResponse> {
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    // Try agent-browser fallback for TikTok
    const tiktok = await scrapeTikTokWithBrowser();
    const payload: ApifySocialResponse = {
      tiktok,
      instagram: { ...DISCONNECTED_INSTAGRAM, error: "APIFY_TOKEN not configured" },
      youtube: { ...DISCONNECTED_YOUTUBE, error: "APIFY_TOKEN not configured" },
      linkedin: { ...DISCONNECTED_LINKEDIN, error: "APIFY_TOKEN not configured" },
      twitter: { ...DISCONNECTED_TWITTER, error: "APIFY_TOKEN not configured" },
      cached: false,
      lastFetched: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  }

  // Serve from cache if still fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  // Fire all five actor calls in parallel; failures are isolated
  const [ttResult, igResult, ytResult, liResult, twResult] = await Promise.allSettled([
    runApifyActor(token, "clockworks/tiktok-profile-scraper", {
      profiles: ["doctablademd"],
    }),
    runApifyActor(token, "apify/instagram-profile-scraper", {
      usernames: ["doctablamd"],
    }),
    runApifyActor(token, "streamers/youtube-channel-scraper", {
      channelUrls: ["https://www.youtube.com/@doctablademd"],
    }),
    runApifyActor(token, "dev_fusion/Linkedin-Profile-Scraper", {
      profileUrls: ["https://www.linkedin.com/in/emekaajufo/"],
    }),
    runApifyActor(token, "igview-owner/x-twitter-profile-viewer", {
      usernames: ["MekkatronFit"],
    }),
  ]);

  let tiktok: TikTokStats =
    ttResult.status === "fulfilled"
      ? (() => {
          try {
            return parseTikTok(ttResult.value);
          } catch (e) {
            return { ...DISCONNECTED_TIKTOK, error: String(e) };
          }
        })()
      : { ...DISCONNECTED_TIKTOK, error: String(ttResult.reason) };

  // Fallback to agent-browser if Apify failed for TikTok
  if (!tiktok.connected) {
    tiktok = await scrapeTikTokWithBrowser();
  }

  const instagram: InstagramStats =
    igResult.status === "fulfilled"
      ? (() => {
          try {
            return parseInstagram(igResult.value);
          } catch (e) {
            return { ...DISCONNECTED_INSTAGRAM, error: String(e) };
          }
        })()
      : { ...DISCONNECTED_INSTAGRAM, error: String(igResult.reason) };

  const youtube: YouTubeApifyStats =
    ytResult.status === "fulfilled"
      ? (() => {
          try {
            return parseYouTube(ytResult.value);
          } catch (e) {
            return { ...DISCONNECTED_YOUTUBE, error: String(e) };
          }
        })()
      : { ...DISCONNECTED_YOUTUBE, error: String(ytResult.reason) };

  const linkedin: LinkedInStats =
    liResult.status === "fulfilled"
      ? (() => {
          try {
            return parseLinkedIn(liResult.value);
          } catch (e) {
            return { ...DISCONNECTED_LINKEDIN, error: String(e) };
          }
        })()
      : { ...DISCONNECTED_LINKEDIN, error: String(liResult.reason) };

  const twitter: TwitterStats =
    twResult.status === "fulfilled"
      ? (() => {
          try {
            return parseTwitter(twResult.value);
          } catch (e) {
            return { ...DISCONNECTED_TWITTER, error: String(e) };
          }
        })()
      : { ...DISCONNECTED_TWITTER, error: String(twResult.reason) };

  const response: ApifySocialResponse = {
    tiktok,
    instagram,
    youtube,
    linkedin,
    twitter,
    cached: false,
    lastFetched: new Date().toISOString(),
  };

  cache = { data: response, timestamp: Date.now() };

  return NextResponse.json(response);
}
