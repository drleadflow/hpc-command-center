import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";

export const dynamic = "force-dynamic";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const AUDIT_SCHEMA = {
  type: "object" as const,
  properties: {
    practiceName: { type: "string" },
    practiceType: { type: "string", description: "e.g. med spa, dental, chiropractic, dermatology" },
    services: { type: "array", items: { type: "string" }, description: "All services listed" },
    locations: { type: "array", items: { type: "object", properties: {
      address: { type: "string" },
      phone: { type: "string" },
    }}},
    teamMembers: { type: "number", description: "Count of team/staff listed" },
    hasOnlineBooking: { type: "boolean", description: "Is there an online booking/scheduling system?" },
    bookingSystem: { type: "string", description: "What booking system if identifiable (Calendly, Jane, Acuity, etc)" },
    ctaAnalysis: { type: "object", properties: {
      primaryCTA: { type: "string", description: "Main call-to-action text" },
      ctaCount: { type: "number", description: "Number of CTAs on the homepage" },
      ctaClarity: { type: "string", description: "clear / vague / missing" },
    }},
    trustSignals: { type: "object", properties: {
      testimonials: { type: "number", description: "Count of visible testimonials" },
      certifications: { type: "array", items: { type: "string" } },
      beforeAfterPhotos: { type: "boolean" },
      reviewScore: { type: "string", description: "Google/Yelp rating if shown" },
    }},
    messagingAnalysis: { type: "object", properties: {
      headline: { type: "string", description: "Main headline text" },
      valueProposition: { type: "string", description: "Core value prop if identifiable" },
      targetAudience: { type: "string", description: "Who the messaging targets" },
      tone: { type: "string", description: "professional / casual / clinical / luxury" },
    }},
    marketingSignals: { type: "array", items: { type: "string" }, description: "Meta pixel, Google tag, chat widget, email capture, popup" },
    socialMedia: { type: "object", properties: {
      instagram: { type: "string" },
      facebook: { type: "string" },
      youtube: { type: "string" },
      tiktok: { type: "string" },
    }},
    opportunities: { type: "array", items: { type: "string" }, description: "What's missing or could be improved for lead generation" },
  },
};

export async function POST(req: NextRequest) {
  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: "FIRECRAWL_API_KEY not configured" }, { status: 500 });
  }

  const { url, clientName } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const fc = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });

  try {
    // Step 1: Map all URLs on the domain
    const siteMap = await (fc as any).mapUrl(url);
    const totalPages = Array.isArray(siteMap?.links) ? siteMap.links.length : 0;

    // Step 2: Scrape homepage with structured extraction
    const audit = await fc.scrape(url, {
      formats: ["json", "markdown"],
      jsonOptions: { schema: AUDIT_SCHEMA },
    });

    return NextResponse.json({
      success: true,
      clientName: clientName || null,
      url,
      auditedAt: new Date().toISOString(),
      totalPages,
      siteMap: Array.isArray(siteMap?.links) ? siteMap.links.slice(0, 50) : [],
      audit: (audit as any)?.json || null,
      pageTitle: (audit as any)?.metadata?.title || null,
      pageDescription: (audit as any)?.metadata?.description || null,
    });
  } catch (err: any) {
    console.error("[client/audit]", err);
    return NextResponse.json({ error: err.message || "Audit failed" }, { status: 502 });
  }
}
