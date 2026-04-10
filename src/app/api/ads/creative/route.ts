import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

const STYLE_INSTRUCTIONS: Record<string, string> = {
  professional:
    "Use a clean, polished medical/clinical aesthetic. Soft neutral tones (white, light grey, navy), modern sans-serif typography, professional stock imagery of clinics or happy patients. Minimal text overlay — headline in bold clean font, high whitespace, trustworthy feel.",
  bold:
    "Use high-contrast, attention-grabbing design. Bright accent colors (gold, deep teal, vibrant coral), oversized headline text dominating the frame, strong graphic elements, dramatic shadow effects. Designed to stop the scroll.",
  lifestyle:
    "Use warm, authentic, real-life imagery. Natural lighting, candid-feeling scenes of real people enjoying results (glowing skin, energy, confidence). Earthy warm tones, approachable typography, human and relatable feel. Minimal text.",
  "before-after":
    "Use a clean split-screen or side-by-side before/after comparison layout. Left side labeled BEFORE (duller/tired), right side labeled AFTER (glowing/transformed). Clear visual contrast, simple typography, centered headline above or below the split.",
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
    headline?: string;
    primaryText?: string;
    clientName?: string;
    industry?: string;
    style?: string;
    referenceUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    headline,
    primaryText,
    clientName = "Medical Practice",
    industry = "med spa",
    style = "professional",
    referenceUrl,
  } = body;

  if (!headline) {
    return NextResponse.json({ error: "headline is required" }, { status: 400 });
  }

  const styleInstructions =
    STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.professional;

  const fullPrompt = `Create a Facebook and Instagram ad image (1080x1080 square format).

AD DETAILS:
- Client: ${clientName}
- Industry: ${industry}
- Headline: "${headline}"
- Ad Copy: "${primaryText || ""}"

FACEBOOK/INSTAGRAM AD BEST PRACTICES:
- Follow the Facebook 20% text rule — text overlay should cover no more than 20% of the image area
- High contrast between focal subject and background
- Clear single focal point that draws the eye immediately
- Optimized for mobile feed viewing — must look great at small sizes
- Brand-safe: no misleading before/after claims, no medical diagrams or extreme imagery
- No explicit text of guaranteed results
- Include the headline text "${headline}" prominently but within the 20% text area limit

STYLE: ${styleInstructions}

INDUSTRY CONTEXT: This is a ${industry} business. Use visuals appropriate for this industry — tasteful wellness/aesthetics imagery, professional setting, target audience of adults seeking self-improvement and confidence.

Generate only the ad image. No borders, no device mockups, no UI chrome — just the full 1:1 square ad creative.`;

  const parts: object[] = [{ text: fullPrompt }];

  if (referenceUrl) {
    const img = await fetchImageAsBase64(referenceUrl);
    if (img) {
      parts.push({
        inlineData: { mimeType: img.mimeType, data: img.data },
      });
      parts.push({
        text: "REFERENCE: Study the visual style and composition of the reference image provided, but create an entirely original design.",
      });
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
