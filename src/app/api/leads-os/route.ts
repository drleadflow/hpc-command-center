import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GHL_BASE = "https://services.leadconnectorhq.com";

function ghlHeaders() {
  const token = process.env.GHL_API_KEY;
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

function locationId() {
  return process.env.GHL_LOCATION_ID || "";
}

async function ghlGet(path: string) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    headers: ghlHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`GHL GET ${path} failed: ${res.status} — ${text}`);
    return null;
  }
  return res.json();
}

async function ghlPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`GHL POST ${path} failed: ${res.status} — ${text}`);
    return null;
  }
  return res.json();
}

async function ghlPut(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method: "PUT",
    headers: ghlHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`GHL PUT ${path} failed: ${res.status} — ${text}`);
    return null;
  }
  return res.json();
}

// ─── GET handler ──────────────────────────────────────────────────
export async function GET(req: Request) {
  const loc = locationId();
  const token = process.env.GHL_API_KEY;

  if (!loc || !token) {
    return NextResponse.json({
      error: "Missing GHL credentials",
      data: null,
    });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "contacts";

  try {
    // ── Contacts ─────────────────────────────────────────────────
    if (action === "contacts") {
      const search = searchParams.get("search") || "";
      const tag = searchParams.get("tag") || "";

      // If searching, use query param; otherwise fetch by tag
      if (search) {
        const path = `/contacts/?locationId=${loc}&limit=100&query=${encodeURIComponent(search)}`;
        const data = await ghlGet(path);
        return NextResponse.json({
          contacts: data?.contacts || [],
          meta: data?.meta || null,
        });
      }

      // Default: fetch webinar contacts from multiple tags in parallel
      if (!tag || tag === "webinar") {
        const [nurture, registered, attended, noShow, oldLeads] = await Promise.all([
          ghlGet(`/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent("nurture-start")}`),
          ghlGet(`/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent("webinar-registered")}`),
          ghlGet(`/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent("webinar-attended")}`),
          ghlGet(`/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent("webinar-no-show")}`),
          ghlGet(`/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent("fb course optin")}`),
        ]);

        // Deduplicate
        const map = new Map<string, unknown>();
        for (const res of [nurture, registered, attended, noShow, oldLeads]) {
          for (const c of res?.contacts || []) {
            map.set(c.id, c);
          }
        }

        // Filter out test contacts
        const contacts = Array.from(map.values()).filter((c: any) => {
          const email = (c.email || "").toLowerCase();
          const name = (c.name || "").toLowerCase();
          return !email.includes("test") && !email.includes("badbots") && !name.includes("test") && !name.includes("badbots");
        });

        return NextResponse.json({ contacts, meta: { total: contacts.length } });
      }

      // Specific tag requested
      const path = `/contacts/?locationId=${loc}&limit=100&tag=${encodeURIComponent(tag)}`;
      const data = await ghlGet(path);
      return NextResponse.json({
        contacts: data?.contacts || [],
        meta: data?.meta || null,
      });
    }

    // ── Single contact detail ────────────────────────────────────
    if (action === "contact") {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Missing id", data: null });
      const data = await ghlGet(`/contacts/${id}`);
      return NextResponse.json({ contact: data?.contact || data || null });
    }

    // ── Contact notes ────────────────────────────────────────────
    if (action === "notes") {
      const contactId = searchParams.get("contactId");
      if (!contactId) return NextResponse.json({ error: "Missing contactId", data: null });
      const data = await ghlGet(`/contacts/${contactId}/notes`);
      return NextResponse.json({ notes: data?.notes || [] });
    }

    // ── Contact tasks ────────────────────────────────────────────
    if (action === "tasks") {
      const contactId = searchParams.get("contactId");
      if (!contactId) return NextResponse.json({ error: "Missing contactId", data: null });
      const data = await ghlGet(`/contacts/${contactId}/tasks`);
      return NextResponse.json({ tasks: data?.tasks || [] });
    }

    // ── Conversations ────────────────────────────────────────────
    if (action === "conversations") {
      const contactId = searchParams.get("contactId");
      if (!contactId) return NextResponse.json({ error: "Missing contactId", data: null });
      const convData = await ghlGet(
        `/conversations/search?locationId=${loc}&contactId=${contactId}`
      );
      const conversations = convData?.conversations || [];
      let messages: unknown[] = [];
      if (conversations.length > 0) {
        const convId = conversations[0].id;
        const msgData = await ghlGet(`/conversations/${convId}/messages`);
        messages = msgData?.messages || [];
      }
      return NextResponse.json({ conversations, messages });
    }

    // ── Pipelines (with stages) ─────────────────────────────────
    if (action === "pipelines") {
      const data = await ghlGet(`/opportunities/pipelines?locationId=${loc}`);
      return NextResponse.json({ pipelines: data?.pipelines || [] });
    }

    // ── Pipeline opportunities (by pipeline, not just contact) ──
    if (action === "opportunities") {
      const contactId = searchParams.get("contactId");
      const pipelineId = searchParams.get("pipelineId");
      let path = `/opportunities/search?locationId=${loc}`;
      if (contactId) path += `&contact_id=${contactId}`;
      if (pipelineId) path += `&pipeline_id=${pipelineId}`;
      const limit = searchParams.get("limit") || "100";
      path += `&limit=${limit}`;
      const data = await ghlGet(path);
      return NextResponse.json({
        opportunities: data?.opportunities || [],
        meta: data?.meta || null,
      });
    }

    return NextResponse.json({ error: "Unknown action", data: null });
  } catch (error) {
    console.error("Leads OS API error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    });
  }
}

// ─── POST handler ─────────────────────────────────────────────────
export async function POST(req: Request) {
  const loc = locationId();
  const token = process.env.GHL_API_KEY;

  if (!loc || !token) {
    return NextResponse.json({ error: "Missing GHL credentials" });
  }

  try {
    const body = await req.json();
    const action = body.action;

    // ── Create note ──────────────────────────────────────────────
    if (action === "note") {
      const { contactId, body: noteBody } = body;
      if (!contactId || !noteBody) {
        return NextResponse.json({ error: "Missing contactId or body" });
      }
      const data = await ghlPost(`/contacts/${contactId}/notes`, {
        body: noteBody,
      });
      return NextResponse.json({ note: data || null });
    }

    // ── Create task ──────────────────────────────────────────────
    if (action === "task") {
      const { contactId, title, dueDate, assignedTo, description } = body;
      if (!contactId || !title) {
        return NextResponse.json({ error: "Missing contactId or title" });
      }
      const taskBody: Record<string, unknown> = { title };
      if (dueDate) taskBody.dueDate = dueDate;
      if (assignedTo) taskBody.assignedTo = assignedTo;
      if (description) taskBody.description = description;
      const data = await ghlPost(`/contacts/${contactId}/tasks`, taskBody);
      return NextResponse.json({ task: data || null });
    }

    // ── Update contact tags ──────────────────────────────────────
    if (action === "update-contact") {
      const { contactId, tags } = body;
      if (!contactId) {
        return NextResponse.json({ error: "Missing contactId" });
      }
      const updateBody: Record<string, unknown> = {};
      if (tags) updateBody.tags = tags;
      const data = await ghlPut(`/contacts/${contactId}`, updateBody);
      return NextResponse.json({ contact: data?.contact || data || null });
    }

    // ── Update opportunity ───────────────────────────────────────
    if (action === "update-opportunity") {
      const { opportunityId, stageId, status, monetaryValue } = body;
      if (!opportunityId) {
        return NextResponse.json({ error: "Missing opportunityId" });
      }
      const updateBody: Record<string, unknown> = {};
      if (stageId) updateBody.stageId = stageId;
      if (status) updateBody.status = status;
      if (monetaryValue !== undefined) updateBody.monetaryValue = monetaryValue;
      const data = await ghlPut(`/opportunities/${opportunityId}`, updateBody);
      return NextResponse.json({ opportunity: data || null });
    }

    // ── Create opportunity (push contact to pipeline) ───────────
    if (action === "create-opportunity") {
      const { contactId, pipelineId, stageId, name, monetaryValue } = body;
      if (!contactId || !pipelineId || !stageId) {
        return NextResponse.json({ error: "Missing contactId, pipelineId, or stageId" });
      }
      const oppBody: Record<string, unknown> = {
        pipelineId,
        pipelineStageId: stageId,
        locationId: loc,
        contactId,
        name: name || "Webinar Lead",
        status: "open",
      };
      if (monetaryValue !== undefined) oppBody.monetaryValue = monetaryValue;
      const data = await ghlPost(`/opportunities/`, oppBody);
      return NextResponse.json({ opportunity: data || null });
    }

    // ── Bulk push contacts to pipeline ──────────────────────────
    if (action === "bulk-push-pipeline") {
      const { contactIds, pipelineId, stageId } = body;
      if (!contactIds?.length || !pipelineId || !stageId) {
        return NextResponse.json({ error: "Missing contactIds, pipelineId, or stageId" });
      }

      const results: { contactId: string; success: boolean; opportunityId?: string }[] = [];

      // Process in batches of 10 to avoid rate limits
      for (let i = 0; i < contactIds.length; i += 10) {
        const batch = contactIds.slice(i, i + 10);
        const batchResults = await Promise.all(
          batch.map(async (contactId: string) => {
            // Check if opportunity already exists for this contact in this pipeline
            const existing = await ghlGet(
              `/opportunities/search?locationId=${loc}&contact_id=${contactId}&pipeline_id=${pipelineId}`
            );
            if (existing?.opportunities?.length > 0) {
              return { contactId, success: true, opportunityId: existing.opportunities[0].id, skipped: true };
            }

            const data = await ghlPost(`/opportunities/`, {
              pipelineId,
              pipelineStageId: stageId,
              locationId: loc,
              contactId,
              name: "Webinar Lead",
              status: "open",
            });
            return {
              contactId,
              success: !!data?.opportunity?.id || !!data?.id,
              opportunityId: data?.opportunity?.id || data?.id,
            };
          })
        );
        results.push(...batchResults);
      }

      return NextResponse.json({
        results,
        created: results.filter((r) => r.success).length,
        total: contactIds.length,
      });
    }

    return NextResponse.json({ error: "Unknown action" });
  } catch (error) {
    console.error("Leads OS POST error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
