import { NextResponse } from "next/server";
import { getFile, upsertFile, createFileContent } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = await getFile("reports/latest-bi-report.md");
    if (!file) {
      return NextResponse.json({ report: null, generated: null });
    }

    // Parse frontmatter
    const lines = file.content.split("\n");
    let generated = null;
    let content = file.content;

    if (lines[0] === "---") {
      const endIdx = lines.indexOf("---", 1);
      if (endIdx > 0) {
        const frontmatter = lines.slice(1, endIdx).join("\n");
        const genLine = frontmatter.split("\n").find(l => l.startsWith("generated:"));
        if (genLine) generated = genLine.split(": ")[1];
        content = lines.slice(endIdx + 1).join("\n").trim();
      }
    }

    return NextResponse.json({ report: content, generated });
  } catch (err) {
    return NextResponse.json({ report: null, generated: null, error: String(err) });
  }
}

export async function POST() {
  try {
    // Call the generate endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const genRes = await fetch(`${baseUrl}/api/bi-report/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!genRes.ok) {
      const err = await genRes.json();
      return NextResponse.json({ error: err.error || "Generation failed" }, { status: genRes.status });
    }

    const { report, generated, kpiSnapshot } = await genRes.json();

    // Save the report to GitHub (reports/latest-bi-report.md)
    const frontmatter = {
      generated,
      kpiSnapshot: JSON.stringify(kpiSnapshot || {}),
    };
    const fileContent = createFileContent(frontmatter, report);

    // Fetch existing sha if file exists (needed to update)
    const existing = await getFile("reports/latest-bi-report.md");
    const saved = await upsertFile(
      "reports/latest-bi-report.md",
      fileContent,
      `BI Council weekly report — ${new Date(generated).toLocaleDateString("en-US")}`,
      existing?.sha
    );

    if (!saved) {
      // Return the report even if save failed — don't block the UI
      console.error("Failed to save BI report to GitHub");
    }

    return NextResponse.json({ report, generated, saved: !!saved });
  } catch (err: any) {
    console.error("BI report POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
