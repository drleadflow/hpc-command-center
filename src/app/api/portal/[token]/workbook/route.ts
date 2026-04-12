import { NextRequest, NextResponse } from "next/server";
import { getPortalLink, getWorkbookProgress, updateWorkbookModule } from "@/lib/db";
import type { WorkbookModuleStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const link = await getPortalLink(token);

  if (!link) {
    return NextResponse.json({ error: "Invalid or expired portal link" }, { status: 404 });
  }

  const workbook = await getWorkbookProgress(token, link.clientSlug);
  return NextResponse.json(workbook);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const link = await getPortalLink(token);

  if (!link) {
    return NextResponse.json({ error: "Invalid or expired portal link" }, { status: 404 });
  }

  let body: { moduleId?: string; status?: WorkbookModuleStatus; progress?: number; lastActivity?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { moduleId, status, progress, lastActivity } = body;

  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  }

  const updated = await updateWorkbookModule(token, link.clientSlug, moduleId, {
    status,
    progress,
    lastActivity,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
