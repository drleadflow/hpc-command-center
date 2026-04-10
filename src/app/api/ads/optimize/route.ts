import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN = process.env.META_USER_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const BASE = "https://graph.facebook.com/v19.0";

export async function POST(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "META_USER_TOKEN not configured" }, { status: 500 });
  if (!ANTHROPIC_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  try {
    const { accountId, period } = await req.json();
    if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

    const datePreset = period || "last_30d";

    // Fetch campaigns with insights
    const campsRes = await fetch(
      `${BASE}/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,insights.date_preset(${datePreset}){spend,impressions,clicks,ctr,cpm,frequency,reach,actions,cost_per_action_type,video_thruplay_watched_actions,video_p25_watched_actions}&limit=20&access_token=${TOKEN}`
    );
    const campsData = await campsRes.json();

    // Fetch ads with insights
    const adsRes = await fetch(
      `${BASE}/${accountId}/ads?fields=id,name,status,insights.date_preset(${datePreset}){spend,impressions,clicks,ctr,cpc,cpm,frequency,reach,actions,cost_per_action_type,video_thruplay_watched_actions,video_p25_watched_actions}&limit=30&access_token=${TOKEN}`
    );
    const adsData = await adsRes.json();

    // Build summary for Claude
    const campaigns = (campsData.data || []).map((c: any) => {
      const ci = c.insights?.data?.[0] || {};
      const spend = parseFloat(ci.spend || 0);
      const leads = parseInt(ci.actions?.find((a: any) => a.action_type === "lead")?.value || 0);
      const cplRaw = ci.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        budget: parseInt(c.daily_budget || c.lifetime_budget || 0) / 100,
        spend: parseFloat(spend.toFixed(2)),
        leads,
        cpl: cplRaw ? parseFloat(parseFloat(cplRaw).toFixed(2)) : null,
        ctr: parseFloat(parseFloat(ci.ctr || 0).toFixed(2)),
        cpm: parseFloat(parseFloat(ci.cpm || 0).toFixed(2)),
        frequency: parseFloat(parseFloat(ci.frequency || 0).toFixed(2)),
      };
    });

    const ads = (adsData.data || [])
      .map((ad: any) => {
        const i = ad.insights?.data?.[0];
        if (!i) return null;
        const spend = parseFloat(i.spend || 0);
        if (spend < 5) return null;
        const leads = parseInt(i.actions?.find((a: any) => a.action_type === "lead")?.value || 0);
        const cplRaw = i.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
        const imp = parseInt(i.impressions || 0);
        const v25 = parseInt(i.video_p25_watched_actions?.[0]?.value || 0);
        const tp = parseInt(i.video_thruplay_watched_actions?.[0]?.value || 0);
        return {
          id: ad.id,
          name: ad.name,
          status: ad.status,
          spend: parseFloat(spend.toFixed(2)),
          leads,
          cpl: cplRaw ? parseFloat(parseFloat(cplRaw).toFixed(2)) : null,
          ctr: parseFloat(parseFloat(i.ctr || 0).toFixed(2)),
          cpm: parseFloat(parseFloat(i.cpm || 0).toFixed(2)),
          frequency: parseFloat(parseFloat(i.frequency || 0).toFixed(2)),
          hookRate: imp > 0 && v25 > 0 ? parseFloat(((v25 / imp) * 100).toFixed(1)) : null,
          holdRate: v25 > 0 && tp > 0 ? parseFloat(((tp / v25) * 100).toFixed(1)) : null,
        };
      })
      .filter(Boolean);

    const dataSnapshot = JSON.stringify({ period: datePreset, campaigns, ads }, null, 2);

    // Ask Claude to analyze and return structured recommendations
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a Meta Ads performance analyst. Analyze this ad account data and return exactly 4-6 optimization recommendations as a JSON array.

Data (${datePreset}):
${dataSnapshot}

Rules:
- CPL target: under $15 is good, over $30 is bad
- Frequency over 3.5 = audience fatigue, needs creative refresh
- Hook rate under 20% = weak hook, needs new creative
- Ads with $20+ spend and 0 leads should be paused
- Winners (low CPL, multiple leads) should be scaled

Return a JSON array ONLY, no markdown. Each item:
{
  "type": "scale" | "pause" | "refresh" | "budget" | "test" | "alert",
  "action": "Short action title (under 60 chars)",
  "reason": "1-2 sentence explanation with specific metrics",
  "impact": "high" | "medium" | "low"
}`,
          },
        ],
      }),
    });

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || "[]";

    let recommendations: any[] = [];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) recommendations = JSON.parse(jsonMatch[0]);
    } catch {
      recommendations = [];
    }

    return NextResponse.json({ recommendations, period: datePreset });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
