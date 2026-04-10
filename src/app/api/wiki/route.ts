import { NextRequest, NextResponse } from "next/server";
import { getDirectory, upsertFile, parseFile, slugify } from "@/lib/github";

export const dynamic = "force-dynamic";

export interface WikiPage {
  title: string;
  content: string;
  created: string;
  updated: string;
  _sha?: string;
  _path?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");

  if (!department) {
    return NextResponse.json({ error: "Department is required" }, { status: 400 });
  }

  try {
    const files = await getDirectory(`wiki/${department}`);
    const pages: WikiPage[] = [];

    for (const file of files) {
      const parsed = parseFile<any>(file);
      if (parsed) {
        pages.push({
          title: parsed.title || file.name.replace(".md", ""),
          content: parsed.content || "",
          created: parsed.created || "",
          updated: parsed.updated || "",
          _sha: parsed._sha,
          _path: parsed._path,
        });
      }
    }

    // Sort by title
    pages.sort((a, b) => a.title.localeCompare(b.title));
    return NextResponse.json(pages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { department, title, content } = body;

    if (!department || !title) {
      return NextResponse.json({ error: "Department and title are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const slug = slugify(title);
    const path = `wiki/${department}/${slug}.md`;

    const frontmatter = {
      title,
      created: now,
      updated: now,
    };

    // gray-matter stringify expects (content, data)
    const fileContent = `---
title: "${title}"
created: "${now}"
updated: "${now}"
---

${content || ""}`;

    const ok = await upsertFile(path, fileContent, `Add wiki: ${title}`);

    if (!ok) return NextResponse.json({ error: "Failed to create wiki page" }, { status: 500 });
    return NextResponse.json({ ...frontmatter, content, _path: path });
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
