import { NextRequest, NextResponse } from "next/server";

const META_TOKEN = process.env.META_USER_TOKEN;

const ACCOUNTS: Record<string, string> = {
  "healthproceo": "act_2549125178703715",
  "vitality": "act_744129051650635",
  "iv wellness": "act_1707066474017114",
  "corrective skin": "act_361114249531815",
  "corrective skin care": "act_361114249531815",
};

export async function POST(req: NextRequest) {
  // Auth: require x-internal-key header matching INTERNAL_API_KEY, or a next-auth session cookie
  const internalKey = process.env.INTERNAL_API_KEY;
  const providedKey = req.headers.get("x-internal-key");
  const hasSession = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token");
  if (internalKey ? providedKey !== internalKey : !hasSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!META_TOKEN) return NextResponse.json({ error: "META_USER_TOKEN not configured" }, { status: 500 });

  try {
    const body = await req.json();
    const { client, metric = "overview", period = "last_30d" } = body;

    const clientKey = client?.toLowerCase();
    const accountId = ACCOUNTS[clientKey] || Object.entries(ACCOUNTS).find(([k]) => clientKey?.includes(k))?.[1];

    if (!accountId) {
      return NextResponse.json({
        error: `Unknown client: ${client}. Available: ${Object.keys(ACCOUNTS).join(", ")}`
      });
    }

    if (metric === "overview" || metric === "performance") {
      const url = `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,reach,actions,cost_per_action_type&date_preset=${period}&access_token=${META_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.data?.[0]) {
        const d = data.data[0];
        const leads = d.actions?.find((a: any) => a.action_type === "lead")?.value || "0";
        const cpl = d.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
        
        return NextResponse.json({
          client,
          period,
          spend: `$${parseFloat(d.spend || 0).toFixed(2)}`,
          leads: parseInt(leads),
          cpl: cpl ? `$${parseFloat(cpl).toFixed(2)}` : "N/A",
          ctr: `${parseFloat(d.ctr || 0).toFixed(2)}%`,
          cpc: `$${parseFloat(d.cpc || 0).toFixed(2)}`,
          impressions: parseInt(d.impressions || 0).toLocaleString(),
          reach: parseInt(d.reach || 0).toLocaleString(),
        });
      }
    }

    if (metric === "creatives" || metric === "ads") {
      const url = `https://graph.facebook.com/v19.0/${accountId}/ads?fields=name,status,insights.date_preset(${period}){spend,actions,cost_per_action_type,ctr}&limit=20&access_token=${META_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const ads = data.data?.map((ad: any) => {
        const ins = ad.insights?.data?.[0];
        if (!ins) return null;
        const spend = parseFloat(ins.spend || 0);
        if (spend < 1) return null;
        const leads = parseInt(ins.actions?.find((a: any) => a.action_type === "lead")?.value || 0);
        const cpl_raw = ins.cost_per_action_type?.find((a: any) => a.action_type === "lead")?.value;
        return {
          name: ad.name,
          status: ad.status,
          spend: `$${spend.toFixed(0)}`,
          leads,
          cpl: cpl_raw ? `$${parseFloat(cpl_raw).toFixed(2)}` : "N/A",
          ctr: `${parseFloat(ins.ctr || 0).toFixed(2)}%`,
        };
      }).filter(Boolean).sort((a: any, b: any) => parseFloat(a.cpl?.replace("$","") || 9999) - parseFloat(b.cpl?.replace("$","") || 9999));

      return NextResponse.json({ client, period, ads: ads?.slice(0, 8) });
    }

    return NextResponse.json({ error: `Unknown metric: ${metric}. Use: overview, creatives` });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
