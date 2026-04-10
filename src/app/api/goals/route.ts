import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDirectory, upsertFile, deleteFile, parseFile, createFileContent, slugify } from "@/lib/github";

const CreateGoalSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  type: z.string().optional(),
  target: z.number(),
  current: z.number().optional(),
  unit: z.string().optional(),
  emoji: z.string().optional(),
  deadline: z.string().optional(),
});

const PatchGoalSchema = z.object({
  id: z.string().min(1),
  _sha: z.string().optional(),
  _path: z.string().min(1),
}).passthrough();

export const dynamic = "force-dynamic";

export type GoalType = "currency" | "count" | "percentage";
export type GoalCategory = "revenue" | "leads" | "content" | "sales" | "operations" | "custom";

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  type: GoalType;        // currency ($), count (#), percentage (%)
  target: number;
  current: number;
  unit?: string;         // e.g. "calls", "leads", "sales calls"
  emoji?: string;
  deadline?: string;     // ISO date
  created: string;
  updated: string;
  _sha?: string;
  _path?: string;
}

const DIR = "goals";

export async function GET() {
  try {
    const files = await getDirectory(DIR);
    const goals: Goal[] = [];

    for (const file of files) {
      const parsed = parseFile<any>(file);
      if (parsed) {
        goals.push({
          id: parsed.id,
          title: parsed.title,
          category: parsed.category || "custom",
          type: parsed.type || "count",
          target: Number(parsed.target) || 0,
          current: Number(parsed.current) || 0,
          unit: parsed.unit || "",
          emoji: parsed.emoji || "🎯",
          deadline: parsed.deadline || "",
          created: parsed.created,
          updated: parsed.updated,
          _sha: parsed._sha,
          _path: parsed._path,
        });
      }
    }

    goals.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    return NextResponse.json(goals);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = CreateGoalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues }, { status: 400 });
  }
  const data = result.data;
  const id = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const frontmatter = {
    id,
    title: data.title,
    category: data.category || "custom",
    type: data.type || "count",
    target: data.target,
    current: data.current ?? 0,
    unit: data.unit || "",
    emoji: data.emoji || "🎯",
    deadline: data.deadline || "",
    created: now,
    updated: now,
  };

  const content = createFileContent(frontmatter, "");
  const path = `${DIR}/${id}.md`;
  const ok = await upsertFile(path, content, `Add goal: ${body.title}`);

  if (!ok) return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  return NextResponse.json({ ...frontmatter, _path: path });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const validation = PatchGoalSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues }, { status: 400 });
  }
  const { id, _sha, _path, ...updates } = body;

  const now = new Date().toISOString();
  const frontmatter = { ...updates, id, updated: now };
  const content = createFileContent(frontmatter, "");

  const ok = await upsertFile(_path, content, `Update goal: ${updates.title || id}`, _sha);
  if (!ok) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { _path, _sha, title } = await req.json();
  const ok = await deleteFile(_path, `Delete goal: ${title}`, _sha);
  if (!ok) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
