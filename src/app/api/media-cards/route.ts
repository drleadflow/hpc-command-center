import { NextRequest, NextResponse } from "next/server";
import { getFile, upsertFile } from "@/lib/github";

const FILE_PATH = "media/cards.json";

export async function GET() {
  try {
    const file = await getFile(FILE_PATH);
    if (!file) {
      return NextResponse.json([]);
    }
    const cards = JSON.parse(file.content);
    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching media cards:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const cards = await req.json();
    const content = JSON.stringify(cards, null, 2);

    // Get existing SHA for update
    const existing = await getFile(FILE_PATH);
    const sha = existing?.sha;

    const success = await upsertFile(FILE_PATH, content, "Update media cards", sha);

    if (!success) {
      return NextResponse.json({ error: "Failed to save cards" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving media cards:", error);
    return NextResponse.json({ error: "Failed to save cards" }, { status: 500 });
  }
}
