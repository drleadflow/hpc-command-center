import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLIENT_ACCOUNTS: Record<string, { name: string; accountId: string }> = {
  healthproceo: { name: "HealthProceo", accountId: "act_2549125178703715" },
  vitality: { name: "Vitality & Aesthetics", accountId: "act_744129051650635" },
  "iv-wellness": { name: "IV Wellness", accountId: "act_1707066474017114" },
  "corrective-skin": { name: "Corrective Skin Care", accountId: "act_361114249531815" },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const client = CLIENT_ACCOUNTS[slug];

  if (!client) {
    return NextResponse.json(
      { error: "Unknown client", validSlugs: Object.keys(CLIENT_ACCOUNTS) },
      { status: 404 }
    );
  }

  const token = process.env.META_USER_TOKEN || process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Meta token not configured" }, { status: 500 });
  }

  const { accountId, name } = client;

  try {
    // 1. Account-level insights (last 30 days)
    const insRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type&date_preset=last_30d&access_token=${token}`
    );
    const insData = await insRes.json();
    if (insData.error) {
      return NextResponse.json({ error: insData.error.message }, { status: 500 });
    }
    const ins = insData.data?.[0] || {};

    const spend = parseFloat(ins.spend || "0");
    const impressions = parseInt(ins.impressions || "0", 10);
    const reach = parseInt(ins.reach || "0", 10);
    const clicks = parseInt(ins.clicks || "0", 10);
    const ctr = parseFloat(ins.ctr || "0");
    const cpc = parseFloat(ins.cpc || "0");
    const cpm = parseFloat(ins.cpm || "0");
    const frequency = parseFloat(ins.frequency || "0");

    let leads = 0;
    if (ins.actions) {
      for (const action of ins.actions) {
        if (
          action.action_type === "lead" ||
          action.action_type === "onsite_conversion.lead_grouped"
        ) {
          leads += parseInt(action.value || "0", 10);
        }
      }
    }
    const cpl = leads > 0 ? spend / leads : 0;

    // 2. Campaigns with insights
    const campsRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,insights.date_preset(last_30d){spend,impressions,clicks,ctr,actions,cost_per_action_type,reach}&limit=20&access_token=${token}`
    );
    const campsData = await campsRes.json();
    const campaigns = (campsData.data || [])
      .filter((c: any) => c.status === "ACTIVE" || c.status === "PAUSED")
      .map((c: any) => {
        const ci = c.insights?.data?.[0] || {};
        const cs = parseFloat(ci.spend || "0");
        const cl = parseInt(
          ci.actions?.find((a: any) => a.action_type === "lead")?.value || "0",
          10
        );
        const ccpl = cl > 0 ? cs / cl : 0;
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          spend: parseFloat(cs.toFixed(2)),
          leads: cl,
          cpl: parseFloat(ccpl.toFixed(2)),
          impressions: parseInt(ci.impressions || "0", 10),
          clicks: parseInt(ci.clicks || "0", 10),
          ctr: parseFloat(parseFloat(ci.ctr || "0").toFixed(2)),
          reach: parseInt(ci.reach || "0", 10),
        };
      });

    // 3. Daily spend breakdown (last 14 days)
    const dailyRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,actions&time_increment=1&date_preset=last_14d&access_token=${token}`
    );
    const dailyData = await dailyRes.json();
    const dailySpend = (dailyData.data || []).map((d: any) => {
      let dayLeads = 0;
      if (d.actions) {
        for (const action of d.actions) {
          if (
            action.action_type === "lead" ||
            action.action_type === "onsite_conversion.lead_grouped"
          ) {
            dayLeads += parseInt(action.value || "0", 10);
          }
        }
      }
      return {
        date: d.date_start,
        spend: parseFloat(parseFloat(d.spend || "0").toFixed(2)),
        leads: dayLeads,
      };
    });

    return NextResponse.json({
      clientName: name,
      accountId,
      // Account totals
      spend: parseFloat(spend.toFixed(2)),
      impressions,
      reach,
      clicks,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpm: parseFloat(cpm.toFixed(2)),
      frequency: parseFloat(frequency.toFixed(2)),
      leads,
      cpl: parseFloat(cpl.toFixed(2)),
      // Campaign list
      campaigns,
      // Daily breakdown
      dailySpend,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
