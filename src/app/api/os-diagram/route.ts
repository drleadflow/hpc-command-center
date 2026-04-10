import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { itemName, itemContext, notes, sectionType } = await req.json();

    if (!itemName) {
      return NextResponse.json({ error: "itemName is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a visual operations consultant for Dr. Lead Flow, an AI lead-generation agency.
Generate a structured diagram definition for the given business process/section.

Return ONLY valid JSON with this exact structure:
{
  "title": "Diagram title",
  "type": "flow" | "funnel" | "grid" | "timeline",
  "nodes": [
    { "id": "1", "label": "Node name", "subtitle": "Brief description", "color": "#hex", "icon": "emoji" }
  ],
  "connections": [
    { "from": "1", "to": "2", "label": "optional edge label" }
  ],
  "kpis": [
    { "label": "KPI Name", "value": "Target value", "color": "#hex" }
  ],
  "summary": "One-line summary of this process"
}

Guidelines:
- Use 4-8 nodes for clarity
- Include 2-5 relevant KPIs with realistic targets for a lead-gen agency
- Use colors that match the agency theme: greens (#10b981, #2d5a4e), blues (#3b82f6), ambers (#f59e0b), purples (#8b5cf6)
- Pick diagram type based on content: "flow" for processes, "funnel" for acquisition, "grid" for org charts, "timeline" for phases
- Icons should be single emoji characters
- Return ONLY the JSON object, no markdown, no code fences, no explanation`;

    const userMessage = `Operating System Section: ${itemName}
${sectionType ? `\nSection Type: ${sectionType}` : ""}
${itemContext ? `\nContext: ${itemContext}` : ""}
${notes ? `\nNotes:\n${notes}` : ""}

Generate a visual diagram definition for this business process.`;

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
    const rawText = data.content[0].text;

    // Try to parse JSON from the response, handling potential markdown fences
    let diagram;
    try {
      diagram = JSON.parse(rawText);
    } catch {
      // Try extracting JSON from markdown code fences or surrounding text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          diagram = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("Failed to parse extracted JSON:", jsonMatch[0].slice(0, 200));
          return NextResponse.json({ error: "Failed to parse diagram data" }, { status: 502 });
        }
      } else {
        console.error("No JSON found in response:", rawText.slice(0, 200));
        return NextResponse.json({ error: "Failed to parse diagram data" }, { status: 502 });
      }
    }

    return NextResponse.json({ diagram });
  } catch (error) {
    console.error("OS diagram error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
