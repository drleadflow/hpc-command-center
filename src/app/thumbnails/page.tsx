"use client";

import { useState, useRef, useEffect, useCallback, DragEvent } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Template {
  id: string;
  name: string;
  archetype: string;
  creator_reference: string;
  description: string;
  color_palette: { primary: string; secondary: string; accent: string; background: string };
}

interface Concept {
  label: string;
  description: string;
  headline: string;
  image: string;
  thumbnailId?: string;
}

interface Iteration {
  id: string;
  type: "user" | "ai";
  message: string;
  image?: string;
  thumbnailId?: string;
  timestamp: Date;
}

interface DesireLoop {
  coreDesire: string;
  painPoint: string;
  solution: string;
  curiosityLoop: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const PRESET_HEADSHOTS = [
  { id: "intense", label: "Intense", image: "/headshots/emeka-intense.jpg" },
  { id: "desk", label: "Desk", image: "/headshots/emeka-desk.png" },
  { id: "cutout", label: "Cutout", image: "/headshots/emeka-cutout.jpg" },
];

const CONCEPT_LABELS = ["A", "B", "C", "D"];

// ── File helpers ───────────────────────────────────────────────────────────
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── DropZone Component ─────────────────────────────────────────────────────
function DropZone({
  onDrop,
  preview,
  label,
}: {
  onDrop: (dataUrl: string) => void;
  preview?: string | null;
  label: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const dataUrl = await fileToDataUrl(file);
      onDrop(dataUrl);
    }
  };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const dataUrl = await fileToDataUrl(file);
      onDrop(dataUrl);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: dragOver ? "2px solid var(--accent)" : "2px dashed var(--border)",
        borderRadius: "12px",
        backgroundColor: dragOver ? "var(--accent-bg)" : "var(--bg)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minWidth: "60px",
        minHeight: "40px",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      {preview ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={preview}
          alt="Upload preview"
          style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</span>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ThumbnailGeneratorPage() {
  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Topic & Refs
  const [topic, setTopic] = useState("");
  const [inspirationResults, setInspirationResults] = useState<{ title: string; thumbnail: string; url: string }[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [selectedHeadshot, setSelectedHeadshot] = useState<string | null>(null);

  // Generation
  const [generating, setGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [desireLoop, setDesireLoop] = useState<DesireLoop | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  // Iteration
  const [selectedConceptIdx, setSelectedConceptIdx] = useState<number | null>(null);
  const [iterationInput, setIterationInput] = useState("");
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [iterating, setIterating] = useState(false);

  // Search
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Load templates on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/thumbnails/templates", { credentials: "include" });
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          setTemplates(data.templates || []);
          if (data.templates?.length > 0) {
            setSelectedTemplate(data.templates[0].id);
          }
        }
      } catch {
        // Silently handle — templates will be empty
      } finally {
        setTemplatesLoading(false);
      }
    })();
  }, []);

  // ── Scroll chat to bottom ────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [iterations]);

  // ── Search inspiration ───────────────────────────────────────────────────
  const handleSearchInspiration = useCallback(async () => {
    const q = searchQuery.trim() || topic.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/thumbnails/search?query=${encodeURIComponent(q)}&count=8`);
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        const mapped = (data.results || []).map((r: any) => ({
          title: r.title || "",
          thumbnail: r.thumbnailUrl || r.thumbnail || "",
          url: r.thumbnailUrl || r.thumbnail || "",
        }));
        setInspirationResults(mapped);
      }
    } catch {
      // Silently handle
    } finally {
      setSearching(false);
    }
  }, [searchQuery, topic]);

  // ── Generate 4 Concepts ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || !selectedTemplate) return;
    setGenerating(true);
    setConcepts([]);
    setDesireLoop(null);
    setProjectId(null);
    setWinnerIdx(null);
    setIterations([]);
    setSelectedConceptIdx(null);

    const progressMessages = [
      "Creating desire loop...",
      "Generating Concept A...",
      "Generating Concept B...",
      "Generating Concept C...",
      "Generating Concept D...",
      "Finalizing...",
    ];

    let msgIdx = 0;
    setProgressMessage(progressMessages[0]);
    const interval = setInterval(() => {
      msgIdx++;
      if (msgIdx < progressMessages.length) {
        setProgressMessage(progressMessages[msgIdx]);
      }
    }, 3000);

    try {
      const res = await fetch("/api/thumbnails/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          templateId: selectedTemplate,
          headshotUrl,
          referenceUrls: selectedRefs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjectId(data.projectId || null);
        setDesireLoop(data.desireLoop || null);
        setConcepts(data.concepts || []);
      }
    } catch {
      // Silently handle
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setProgressMessage("");
    }
  }, [topic, selectedTemplate, headshotUrl, selectedRefs]);

  // ── Iterate on a concept ─────────────────────────────────────────────────
  const handleIterate = useCallback(async () => {
    if (!iterationInput.trim() || selectedConceptIdx === null || !projectId) return;
    const concept = concepts[selectedConceptIdx];
    if (!concept) return;

    const userMsg: Iteration = {
      id: Date.now().toString(),
      type: "user",
      message: iterationInput.trim(),
      timestamp: new Date(),
    };
    setIterations(prev => [...prev, userMsg]);
    setIterationInput("");
    setIterating(true);

    try {
      const res = await fetch("/api/thumbnails/iterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          thumbnailId: concept.thumbnailId || concept.label,
          feedback: userMsg.message,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Iteration = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          message: data.message || "Here's your updated thumbnail:",
          image: data.image || undefined,
          thumbnailId: data.thumbnailId || undefined,
          timestamp: new Date(),
        };
        setIterations(prev => [...prev, aiMsg]);
      }
    } catch {
      const errMsg: Iteration = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        message: "Failed to generate iteration. Please try again.",
        timestamp: new Date(),
      };
      setIterations(prev => [...prev, errMsg]);
    } finally {
      setIterating(false);
    }
  }, [iterationInput, selectedConceptIdx, projectId, concepts]);

  // ── Mark winner ──────────────────────────────────────────────────────────
  const handleMarkWinner = useCallback(async (idx: number) => {
    setWinnerIdx(prev => prev === idx ? null : idx);
    if (projectId && concepts[idx]) {
      try {
        await fetch("/api/thumbnails/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            thumbnailId: concepts[idx].thumbnailId || concepts[idx].label,
            winner: true,
          }),
        });
      } catch {
        // Silently handle
      }
    }
  }, [projectId, concepts]);

  // ── Download single ──────────────────────────────────────────────────────
  const handleDownload = useCallback((image: string, label: string) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = `thumbnail-${label.toLowerCase()}.png`;
    a.click();
  }, []);

  // ── Download comparison grid ─────────────────────────────────────────────
  const handleDownloadComparison = useCallback(async () => {
    if (concepts.length < 4) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const thumbW = 640;
    const thumbH = 360;
    const pad = 20;
    const labelH = 40;

    canvas.width = thumbW * 2 + pad * 3;
    canvas.height = (thumbH + labelH) * 2 + pad * 3;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    try {
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = pad + col * (thumbW + pad);
        const y = pad + row * (thumbH + labelH + pad);

        // Label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px -apple-system, sans-serif";
        ctx.fillText(`Concept ${CONCEPT_LABELS[i]}`, x, y + 28);

        // Image
        if (concepts[i].image) {
          try {
            const img = await loadImg(concepts[i].image);
            ctx.drawImage(img, x, y + labelH, thumbW, thumbH);
          } catch {
            ctx.fillStyle = "#333";
            ctx.fillRect(x, y + labelH, thumbW, thumbH);
            ctx.fillStyle = "#666";
            ctx.font = "16px sans-serif";
            ctx.fillText("Image unavailable", x + thumbW / 2 - 60, y + labelH + thumbH / 2);
          }
        }
      }

      const link = document.createElement("a");
      link.download = "thumbnail-comparison.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Silently handle
    }
  }, [concepts]);

  // ── Select headshot preset ───────────────────────────────────────────────
  const selectPresetHeadshot = useCallback((preset: typeof PRESET_HEADSHOTS[0]) => {
    setSelectedHeadshot(preset.id);
    setHeadshotUrl(preset.image);
  }, []);

  // ── Start over ───────────────────────────────────────────────────────────
  const handleStartOver = useCallback(() => {
    setConcepts([]);
    setDesireLoop(null);
    setProjectId(null);
    setWinnerIdx(null);
    setIterations([]);
    setSelectedConceptIdx(null);
    setProgressMessage("");
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          CONTENT · YOUTUBE
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Thumbnail Generator
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          AI-powered YouTube thumbnails
        </p>
      </div>

      {/* ─── Section 1: Template Picker ──────────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          SELECT TEMPLATE
        </p>

        {templatesLoading ? (
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            <span className="text-sm" style={{ color: "var(--muted)" }}>Loading templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No templates available. Check that /api/thumbnails/templates is configured.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            {templates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className="text-left transition-all"
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                    backgroundColor: isSelected ? "var(--accent-bg)" : "var(--surface)",
                    cursor: "pointer",
                    position: "relative",
                    minWidth: 0,
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      &#10003;
                    </span>
                  )}
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {tpl.name}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                    {tpl.creator_reference}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    {tpl.archetype}
                  </p>
                  {/* Color palette dots */}
                  <div className="flex gap-1.5 mt-2">
                    {Object.values(tpl.color_palette).map((color, i) => (
                      <span
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: color,
                          border: "1px solid var(--border)",
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Responsive mobile override */}
        <style>{`
          @media (max-width: 768px) {
            .card > div[style*="grid-template-columns: repeat(4"] {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
      </div>

      {/* ─── Section 2: Topic + Inspiration ──────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          YOUR VIDEO
        </p>

        {/* Topic textarea */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
            What&apos;s your video about?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How I made $1M in 90 days with AI lead generation..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        {/* Inspiration search */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={topic.trim() ? topic.trim().slice(0, 50) : "Search YouTube thumbnails..."}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchInspiration(); }}
            />
            <button
              onClick={handleSearchInspiration}
              disabled={searching}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {searching ? "Searching..." : "Find Inspiration"}
            </button>
          </div>

          {/* Inspiration results row */}
          {inspirationResults.length > 0 && (
            <div style={{ overflowX: "auto", paddingBottom: 8 }}>
              <div style={{ display: "flex", gap: 10, minWidth: "max-content" }}>
                {inspirationResults.map((item, i) => {
                  const isRef = selectedRefs.includes(item.thumbnail);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedRefs((prev) =>
                          isRef ? prev.filter((r) => r !== item.thumbnail) : [...prev, item.thumbnail]
                        );
                      }}
                      style={{
                        borderRadius: 10,
                        overflow: "hidden",
                        border: isRef ? "2px solid var(--accent)" : "1px solid var(--border)",
                        backgroundColor: "var(--surface)",
                        width: 160,
                        flexShrink: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        style={{ width: "100%", height: 90, objectFit: "cover" }}
                      />
                      <p
                        className="text-xs px-2 py-1.5 truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {item.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected references chips */}
          {selectedRefs.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                Selected References:
              </span>
              {selectedRefs.map((ref, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
                >
                  Ref {i + 1}
                  <button
                    onClick={() => setSelectedRefs((prev) => prev.filter((_, j) => j !== i))}
                    style={{ cursor: "pointer", marginLeft: 2 }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Headshot selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            HEADSHOT
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {PRESET_HEADSHOTS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPresetHeadshot(preset)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: selectedHeadshot === preset.id ? "3px solid var(--accent)" : "2px solid var(--border)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "border-color 0.15s",
                  flexShrink: 0,
                }}
                title={preset.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.image}
                  alt={preset.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            ))}

            <DropZone
              onDrop={(dataUrl) => {
                setHeadshotUrl(dataUrl);
                setSelectedHeadshot("upload");
              }}
              preview={selectedHeadshot === "upload" ? headshotUrl : null}
              label="Upload"
            />

            <button
              onClick={() => {
                setSelectedHeadshot("ai-avatar");
                setHeadshotUrl("ai-avatar");
              }}
              className="text-xs px-3 py-2 rounded-xl border font-medium transition-all"
              style={{
                backgroundColor: selectedHeadshot === "ai-avatar" ? "var(--accent)" : "var(--surface)",
                borderColor: selectedHeadshot === "ai-avatar" ? "var(--accent)" : "var(--border)",
                color: selectedHeadshot === "ai-avatar" ? "#fff" : "var(--muted)",
              }}
            >
              AI Avatar
            </button>
          </div>
        </div>
      </div>

      {/* ─── Section 3: Generate Button ──────────────────────────────────── */}
      <button
        onClick={handleGenerate}
        disabled={generating || !topic.trim() || !selectedTemplate}
        className="w-full py-4 rounded-xl text-base font-semibold transition-all disabled:opacity-40"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
          border: "none",
          cursor: generating || !topic.trim() || !selectedTemplate ? "not-allowed" : "pointer",
        }}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-3">
            <span
              className="inline-block w-4 h-4 border-2 border-white rounded-full animate-spin"
              style={{ borderTopColor: "transparent" }}
            />
            {progressMessage}
          </span>
        ) : (
          "Generate 4 Concepts"
        )}
      </button>

      {/* ─── Section 4: Results ──────────────────────────────────────────── */}
      {concepts.length > 0 && (
        <div className="space-y-6">
          {/* Desire Loop Card */}
          {desireLoop && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                DESIRE LOOP
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "16px",
                }}
              >
                {[
                  { label: "Core Desire", value: desireLoop.coreDesire },
                  { label: "Pain Point", value: desireLoop.painPoint },
                  { label: "Solution", value: desireLoop.solution },
                  { label: "Curiosity Loop", value: desireLoop.curiosityLoop },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>
                      {item.label}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* Mobile responsive */}
              <style>{`
                @media (max-width: 768px) {
                  .card > div[style*="grid-template-columns: repeat(4, 1fr)"] {
                    grid-template-columns: 1fr 1fr !important;
                  }
                }
              `}</style>
            </div>
          )}

          {/* Concept Cards 2x2 */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              CONCEPTS
            </p>
            <div
              className="thumbnail-concept-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
              }}
            >
              {concepts.map((concept, idx) => {
                const isWinner = winnerIdx === idx;
                const isIterating = selectedConceptIdx === idx;
                return (
                  <div
                    key={idx}
                    className="card transition-all"
                    style={{
                      borderColor: isWinner ? "#d4a017" : isIterating ? "var(--accent)" : "var(--border)",
                      borderWidth: isWinner || isIterating ? "2px" : "1px",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedConceptIdx(idx)}
                  >
                    {/* Image */}
                    <div style={{ position: "relative", aspectRatio: "16/9", backgroundColor: "var(--bg)" }}>
                      {concept.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={concept.image}
                          alt={`Concept ${concept.label}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-sm" style={{ color: "var(--muted)" }}>No image generated</span>
                        </div>
                      )}
                      {/* Badge */}
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          backgroundColor: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 8,
                        }}
                      >
                        {concept.label}
                      </span>
                      {isWinner && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "#d4a017",
                            color: "#fff",
                            fontSize: 14,
                            padding: "3px 8px",
                            borderRadius: 8,
                          }}
                        >
                          &#9733;
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {concept.headline}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {concept.description}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (concept.image) handleDownload(concept.image, concept.label);
                          }}
                          disabled={!concept.image}
                          className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all disabled:opacity-30"
                          style={{
                            backgroundColor: "var(--bg)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkWinner(idx);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                          style={{
                            backgroundColor: isWinner ? "rgba(212,160,23,0.15)" : "var(--bg)",
                            borderColor: isWinner ? "#d4a017" : "var(--border)",
                            color: isWinner ? "#d4a017" : "var(--muted)",
                          }}
                        >
                          {isWinner ? "Winner" : "Mark Winner"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Mobile: single column */}
            <style>{`
              @media (max-width: 768px) {
                .thumbnail-concept-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>

          {/* Download Comparison + Start Over */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownloadComparison}
              disabled={concepts.length < 4}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Download Comparison
            </button>
            <button
              onClick={handleStartOver}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* ─── Section 5: Iteration Chat ───────────────────────────────────── */}
      {concepts.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              ITERATE
            </p>
            {selectedConceptIdx !== null && (
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
              >
                Editing Concept {concepts[selectedConceptIdx]?.label}
              </span>
            )}
          </div>

          {selectedConceptIdx === null && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Click a concept card above to select it for iteration.
            </p>
          )}

          {/* Chat history */}
          {iterations.length > 0 && (
            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                padding: "8px 0",
              }}
              className="space-y-3"
            >
              {iterations.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 14px",
                      borderRadius: msg.type === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      backgroundColor: msg.type === "user" ? "var(--accent)" : "var(--bg)",
                      color: msg.type === "user" ? "#fff" : "var(--text)",
                    }}
                  >
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.image && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.image}
                          alt="Iteration result"
                          style={{
                            width: "100%",
                            borderRadius: 10,
                            maxWidth: 400,
                          }}
                        />
                        <button
                          onClick={() => handleDownload(msg.image!, `iteration-${msg.id}`)}
                          className="text-xs mt-1.5 px-3 py-1 rounded-lg font-medium transition-all"
                          style={{
                            backgroundColor: msg.type === "user" ? "rgba(255,255,255,0.2)" : "var(--surface)",
                            border: "1px solid",
                            borderColor: msg.type === "user" ? "rgba(255,255,255,0.3)" : "var(--border)",
                            color: msg.type === "user" ? "#fff" : "var(--text)",
                          }}
                        >
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Chat input */}
          {selectedConceptIdx !== null && (
            <div className="flex gap-2">
              <input
                type="text"
                value={iterationInput}
                onChange={(e) => setIterationInput(e.target.value)}
                placeholder="What would you like to change?"
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleIterate(); }}
                disabled={iterating}
              />
              <button
                onClick={handleIterate}
                disabled={iterating || !iterationInput.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                }}
              >
                {iterating ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 border-2 border-white rounded-full animate-spin"
                      style={{ borderTopColor: "transparent" }}
                    />
                    Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
