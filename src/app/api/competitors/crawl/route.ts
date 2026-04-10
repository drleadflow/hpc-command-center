import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

export const dynamic = "force-dynamic";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const COMPETITOR_SCHEMA = {
  type: "object" as const,
  properties: {
    businessName: { type: "string", description: "Name of the business" },
    services: { type: "array", items: { type: "string" }, description: "Services offered" },
    locations: { type: "array", items: { type: "string" }, description: "Office/clinic locations" },
    teamSize: { type: "string", description: "Number of team members or 'unknown'" },
    pricing: { type: "string", description: "Any pricing information found" },
    uniqueSellingPoints: { type: "array", items: { type: "string" }, description: "Key differentiators and USPs" },
    testimonialCount: { type: "number", description: "Number of testimonials/reviews visible" },
    socialLinks: { type: "object", properties: {
      instagram: { type: "string" },
      facebook: { type: "string" },
      youtube: { type: "string" },
      tiktok: { type: "string" },
      linkedin: { type: "string" },
    }},
    techStack: { type: "array", items: { type: "string" }, description: "Visible tech: booking systems, chat widgets, CRM indicators" },
    marketingSignals: { type: "array", items: { type: "string" }, description: "Evidence of marketing: pixel, ads, retargeting, email capture" },
  },
};

export async function POST(req: NextRequest) {
  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: "FIRECRAWL_API_KEY not configured" }, { status: 500 });
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const fc = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });

  try {
    // Scrape with structured extraction
    const result = await fc.scrape(url, {
      formats: ["json", "markdown"],
      jsonOptions: { schema: COMPETITOR_SCHEMA },
    });

    return NextResponse.json({
      success: true,
      url,
      scannedAt: new Date().toISOString(),
      structured: (result as any)?.json || null,
      markdown: (result as any)?.markdown?.slice(0, 5000) || null,
      metadata: (result as any)?.metadata || null,
    });
  } catch (err: any) {
    console.error("[competitors/crawl]", err);
    return NextResponse.json({ error: err.message || "Crawl failed" }, { status: 502 });
  }
}
