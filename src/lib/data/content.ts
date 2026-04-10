import { hasSupabaseConfig, supabaseInsert, supabaseSelect, supabaseUpdate } from "./supabase";

export interface ContentItem {
  id: string;
  name: string;
  status: string;
  contentType: string;
  platforms: string[];
  postTime: string | null;
  hook: string;
  copy: string;
  finishedVideo: string | null;
  rawLink: string | null;
  postLink: string | null;
  ctaLink: string | null;
  views: number;
  likes: number;
  shares: number;
  saves: number;
  comments: number;
  engagementRate: number;
  month: string;
  title: string;
  script: string;
  createdAt: string;
}

export type ContentRoutePatchInput = {
  id: string;
  fields?: Record<string, unknown>;
  status?: string;
};

type ContentProvider = "supabase" | "airtable";

const AIRTABLE_API_KEY = process.env.AIRTABLE_CONTENT_API_KEY || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_CONTENT_BASE_ID || "app93tcET7pw7UUTx";
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_CONTENT_TABLE_ID || "tblwH8cA11yfZcz7m";
const SUPABASE_CONTENT_TABLE = process.env.SUPABASE_CONTENT_TABLE || "content_items";
const CONTENT_DATA_PROVIDER = process.env.CONTENT_DATA_PROVIDER || "airtable";

function clean(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map((item) => clean(item)).filter(Boolean).join(", ");
  return String(val);
}

function num(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val.replace(/[$,%\s,]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function provider(): ContentProvider {
  if (CONTENT_DATA_PROVIDER === "supabase" && hasSupabaseConfig()) return "supabase";
  return "airtable";
}

function field(fields: Record<string, unknown>, names: string[]): unknown {
  const exactEntries = Object.entries(fields);
  for (const name of names) {
    const exact = exactEntries.find(([key]) => key === name);
    if (exact) return exact[1];
  }

  const normalizedNames = names.map((name) => name.toLowerCase());
  for (const [key, value] of exactEntries) {
    const lowered = key.toLowerCase();
    if (normalizedNames.includes(lowered)) return value;
  }
  return undefined;
}

function toContentItem(fields: Record<string, unknown>, id: string, createdAt?: string): ContentItem {
  return {
    id,
    name: clean(field(fields, ["👦 Name", "name", "Name"])) || clean(field(fields, ["📖 Title", "title", "Title"])) || "Untitled",
    status: clean(field(fields, ["⭐️ Status", "status", "Status"])),
    contentType: clean(field(fields, ["🚀 Content Type", "content_type", "contentType"])),
    platforms: Array.isArray(field(fields, ["📲 Upload Location", "platforms", "upload_location"]))
      ? (field(fields, ["📲 Upload Location", "platforms", "upload_location"]) as string[])
      : [],
    postTime: (field(fields, ["🗓️ Post Time", "post_time", "postTime"]) as string | null) || null,
    hook: clean(field(fields, ["🪝 Hook", "hook", "Hook"])),
    copy: clean(field(fields, ["✍️ Copy", "copy", "Copy"])),
    finishedVideo: (field(fields, ["🖥️ Finished Video", "finished_video", "finishedVideo"]) as string | null) || null,
    rawLink: (field(fields, ["🎥 Raw Link", "raw_link", "rawLink"]) as string | null) || null,
    postLink: (field(fields, ["🔗 PostLink", "post_link", "postLink"]) as string | null) || null,
    ctaLink: (field(fields, ["🎁 CTA Link", "cta_link", "ctaLink"]) as string | null) || null,
    views: num(field(fields, ["👀 Views", "views", "Views"])),
    likes: num(field(fields, ["👍 Likes", "likes", "Likes"])),
    shares: num(field(fields, ["🔄 Shares", "shares", "Shares"])),
    saves: num(field(fields, ["🔖 Saves", "saves", "Saves"])),
    comments: num(field(fields, ["💬 # of Comments", "comments", "Comments"])),
    engagementRate: num(field(fields, ["👍 Engagement Rate", "engagement_rate", "engagementRate"])),
    month: clean(field(fields, ["Month", "month"])),
    title: clean(field(fields, ["📖 Title", "title", "Title"])),
    script: clean(field(fields, ["✍️ Script", "script", "Script"])),
    createdAt: createdAt || clean(field(fields, ["Created", "created_at", "createdAt"])) || new Date().toISOString(),
  };
}

function canonicalFieldsFromRoute(fields: Record<string, unknown>): Record<string, unknown> {
  return {
    name: field(fields, ["👦 Name", "name", "Name"]),
    status: field(fields, ["⭐️ Status", "status", "Status"]),
    content_type: field(fields, ["🚀 Content Type", "contentType", "content_type"]),
    hook: field(fields, ["🪝 Hook", "hook", "Hook"]),
    copy: field(fields, ["✍️ Copy", "copy", "Copy"]),
    script: field(fields, ["✍️ Script", "script", "Script"]),
    platforms: field(fields, ["📲 Upload Location", "platforms", "upload_location"]),
    post_time: field(fields, ["🗓️ Post Time", "post_time", "postTime"]),
    cta_link: field(fields, ["🎁 CTA Link", "cta_link", "ctaLink"]),
    finished_video: field(fields, ["🖥️ Finished Video", "finished_video", "finishedVideo"]),
    raw_link: field(fields, ["🎥 Raw Link", "raw_link", "rawLink"]),
    post_link: field(fields, ["🔗 PostLink", "post_link", "postLink"]),
    views: field(fields, ["👀 Views", "views", "Views"]),
    likes: field(fields, ["👍 Likes", "likes", "Likes"]),
    shares: field(fields, ["🔄 Shares", "shares", "Shares"]),
    saves: field(fields, ["🔖 Saves", "saves", "Saves"]),
    comments: field(fields, ["💬 # of Comments", "comments", "Comments"]),
    engagement_rate: field(fields, ["👍 Engagement Rate", "engagementRate", "engagement_rate"]),
    month: field(fields, ["Month", "month"]),
    title: field(fields, ["📖 Title", "title", "Title"]),
  };
}

function compact<T extends Record<string, unknown>>(record: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== "")
  ) as Partial<T>;
}

async function listFromAirtable(limit: number, status?: string | null): Promise<ContentItem[]> {
  if (!AIRTABLE_API_KEY) return [];

  const params = new URLSearchParams({
    maxRecords: String(limit),
    "sort[0][field]": "Created",
    "sort[0][direction]": "desc",
  });

  if (status && status !== "all") {
    params.set("filterByFormula", `{⭐️ Status} = "${status}"`);
  }

  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Airtable content fetch failed: ${res.status} ${detail}`);
  }

  const payload = await res.json();
  return (payload.records || []).map((record: any) => toContentItem(record.fields || {}, record.id, record.fields?.Created || record.createdTime));
}

async function createInAirtable(title: string): Promise<ContentItem> {
  if (!AIRTABLE_API_KEY) throw new Error("Airtable content API key not configured");

  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "👦 Name": title,
        "⭐️ Status": "💡 Idea",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Airtable content create failed: ${res.status} ${detail}`);
  }

  const created = await res.json();
  return toContentItem(created.fields || {}, created.id, created.createdTime);
}

async function updateInAirtable(input: ContentRoutePatchInput): Promise<ContentItem> {
  if (!AIRTABLE_API_KEY) throw new Error("Airtable content API key not configured");

  const updateFields = input.fields || { "⭐️ Status": input.status };
  const cleaned = compact(updateFields);

  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${input.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: cleaned }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Airtable content update failed: ${res.status} ${detail}`);
  }

  const updated = await res.json();
  return toContentItem(updated.fields || {}, updated.id, updated.createdTime);
}

async function listFromSupabase(limit: number, status?: string | null): Promise<ContentItem[]> {
  const rows = await supabaseSelect<Record<string, unknown>>(SUPABASE_CONTENT_TABLE, {
    limit,
    order: { column: "created_at", ascending: false },
    filters: status && status !== "all" ? { status } : undefined,
  });

  return rows.map((row) => toContentItem(row, clean(row.id), clean(row.created_at as string)));
}

async function createInSupabase(title: string): Promise<ContentItem> {
  const row = await supabaseInsert<Record<string, unknown>>(SUPABASE_CONTENT_TABLE, {
    name: title,
    title,
    status: "💡 Idea",
    platforms: [],
    views: 0,
    likes: 0,
    shares: 0,
    saves: 0,
    comments: 0,
    engagement_rate: 0,
  });

  return toContentItem(row, clean(row.id), clean(row.created_at as string));
}

async function updateInSupabase(input: ContentRoutePatchInput): Promise<ContentItem> {
  const routeFields = input.fields || { status: input.status };
  const row = await supabaseUpdate<Record<string, unknown>>(
    SUPABASE_CONTENT_TABLE,
    compact(canonicalFieldsFromRoute(routeFields)),
    { id: input.id },
  );

  return toContentItem(row, clean(row.id), clean(row.created_at as string));
}

export async function listContentItems(options: { limit?: number; status?: string | null } = {}): Promise<ContentItem[]> {
  const { limit = 100, status } = options;
  return provider() === "supabase" ? listFromSupabase(limit, status) : listFromAirtable(limit, status);
}

export async function createContentItem(title: string): Promise<ContentItem> {
  return provider() === "supabase" ? createInSupabase(title) : createInAirtable(title);
}

export async function updateContentItem(input: ContentRoutePatchInput): Promise<ContentItem> {
  return provider() === "supabase" ? updateInSupabase(input) : updateInAirtable(input);
}
