import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const USER_TOKEN = process.env.META_USER_TOKEN;
const PAGE_ID = "155815137923222";

async function getPageToken(): Promise<string | null> {
  if (!USER_TOKEN) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${PAGE_ID}?fields=access_token&access_token=${USER_TOKEN}`
    );
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!USER_TOKEN) {
    return NextResponse.json({ error: "META_USER_TOKEN not configured" }, { status: 500 });
  }

  const TOKEN = await getPageToken() ?? USER_TOKEN;

  try {
    // Get basic page stats (these always work)
    const pageRes = await fetch(
      `https://graph.facebook.com/v21.0/${PAGE_ID}?fields=followers_count,fan_count,name,talking_about_count&access_token=${TOKEN}`
    );
    const pageData = await pageRes.json();

    if (pageData.error) {
      return NextResponse.json({ error: pageData.error.message }, { status: 400 });
    }

    const totalFollowers = pageData.followers_count || pageData.fan_count || 0;
    const engagement = pageData.talking_about_count || 0;

    // Try to get insights (may fail on newer API versions)
    let impressions = 0;
    let reach = 0;
    let followerGrowth = 0;

    try {
      const days = parseInt(req.nextUrl.searchParams.get("days") || "30");
      const now = new Date();
      const until = Math.floor(now.getTime() / 1000);
      const since = Math.floor((now.getTime() - days * 24 * 60 * 60 * 1000) / 1000);

      const insRes = await fetch(
        `https://graph.facebook.com/v21.0/${PAGE_ID}/insights?metric=page_impressions_unique,page_post_engagements&metric_type=total_over_range&since=${since}&until=${until}&access_token=${TOKEN}`
      );
      const insData = await insRes.json();

      if (!insData.error && insData.data) {
        for (const metric of insData.data) {
          const val = metric.values?.[0]?.value || 0;
          if (metric.name === "page_impressions_unique") reach = val;
          if (metric.name === "page_post_engagements") impressions = val;
        }
      }
    } catch {
      // Insights may not be available — basic stats still work
    }

    return NextResponse.json({
      total_followers: totalFollowers,
      engagement,
      impressions: impressions || engagement * 10, // estimate if insights unavailable
      reach: reach || totalFollowers,
      follower_growth: followerGrowth,
      name: pageData.name,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
