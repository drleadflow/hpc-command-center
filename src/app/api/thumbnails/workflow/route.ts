import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { data, mimeType };
  } catch {
    return null;
  }
}

interface ConceptOutput {
  label: string;
  prompt: string;
  description: string;
  headline: string;
}

interface ClaudeResponse {
  desireLoop: {
    coreDesire: string;
    painPoint: string;
    solution: string;
    curiosityLoop: string;
  };
  concepts: ConceptOutput[];
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body: {
    topic?: string;
    templateId?: string;
    headshotUrl?: string;
    referenceUrls?: string[];
    styleProfile?: { brandColors?: string; styleNotes?: string };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { topic, templateId, headshotUrl, referenceUrls = [], styleProfile } = body;

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  // --- Step 0: Fetch template if provided ---
  let templateContext = "";
  if (templateId) {
    const { data: template } = await supabase
      .from("thumbnail_templates")
      .select("prompt_skeleton, style_rules, name, archetype")
      .eq("id", templateId)
      .single();

    if (template) {
      templateContext = `\n\nTEMPLATE "${template.name}" (${template.archetype}):\nPrompt skeleton: ${template.prompt_skeleton}\nStyle rules: ${JSON.stringify(template.style_rules)}`;
    }
  }

  // --- Step 1: Claude Haiku generates desire loop + 4 concept prompts ---
  let claudeResult: ClaudeResponse;
  try {
    const systemPrompt = `You are a YouTube thumbnail strategist. Given a video topic, generate a desire loop and 4 distinct thumbnail concepts.

Each concept must vary in: visual elements, text treatment, color direction, expression, composition, and desire loop angle.

Each concept prompt should follow YouTube thumbnail best practices:
- 1280x720 pixels, 16:9 aspect ratio
- Person on right side ~40% width when a person is included
- Dark moody background (not solid black) with dramatic lighting
- Max 3 visual elements for clarity
- Bottom-right area clear for YouTube timestamp overlay
- Text must be readable at 320x180px (mobile preview size)
- Bold, high-contrast colors that pop against YouTube's UI
- Emotionally expressive faces when people are included

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "desireLoop": { "coreDesire": "...", "painPoint": "...", "solution": "...", "curiosityLoop": "..." },
  "concepts": [
    { "label": "A", "prompt": "detailed Gemini image generation prompt...", "description": "short human-readable description", "headline": "TEXT ON THUMBNAIL" },
    { "label": "B", "prompt": "...", "description": "...", "headline": "..." },
    { "label": "C", "prompt": "...", "description": "...", "headline": "..." },
    { "label": "D", "prompt": "...", "description": "...", "headline": "..." }
  ]
}${templateContext}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20241022",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Video topic: ${topic}${styleProfile ? `\n\nStyle profile: ${JSON.stringify(styleProfile)}` : ""}`,
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return NextResponse.json(
        { error: `Claude API error: ${claudeRes.status}`, detail: errText },
        { status: 502 }
      );
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || "";
    claudeResult = JSON.parse(rawText);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse Claude concept response", detail: String(err) },
      { status: 502 }
    );
  }

  // --- Step 2: Create project in Supabase ---
  const { data: project, error: projectError } = await supabase
    .from("thumbnail_projects")
    .insert({
      title: topic,
      topic,
      desire_loop: claudeResult.desireLoop,
      template_id: templateId || null,
      style_profile: styleProfile || null,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Failed to create project", detail: projectError?.message },
      { status: 500 }
    );
  }

  const projectId = project.id;

  // --- Step 3: Prepare headshot and reference images ---
  let headshotData: { data: string; mimeType: string } | null = null;
  if (headshotUrl) {
    let resolvedUrl = headshotUrl;
    if (headshotUrl.startsWith("/")) {
      const origin = req.nextUrl.origin;
      resolvedUrl = `${origin}${headshotUrl}`;
    }
    headshotData = await fetchImageAsBase64(resolvedUrl);
  }

  const referenceImages: { data: string; mimeType: string }[] = [];
  for (const refUrl of referenceUrls) {
    const img = await fetchImageAsBase64(refUrl);
    if (img) {
      referenceImages.push(img);
    }
  }

  // --- Step 4: Generate all 4 thumbnails in parallel with Gemini ---
  const generateThumbnail = async (concept: ConceptOutput) => {
    let fullPrompt = concept.prompt;

    if (headshotUrl) {
      fullPrompt +=
        "\n\nFACE INSTRUCTION: Incorporate the provided person's face prominently in the thumbnail — positioned on the right side at ~40% width, with an expressive look that matches the topic.";
    }

    if (referenceImages.length > 0) {
      fullPrompt +=
        "\n\nREFERENCE INSTRUCTION: Study the visual style, layout, and composition of the reference images provided, but create an entirely original design.";
    }

    if (styleProfile?.brandColors) {
      fullPrompt += `\n\nBRAND COLORS: ${styleProfile.brandColors}`;
    }
    if (styleProfile?.styleNotes) {
      fullPrompt += `\n\nSTYLE NOTES: ${styleProfile.styleNotes}`;
    }

    fullPrompt +=
      "\n\nGenerate only the thumbnail image. No borders, no padding, no UI chrome — just the full-bleed 16:9 thumbnail.";

    const parts: object[] = [{ text: fullPrompt }];

    if (headshotData) {
      parts.push({
        inlineData: { mimeType: headshotData.mimeType, data: headshotData.data },
      });
    }

    for (const ref of referenceImages) {
      parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
    }

    const requestBody = {
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`);
    }

    const data = await geminiRes.json();
    const partsOut: { inlineData?: { mimeType: string; data: string } }[] =
      data?.candidates?.[0]?.content?.parts || [];

    const imagePart = partsOut.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData) {
      throw new Error("No image returned by Gemini");
    }

    return imagePart.inlineData;
  };

  const results = await Promise.allSettled(
    claudeResult.concepts.map((concept) => generateThumbnail(concept))
  );

  // --- Step 5: Save thumbnails and build response ---
  const concepts: {
    label: string;
    description: string;
    headline: string;
    image: string | null;
  }[] = [];

  for (let i = 0; i < claudeResult.concepts.length; i++) {
    const concept = claudeResult.concepts[i];
    const result = results[i];

    let imageBase64: string | null = null;
    let imageDataUri: string | null = null;

    if (result.status === "fulfilled") {
      imageBase64 = result.value.data;
      imageDataUri = `data:${result.value.mimeType};base64,${result.value.data}`;
    }

    // Save to Supabase regardless (prompt is still valuable)
    await supabase.from("thumbnails").insert({
      project_id: projectId,
      concept_label: concept.label,
      prompt: concept.prompt,
      image_base64: imageBase64,
      style: "generated",
      version: 1,
      is_winner: false,
      is_clean: false,
      metadata: {
        description: concept.description,
        headline: concept.headline,
      },
    });

    concepts.push({
      label: concept.label,
      description: concept.description,
      headline: concept.headline,
      image: imageDataUri,
    });
  }

  return NextResponse.json({
    projectId,
    desireLoop: claudeResult.desireLoop,
    concepts,
  });
}
