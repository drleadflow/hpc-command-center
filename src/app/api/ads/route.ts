import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOKEN = process.env.META_USER_TOKEN;

export async function GET(req: NextRequest) {
  if (!TOKEN) return NextResponse.json({ error: "META_USER_TOKEN not configured" }, { status: 500 });

  const period = req.nextUrl.searchParams.get("period") || "last_30d";
  const accountId = req.nextUrl.searchParams.get("accountId");

  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  try {
    // Full account insights with all key metrics
    const insRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,reach,clicks,unique_clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions&date_preset=${period}&access_token=${TOKEN}`
    );
    const insData = await insRes.json();
    const ins = insData.data?.[0] || {};

    const spend = parseFloat(ins.spend || 0);
    const impressions = parseInt(ins.impressions || 0);
    const reach = parseInt(ins.reach || 0);
    const clicks = parseInt(ins.clicks || 0);
    const frequency = parseFloat(ins.frequency || 0);
    const cpm = parseFloat(ins.cpm || 0);
    const ctr_all = parseFloat(ins.ctr || 0);
    const cpc = parseFloat(ins.cpc || 0);

    const leads = parseInt(ins.actions?.find((a: any) => a.action_type === "lead")?.value || 0);
    const msgs = parseInt(ins.actions?.find((a: any) => a.action_type === "onsite_conversion.messaging_conversation_started_7d")?.value || 0);
    const linkClicks = parseInt(ins.actions?.find((a: any) => a.action_type === "link_click")?.value || 0);
    const thruPlays = parseInt(ins.video_thruplay_watched_actions?.[0]?.value || 0);
    const video25 = parseInt(ins.video_p25_watched_actions?.[0]?.value || 0);
    
    const cpl_raw = ins.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
    const cpl = cpl_raw ? parseFloat(cpl_raw) : null;
    const ctr_link = linkClicks > 0 && impressions > 0 ? (linkClicks / impressions) * 100 : 0;
    const hookRate = video25 > 0 && impressions > 0 ? (video25 / impressions) * 100 : null;
    const holdRate = thruPlays > 0 && video25 > 0 ? (thruPlays / video25) * 100 : null;
    const cvr = clicks > 0 && leads > 0 ? (leads / clicks) * 100 : null;

    // Campaigns
    const campsRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,insights.date_preset(${period}){spend,impressions,clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type,reach}&limit=20&access_token=${TOKEN}`
    );
    const campsData = await campsRes.json();
    const campaigns = (campsData.data || []).map((c: any) => {
      const ci = c.insights?.data?.[0] || {};
      const cs = parseFloat(ci.spend || 0);
      const cl = parseInt(ci.actions?.find((a: any) => a.action_type === "lead")?.value || 0);
      const cc = ci.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
      const ci_imp = parseInt(ci.impressions || 0);
      const ci_link = parseInt(ci.actions?.find((a: any) => a.action_type === "link_click")?.value || 0);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        budget: parseInt(c.daily_budget || c.lifetime_budget || 0),
        spend: cs,
        leads: cl,
        cpl: cc ? parseFloat(parseFloat(cc).toFixed(2)) : null,
        ctr: parseFloat(parseFloat(ci.ctr || 0).toFixed(2)),
        ctrLink: ci_imp > 0 ? parseFloat(((ci_link / ci_imp) * 100).toFixed(2)) : 0,
        cpm: parseFloat(parseFloat(ci.cpm || 0).toFixed(2)),
        frequency: parseFloat(parseFloat(ci.frequency || 0).toFixed(2)),
        reach: parseInt(ci.reach || 0),
      };
    });

    // Ads with full metrics
    const adsRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/ads?fields=name,status,insights.date_preset(${period}){spend,impressions,clicks,ctr,cpc,cpm,frequency,reach,actions,cost_per_action_type,video_thruplay_watched_actions,video_p25_watched_actions}&limit=50&access_token=${TOKEN}`
    );
    const adsData = await adsRes.json();
    const topAds = (adsData.data || [])
      .map((ad: any) => {
        const i = ad.insights?.data?.[0];
        if (!i) return null;
        const s = parseFloat(i.spend || 0);
        if (s < 5) return null;
        const l = parseInt(i.actions?.find((a: any) => a.action_type === "lead")?.value || 0);
        const c = i.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
        const imp = parseInt(i.impressions || 0);
        const lc = parseInt(i.actions?.find((a: any) => a.action_type === "link_click")?.value || 0);
        const tp = parseInt(i.video_thruplay_watched_actions?.[0]?.value || 0);
        const v25 = parseInt(i.video_p25_watched_actions?.[0]?.value || 0);
        return {
          name: ad.name,
          status: ad.status,
          spend: parseFloat(s.toFixed(2)),
          leads: l,
          cpl: c ? parseFloat(parseFloat(c).toFixed(2)) : null,
          ctr: parseFloat(parseFloat(i.ctr || 0).toFixed(2)),
          ctrLink: imp > 0 ? parseFloat(((lc / imp) * 100).toFixed(2)) : 0,
          cpm: parseFloat(parseFloat(i.cpm || 0).toFixed(2)),
          frequency: parseFloat(parseFloat(i.frequency || 0).toFixed(2)),
          reach: parseInt(i.reach || 0),
          hookRate: imp > 0 && v25 > 0 ? parseFloat(((v25 / imp) * 100).toFixed(1)) : null,
          holdRate: v25 > 0 && tp > 0 ? parseFloat(((tp / v25) * 100).toFixed(1)) : null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (a.cpl || 9999) - (b.cpl || 9999))
      .slice(0, 10);

    // Recommendations
    const recommendations: any[] = [];
    const winners = topAds.filter((a: any) => a.cpl && a.cpl < 10 && a.leads >= 5);
    const losers = topAds.filter((a: any) => a.cpl && a.cpl > 25 && a.status === "ACTIVE");
    const fatigued = topAds.filter((a: any) => a.frequency > 3 && a.status === "ACTIVE");
    const zeroLeads = topAds.filter((a: any) => a.leads === 0 && a.spend > 20 && a.status === "ACTIVE");

    if (winners[0]) recommendations.push({ type: "scale", action: `Scale "${winners[0].name}"`, reason: `$${winners[0].cpl} CPL · ${winners[0].leads} leads. Best performer — increase budget.` });
    if (losers[0]) recommendations.push({ type: "pause", action: `Pause "${losers[0].name}"`, reason: `$${losers[0].cpl} CPL — ${(losers[0].cpl / 10).toFixed(1)}x above target. Burning budget.` });
    if (fatigued[0]) recommendations.push({ type: "refresh", action: `Refresh creative for "${fatigued[0].name}"`, reason: `Frequency ${fatigued[0].frequency}x — audience is saturated. New creative needed.` });
    if (zeroLeads[0]) recommendations.push({ type: "pause", action: `Kill "${zeroLeads[0].name}"`, reason: `$${zeroLeads[0].spend.toFixed(0)} spent with 0 leads. No path to ROI.` });

    return NextResponse.json({
      // Account totals
      spend, impressions, reach, frequency, cpm, ctr_all, ctr_link: parseFloat(ctr_link.toFixed(2)),
      cpc, leads, msgs, cpl, cvr: cvr ? parseFloat(cvr.toFixed(2)) : null,
      hookRate: hookRate ? parseFloat(hookRate.toFixed(1)) : null,
      holdRate: holdRate ? parseFloat(holdRate.toFixed(1)) : null,
      // Lists
      campaigns,
      topAds,
      recommendations,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
