import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

const STYLE_INSTRUCTIONS: Record<string, string> = {
  bold:
    "Use bold, high-contrast design with large chunky text, bright saturated colors (red, yellow, orange), dramatic shadows, and strong visual hierarchy. Everything should be oversized and attention-grabbing.",
  minimal:
    "Use a clean minimal design with plenty of white space, simple typography, muted color palette, and subtle accents. Avoid clutter — let one strong focal point carry the image.",
  cinematic:
    "Use a cinematic widescreen aesthetic with dramatic lighting, dark moody tones, lens flares or bokeh, professional color grading, and a movie-poster composition.",
  podcast:
    "Use a podcast-style layout with the host prominently featured center-frame, bold show-title typography, a professional studio or gradient background, and microphone or audio wave motifs.",
};

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

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body: {
    prompt?: string;
    headshotUrl?: string;
    referenceUrls?: string[];
    style?: string;
    headlineText?: string;
    subtextText?: string;
    textPosition?: string;
    textColor?: string;
    styleProfile?: {
      brandColors?: string;
      styleNotes?: string;
      preferredFonts?: string;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    prompt,
    headshotUrl,
    referenceUrls = [],
    style = "bold",
    headlineText,
    subtextText,
    textPosition,
    textColor,
    styleProfile,
  } = body;

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const styleInstructions =
    STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.bold;

  // Build the system/user prompt
  let fullPrompt = `Create a professional YouTube thumbnail image (1280x720 pixels, 16:9 aspect ratio).

YOUTUBE THUMBNAIL BEST PRACTICES:
- Bold, easy-to-read text (max 3-6 words) visible at small sizes
- High contrast between text and background
- Emotionally expressive faces when people are included
- Strong focal point that draws the eye immediately
- Colors that pop against YouTube's white/dark background
- Clear visual hierarchy

STYLE: ${styleInstructions}

SUBJECT: ${prompt}`;

  if (headshotUrl) {
    fullPrompt +=
      "\n\nFACE INSTRUCTION: Incorporate the provided person's face prominently in the thumbnail — centered or slightly off-center, with an expressive, confident look that matches the topic.";
  }

  if (referenceUrls.length > 0) {
    fullPrompt +=
      "\n\nREFERENCE INSTRUCTION: Study the visual style, layout, and composition of the reference images provided, but create an entirely original design — do not copy them directly.";
  }

  // Text overlay instructions
  if (headlineText) {
    const pos = textPosition || "center";
    const color = textColor || "#FFFFFF";
    fullPrompt += `\n\nTEXT OVERLAY: Include the headline text "${headlineText}" prominently on the thumbnail. Position: ${pos}. Text color: ${color}. Make the text bold, easy to read, and high-contrast against the background.`;
    if (subtextText) {
      fullPrompt += ` Also include smaller subtext: "${subtextText}" below or near the headline.`;
    }
  }

  // Style profile instructions
  if (styleProfile) {
    if (styleProfile.brandColors) {
      fullPrompt += `\n\nBRAND COLORS: Use these brand colors in the design: ${styleProfile.brandColors}`;
    }
    if (styleProfile.styleNotes) {
      fullPrompt += `\n\nSTYLE NOTES: ${styleProfile.styleNotes}`;
    }
    if (styleProfile.preferredFonts) {
      fullPrompt += `\n\nFONT STYLE: Use font styles similar to: ${styleProfile.preferredFonts}`;
    }
  }

  fullPrompt +=
    "\n\nGenerate only the thumbnail image. No borders, no padding, no UI chrome — just the full-bleed 16:9 thumbnail.";

  // Build parts array for the request
  const parts: object[] = [{ text: fullPrompt }];

  // Fetch headshot and add as inlineData
  if (headshotUrl) {
    const img = await fetchImageAsBase64(headshotUrl);
    if (img) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }

  // Fetch reference images and add as inlineData
  for (const refUrl of referenceUrls) {
    const img = await fetchImageAsBase64(refUrl);
    if (img) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }

  const requestBody = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini API error: ${geminiRes.status}`, detail: errText },
        { status: geminiRes.status }
      );
    }

    const data = await geminiRes.json();

    // Extract image from response
    const parts_out: { inlineData?: { mimeType: string; data: string } }[] =
      data?.candidates?.[0]?.content?.parts || [];

    const imagePart = parts_out.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData) {
      return NextResponse.json(
        { error: "No image returned by Gemini", raw: data },
        { status: 502 }
      );
    }

    const { mimeType, data: imageData } = imagePart.inlineData;
    const image = `data:${mimeType};base64,${imageData}`;

    return NextResponse.json({ image });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
