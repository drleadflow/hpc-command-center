import { hasSupabaseConfig, supabaseSelect } from "./supabase";

export type SourceState = "live" | "configured" | "mock" | "missing" | "error";

export type OutreachSummary = {
  activeCampaigns: number;
  leadsQueued: number;
  leadsContacted: number;
  openRate: number;
  replyRate: number;
  positiveReplyRate: number;
  meetingsBooked: number;
  pipelineValue: number;
  warmLeads: number;
  deliverabilityScore: number;
  lastSync: string;
};

export type OutreachCampaign = {
  id: string;
  name: string;
  client: string;
  status: string;
  channel: string;
  owner: string;
  leadsQueued: number;
  leadsContacted: number;
  openRate: number;
  replyRate: number;
  positiveReplies: number;
  meetingsBooked: number;
  pipelineValue: number;
  health: "strong" | "watch" | "at-risk";
  updatedAt: string;
};

export type PipelineStage = {
  id: string;
  label: string;
  count: number;
  value: number;
  color: string;
  conversionRate?: number;
};

export type HotLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  campaign: string;
  lastActivity: string;
};

export type OutreachActivity = {
  id: string;
  type: string;
  title: string;
  detail: string;
  happenedAt: string;
};

export type SourceStatus = {
  id: string;
  label: string;
  state: SourceState;
  detail: string;
};

export type OutreachResponse = {
  source: "upstream" | "airtable" | "supabase" | "mock" | "none";
  summary: OutreachSummary;
  campaigns: OutreachCampaign[];
  pipeline: PipelineStage[];
  hotLeads: HotLead[];
  activity: OutreachActivity[];
  sourceStatus: SourceStatus[];
  links: {
    airtableUrl?: string;
    upstreamUrl?: string;
    supabaseTable?: string;
  };
};

const AIRTABLE_TOKEN = process.env.AIRTABLE_OUTREACH_API_KEY || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_OUTREACH_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_OUTREACH_TABLE_ID;
const AIRTABLE_VIEW = process.env.AIRTABLE_OUTREACH_VIEW;

const OUTREACH_API_URL = process.env.OUTREACH_API_URL;
const OUTREACH_API_KEY = process.env.OUTREACH_API_KEY;
const SUPABASE_OUTREACH_TABLE = process.env.SUPABASE_OUTREACH_TABLE || "outreach_campaigns";
const OUTREACH_DATA_PROVIDER = process.env.OUTREACH_DATA_PROVIDER || "airtable";

const DEFAULT_PIPELINE_COLORS = ["#2d5a4e", "#3b82f6", "#d97706", "#8b5cf6", "#b91c1c"];

// Ordered funnel stages for the cold-email CRM
const PIPELINE_STAGE_ORDER = ["New", "Opened", "Replied", "Interested", "Hot Lead", "Booked", "Won"];
const PIPELINE_STAGE_COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#2d5a4e"];

// Statuses that represent a warm / actionable lead
const HOT_STATUSES = new Set(["Hot Lead", "Interested", "Booked"]);

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%\s,]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => str(item)).filter(Boolean).join(", ");
  return "";
}

function isoOrNow(value: unknown, fallbackOffsetHours = 0): string {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date(Date.now() - fallbackOffsetHours * 60 * 60 * 1000).toISOString();
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function healthFromCampaign(campaign: Pick<OutreachCampaign, "meetingsBooked" | "replyRate" | "openRate" | "positiveReplies">): "strong" | "watch" | "at-risk" {
  if (campaign.replyRate >= 8 || campaign.meetingsBooked >= 3 || campaign.positiveReplies >= 5) return "strong";
  if (campaign.replyRate >= 3 || campaign.openRate >= 35) return "watch";
  return "at-risk";
}

function sum<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((total, item) => total + getter(item), 0);
}

// Campaign-based helpers (used by Supabase + upstream paths)

function buildSummary(campaigns: OutreachCampaign[]): OutreachSummary {
  const activeCampaigns = campaigns.filter((campaign) => campaign.status.toLowerCase() !== "paused").length;
  const leadsQueued = sum(campaigns, (campaign) => campaign.leadsQueued);
  const leadsContacted = sum(campaigns, (campaign) => campaign.leadsContacted);
  const positiveReplies = sum(campaigns, (campaign) => campaign.positiveReplies);
  const meetingsBooked = sum(campaigns, (campaign) => campaign.meetingsBooked);
  const pipelineValue = sum(campaigns, (campaign) => campaign.pipelineValue);
  const weightedOpenRate = leadsContacted ? sum(campaigns, (campaign) => campaign.openRate * campaign.leadsContacted) / leadsContacted : 0;
  const totalReplies = sum(campaigns, (campaign) => Math.round((campaign.replyRate / 100) * campaign.leadsContacted));
  const totalDelivered = Math.max(leadsContacted, 1);
  const deliverabilityScore = Math.max(42, Math.min(99, Math.round(weightedOpenRate + 45)));

  return {
    activeCampaigns,
    leadsQueued,
    leadsContacted,
    openRate: Math.round(weightedOpenRate * 10) / 10,
    replyRate: pct(totalReplies, totalDelivered),
    positiveReplyRate: pct(positiveReplies, totalDelivered),
    meetingsBooked,
    pipelineValue,
    warmLeads: positiveReplies,
    deliverabilityScore,
    lastSync: new Date().toISOString(),
  };
}

function buildPipeline(campaigns: OutreachCampaign[]): PipelineStage[] {
  const contacted = sum(campaigns, (campaign) => campaign.leadsContacted);
  const replies = sum(campaigns, (campaign) => Math.round((campaign.replyRate / 100) * campaign.leadsContacted));
  const positiveReplies = sum(campaigns, (campaign) => campaign.positiveReplies);
  const meetings = sum(campaigns, (campaign) => campaign.meetingsBooked);
  const opportunities = campaigns.filter((campaign) => campaign.pipelineValue > 0).length;

  const rawStages = [
    { id: "contacted", label: "Contacted", count: contacted, value: 0 },
    { id: "replied", label: "Replied", count: replies, value: 0 },
    { id: "warm", label: "Positive", count: positiveReplies, value: 0 },
    { id: "meetings", label: "Meetings", count: meetings, value: 0 },
    { id: "opportunities", label: "Pipeline", count: opportunities, value: sum(campaigns, (campaign) => campaign.pipelineValue) },
  ];

  return rawStages.map((stage, index) => ({
    ...stage,
    color: DEFAULT_PIPELINE_COLORS[index] || DEFAULT_PIPELINE_COLORS[DEFAULT_PIPELINE_COLORS.length - 1],
  }));
}

function buildActivity(campaigns: OutreachCampaign[]): OutreachActivity[] {
  const items = campaigns.flatMap((campaign, index) => {
    const baseTime = new Date(campaign.updatedAt).getTime();
    return [
      {
        id: `${campaign.id}-status`,
        type: "Campaign",
        title: `${campaign.name} is ${campaign.status.toLowerCase()}`,
        detail: `${campaign.client} · ${campaign.owner}`,
        happenedAt: new Date(baseTime - index * 15 * 60 * 1000).toISOString(),
      },
      {
        id: `${campaign.id}-reply`,
        type: "Replies",
        title: `${campaign.positiveReplies} positive replies in ${campaign.name}`,
        detail: `${campaign.replyRate}% reply rate · ${campaign.meetingsBooked} meetings booked`,
        happenedAt: new Date(baseTime - (index + 1) * 45 * 60 * 1000).toISOString(),
      },
    ];
  });

  return items.sort((a, b) => (a.happenedAt < b.happenedAt ? 1 : -1)).slice(0, 8);
}

// Leads-table-based helpers (used by Airtable path)

function buildPipelineFromLeads(statusCounts: Record<string, number>): PipelineStage[] {
  const stages = PIPELINE_STAGE_ORDER.map((label, index) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    count: statusCounts[label] ?? 0,
    value: 0,
    color: PIPELINE_STAGE_COLORS[index] ?? PIPELINE_STAGE_COLORS[PIPELINE_STAGE_COLORS.length - 1],
  }));

  return stages.map((stage, index) => {
    if (index === 0) return stage;
    const prevCount = stages[index - 1].count;
    const conversionRate = prevCount > 0 ? Math.round((stage.count / prevCount) * 1000) / 10 : 0;
    return { ...stage, conversionRate };
  });
}

function buildSummaryFromLeads(
  totalLeads: number,
  statusCounts: Record<string, number>,
  campaignCount: number,
): OutreachSummary {
  const opened = statusCounts["Opened"] ?? 0;
  const replied = statusCounts["Replied"] ?? 0;
  const interested = statusCounts["Interested"] ?? 0;
  const hotLeadCount = statusCounts["Hot Lead"] ?? 0;
  const booked = statusCounts["Booked"] ?? 0;
  const won = statusCounts["Won"] ?? 0;

  const contacted = totalLeads - (statusCounts["New"] ?? 0);
  const warmLeads = interested + hotLeadCount + booked;
  const openRate = contacted > 0 ? Math.round((opened / contacted) * 1000) / 10 : 0;
  const replyRate = contacted > 0 ? Math.round((replied / contacted) * 1000) / 10 : 0;
  const positiveReplyRate = contacted > 0 ? Math.round((warmLeads / contacted) * 1000) / 10 : 0;
  const deliverabilityScore = Math.max(42, Math.min(99, Math.round(openRate + 45)));

  return {
    activeCampaigns: campaignCount,
    leadsQueued: statusCounts["New"] ?? 0,
    leadsContacted: contacted,
    openRate,
    replyRate,
    positiveReplyRate,
    meetingsBooked: booked + won,
    pipelineValue: (booked + won) * 5000,
    warmLeads,
    deliverabilityScore,
    lastSync: new Date().toISOString(),
  };
}

function emptyResponse(): OutreachResponse {
  return {
    source: "none",
    summary: buildSummary([]),
    campaigns: [],
    pipeline: buildPipeline([]),
    hotLeads: [],
    activity: buildActivity([]),
    sourceStatus: [
      {
        id: "supabase",
        label: "Supabase",
        state: hasSupabaseConfig() ? "configured" : "missing",
        detail: hasSupabaseConfig()
          ? `Configured. Set up ${SUPABASE_OUTREACH_TABLE} to make it the source of truth.`
          : "Supabase keys not present in this runtime.",
      },
      {
        id: "upstream",
        label: "Cold-email service",
        state: OUTREACH_API_URL ? "error" : "missing",
        detail: OUTREACH_API_URL
          ? "Configured but unavailable from the current runtime."
          : "Set OUTREACH_API_URL to pull live outreach metrics from Modal or another service.",
      },
      {
        id: "airtable",
        label: "Airtable sync",
        state: AIRTABLE_BASE_ID && AIRTABLE_TABLE_ID && AIRTABLE_TOKEN ? "configured" : "missing",
        detail: AIRTABLE_BASE_ID && AIRTABLE_TABLE_ID && AIRTABLE_TOKEN
          ? "Configured as fallback only."
          : "No Airtable outreach mapping found.",
      },
    ],
    links: {
      upstreamUrl: OUTREACH_API_URL,
      airtableUrl: AIRTABLE_BASE_ID ? `https://airtable.com/${AIRTABLE_BASE_ID}` : undefined,
      supabaseTable: SUPABASE_OUTREACH_TABLE,
    },
  };
}

// Field lookup helpers

function field(fields: Record<string, unknown>, names: string[]): unknown {
  const entries = Object.entries(fields);
  for (const name of names) {
    const exact = entries.find(([key]) => key === name);
    if (exact) return exact[1];
  }

  const lowered = names.map((name) => name.toLowerCase());
  for (const [key, value] of entries) {
    const normalized = key.toLowerCase();
    if (lowered.includes(normalized)) return value;
  }

  for (const [key, value] of entries) {
    const normalized = key.toLowerCase();
    if (lowered.some((name) => normalized.includes(name))) return value;
  }

  return undefined;
}

function normalizeCampaign(record: Record<string, unknown>): OutreachCampaign {
  const name = str(field(record, ["Campaign", "Campaign Name", "Name", "Title", "name"])) || "Untitled campaign";
  const client = str(field(record, ["Client", "Account", "Brand", "client"])) || "Unknown client";
  const status = str(field(record, ["Status", "Campaign Status", "State", "status"])) || "Running";
  const owner = str(field(record, ["Owner", "Assigned To", "Rep", "owner"])) || "Team";
  const channel = str(field(record, ["Channel", "Platform", "System", "channel"])) || "Cold Email";
  const leadsQueued = num(field(record, ["Leads Queued", "Queue", "Prospects", "Total Leads", "leads_queued", "leadsQueued"]));
  const leadsContacted = num(field(record, ["Leads Contacted", "Sent", "Emails Sent", "Contacted", "leads_contacted", "leadsContacted"])) || leadsQueued;
  const openRate =
    num(field(record, ["Open Rate", "Opens %", "Open %", "Opened", "open_rate", "openRate"])) ||
    pct(num(field(record, ["Opens", "Opened Count"])), Math.max(leadsContacted, 1));
  const replyRate =
    num(field(record, ["Reply Rate", "Replies %", "Reply %", "reply_rate", "replyRate"])) ||
    pct(num(field(record, ["Replies", "replies"])), Math.max(leadsContacted, 1));
  const positiveReplies = num(field(record, ["Positive Replies", "Interested", "Warm Replies", "positive_replies", "positiveReplies"]));
  const meetingsBooked = num(field(record, ["Meetings Booked", "Calls Booked", "Booked Meetings", "meetings_booked", "meetingsBooked"]));
  const pipelineValue = num(field(record, ["Pipeline Value", "Opportunities Value", "Revenue Potential", "pipeline_value", "pipelineValue"]));
  const updatedAt = isoOrNow(field(record, ["Updated", "Last Updated", "Modified", "Created", "updated_at", "updatedAt"]));

  const baseCampaign = {
    id: str(field(record, ["id", "Record ID"])) || `normalized-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    client,
    status,
    channel,
    owner,
    leadsQueued,
    leadsContacted,
    openRate,
    replyRate,
    positiveReplies,
    meetingsBooked,
    pipelineValue,
    updatedAt,
  };

  return {
    ...baseCampaign,
    health: healthFromCampaign(baseCampaign),
  };
}

// Data loaders

async function loadFromSupabase(): Promise<OutreachResponse | null> {
  if (!hasSupabaseConfig()) return null;

  const rows = await supabaseSelect<Record<string, unknown>>(SUPABASE_OUTREACH_TABLE, {
    order: { column: "updated_at", ascending: false },
    limit: 100,
  });

  if (!rows.length) return null;

  const campaigns = rows.map((row) => normalizeCampaign(row));

  return {
    source: "supabase",
    summary: buildSummary(campaigns),
    campaigns,
    pipeline: buildPipeline(campaigns),
    hotLeads: [],
    activity: buildActivity(campaigns),
    sourceStatus: [
      {
        id: "supabase",
        label: "Supabase",
        state: "live",
        detail: `Fetched ${campaigns.length} outreach records from ${SUPABASE_OUTREACH_TABLE}.`,
      },
      {
        id: "upstream",
        label: "Cold-email service",
        state: OUTREACH_API_URL ? "configured" : "missing",
        detail: OUTREACH_API_URL
          ? "Configured, but Supabase is currently the read model for the page."
          : "No upstream outreach service configured yet.",
      },
      {
        id: "airtable",
        label: "Airtable sync",
        state: AIRTABLE_BASE_ID && AIRTABLE_TABLE_ID && AIRTABLE_TOKEN ? "configured" : "missing",
        detail: AIRTABLE_BASE_ID && AIRTABLE_TABLE_ID && AIRTABLE_TOKEN
          ? "Configured as fallback only."
          : "No Airtable fallback configured.",
      },
    ],
    links: {
      supabaseTable: SUPABASE_OUTREACH_TABLE,
      airtableUrl: AIRTABLE_BASE_ID ? `https://airtable.com/${AIRTABLE_BASE_ID}` : undefined,
      upstreamUrl: OUTREACH_API_URL,
    },
  };
}

async function fetchAllAirtableRecords(
  baseId: string,
  tableId: string,
  token: string,
  view?: string,
): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (view) params.set("view", view);
    if (offset) params.set("offset", offset);

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Airtable fetch failed: ${response.status} ${detail}`);
    }

    const payload = await response.json();
    for (const record of payload.records ?? []) {
      allRecords.push({ id: record.id, fields: record.fields ?? {} });
    }
    offset = payload.offset;
  } while (offset);

  return allRecords;
}

async function loadFromAirtable(): Promise<OutreachResponse | null> {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) return null;

  const records = await fetchAllAirtableRecords(
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    AIRTABLE_TOKEN,
    AIRTABLE_VIEW,
  );

  if (!records.length) return null;

  // Count leads by status and collect hot leads
  const statusCounts: Record<string, number> = {};
  const campaignNames = new Set<string>();
  const hotLeads: HotLead[] = [];

  for (const record of records) {
    const f = record.fields;

    const status = str(
      f["Status"] ?? f["Lead Status"] ?? f["Stage"] ?? f["status"] ?? "New",
    ) || "New";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    const campaign = str(
      f["Campaign"] ?? f["Campaign Name"] ?? f["campaign"] ?? "",
    );
    if (campaign) campaignNames.add(campaign);

    if (HOT_STATUSES.has(status)) {
      hotLeads.push({
        id: record.id,
        name: str(
          f["Name"] ?? f["Full Name"] ?? f["First Name"] ?? f["Contact Name"] ?? f["Lead Name"] ?? "",
        ) || "Unknown",
        company: str(f["Company"] ?? f["Organization"] ?? f["Business"] ?? f["Account"] ?? ""),
        email: str(f["Email"] ?? f["Email Address"] ?? f["email"] ?? ""),
        status,
        campaign,
        lastActivity: isoOrNow(
          f["Last Activity"] ?? f["Updated"] ?? f["Last Modified"] ?? f["Created"] ?? "",
        ),
      });
    }
  }

  hotLeads.sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1));
  const topHotLeads = hotLeads.slice(0, 10);

  const campaignCount = Math.max(campaignNames.size, 1);
  const pipeline = buildPipelineFromLeads(statusCounts);
  const summary = buildSummaryFromLeads(records.length, statusCounts, campaignCount);

  // Build one campaign row per unique campaign name
  const syntheticCampaigns: OutreachCampaign[] = Array.from(campaignNames).map(
    (name, index) => {
      const campaignLeads = records.filter(
        (r) => str(r.fields["Campaign"] ?? r.fields["Campaign Name"] ?? r.fields["campaign"] ?? "") === name,
      );
      const total = campaignLeads.length;
      const replies = campaignLeads.filter((r) => {
        const s = str(r.fields["Status"] ?? r.fields["Lead Status"] ?? r.fields["Stage"] ?? "");
        return ["Replied", "Interested", "Hot Lead", "Booked", "Won"].includes(s);
      }).length;
      const positive = campaignLeads.filter((r) => {
        const s = str(r.fields["Status"] ?? r.fields["Lead Status"] ?? r.fields["Stage"] ?? "");
        return ["Interested", "Hot Lead", "Booked", "Won"].includes(s);
      }).length;
      const booked = campaignLeads.filter((r) => {
        const s = str(r.fields["Status"] ?? r.fields["Lead Status"] ?? r.fields["Stage"] ?? "");
        return ["Booked", "Won"].includes(s);
      }).length;

      const base = {
        id: `at-campaign-${index}`,
        name,
        client: str(campaignLeads[0]?.fields["Client"] ?? campaignLeads[0]?.fields["Account"] ?? "") || "DLF",
        status: "Running",
        channel: "Cold Email",
        owner: str(campaignLeads[0]?.fields["Owner"] ?? campaignLeads[0]?.fields["Assigned To"] ?? "") || "Team",
        leadsQueued: total,
        leadsContacted: total,
        openRate: pct(
          campaignLeads.filter((r) => str(r.fields["Status"] ?? "") !== "New").length,
          Math.max(total, 1),
        ),
        replyRate: pct(replies, Math.max(total, 1)),
        positiveReplies: positive,
        meetingsBooked: booked,
        pipelineValue: booked * 5000,
        updatedAt: new Date().toISOString(),
      };

      return { ...base, health: healthFromCampaign(base) };
    },
  );

  // Fallback: single synthetic row if no campaign names found
  const fallbackBase = {
    id: "at-all",
    name: "Cold Email Pipeline",
    client: "DLF",
    status: "Running",
    channel: "Cold Email",
    owner: "Team",
    leadsQueued: records.length,
    leadsContacted: summary.leadsContacted,
    openRate: summary.openRate,
    replyRate: summary.replyRate,
    positiveReplies: summary.warmLeads,
    meetingsBooked: summary.meetingsBooked,
    pipelineValue: summary.pipelineValue,
    updatedAt: new Date().toISOString(),
  };
  const campaigns: OutreachCampaign[] = syntheticCampaigns.length
    ? syntheticCampaigns
    : [{ ...fallbackBase, health: healthFromCampaign(fallbackBase) }];

  // Build activity from hot leads
  const activity: OutreachActivity[] = [
    ...topHotLeads.slice(0, 4).map((lead) => ({
      id: `activity-${lead.id}`,
      type: lead.status,
      title: `${lead.name} marked as ${lead.status}`,
      detail: `${lead.company || "Unknown company"} · ${lead.campaign || "Cold Email"}`,
      happenedAt: lead.lastActivity,
    })),
    {
      id: "activity-summary",
      type: "Pipeline",
      title: `${records.length} total leads in funnel`,
      detail: `${summary.warmLeads} warm leads · ${summary.meetingsBooked} booked`,
      happenedAt: new Date().toISOString(),
    },
  ].slice(0, 8);

  return {
    source: "airtable",
    summary,
    campaigns,
    pipeline,
    hotLeads: topHotLeads,
    activity,
    sourceStatus: [
      {
        id: "airtable",
        label: "Airtable — cold email CRM",
        state: "live",
        detail: `Fetched ${records.length} leads from Airtable base ${AIRTABLE_BASE_ID}.`,
      },
      {
        id: "supabase",
        label: "Supabase",
        state: hasSupabaseConfig() ? "configured" : "missing",
        detail: hasSupabaseConfig()
          ? `Configured. Migrate ${SUPABASE_OUTREACH_TABLE} and flip reads there when ready.`
          : "Supabase keys not present in this runtime.",
      },
      {
        id: "upstream",
        label: "Cold-email service (Modal / SmartLead)",
        state: OUTREACH_API_URL ? "configured" : "missing",
        detail: OUTREACH_API_URL
          ? "Configured. Airtable is the active source until upstream is wired."
          : "Set OUTREACH_API_URL to pull live metrics from Modal or SmartLead.",
      },
    ],
    links: {
      airtableUrl: `https://airtable.com/${AIRTABLE_BASE_ID}`,
      upstreamUrl: OUTREACH_API_URL,
      supabaseTable: SUPABASE_OUTREACH_TABLE,
    },
  };
}

function normalizeUpstreamPayload(input: unknown): OutreachResponse | null {
  const raw = input as Record<string, unknown> | null | undefined;
  const payload = (raw?.data ?? raw) as Record<string, unknown> | null | undefined;
  if (!payload || !Array.isArray(payload.campaigns)) return null;

  const campaigns: OutreachCampaign[] = (payload.campaigns as Record<string, unknown>[]).map((campaign, index) => {
    const normalized = {
      id: str(campaign.id) || `upstream-${index + 1}`,
      name: str(campaign.name) || `Campaign ${index + 1}`,
      client: str(campaign.client) || "Unknown client",
      status: str(campaign.status) || "Running",
      channel: str(campaign.channel) || "Cold Email",
      owner: str(campaign.owner) || "Team",
      leadsQueued: num(campaign.leadsQueued ?? campaign.queue ?? campaign.totalLeads),
      leadsContacted: num(campaign.leadsContacted ?? campaign.sent ?? campaign.emailsSent),
      openRate: num(campaign.openRate ?? campaign.opensPct),
      replyRate: num(campaign.replyRate ?? campaign.repliesPct),
      positiveReplies: num(campaign.positiveReplies ?? campaign.positiveReplyCount ?? campaign.interested),
      meetingsBooked: num(campaign.meetingsBooked ?? campaign.bookedMeetings),
      pipelineValue: num(campaign.pipelineValue ?? campaign.revenuePotential),
      updatedAt: isoOrNow(campaign.updatedAt ?? campaign.lastSyncedAt ?? campaign.createdAt, index + 1),
    };

    return {
      ...normalized,
      health: healthFromCampaign(normalized),
    };
  });

  const rawSourceStatus = payload.sourceStatus;
  const sourceStatus: SourceStatus[] = Array.isArray(rawSourceStatus)
    ? (rawSourceStatus as Record<string, unknown>[]).map((item, index) => ({
        id: str(item.id) || `source-${index + 1}`,
        label: str(item.label) || `Source ${index + 1}`,
        state: (["live", "configured", "mock", "missing", "error"].includes(str(item.state)) ? item.state : "configured") as SourceState,
        detail: str(item.detail) || "Source connected.",
      }))
    : [
        {
          id: "upstream",
          label: "Cold-email service",
          state: "live" as SourceState,
          detail: "Metrics loaded from the configured outreach API.",
        },
      ];

  const rawSummary = payload.summary as Record<string, unknown> | undefined;
  const rawPipeline = payload.pipeline;
  const rawActivity = payload.activity;
  const rawLinks = payload.links as Record<string, unknown> | undefined;

  return {
    source: "upstream",
    summary: rawSummary
      ? {
          activeCampaigns: num(rawSummary.activeCampaigns),
          leadsQueued: num(rawSummary.leadsQueued),
          leadsContacted: num(rawSummary.leadsContacted),
          openRate: num(rawSummary.openRate),
          replyRate: num(rawSummary.replyRate),
          positiveReplyRate: num(rawSummary.positiveReplyRate),
          meetingsBooked: num(rawSummary.meetingsBooked),
          pipelineValue: num(rawSummary.pipelineValue),
          warmLeads: num(rawSummary.warmLeads),
          deliverabilityScore: num(rawSummary.deliverabilityScore),
          lastSync: isoOrNow(rawSummary.lastSync),
        }
      : buildSummary(campaigns),
    campaigns,
    pipeline: Array.isArray(rawPipeline) && rawPipeline.length
      ? (rawPipeline as Record<string, unknown>[]).map((stage, index) => ({
          id: str(stage.id) || `stage-${index + 1}`,
          label: str(stage.label) || `Stage ${index + 1}`,
          count: num(stage.count),
          value: num(stage.value),
          color: str(stage.color) || DEFAULT_PIPELINE_COLORS[index] || DEFAULT_PIPELINE_COLORS[0],
        }))
      : buildPipeline(campaigns),
    hotLeads: [],
    activity: Array.isArray(rawActivity) && rawActivity.length
      ? (rawActivity as Record<string, unknown>[]).map((event, index) => ({
          id: str(event.id) || `event-${index + 1}`,
          type: str(event.type) || "Update",
          title: str(event.title) || "Campaign updated",
          detail: str(event.detail) || "",
          happenedAt: isoOrNow(event.happenedAt ?? event.updatedAt, index + 1),
        }))
      : buildActivity(campaigns),
    sourceStatus,
    links: {
      airtableUrl: str(rawLinks?.airtableUrl),
      upstreamUrl: OUTREACH_API_URL || str(rawLinks?.upstreamUrl),
      supabaseTable: SUPABASE_OUTREACH_TABLE,
    },
  };
}

async function loadFromUpstream(): Promise<OutreachResponse | null> {
  if (!OUTREACH_API_URL) return null;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (OUTREACH_API_KEY) headers.Authorization = `Bearer ${OUTREACH_API_KEY}`;

  const response = await fetch(OUTREACH_API_URL, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Outreach API fetch failed: ${response.status} ${detail}`);
  }

  const payload = await response.json();
  return normalizeUpstreamPayload(payload);
}

export async function getOutreachDashboard(): Promise<OutreachResponse> {
  const sourceErrors: string[] = [];

  const loaders: Array<[string, () => Promise<OutreachResponse | null>]> =
    OUTREACH_DATA_PROVIDER === "supabase"
      ? [
          ["supabase", loadFromSupabase],
          ["upstream", loadFromUpstream],
          ["airtable", loadFromAirtable],
        ]
      : [
          ["airtable", loadFromAirtable],
          ["supabase", loadFromSupabase],
          ["upstream", loadFromUpstream],
        ];

  for (const [label, loader] of loaders) {
    try {
      const data = await loader();
      if (data) {
        if (sourceErrors.length) {
          data.sourceStatus.push({
            id: "warnings",
            label: "Fallback notes",
            state: "configured",
            detail: sourceErrors.join(" | "),
          });
        }
        return data;
      }
    } catch (error) {
      sourceErrors.push(error instanceof Error ? error.message : `Unknown ${label} outreach error`);
    }
  }

  const fallback = emptyResponse();
  if (sourceErrors.length) {
    fallback.sourceStatus = fallback.sourceStatus.map((source) =>
      source.id === "supabase" || source.id === "upstream" || source.id === "airtable"
        ? { ...source, state: "error" as SourceState, detail: sourceErrors.join(" | ") }
        : source,
    );
  }

  return fallback;
}
