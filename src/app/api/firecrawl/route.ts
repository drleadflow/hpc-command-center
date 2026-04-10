import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

export const dynamic = "force-dynamic";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

function getClient() {
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
  return new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
}

// POST /api/firecrawl — unified endpoint for scrape, extract, search, agent
export async function POST(req: NextRequest) {
  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: "FIRECRAWL_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { action, url, urls, prompt, schema, model } = body;

  const fc = getClient();

  try {
    // --- SCRAPE: single URL → markdown/json ---
    if (action === "scrape") {
      if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
      const result = await fc.scrape(url, {
        formats: ["markdown", "json"],
        ...(schema ? { jsonOptions: { schema } } : {}),
      });
      return NextResponse.json({ success: true, data: result });
    }

    // --- EXTRACT: structured data from one or more URLs ---
    if (action === "extract") {
      const targetUrls = urls || (url ? [url] : null);
      if (!targetUrls) return NextResponse.json({ error: "url or urls required" }, { status: 400 });
      const result = await (fc as any).extract({
        urls: targetUrls,
        prompt: prompt || "Extract all key information",
        ...(schema ? { schema } : {}),
      });
      return NextResponse.json({ success: true, data: result });
    }

    // --- SEARCH: web search with full page content ---
    if (action === "search") {
      if (!prompt) return NextResponse.json({ error: "prompt required for search" }, { status: 400 });
      const result = await (fc as any).search(prompt, { limit: 5 });
      return NextResponse.json({ success: true, data: result });
    }

    // --- AGENT: autonomous research (no URLs needed) ---
    if (action === "agent") {
      if (!prompt) return NextResponse.json({ error: "prompt required for agent" }, { status: 400 });
      const result = await (fc as any).agent({
        prompt,
        ...(schema ? { schema } : {}),
        model: model || "spark-1-mini",
      });
      return NextResponse.json({ success: true, data: result });
    }

    // --- MAP: discover all URLs on a domain ---
    if (action === "map") {
      if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
      const result = await (fc as any).mapUrl(url);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: `Unknown action: ${action}. Use: scrape, extract, search, agent, map` }, { status: 400 });

  } catch (err: any) {
    console.error("[firecrawl] error:", err);
    return NextResponse.json({ error: err.message || "Firecrawl request failed" }, { status: 502 });
  }
}
