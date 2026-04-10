import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_ID = "155815137923222";

export async function GET(): Promise<NextResponse> {
  const token = process.env.META_USER_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "META_USER_TOKEN not configured", connected: false },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get the linked Instagram Business Account ID from the Facebook Page
    const pageRes = await fetch(
      `https://graph.facebook.com/v19.0/${PAGE_ID}?fields=instagram_business_account&access_token=${token}`
    );

    const pageData = await pageRes.json();

    if (pageData.error) {
      return NextResponse.json(
        { error: pageData.error.message, connected: false },
        { status: 400 }
      );
    }

    const igId = pageData.instagram_business_account?.id;

    if (!igId) {
      return NextResponse.json({
        connected: false,
        error: "No linked Instagram account",
      });
    }

    // Step 2: Fetch Instagram account stats
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${igId}?fields=followers_count,media_count,username,profile_picture_url&access_token=${token}`
    );

    const igData = await igRes.json();

    if (igData.error) {
      return NextResponse.json(
        { error: igData.error.message, connected: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      followers: igData.followers_count || 0,
      mediaCount: igData.media_count || 0,
      username: igData.username || "",
      profilePic: igData.profile_picture_url || "",
      connected: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error), connected: false },
      { status: 500 }
    );
  }
}
