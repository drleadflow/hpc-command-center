import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN = process.env.META_USER_TOKEN;
const BASE = "https://graph.facebook.com/v19.0";

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "META_USER_TOKEN not configured" }, { status: 500 });

  try {
    const { accountId, name, objective, dailyBudget, headline, primaryText, description, link } = await req.json();

    if (!accountId || !name) {
      return NextResponse.json({ error: "accountId and name are required" }, { status: 400 });
    }

    // Step 1: Create campaign (PAUSED)
    const campaignParams = new URLSearchParams({
      name,
      objective: objective || "OUTCOME_LEADS",
      status: "PAUSED",
      special_ad_categories: "[]",
      access_token: TOKEN,
    });

    const campaignRes = await fetch(`${BASE}/${accountId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: campaignParams.toString(),
    });
    const campaignData = await campaignRes.json();

    if (!campaignData.id) {
      return NextResponse.json({
        error: campaignData.error?.message || "Failed to create campaign",
        details: campaignData,
      }, { status: 400 });
    }

    const campaignId = campaignData.id;

    // Step 2: Create ad set (PAUSED, $10/day default if not provided)
    const budgetCents = dailyBudget ? Math.round(parseFloat(dailyBudget) * 100) : 1000;

    const adSetParams = new URLSearchParams({
      name: `${name} - Ad Set`,
      campaign_id: campaignId,
      billing_event: "IMPRESSIONS",
      optimization_goal: "LEAD_GENERATION",
      daily_budget: String(budgetCents),
      status: "PAUSED",
      targeting: JSON.stringify({ geo_locations: { countries: ["US"] } }),
      access_token: TOKEN,
    });

    const adSetRes = await fetch(`${BASE}/${accountId}/adsets`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: adSetParams.toString(),
    });
    const adSetData = await adSetRes.json();

    if (!adSetData.id) {
      return NextResponse.json({
        error: adSetData.error?.message || "Failed to create ad set",
        campaignId,
        details: adSetData,
      }, { status: 400 });
    }

    const adSetId = adSetData.id;

    // Step 3: Create ad creative + ad (PAUSED)
    // Build creative object from provided copy fields
    const creativeBody: Record<string, any> = {
      name: `${name} - Creative`,
      object_story_spec: {
        page_id: accountId, // placeholder — Meta requires a real page_id; callers can override
        link_data: {
          message: primaryText || name,
          name: headline || name,
          description: description || "",
          link: link || "https://drleadflow.com",
        },
      },
      access_token: TOKEN,
    };

    const creativeRes = await fetch(`${BASE}/${accountId}/adcreatives`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creativeBody),
    });
    const creativeData = await creativeRes.json();

    // If creative creation fails, still return campaign + ad set IDs
    let adId: string | null = null;

    if (creativeData.id) {
      const adParams = new URLSearchParams({
        name: `${name} - Ad`,
        adset_id: adSetId,
        creative: JSON.stringify({ creative_id: creativeData.id }),
        status: "PAUSED",
        access_token: TOKEN,
      });

      const adRes = await fetch(`${BASE}/${accountId}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: adParams.toString(),
      });
      const adData = await adRes.json();
      adId = adData.id || null;
    }

    return NextResponse.json({
      campaignId,
      adSetId,
      adId,
      status: "PAUSED",
      creativeWarning: !creativeData.id
        ? (creativeData.error?.message || "Creative creation skipped — provide a valid page_id to enable ads")
        : null,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
