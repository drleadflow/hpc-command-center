import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { itemName, itemContext, notes, mode = "enhance" } = await req.json();

    if (!itemName) {
      return NextResponse.json({ error: "itemName is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = mode === "invent"
      ? `You are an operations architect for Dr. Lead Flow (DLF), an AI-driven lead generation agency based in Miami.

Your job is to INVENT missing pieces for the following operating system area. Generate practical ideas that could strengthen the system even if notes are sparse. Include:
- New workflows, SOPs, automations, or checkpoints that should exist
- Suggested owners for each idea where possible
- KPIs or operating metrics worth tracking
- Risks, bottlenecks, or blind spots this area likely has
- Concrete next actions to test or implement immediately

Keep the tone professional but direct. Use bullet points and short paragraphs. Do not use excessive formatting or headers. Stay under 500 words.`
      : `You are an operations consultant for Dr. Lead Flow (DLF), an AI-driven lead generation agency based in Miami. You help the CEO, Dr. Blade (Dr. Emeka), build and refine his operating system.

Your job is to expand and improve the following operating system notes. Be specific, actionable, and concise. Include:
- Clear next steps or action items where relevant
- KPIs or metrics to track if applicable
- Potential risks or gaps to address
- Connections to other parts of the business operating system

Keep the tone professional but direct. Use bullet points and short paragraphs. Do not use excessive formatting or headers. Stay under 500 words.`;

    const userMessage = `Operating System Item: ${itemName}
${itemContext ? `\nContext: ${itemContext}` : ""}
${notes ? `\nCurrent Notes:\n${notes}` : "\nNo notes yet. Generate initial operating notes for this item."}

${mode === "invent" ? "Invent smart additions for this area." : "Expand and improve these notes."}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Anthropic error:", error);
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = await res.json();
    const enhanced = data.content[0].text;

    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error("OS enhance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
