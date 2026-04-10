import { NextRequest, NextResponse } from "next/server";
import { getDirectory, upsertFile, deleteFile, parseFile, createFileContent } from "@/lib/github";

export const dynamic = "force-dynamic";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  description: string;
  created: string;
  updated: string;
  _sha?: string;
  _path?: string;
}

const DIR = "invoices";

export async function GET() {
  try {
    const files = await getDirectory(DIR);
    const invoices: Invoice[] = [];

    for (const file of files) {
      const parsed = parseFile<any>(file);
      if (parsed) {
        invoices.push({
          id: parsed.id,
          client: parsed.client || "",
          amount: Number(parsed.amount) || 0,
          status: parsed.status || "draft",
          due_date: parsed.due_date || "",
          description: parsed.description || "",
          created: parsed.created,
          updated: parsed.updated,
          _sha: parsed._sha,
          _path: parsed._path,
        });
      }
    }

    // Sort by due_date descending
    invoices.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    return NextResponse.json(invoices);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const frontmatter = {
    id,
    client: body.client,
    amount: body.amount,
    status: body.status || "draft",
    due_date: body.due_date,
    description: body.description || "",
    created: now,
    updated: now,
  };

  const content = createFileContent(frontmatter, "");
  const path = `${DIR}/${id}.md`;
  const ok = await upsertFile(path, content, `Add invoice: ${body.client}`);

  if (!ok) return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  return NextResponse.json({ ...frontmatter, _path: path });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, _sha, _path, ...updates } = body;

  const now = new Date().toISOString();
  const frontmatter = { ...updates, id, updated: now };
  const content = createFileContent(frontmatter, "");

  const ok = await upsertFile(_path, content, `Update invoice: ${updates.client || id}`, _sha);
  if (!ok) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { _path, _sha, client } = await req.json();
  const ok = await deleteFile(_path, `Delete invoice: ${client}`, _sha);
  if (!ok) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
