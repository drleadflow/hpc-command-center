import { NextRequest, NextResponse } from "next/server";
import { createPortalLink, listPortalLinks } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_SLUGS: Record<string, string> = {
  healthproceo: "HealthProceo",
  vitality: "Vitality & Aesthetics",
  "iv-wellness": "IV Wellness",
  "corrective-skin": "Corrective Skin Care",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientSlug, clientName, expiresInDays = 30 } = body;

    if (!clientSlug) {
      return NextResponse.json({ error: "clientSlug is required" }, { status: 400 });
    }

    if (!VALID_SLUGS[clientSlug]) {
      return NextResponse.json(
        { error: "Unknown clientSlug", valid: Object.keys(VALID_SLUGS) },
        { status: 400 }
      );
    }

    const resolvedName = clientName || VALID_SLUGS[clientSlug];
    const link = await createPortalLink(clientSlug, resolvedName, expiresInDays);

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    return NextResponse.json({
      token: link.token,
      clientSlug: link.clientSlug,
      clientName: link.clientName,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      url: `${baseUrl}/portal/${link.token}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function GET() {
  const links = await listPortalLinks();

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return NextResponse.json({
    links: links.map(link => ({
      ...link,
      url: `${baseUrl}/portal/${link.token}`,
    })),
  });
}
