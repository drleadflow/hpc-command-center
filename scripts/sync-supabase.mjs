#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(ROOT, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const mode = (process.argv[2] || "all").toLowerCase();
const dryRun = process.argv.includes("--dry-run");

function requireEnv(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function clean(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean).join(", ");
  return String(value);
}

function num(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function field(fields, names) {
  const entries = Object.entries(fields);
  for (const name of names) {
    const exact = entries.find(([key]) => key === name);
    if (exact) return exact[1];
  }

  const lowered = names.map((name) => name.toLowerCase());
  for (const [key, value] of entries) {
    if (lowered.includes(key.toLowerCase())) return value;
  }

  for (const [key, value] of entries) {
    const normalized = key.toLowerCase();
    if (lowered.some((name) => normalized.includes(name))) return value;
  }

  return undefined;
}

function iso(value, fallback = new Date().toISOString()) {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${detail}`);
  }
  return res.json();
}

function supabaseConfig() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.SUPABASE_URL),
    key: requireEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_API_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

async function upsertRows(table, rows) {
  if (!rows.length) return;

  const { url, key } = supabaseConfig();
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=id`;

  for (let index = 0; index < rows.length; index += 100) {
    const chunk = rows.slice(index, index + 100);
    if (dryRun) {
      console.log(`[dry-run] would upsert ${chunk.length} row(s) into ${table}`);
      continue;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Supabase upsert failed for ${table}: ${res.status} ${detail}`);
    }

    console.log(`upserted ${chunk.length} row(s) into ${table}`);
  }
}

async function fetchContentRows() {
  const apiKey = requireEnv("AIRTABLE_CONTENT_API_KEY", process.env.AIRTABLE_API_KEY);
  const baseId = process.env.AIRTABLE_CONTENT_BASE_ID || "app93tcET7pw7UUTx";
  const tableId = process.env.AIRTABLE_CONTENT_TABLE_ID || "tblwH8cA11yfZcz7m";

  const params = new URLSearchParams({
    maxRecords: "500",
    "sort[0][field]": "Created",
    "sort[0][direction]": "desc",
  });

  const payload = await fetchJson(`https://api.airtable.com/v0/${baseId}/${tableId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const now = new Date().toISOString();
  return (payload.records || []).map((record) => {
    const fields = record.fields || {};
    return {
      id: record.id,
      name: clean(field(fields, ["👦 Name", "name", "Name"])) || clean(field(fields, ["📖 Title", "title"])),
      title: clean(field(fields, ["📖 Title", "title", "Title"])) || clean(field(fields, ["👦 Name", "name"])),
      status: clean(field(fields, ["⭐️ Status", "status", "Status"])) || "💡 Idea",
      content_type: clean(field(fields, ["🚀 Content Type", "contentType", "content_type"])),
      platforms: Array.isArray(field(fields, ["📲 Upload Location", "platforms", "upload_location"]))
        ? field(fields, ["📲 Upload Location", "platforms", "upload_location"])
        : [],
      post_time: field(fields, ["🗓️ Post Time", "post_time", "postTime"]) || null,
      hook: clean(field(fields, ["🪝 Hook", "hook"])),
      copy: clean(field(fields, ["✍️ Copy", "copy"])),
      script: clean(field(fields, ["✍️ Script", "script"])),
      finished_video: field(fields, ["🖥️ Finished Video", "finished_video", "finishedVideo"]) || null,
      raw_link: field(fields, ["🎥 Raw Link", "raw_link", "rawLink"]) || null,
      post_link: field(fields, ["🔗 PostLink", "post_link", "postLink"]) || null,
      cta_link: field(fields, ["🎁 CTA Link", "cta_link", "ctaLink"]) || null,
      views: num(field(fields, ["👀 Views", "views"])),
      likes: num(field(fields, ["👍 Likes", "likes"])),
      shares: num(field(fields, ["🔄 Shares", "shares"])),
      saves: num(field(fields, ["🔖 Saves", "saves"])),
      comments: num(field(fields, ["💬 # of Comments", "comments"])),
      engagement_rate: num(field(fields, ["👍 Engagement Rate", "engagement_rate", "engagementRate"])),
      month: clean(field(fields, ["Month", "month"])),
      source: "airtable",
      synced_at: now,
      created_at: iso(fields.Created || record.createdTime, now),
      updated_at: now,
    };
  });
}

function normalizeOutreachCampaign(record) {
  const leadsContacted =
    num(field(record, ["Leads Contacted", "Sent", "Emails Sent", "Contacted", "leads_contacted", "leadsContacted"])) ||
    num(field(record, ["Leads Queued", "Queue", "Prospects", "Total Leads", "leads_queued", "leadsQueued"]));
  const openRate =
    num(field(record, ["Open Rate", "Opens %", "Open %", "Opened", "open_rate", "openRate"])) ||
    pct(num(field(record, ["Opens", "Opened Count"])), Math.max(leadsContacted, 1));
  const replyRate =
    num(field(record, ["Reply Rate", "Replies %", "Reply %", "reply_rate", "replyRate"])) ||
    pct(num(field(record, ["Replies", "replies"])), Math.max(leadsContacted, 1));

  return {
    id:
      clean(field(record, ["id", "Record ID", "SmartLead Account ID", "smartlead_account_id"])) ||
      `outreach-${clean(field(record, ["Campaign", "Campaign Name", "Name", "Title", "name", "Email Address"])).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name:
      clean(field(record, ["Campaign", "Campaign Name", "Name", "Title", "name", "Email Address"])) || "Untitled campaign",
    client: clean(field(record, ["Client", "Account", "Brand", "client", "Domain"])) || "Unknown client",
    status: clean(field(record, ["Status", "Campaign Status", "State", "status"])) || "Running",
    channel: clean(field(record, ["Channel", "Platform", "System", "channel"])) || "Cold Email",
    owner: clean(field(record, ["Owner", "Assigned To", "Rep", "owner", "Email Address"])) || "Team",
    leads_queued:
      num(field(record, ["Leads Queued", "Queue", "Prospects", "Total Leads", "leads_queued", "leadsQueued"])) ||
      num(field(record, ["Daily Send Limit"])),
    leads_contacted: leadsContacted,
    open_rate: openRate,
    reply_rate: replyRate,
    positive_replies: num(field(record, ["Positive Replies", "Interested", "Warm Replies", "positive_replies", "positiveReplies"])),
    meetings_booked: num(field(record, ["Meetings Booked", "Calls Booked", "Booked Meetings", "meetings_booked", "meetingsBooked"])),
    pipeline_value: num(field(record, ["Pipeline Value", "Opportunities Value", "Revenue Potential", "pipeline_value", "pipelineValue"])),
    source: clean(field(record, ["source"])) || "airtable",
    synced_at: new Date().toISOString(),
    created_at: iso(field(record, ["Created", "created_at", "createdAt"]), new Date().toISOString()),
    updated_at: iso(field(record, ["Updated", "Last Updated", "Modified", "updated_at", "updatedAt"]), new Date().toISOString()),
  };
}

async function fetchOutreachFromAirtable() {
  const apiKey = requireEnv("AIRTABLE_OUTREACH_API_KEY", process.env.AIRTABLE_API_KEY);
  const baseId = requireEnv("AIRTABLE_OUTREACH_BASE_ID");
  const tableId = requireEnv("AIRTABLE_OUTREACH_TABLE_ID");
  const view = process.env.AIRTABLE_OUTREACH_VIEW;
  const sortField = process.env.AIRTABLE_OUTREACH_SORT_FIELD;
  const sortDirection = process.env.AIRTABLE_OUTREACH_SORT_DIRECTION || "desc";

  const params = new URLSearchParams({ pageSize: "100" });
  if (view) params.set("view", view);
  if (sortField) {
    params.set("sort[0][field]", sortField);
    params.set("sort[0][direction]", sortDirection);
  }

  const payload = await fetchJson(`https://api.airtable.com/v0/${baseId}/${tableId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  return (payload.records || []).map((record) =>
    normalizeOutreachCampaign({
      id: record.id,
      ...(record.fields || {}),
      source: "airtable",
    }),
  );
}

async function fetchOutreachFromUpstream() {
  const url = requireEnv("OUTREACH_API_URL");
  const apiKey = process.env.OUTREACH_API_KEY;

  const payload = await fetchJson(url, {
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  });

  const data = payload?.data ?? payload;
  if (!Array.isArray(data?.campaigns)) {
    throw new Error("OUTREACH_API_URL did not return a campaigns array");
  }

  return data.campaigns.map((campaign, index) =>
    normalizeOutreachCampaign({
      id: campaign.id || `upstream-${index + 1}`,
      name: campaign.name,
      client: campaign.client,
      status: campaign.status,
      channel: campaign.channel,
      owner: campaign.owner,
      leads_queued: campaign.leadsQueued ?? campaign.queue ?? campaign.totalLeads,
      leads_contacted: campaign.leadsContacted ?? campaign.sent ?? campaign.emailsSent,
      open_rate: campaign.openRate ?? campaign.opensPct,
      reply_rate: campaign.replyRate ?? campaign.repliesPct,
      positive_replies: campaign.positiveReplies ?? campaign.positiveReplyCount ?? campaign.interested,
      meetings_booked: campaign.meetingsBooked ?? campaign.bookedMeetings,
      pipeline_value: campaign.pipelineValue ?? campaign.revenuePotential,
      updated_at: campaign.updatedAt ?? campaign.lastSyncedAt ?? campaign.createdAt,
      source: "upstream",
    }),
  );
}

async function fetchOutreachRows() {
  const source = (process.env.OUTREACH_SYNC_SOURCE || "airtable").toLowerCase();
  if (source === "upstream") return fetchOutreachFromUpstream();
  return fetchOutreachFromAirtable();
}

async function syncContent() {
  const table = process.env.SUPABASE_CONTENT_TABLE || "content_items";
  const rows = await fetchContentRows();
  console.log(`fetched ${rows.length} content row(s) from Airtable`);
  await upsertRows(table, rows);
}

async function syncOutreach() {
  const table = process.env.SUPABASE_OUTREACH_TABLE || "outreach_campaigns";
  const rows = await fetchOutreachRows();
  console.log(`fetched ${rows.length} outreach row(s) from ${process.env.OUTREACH_SYNC_SOURCE || "airtable"}`);
  await upsertRows(table, rows);
}

async function main() {
  if (!["all", "content", "outreach"].includes(mode)) {
    throw new Error(`Unknown sync mode "${mode}". Use one of: all, content, outreach`);
  }

  if (mode === "all" || mode === "content") {
    await syncContent();
  }

  if (mode === "all" || mode === "outreach") {
    await syncOutreach();
  }

  console.log(dryRun ? "Dry run complete." : "Sync complete.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
