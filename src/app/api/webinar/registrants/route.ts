import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GHL_BASE = "https://services.leadconnectorhq.com";

function ghlHeaders() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

function locationId() {
  return process.env.GHL_LOCATION_ID || "";
}

async function ghlGet(path: string) {
  const res = await fetch(`${GHL_BASE}${path}`, { headers: ghlHeaders() });
  if (!res.ok) {
    console.error(`GHL GET ${path} failed: ${res.status}`);
    return null;
  }
  return res.json();
}

// ── PPP Webinar Campaign — 8 workflows from ghl-superspeed-v3 ──────
// Source: drleadflow/ghl-superspeed-v3/campaigns/ppp-webinar.py
//
// Workflow 01: List Nurture (Mon-Thu)        trigger: nurture-start
// Workflow 02: Webinar Confirmation          trigger: webinar-registered
// Workflow 03: Day-Of Reminders (Thu)        trigger: webinar-registered
// Workflow 04: Attendee Follow-Up (Thu-Sun)  trigger: webinar-attended
// Workflow 05: No-Show Replay                trigger: webinar-no-show
// Workflow 06: Cart Close Deadline (Sun)     trigger: webinar-cart-open
// Workflow 07: Post-Cart Nurture             trigger: webinar-no-buy
// Workflow 08: Purchase Exit (Remove All)    trigger: pipeline-purchased

// ── Funnel stages (ordered by progression) ──────────────────────────

type FunnelStage =
  | "purchased"
  | "cart-open"
  | "attended"
  | "replay-watched"
  | "no-buy"
  | "no-show"
  | "day-of"
  | "registered"
  | "nurture"
  | "old-lead";

const FUNNEL_ORDER: FunnelStage[] = [
  "purchased",
  "cart-open",
  "attended",
  "replay-watched",
  "no-buy",
  "no-show",
  "day-of",
  "registered",
  "nurture",
  "old-lead",
];

// Tags that identify new webinar funnel contacts
const NEW_WEBINAR_TAGS = [
  "nurture-start",
  "webinar-registered",
  "webinar-day-of",
  "webinar-attended-prep",
  "webinar-attended",
  "webinar-no-show",
  "webinar-no-buy",
  "webinar-cart-open",
  "webinar-replay-watched",
  "webinar-mon-reminder",
  "pipeline-purchased",
];

// Tags from old webinar / FB lead campaigns
const OLD_LEAD_TAGS = [
  "fb course optin",
  "fb lead form",
  "fb lead form apply lp",
  "registered - webinar",
  "oct 30th webinar",
  "webinar lead",
  "invite - webinar",
];

// ── Scoring weights ─────────────────────────────────────────────────

const ENGAGEMENT_SCORES: Record<string, number> = {
  // Funnel progression (from superspeed workflow triggers)
  "pipeline-purchased": 100,
  "webinar-cart-open": 40,
  "webinar-attended": 35,
  "webinar-replay-watched": 20,
  "webinar-attended-prep": 5,
  "webinar-registered": 10,
  "webinar-day-of": 5,
  "webinar-no-buy": -5,
  "webinar-no-show": -10,
  // Engagement signals
  "replied": 20,
  "email clicked": 10,
  "email opened": 5,
  "titan-quiz-lead": 10,
  "skoolcommunity": 15,
  "ai_setter_skool": 10,
  "email list": 5,
  // PPP program (upsell path)
  "ppp-v2-start": 10,
  "ppp-v2-registered": 25,
  "ppp-v2-active": 30,
  // AI bot interaction
  "ai conversation started": 5,
  "ai owner confirmed": 15,
  "ceo bot": 10,
  "ai conversation dormant": -5,
};

// ── Contact classification ──────────────────────────────────────────

interface Classification {
  stage: FunnelStage;
  cohort: "new" | "old";
  score: number;
  signals: string[];
  activeWorkflow: string;
}

function classifyContact(tags: string[]): Classification {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  const signals: string[] = [];

  // Determine cohort
  const isNewWebinar = NEW_WEBINAR_TAGS.some((t) => tagSet.has(t));
  const cohort: "new" | "old" = isNewWebinar ? "new" : "old";

  // Determine funnel stage (highest progression wins)
  let stage: FunnelStage = cohort === "old" ? "old-lead" : "nurture";
  let activeWorkflow = cohort === "old" ? "—" : "01. List Nurture";

  if (tagSet.has("pipeline-purchased")) {
    stage = "purchased";
    activeWorkflow = "08. Purchase Exit";
    signals.push("Purchased PPP");
  } else if (tagSet.has("webinar-cart-open")) {
    stage = "cart-open";
    activeWorkflow = "06. Cart Close Deadline";
    signals.push("Opened cart page");
  } else if (tagSet.has("webinar-attended")) {
    stage = "attended";
    activeWorkflow = "04. Attendee Follow-Up";
    signals.push("Attended live webinar");
  } else if (tagSet.has("webinar-replay-watched")) {
    stage = "replay-watched";
    activeWorkflow = "05. No-Show Replay";
    signals.push("Watched replay");
  } else if (tagSet.has("webinar-no-buy")) {
    stage = "no-buy";
    activeWorkflow = "07. Post-Cart Nurture";
    signals.push("Attended, did not purchase");
  } else if (tagSet.has("webinar-no-show")) {
    stage = "no-show";
    activeWorkflow = "05. No-Show Replay";
    signals.push("Did not attend");
  } else if (tagSet.has("webinar-day-of")) {
    stage = "day-of";
    activeWorkflow = "03. Day-Of Reminders";
    signals.push("Received day-of reminders");
  } else if (tagSet.has("webinar-registered")) {
    stage = "registered";
    activeWorkflow = "02. Webinar Confirmation";
    signals.push("Registered for webinar");
  } else if (tagSet.has("nurture-start")) {
    stage = "nurture";
    activeWorkflow = "01. List Nurture";
    signals.push("In nurture sequence");
  }

  // Engagement signals
  if (tagSet.has("replied")) signals.push("Replied to messages");
  if (tagSet.has("email clicked")) signals.push("Clicked email link");
  if (tagSet.has("email opened")) signals.push("Opened emails");
  if (tagSet.has("titan-quiz-lead")) signals.push("Took Titan quiz");
  if (tagSet.has("skoolcommunity")) signals.push("Skool community member");
  if (tagSet.has("ppp-v2-active")) signals.push("PPP v2 active");
  if (tagSet.has("ppp-v2-registered")) signals.push("PPP v2 registered");
  if (tagSet.has("ai owner confirmed")) signals.push("Confirmed practice owner via AI");
  if (tagSet.has("ceo bot")) signals.push("Engaged with CEO bot");

  // Calculate score
  let score = 0;
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (ENGAGEMENT_SCORES[key]) score += ENGAGEMENT_SCORES[key];
  }
  // Bonus for old leads re-engaging with new webinar
  if (cohort === "new" && OLD_LEAD_TAGS.some((t) => tagSet.has(t))) {
    score += 15;
    signals.push("Re-engaged from old campaign");
  }

  return { stage, cohort, score, signals, activeWorkflow };
}

// ── Paginated GHL fetch ─────────────────────────────────────────────

async function fetchAllByTag(loc: string, tag: string): Promise<any[]> {
  const all: any[] = [];
  let startAfterId: string | undefined;
  let page = 0;
  const maxPages = 5; // Safety limit: 500 contacts max

  while (page < maxPages) {
    let path = `/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent(tag)}`;
    if (startAfterId) path += `&startAfterId=${startAfterId}`;

    const data = await ghlGet(path);
    const contacts = data?.contacts || [];
    if (contacts.length === 0) break;

    all.push(...contacts);
    startAfterId = contacts[contacts.length - 1].id;
    page++;

    // If less than 100 returned, we've hit the end
    if (contacts.length < 100) break;
  }

  return all;
}

// ── Main handler ────────────────────────────────────────────────────

export async function GET(req: Request) {
  const loc = locationId();
  const token = process.env.GHL_API_KEY;

  if (!loc || !token) {
    return NextResponse.json({ error: "Missing GHL credentials" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const cohortFilter = searchParams.get("cohort");
  const stageFilter = searchParams.get("stage");
  const search = searchParams.get("search") || "";

  try {
    // Fetch contacts from multiple tag sources in parallel
    const [nurtureRes, registeredRes, attendedRes, noShowRes, oldRes] = await Promise.all([
      fetchAllByTag(loc, "nurture-start"),
      fetchAllByTag(loc, "webinar-registered"),
      fetchAllByTag(loc, "webinar-attended"),
      fetchAllByTag(loc, "webinar-no-show"),
      fetchAllByTag(loc, "fb course optin"),
    ]);

    // Deduplicate by ID
    const contactMap = new Map<string, any>();
    for (const list of [nurtureRes, registeredRes, attendedRes, noShowRes, oldRes]) {
      for (const c of list) {
        contactMap.set(c.id, c);
      }
    }

    // Classify and enrich
    const registrants = Array.from(contactMap.values())
      .filter((c: any) => {
        const tags = (c.tags || []).map((t: string) => t.toLowerCase());
        // Must have at least one relevant tag
        return (
          NEW_WEBINAR_TAGS.some((t) => tags.includes(t)) ||
          OLD_LEAD_TAGS.some((t) => tags.includes(t))
        );
      })
      .filter((c: any) => {
        // Exclude test contacts
        const email = (c.email || "").toLowerCase();
        const name = (c.name || "").toLowerCase();
        return (
          !email.includes("test") &&
          !email.includes("badbots") &&
          !name.includes("test") &&
          !name.includes("badbots")
        );
      })
      .map((c: any) => {
        const { stage, cohort, score, signals, activeWorkflow } = classifyContact(c.tags || []);
        return {
          id: c.id,
          name: c.name || c.firstName || "Unknown",
          email: c.email || "",
          phone: c.phone || "",
          tags: c.tags || [],
          dateAdded: c.dateAdded,
          stage,
          cohort,
          score,
          signals,
          activeWorkflow,
          company: c.companyName || "",
          website: c.website || "",
        };
      })
      .filter((r) => {
        if (cohortFilter && r.cohort !== cohortFilter) return false;
        if (stageFilter && r.stage !== stageFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.company.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.score - a.score);

    // Stats
    const stats = {
      total: registrants.length,
      newWebinar: registrants.filter((r) => r.cohort === "new").length,
      oldLeads: registrants.filter((r) => r.cohort === "old").length,
      purchased: registrants.filter((r) => r.stage === "purchased").length,
      attended: registrants.filter((r) => r.stage === "attended").length,
      noShow: registrants.filter((r) => r.stage === "no-show").length,
      noBuy: registrants.filter((r) => r.stage === "no-buy").length,
      cartOpen: registrants.filter((r) => r.stage === "cart-open").length,
      replayWatched: registrants.filter((r) => r.stage === "replay-watched").length,
      registered: registrants.filter((r) => r.stage === "registered").length,
      dayOf: registrants.filter((r) => r.stage === "day-of").length,
      nurture: registrants.filter((r) => r.stage === "nurture").length,
      hotLeads: registrants.filter((r) => r.score >= 40).length,
    };

    // Funnel visualization data
    const funnel = FUNNEL_ORDER.map((stage) => ({
      stage,
      count: registrants.filter((r) => r.stage === stage).length,
    }));

    return NextResponse.json({ registrants, stats, funnel });
  } catch (err) {
    console.error("Webinar registrants error:", err);
    return NextResponse.json({ error: "Failed to fetch registrants" }, { status: 500 });
  }
}
