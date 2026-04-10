"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/hooks";

export function BICouncilPanel() {
  const [report, setReport] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bi-report")
      .then(r => r.json())
      .then(data => {
        setReport(data.report);
        setGenerated(data.generated);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleGenerate(e: React.MouseEvent) {
    e.stopPropagation();
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/bi-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        setGenerateError(err.error || "Generation failed");
      } else {
        const data = await res.json();
        setReport(data.report);
        setGenerated(data.generated);
        setExpanded(true);
      }
    } catch {
      setGenerateError("Network error — try again");
    } finally {
      setGenerating(false);
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit"
      });
    } catch { return iso; }
  };

  const parseReport = (md: string) => {
    const sections: { title: string; emoji: string; content: string; color: string }[] = [];
    const sectionMap: Record<string, { emoji: string; color: string }> = {
      "Top 3 Priorities": { emoji: "🎯", color: "var(--warning)" },
      "Red Flags": { emoji: "🚨", color: "var(--danger)" },
      "Quick Win": { emoji: "⚡", color: "var(--accent)" },
      "Ad Performance": { emoji: "📊", color: "var(--accent)" },
    };

    const parts = md.split(/^## /m).filter(Boolean);
    for (const part of parts) {
      const firstLine = part.split("\n")[0];
      const content = part.split("\n").slice(1).join("\n").trim();
      const key = Object.keys(sectionMap).find(k => firstLine.includes(k));
      if (key) {
        sections.push({
          title: firstLine.replace(/[🎯🚨⚡📊]/g, "").trim(),
          emoji: sectionMap[key].emoji,
          content,
          color: sectionMap[key].color,
        });
      }
    }
    return sections;
  };

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 rounded-xl w-48 mb-3" style={{ backgroundColor: "var(--border)" }} />
        <div className="h-3 rounded-xl w-full mb-2" style={{ backgroundColor: "var(--border)" }} />
        <div className="h-3 rounded-xl w-3/4" style={{ backgroundColor: "var(--border)" }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: "var(--bg)" }}>🧠</div>
          <div>
            <h3 className="text-base font-serif themed-text" style={{ fontWeight: 400 }}>BI Council</h3>
            <p className="text-xs themed-muted mt-0.5">No report generated yet</p>
          </div>
        </div>
        {generateError && (
          <p className="text-xs mb-3 px-3 py-2 rounded-xl" style={{ color: "var(--danger)", backgroundColor: "var(--bg)" }}>
            {generateError}
          </p>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full text-sm font-medium py-2.5 px-4 rounded-xl transition-opacity"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
            opacity: generating ? 0.6 : 1,
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? "Generating report..." : "Generate Report Now"}
        </button>
      </div>
    );
  }

  const sections = parseReport(report);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center justify-between cursor-pointer transition-colors"
        style={{ borderBottom: expanded ? `1px solid var(--border)` : "none" }}
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: "var(--bg)" }}>🧠</div>
          <div>
            <h3 className="text-base font-serif themed-text" style={{ fontWeight: 400 }}>BI Council Report</h3>
            {generated && (
              <p className="text-xs themed-muted mt-0.5">
                {formatTime(generated)}
                <span className="ml-2 opacity-60">({timeAgo(generated)})</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs px-3 py-1.5 rounded-xl font-medium transition-opacity"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
              opacity: generating ? 0.6 : 1,
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? "Generating..." : "Regenerate"}
          </button>
          <span className="themed-muted text-sm ml-1">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {generateError && (
        <div className="px-5 pt-3">
          <p className="text-xs px-3 py-2 rounded-xl" style={{ color: "var(--danger)", backgroundColor: "var(--bg)" }}>
            {generateError}
          </p>
        </div>
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="px-5 py-4">
          <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "var(--bg)" }}>
            <p className="text-sm themed-muted animate-pulse">Gathering KPIs and generating report...</p>
          </div>
        </div>
      )}

      {/* Collapsed preview */}
      {!expanded && !generating && sections.length > 0 && (
        <div className="px-5 pb-5 pt-4 space-y-3">
          {sections.filter(s => s.title.includes("Quick Win") || s.title.includes("Top 3") || s.title.includes("Priorities")).slice(0, 2).map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border themed-border"
              style={{ backgroundColor: "var(--bg)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{s.emoji}</span>
                <span className="text-xs font-semibold uppercase tracking-wide themed-secondary">{s.title}</span>
              </div>
              <p className="text-sm leading-relaxed themed-text line-clamp-3">{s.content.split("\n")[0]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full expanded */}
      {expanded && !generating && (
        <div className="px-5 pb-5 pt-4 space-y-3">
          {sections.map((section, i) => (
            <div key={i} className="rounded-2xl border overflow-hidden themed-border">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b themed-border"
                style={{ backgroundColor: "var(--bg)" }}>
                <span>{section.emoji}</span>
                <span className="text-xs font-semibold uppercase tracking-wide themed-secondary">
                  {section.title}
                </span>
              </div>
              <div className="px-4 py-3" style={{ backgroundColor: "var(--surface)" }}>
                <p className="text-sm leading-relaxed themed-text whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm themed-text whitespace-pre-wrap leading-relaxed">{report}</p>
          )}
        </div>
      )}
    </div>
  );
}
