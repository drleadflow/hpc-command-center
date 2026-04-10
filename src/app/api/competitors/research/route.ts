import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = "https://api.apify.com/v2/acts";
const TIMEOUT_MS = 60_000;

type Platform = "instagram" | "youtube" | "tiktok";

interface RecentPost {
  url?: string;
  caption?: string;
  title?: string;
  likes?: number;
  comments?: number;
  views?: number;
  shares?: number;
  publishedAt?: string;
}

interface ScrapedProfile {
  followers: number | null;
  following?: number | null;
  postsCount: number | null;
  engagement: number | null;
  bio: string;
  profileUrl: string;
  username: string;
  displayName?: string;
  recentContent: RecentPost[];
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
    // Apify run-sync-post returns { items: [...] } or the dataset array directly
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeInstagram(raw: unknown[]): ScrapedProfile {
  const profile = (raw[0] as Record<string, unknown>) ?? {};

  const followers = (profile.followersCount as number) ?? null;
  const following = (profile.followsCount as number) ?? null;
  const postsCount = (profile.postsCount as number) ?? null;
  const bio = (profile.biography as string) ?? "";
  const username = (profile.username as string) ?? "";
  const displayName = (profile.fullName as string) ?? "";
  const profileUrl = `https://www.instagram.com/${username}/`;

  const rawPosts = Array.isArray(profile.latestPosts)
    ? (profile.latestPosts as Record<string, unknown>[])
    : [];

  const recentContent: RecentPost[] = rawPosts.slice(0, 5).map((p) => ({
    url: p.url as string | undefined,
    caption:
      typeof p.caption === "string"
        ? p.caption.slice(0, 200)
        : undefined,
    likes: p.likesCount as number | undefined,
    comments: p.commentsCount as number | undefined,
    publishedAt: p.timestamp as string | undefined,
  }));

  // Rough engagement rate: avg likes / followers
  const avgLikes =
    recentContent.length > 0
      ? recentContent.reduce((s, p) => s + (p.likes ?? 0), 0) /
        recentContent.length
      : 0;
  const engagement =
    followers && followers > 0
      ? Math.round((avgLikes / followers) * 10000) / 100
      : null;

  return {
    followers,
    following,
    postsCount,
    engagement,
    bio,
    profileUrl,
    username,
    displayName,
    recentContent,
  };
}

function normalizeYouTube(raw: unknown[]): ScrapedProfile {
  const channel = (raw[0] as Record<string, unknown>) ?? {};

  const followers =
    (channel.numberOfSubscribers as number) ??
    (channel.subscriberCount as number) ??
    null;
  const postsCount =
    (channel.numberOfVideos as number) ??
    (channel.videoCount as number) ??
    null;
  const bio = (channel.description as string) ?? "";
  const username =
    (channel.channelHandle as string) ??
    (channel.channelId as string) ??
    "";
  const displayName = (channel.channelName as string) ?? "";
  const profileUrl =
    (channel.channelUrl as string) ??
    `https://www.youtube.com/@${username}`;

  const rawVideos = Array.isArray(channel.recentVideos)
    ? (channel.recentVideos as Record<string, unknown>[])
    : Array.isArray(channel.videos)
    ? (channel.videos as Record<string, unknown>[])
    : [];

  const recentContent: RecentPost[] = rawVideos.slice(0, 5).map((v) => ({
    url: v.url as string | undefined,
    title: v.title as string | undefined,
    views: (v.viewCount as number) ?? (v.views as number) ?? undefined,
    likes: v.likes as number | undefined,
    comments: v.commentCount as number | undefined,
    publishedAt: (v.publishedAt as string) ?? (v.date as string) ?? undefined,
  }));

  const avgViews =
    recentContent.length > 0
      ? recentContent.reduce((s, v) => s + (v.views ?? 0), 0) /
        recentContent.length
      : 0;
  const engagement =
    followers && followers > 0
      ? Math.round((avgViews / followers) * 10000) / 100
      : null;

  return {
    followers,
    postsCount,
    engagement,
    bio,
    profileUrl,
    username,
    displayName,
    recentContent,
  };
}

function normalizeTikTok(raw: unknown[]): ScrapedProfile {
  const profile = (raw[0] as Record<string, unknown>) ?? {};

  const followers =
    (profile.followers as number) ??
    (profile.followerCount as number) ??
    null;
  const following =
    (profile.following as number) ??
    (profile.followingCount as number) ??
    null;
  const postsCount =
    (profile.videos as number) ??
    (profile.videoCount as number) ??
    null;
  const bio = (profile.bio as string) ?? (profile.signature as string) ?? "";
  const username =
    (profile.username as string) ??
    (profile.uniqueId as string) ??
    "";
  const displayName = (profile.nickname as string) ?? "";
  const profileUrl = `https://www.tiktok.com/@${username}`;

  const rawVideos = Array.isArray(profile.recentVideos)
    ? (profile.recentVideos as Record<string, unknown>[])
    : [];

  const recentContent: RecentPost[] = rawVideos.slice(0, 5).map((v) => ({
    url: v.webVideoUrl as string | undefined,
    caption:
      typeof v.text === "string" ? v.text.slice(0, 200) : undefined,
    views:
      (v.playCount as number) ?? (v.videoMeta as Record<string, unknown>)
        ?.playCount as number | undefined,
    likes:
      (v.diggCount as number) ?? (v.heartCount as number) ?? undefined,
    comments: v.commentCount as number | undefined,
    shares: v.shareCount as number | undefined,
    publishedAt: v.createTimeISO as string | undefined,
  }));

  const avgViews =
    recentContent.length > 0
      ? recentContent.reduce((s, v) => s + (v.views ?? 0), 0) /
        recentContent.length
      : 0;
  const engagement =
    followers && followers > 0
      ? Math.round((avgViews / followers) * 10000) / 100
      : null;

  return {
    followers,
    following,
    postsCount,
    engagement,
    bio,
    profileUrl,
    username,
    displayName,
    recentContent,
  };
}

export async function POST(req: Request) {
  if (!APIFY_TOKEN) {
    return NextResponse.json(
      { error: "APIFY_TOKEN environment variable is not set" },
      { status: 500 }
    );
  }

  let body: { platform: Platform; handle: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform, handle } = body;
  if (!platform || !handle) {
    return NextResponse.json(
      { error: "platform and handle are required" },
      { status: 400 }
    );
  }

  const cleanHandle = handle.replace(/^@/, "").trim();
  if (!cleanHandle) {
    return NextResponse.json({ error: "handle cannot be empty" }, { status: 400 });
  }

  try {
    let raw: unknown[];
    let profile: ScrapedProfile;

    if (platform === "instagram") {
      raw = await runActor("apify/instagram-profile-scraper", {
        usernames: [cleanHandle],
      });
      profile = normalizeInstagram(raw);
    } else if (platform === "youtube") {
      raw = await runActor("streamers/youtube-channel-scraper", {
        channelUrls: [`https://www.youtube.com/@${cleanHandle}`],
      });
      profile = normalizeYouTube(raw);
    } else if (platform === "tiktok") {
      raw = await runActor("clockworks/tiktok-profile-scraper", {
        profiles: [cleanHandle],
      });
      profile = normalizeTikTok(raw);
    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ platform, handle: cleanHandle, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[competitors/research]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
