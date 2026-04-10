import { NextRequest, NextResponse } from "next/server";

const LORA_WEIGHTS_URL =
  "https://v3b.fal.media/files/b/0a938a0e/m-uaNpNtAvvHHLEsQiRjW_pytorch_lora_weights.safetensors";

const IMAGE_SIZE_MAP: Record<string, string> = {
  "1:1": "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
};

export async function POST(req: NextRequest) {
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!falKey) {
    return NextResponse.json(
      { error: "FAL_KEY or FAL_API_KEY is not configured. Add it to your environment variables." },
      { status: 400 }
    );
  }

  let body: { prompt?: string; style?: string; aspectRatio?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, style = "photorealistic", aspectRatio = "1:1" } = body;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const fullPrompt = style && style !== "photorealistic"
    ? `${prompt.trim()}, ${style} style`
    : prompt.trim();

  const imageSize = IMAGE_SIZE_MAP[aspectRatio] || "square_hd";

  const falBody = {
    prompt: fullPrompt,
    image_size: imageSize,
    num_images: 1,
    output_format: "png",
    guidance_scale: 3.5,
    num_inference_steps: 28,
    loras: [
      {
        path: LORA_WEIGHTS_URL,
        scale: 1.0,
      },
    ],
    enable_safety_checker: false,
  };

  // Try synchronous endpoint first
  try {
    const res = await fetch("https://fal.run/fal-ai/flux-lora", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falBody),
    });

    if (res.ok) {
      const data = await res.json();
      const imageUrl: string | undefined = data?.images?.[0]?.url;
      if (imageUrl) {
        const base64 = await fetchImageAsBase64(imageUrl);
        return NextResponse.json({ image: `data:image/png;base64,${base64}` });
      }
    }
    // Fall through to queue approach if sync fails
  } catch {
    // Fall through to queue approach
  }

  // Queue-based approach
  try {
    // Step 1: Submit job
    const submitRes = await fetch("https://queue.fal.run/fal-ai/flux-lora", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falBody),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => "");
      return NextResponse.json(
        { error: `fal.ai submission failed (${submitRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const { request_id } = await submitRes.json();
    if (!request_id) {
      return NextResponse.json({ error: "No request_id from fal.ai" }, { status: 502 });
    }

    // Step 2: Poll for completion (max 90s, polling every 3s)
    const statusUrl = `https://queue.fal.run/fal-ai/flux-lora/requests/${request_id}/status`;
    const resultUrl = `https://queue.fal.run/fal-ai/flux-lora/requests/${request_id}`;
    const headers = { Authorization: `Key ${falKey}` };

    for (let attempt = 0; attempt < 30; attempt++) {
      await sleep(3000);
      const statusRes = await fetch(statusUrl, { headers });
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();
      const status: string = statusData?.status || "";

      if (status === "COMPLETED") {
        const resultRes = await fetch(resultUrl, { headers });
        if (!resultRes.ok) {
          return NextResponse.json({ error: "Failed to fetch result from fal.ai" }, { status: 502 });
        }
        const result = await resultRes.json();
        const imageUrl: string | undefined = result?.images?.[0]?.url;
        if (!imageUrl) {
          return NextResponse.json({ error: "No image URL in fal.ai result" }, { status: 502 });
        }
        const base64 = await fetchImageAsBase64(imageUrl);
        return NextResponse.json({ image: `data:image/png;base64,${base64}` });
      }

      if (status === "FAILED" || status === "CANCELLED") {
        return NextResponse.json(
          { error: `fal.ai job ${status.toLowerCase()}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ error: "fal.ai job timed out after 90 seconds" }, { status: 504 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "fal.ai request failed" },
      { status: 502 }
    );
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
