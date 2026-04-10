import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

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
    projectId?: string;
    thumbnailId?: string;
    feedback?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, thumbnailId, feedback } = body;

  if (!projectId || !thumbnailId || !feedback) {
    return NextResponse.json(
      { error: "projectId, thumbnailId, and feedback are required" },
      { status: 400 }
    );
  }

  // --- Step 1: Fetch original thumbnail ---
  const { data: original, error: origError } = await supabase
    .from("thumbnails")
    .select("*")
    .eq("id", thumbnailId)
    .single();

  if (origError || !original) {
    return NextResponse.json(
      { error: "Thumbnail not found", detail: origError?.message },
      { status: 404 }
    );
  }

  // --- Step 2: Fetch sibling thumbnails for context ---
  const { data: siblings } = await supabase
    .from("thumbnails")
    .select("concept_label, prompt, metadata")
    .eq("project_id", projectId)
    .neq("id", thumbnailId);

  const siblingContext = (siblings || [])
    .map(
      (s) =>
        `Concept ${s.concept_label}: ${s.prompt?.slice(0, 200) || "no prompt"}`
    )
    .join("\n");

  // --- Step 3: Claude refines the prompt ---
  let refinedPrompt: string;
  let aiExplanation: string;

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20241022",
        max_tokens: 1000,
        system: `You are a YouTube thumbnail iteration expert. You will receive an original thumbnail prompt, user feedback, and context about sibling concepts. Generate a refined prompt that incorporates the feedback while maintaining YouTube thumbnail best practices (1280x720, bold visuals, readable at 320x180px).

Return ONLY valid JSON (no markdown, no code fences):
{
  "refinedPrompt": "the full updated image generation prompt...",
  "explanation": "brief explanation of what was changed and why"
}`,
        messages: [
          {
            role: "user",
            content: `Original prompt (Concept ${original.concept_label}): ${original.prompt}

User feedback: ${feedback}

Other concepts for reference:
${siblingContext || "No other concepts available."}`,
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
    const parsed = JSON.parse(rawText);
    refinedPrompt = parsed.refinedPrompt;
    aiExplanation = parsed.explanation;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse Claude iteration response", detail: String(err) },
      { status: 502 }
    );
  }

  // --- Step 4: Generate new image with Gemini ---
  const parts: object[] = [
    {
      text:
        refinedPrompt +
        "\n\nGenerate only the thumbnail image. No borders, no padding, no UI chrome — just the full-bleed 16:9 thumbnail.",
    },
  ];

  // Include the original image as reference if available
  if (original.image_base64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: original.image_base64,
      },
    });
  }

  let imageBase64: string | null = null;
  let imageMimeType = "image/png";

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}`, detail: errText },
        { status: geminiRes.status }
      );
    }

    const data = await geminiRes.json();
    const partsOut: { inlineData?: { mimeType: string; data: string } }[] =
      data?.candidates?.[0]?.content?.parts || [];

    const imagePart = partsOut.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData) {
      return NextResponse.json(
        { error: "No image returned by Gemini" },
        { status: 502 }
      );
    }

    imageBase64 = imagePart.inlineData.data;
    imageMimeType = imagePart.inlineData.mimeType;
  } catch (err) {
    return NextResponse.json(
      { error: "Gemini generation failed", detail: String(err) },
      { status: 500 }
    );
  }

  // --- Step 5: Save new thumbnail with incremented version ---
  const newVersion = (original.version || 1) + 1;

  const { data: newThumbnail, error: insertError } = await supabase
    .from("thumbnails")
    .insert({
      project_id: projectId,
      concept_label: original.concept_label,
      prompt: refinedPrompt,
      image_base64: imageBase64,
      style: original.style || "generated",
      version: newVersion,
      is_winner: false,
      is_clean: false,
      metadata: {
        ...((original.metadata as Record<string, unknown>) || {}),
        iterated_from: thumbnailId,
        iteration_feedback: feedback,
      },
    })
    .select("id")
    .single();

  if (insertError || !newThumbnail) {
    return NextResponse.json(
      { error: "Failed to save iterated thumbnail", detail: insertError?.message },
      { status: 500 }
    );
  }

  // --- Step 6: Save iteration record ---
  await supabase.from("thumbnail_iterations").insert({
    project_id: projectId,
    parent_thumbnail_id: thumbnailId,
    user_feedback: feedback,
    ai_response: aiExplanation,
    result_thumbnail_id: newThumbnail.id,
  });

  return NextResponse.json({
    thumbnailId: newThumbnail.id,
    version: newVersion,
    explanation: aiExplanation,
    image: `data:${imageMimeType};base64,${imageBase64}`,
  });
}
