"use client";

import { useState } from "react";

const CLIENTS = [
  { id: "act_2549125178703715", name: "HealthProceo" },
  { id: "act_1707066474017114", name: "IV Wellness" },
];

const IMAGE_STYLES = [
  { value: "professional", label: "Professional" },
  { value: "bold", label: "Bold" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "before-after", label: "Before/After" },
];

type Variant = {
  headline: string;
  primaryText: string;
  description: string;
  approved: boolean;
  imageBrief: string | null;
  launching: boolean;
  launched: { campaignId: string; adSetId: string; adId: string | null } | null;
  goingLive: boolean;
  live: boolean;
  liveError: string | null;
  generatedImage: string | null;
  generatingImage: boolean;
  imageStyle: string;
};

function CharCount({ value, max, label }: { value: string; max: number; label: string }) {
  const len = value.length;
  const over = len > max;
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-xs font-mono" style={{ color: over ? "#b91c1c" : len > max * 0.85 ? "#d97706" : "var(--muted)" }}>
        {len}/{max}
      </span>
    </div>
  );
}

export default function CreativeLabPage() {
  const [client, setClient] = useState(CLIENTS[0].id);
  const [offer, setOffer] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLaunch, setConfirmLaunch] = useState<number | null>(null);
  const [confirmGoLive, setConfirmGoLive] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const clientName = CLIENTS.find(c => c.id === client)?.name ?? "";

  const handleGenerateCopy = async () => {
    if (!offer.trim()) return;
    setLoadingCopy(true);
    setError(null);
    setVariants([]);

    const prompt = `You are an expert Meta Ads copywriter for a medical aesthetics and wellness agency.

Client: ${clientName}
Offer / Angle: ${offer}

Generate exactly 3 distinct ad copy variants. Each variant must follow Meta Ads character limits:
- Headline: max 40 characters
- Primary Text: max 125 characters
- Description: max 30 characters

Respond with a JSON array ONLY — no markdown, no explanation. Format:
[
  {
    "headline": "...",
    "primaryText": "...",
    "description": "..."
  },
  ...
]`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      if (!res.ok) throw new Error("API error");

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }

      // Extract JSON from response
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not parse response");

      const parsed = JSON.parse(jsonMatch[0]);
      const newVariants: Variant[] = parsed.map((v: { headline?: string; primaryText?: string; description?: string }) => ({
        headline: (v.headline || "").slice(0, 40),
        primaryText: (v.primaryText || "").slice(0, 125),
        description: (v.description || "").slice(0, 30),
        approved: false,
        imageBrief: null,
        launching: false,
        launched: null,
        goingLive: false,
        live: false,
        liveError: null,
        generatedImage: null,
        generatingImage: false,
        imageStyle: "professional",
      }));
      setVariants(newVariants);
    } catch (e) {
      setError("Failed to generate copy. Please try again.");
    } finally {
      setLoadingCopy(false);
    }
  };

  const handleGenerateBrief = async (idx: number) => {
    const v = variants[idx];
    setLoadingBrief(idx);

    const prompt = `You are a creative director for a medical aesthetics agency.

Based on this Meta ad copy, write a concise image brief for a designer or AI image tool.

Client: ${clientName}
Headline: ${v.headline}
Primary Text: ${v.primaryText}
Description: ${v.description}

Write a 2-3 sentence image brief describing: subject, mood, visual style, and key elements to include. Be specific and actionable. No headers, just the brief paragraph.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }

      setVariants(prev => prev.map((item, i) =>
        i === idx ? { ...item, imageBrief: fullText.trim() } : item
      ));
    } catch {
      setVariants(prev => prev.map((item, i) =>
        i === idx ? { ...item, imageBrief: "Failed to generate brief." } : item
      ));
    } finally {
      setLoadingBrief(null);
    }
  };

  const handleGenerateImage = async (idx: number) => {
    const v = variants[idx];
    setImageError(null);
    setVariants(prev => prev.map((item, i) =>
      i === idx ? { ...item, generatingImage: true, generatedImage: null } : item
    ));

    try {
      const res = await fetch("/api/ads/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: v.headline,
          primaryText: v.primaryText,
          clientName,
          industry: "med spa",
          style: v.imageStyle,
        }),
      });

      const data = await res.json();

      if (data.image) {
        setVariants(prev => prev.map((item, i) =>
          i === idx ? { ...item, generatingImage: false, generatedImage: data.image } : item
        ));
      } else {
        setVariants(prev => prev.map((item, i) =>
          i === idx ? { ...item, generatingImage: false } : item
        ));
        setImageError(data.error || "Image generation failed.");
      }
    } catch {
      setVariants(prev => prev.map((item, i) =>
        i === idx ? { ...item, generatingImage: false } : item
      ));
      setImageError("Failed to generate image. Please try again.");
    }
  };

  const handleDownloadImage = (idx: number) => {
    const v = variants[idx];
    if (!v.generatedImage) return;
    const a = document.createElement("a");
    a.href = v.generatedImage;
    a.download = `ad-creative-variant-${idx + 1}-${v.imageStyle}.png`;
    a.click();
  };

  const handleSetImageStyle = (idx: number, style: string) => {
    setVariants(prev => prev.map((item, i) =>
      i === idx ? { ...item, imageStyle: style } : item
    ));
  };

  const handleApprove = (idx: number) => {
    setVariants(prev => prev.map((item, i) =>
      i === idx ? { ...item, approved: !item.approved } : item
    ));
  };

  const handleLaunch = async (idx: number) => {
    const v = variants[idx];
    setConfirmLaunch(null);
    setVariants(prev => prev.map((item, i) =>
      i === idx ? { ...item, launching: true } : item
    ));

    try {
      const res = await fetch("/api/ads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: client,
          name: `${clientName} — ${v.headline}`,
          objective: "OUTCOME_LEADS",
          dailyBudget: "10",
          headline: v.headline,
          primaryText: v.primaryText,
          description: v.description,
        }),
      });
      const data = await res.json();
      if (data.campaignId) {
        setVariants(prev => prev.map((item, i) =>
          i === idx ? { ...item, launching: false, launched: { campaignId: data.campaignId, adSetId: data.adSetId, adId: data.adId } } : item
        ));
      } else {
        setError(data.error || "Failed to create campaign");
        setVariants(prev => prev.map((item, i) =>
          i === idx ? { ...item, launching: false } : item
        ));
      }
    } catch (e) {
      setError("Failed to launch campaign");
      setVariants(prev => prev.map((item, i) =>
        i === idx ? { ...item, launching: false } : item
      ));
    }
  };

  const handleGoLive = async (idx: number) => {
    const v = variants[idx];
    if (!v.launched) return;
    setConfirmGoLive(null);
    setVariants(prev => prev.map((item, i) =>
      i === idx ? { ...item, goingLive: true, liveError: null } : item
    ));
    try {
      const res = await fetch("/api/ads/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: v.launched.campaignId, status: "ACTIVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setVariants(prev => prev.map((item, i) =>
          i === idx ? { ...item, goingLive: false, live: true } : item
        ));
      } else {
        setVariants(prev => prev.map((item, i) =>
          i === idx ? { ...item, goingLive: false, liveError: data.error || "Failed to activate campaign" } : item
        ));
      }
    } catch {
      setVariants(prev => prev.map((item, i) =>
        i === idx ? { ...item, goingLive: false, liveError: "Network error. Please try again." } : item
      ));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>GROWTH · META ADS</p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>Creative Lab</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Generate ad copy variants and image briefs with AI</p>
      </div>

      {/* Input Card */}
      <div className="card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>GENERATE COPY</p>

        {/* Client selector */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Client</label>
          <select
            value={client}
            onChange={e => setClient(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            {CLIENTS.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
        </div>

        {/* Offer / angle */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Offer / Angle</label>
          <textarea
            value={offer}
            onChange={e => setOffer(e.target.value)}
            placeholder="e.g. Free consultation for IV drip therapy, targeting women 35-55 in LA who want energy and recovery..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <button
          onClick={handleGenerateCopy}
          disabled={loadingCopy || !offer.trim()}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
          }}
        >
          {loadingCopy ? "Generating..." : "Generate Ad Copy"}
        </button>

        {error && (
          <p className="text-sm" style={{ color: "#b91c1c" }}>{error}</p>
        )}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            VARIANTS — {clientName.toUpperCase()}
          </p>

          {variants.map((v, idx) => (
            <div
              key={idx}
              className="card p-6 space-y-4 transition-all"
              style={{
                borderColor: v.approved ? "#059669" : "var(--border)",
                borderWidth: "1px",
                borderStyle: "solid",
                backgroundColor: v.approved ? "rgba(5,150,105,0.04)" : "var(--surface)",
              }}
            >
              {/* Variant header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      backgroundColor: v.approved ? "#059669" : "var(--bg)",
                      color: v.approved ? "#fff" : "var(--muted)",
                      border: "1px solid",
                      borderColor: v.approved ? "#059669" : "var(--border)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    Variant {idx + 1}
                  </span>
                  {v.approved && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(5,150,105,0.12)", color: "#059669" }}>
                      Approved
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleApprove(idx)}
                  className="text-xs px-4 py-1.5 rounded-xl border font-medium transition-all"
                  style={{
                    backgroundColor: v.approved ? "rgba(5,150,105,0.1)" : "var(--bg)",
                    borderColor: v.approved ? "#059669" : "var(--border)",
                    color: v.approved ? "#059669" : "var(--text-secondary)",
                  }}
                >
                  {v.approved ? "Approved" : "Approve"}
                </button>
              </div>

              {/* Copy fields */}
              <div className="space-y-3">
                <div>
                  <CharCount value={v.headline} max={40} label="Headline" />
                  <p className="text-base font-semibold leading-snug" style={{ color: "var(--text)" }}>{v.headline}</p>
                </div>

                <div>
                  <CharCount value={v.primaryText} max={125} label="Primary Text" />
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{v.primaryText}</p>
                </div>

                <div>
                  <CharCount value={v.description} max={30} label="Description" />
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{v.description}</p>
                </div>
              </div>

              {/* Image Brief */}
              {v.imageBrief && (
                <div className="rounded-xl p-4 border" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Image Brief</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{v.imageBrief}</p>
                </div>
              )}

              {/* Image Generation Section */}
              <div className="rounded-xl p-4 border space-y-3" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Generate Ad Image</p>

                {/* Style selector */}
                <div className="flex gap-2 flex-wrap">
                  {IMAGE_STYLES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleSetImageStyle(idx, s.value)}
                      className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                      style={{
                        backgroundColor: v.imageStyle === s.value ? "var(--accent)" : "var(--surface)",
                        borderColor: v.imageStyle === s.value ? "var(--accent)" : "var(--border)",
                        color: v.imageStyle === s.value ? "#fff" : "var(--muted)",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Generate button */}
                <button
                  onClick={() => handleGenerateImage(idx)}
                  disabled={v.generatingImage}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  {v.generatingImage ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating image...
                    </>
                  ) : (
                    v.generatedImage ? "Regenerate Image" : "Generate Image"
                  )}
                </button>

                {imageError && (
                  <p className="text-xs" style={{ color: "#b91c1c" }}>{imageError}</p>
                )}

                {/* Generated image preview */}
                {v.generatedImage && (
                  <div className="space-y-2">
                    <img
                      src={v.generatedImage}
                      alt={`Ad creative for variant ${idx + 1}`}
                      className="w-full max-w-sm rounded-xl border"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <button
                      onClick={() => handleDownloadImage(idx)}
                      className="text-xs px-4 py-2 rounded-xl border font-medium transition-all"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      Download Image
                    </button>
                  </div>
                )}
              </div>

              {/* Launched banner */}
              {v.launched && (
                <div className="rounded-xl p-3 border text-xs font-mono space-y-0.5" style={{ backgroundColor: v.live ? "rgba(5,150,105,0.10)" : "rgba(5,150,105,0.06)", borderColor: "#059669", color: "#059669" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: v.live ? "#059669" : "#d97706" }} />
                    <span>{v.live ? "Campaign is LIVE on Meta" : "Campaign created (PAUSED) on Meta"}</span>
                  </div>
                  <div>Campaign ID: {v.launched.campaignId}</div>
                  <div>Ad Set ID: {v.launched.adSetId}</div>
                  {v.launched.adId && <div>Ad ID: {v.launched.adId}</div>}
                </div>
              )}

              {/* Go Live confirm dialog */}
              {confirmGoLive === idx && (
                <div className="rounded-xl p-4 border space-y-3" style={{ backgroundColor: "rgba(5,150,105,0.06)", borderColor: "#059669" }}>
                  <p className="text-sm font-medium" style={{ color: "#065f46" }}>
                    This will activate the campaign on Meta and <strong>start spending budget</strong>. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGoLive(idx)}
                      className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
                      style={{ backgroundColor: "#059669", color: "#fff" }}
                    >
                      Yes, Go Live
                    </button>
                    <button
                      onClick={() => setConfirmGoLive(null)}
                      className="text-xs px-4 py-2 rounded-xl border font-medium transition-all"
                      style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Go Live error */}
              {v.liveError && (
                <p className="text-xs" style={{ color: "#b91c1c" }}>{v.liveError}</p>
              )}

              {/* Confirm launch dialog */}
              {confirmLaunch === idx && (
                <div className="rounded-xl p-4 border space-y-3" style={{ backgroundColor: "rgba(245,158,11,0.06)", borderColor: "#d97706" }}>
                  <p className="text-sm font-medium" style={{ color: "#92400e" }}>
                    This will create a PAUSED campaign on Meta for <strong>{clientName}</strong>. It will not go live until you activate it in Ads Manager.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLaunch(idx)}
                      className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
                      style={{ backgroundColor: "#d97706", color: "#fff" }}
                    >
                      Confirm — Create Paused Campaign
                    </button>
                    <button
                      onClick={() => setConfirmLaunch(null)}
                      className="text-xs px-4 py-2 rounded-xl border font-medium transition-all"
                      style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action row */}
              <div className="pt-1 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleGenerateBrief(idx)}
                  disabled={loadingBrief === idx}
                  className="text-xs px-4 py-2 rounded-xl border font-medium transition-all disabled:opacity-40"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {loadingBrief === idx ? "Generating brief..." : v.imageBrief ? "Regenerate Image Brief" : "Generate Image Brief"}
                </button>
                {v.approved && !v.launched && !v.launching && confirmLaunch !== idx && (
                  <button
                    onClick={() => setConfirmLaunch(idx)}
                    className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    Launch Campaign
                  </button>
                )}
                {v.launching && (
                  <span className="text-xs px-4 py-2 rounded-xl font-medium opacity-60" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
                    Creating...
                  </span>
                )}
                {v.launched && !v.live && !v.goingLive && confirmGoLive !== idx && (
                  <button
                    onClick={() => setConfirmGoLive(idx)}
                    className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
                    style={{ backgroundColor: "#059669", color: "#fff" }}
                  >
                    Activate Campaign
                  </button>
                )}
                {v.goingLive && (
                  <span className="text-xs px-4 py-2 rounded-xl font-medium opacity-60" style={{ backgroundColor: "#059669", color: "#fff" }}>
                    Activating...
                  </span>
                )}
                {v.live && (
                  <span className="text-xs px-4 py-2 rounded-xl font-medium flex items-center gap-1.5" style={{ backgroundColor: "rgba(5,150,105,0.12)", color: "#059669" }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#059669" }} />
                    Campaign is LIVE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
