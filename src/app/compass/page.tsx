"use client";

import { useState, useEffect } from "react";

type FilterResult = "pass" | "fail" | "unset";

interface Filter {
  id: string;
  title: string;
  question: string;
  subtext: string;
  color: string;
}

interface DecisionEntry {
  id: string;
  decision: string;
  date: string;
  results: Record<string, FilterResult>;
  verdict: "proceed" | "caution" | "stop";
}

const DEFAULT_FILTERS: Filter[] = [
  {
    id: "company",
    title: "Company Case",
    question: "Does this get us closer to our 3-year targets?",
    subtext: "Set your revenue and profitability goals in settings.",
    color: "#3b82f6",
  },
  {
    id: "customer",
    title: "Customer Case",
    question: "Does this align with our company purpose?",
    subtext: "Set your company purpose in settings.",
    color: "#10b981",
  },
  {
    id: "culture",
    title: "Culture Case",
    question: "Does this match our core values?",
    subtext: "Set your core values in settings.",
    color: "#8b5cf6",
  },
  {
    id: "competitive",
    title: "Competitive Case",
    question: "Does this leverage our strategic anchors?",
    subtext: "Set your strategic anchors in settings.",
    color: "#f59e0b",
  },
];

function loadFilters(): Filter[] {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const saved = localStorage.getItem("dlf-compass-filters");
    if (saved) {
      const parsed = JSON.parse(saved) as Filter[];
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    }
  } catch { /* fall through */ }
  return DEFAULT_FILTERS;
}

function saveFilters(filters: Filter[]) {
  try { localStorage.setItem("dlf-compass-filters", JSON.stringify(filters)); } catch { /* ignore */ }
}

function getVerdict(
  results: Record<string, FilterResult>
): "proceed" | "caution" | "stop" | null {
  const values = Object.values(results);
  if (values.length < 4 || values.some((v) => v === "unset")) return null;
  const passes = values.filter((v) => v === "pass").length;
  if (passes === 4) return "proceed";
  if (passes === 3) return "caution";
  return "stop";
}

function verdictLabel(verdict: "proceed" | "caution" | "stop") {
  if (verdict === "proceed")
    return {
      text: "PROCEED — This decision aligns with everything. Execute.",
      bg: "#f0fdf4",
      border: "#22c55e",
      color: "#15803d",
    };
  if (verdict === "caution")
    return {
      text: "CAUTION — Review the failing case before proceeding.",
      bg: "#fffbeb",
      border: "#f59e0b",
      color: "#b45309",
    };
  return {
    text: "STOP — This doesn't align. Rethink or reject.",
    bg: "#fef2f2",
    border: "#ef4444",
    color: "#b91c1c",
  };
}

export default function CompassPage() {
  const [filters, setFilters] = useState<Filter[]>(DEFAULT_FILTERS);
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [decision, setDecision] = useState("");
  const [results, setResults] = useState<Record<string, FilterResult>>(
    Object.fromEntries(DEFAULT_FILTERS.map((f) => [f.id, "unset"]))
  );

  useEffect(() => {
    setFilters(loadFilters());
  }, []);
  const [log, setLog] = useState<DecisionEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("dlf-compass-log");
      if (saved) return JSON.parse(saved) as DecisionEntry[];
    } catch {
      // invalid or old data — fall back to empty
    }
    return [];
  });

  // Persist log to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("dlf-compass-log", JSON.stringify(log));
    } catch {
      // storage unavailable — silently ignore
    }
  }, [log]);

  const verdict = getVerdict(results);

  function toggleResult(filterId: string, value: FilterResult) {
    setResults((prev) => ({
      ...prev,
      [filterId]: prev[filterId] === value ? "unset" : value,
    }));
  }

  function saveDecision() {
    if (!decision.trim() || !verdict) return;
    const entry: DecisionEntry = {
      id: Date.now().toString(),
      decision: decision.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      results: { ...results },
      verdict,
    };
    setLog((prev) => [entry, ...prev]);
    setDecision("");
    setResults(Object.fromEntries(filters.map((f) => [f.id, "unset"])));
  }

  function removeEntry(id: string) {
    setLog((prev) => prev.filter((e) => e.id !== id));
  }

  const verdictStyle = verdict ? verdictLabel(verdict) : null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent)" }}
        >
          DECISION FRAMEWORK
        </p>
        <h1
          className="text-4xl font-serif mb-2"
          style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}
        >
          Clarity Compass
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Filter every decision through these 4 cases. If it doesn&apos;t pass
          all 4, don&apos;t do it.
        </p>
      </div>

      {/* Decision Input */}
      <div className="card p-6">
        <label
          className="block text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--muted)" }}
        >
          What decision are you evaluating?
        </label>
        <textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          placeholder="e.g. Launch a new IV Therapy campaign targeting Miami's Brickell neighborhood..."
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onFocus={(e) =>
            (e.target.style.borderColor = "var(--accent)")
          }
          onBlur={(e) =>
            (e.target.style.borderColor = "var(--border)")
          }
        />
      </div>

      {/* 4 Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filters.map((filter) => {
          const result = results[filter.id];
          const isEditing = editingFilter === filter.id;
          return (
            <div
              key={filter.id}
              className="card p-5"
              style={{
                borderTop: `3px solid ${filter.color}`,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: filter.color }}
              >
                {filter.title}
              </p>
              <p
                className="text-sm font-medium mb-2 leading-snug"
                style={{ color: "var(--text)" }}
              >
                {filter.question}
              </p>
              {isEditing ? (
                <input
                  autoFocus
                  defaultValue={filter.subtext}
                  className="text-xs mb-4 leading-relaxed w-full rounded px-2 py-1 outline-none"
                  style={{ color: "var(--text)", backgroundColor: "var(--bg)", border: "1px solid var(--accent)" }}
                  onBlur={(e) => {
                    const updated = filters.map((f) =>
                      f.id === filter.id ? { ...f, subtext: e.target.value } : f
                    );
                    setFilters(updated);
                    saveFilters(updated);
                    setEditingFilter(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                />
              ) : (
                <p
                  className="text-xs mb-4 leading-relaxed cursor-pointer hover:underline"
                  style={{ color: "var(--muted)" }}
                  onClick={() => setEditingFilter(filter.id)}
                  title="Click to edit"
                >
                  {filter.subtext}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleResult(filter.id, "pass")}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wide transition-all"
                  style={{
                    backgroundColor:
                      result === "pass" ? "#f0fdf4" : "var(--bg)",
                    border: `1px solid ${result === "pass" ? "#22c55e" : "var(--border)"}`,
                    color: result === "pass" ? "#15803d" : "var(--muted)",
                  }}
                >
                  Pass
                </button>
                <button
                  onClick={() => toggleResult(filter.id, "fail")}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wide transition-all"
                  style={{
                    backgroundColor:
                      result === "fail" ? "#fef2f2" : "var(--bg)",
                    border: `1px solid ${result === "fail" ? "#ef4444" : "var(--border)"}`,
                    color:
                      result === "fail" ? "var(--danger)" : "var(--muted)",
                  }}
                >
                  Fail
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verdict */}
      {verdictStyle && (
        <div
          className="rounded-2xl px-6 py-5"
          style={{
            backgroundColor: verdictStyle.bg,
            border: `2px solid ${verdictStyle.border}`,
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: verdictStyle.color }}
          >
            {verdictStyle.text}
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveDecision}
          disabled={!decision.trim() || !verdict}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-opacity"
          style={{
            backgroundColor:
              !decision.trim() || !verdict
                ? "var(--border)"
                : "var(--accent)",
            color:
              !decision.trim() || !verdict ? "var(--muted)" : "#ffffff",
            cursor:
              !decision.trim() || !verdict ? "not-allowed" : "pointer",
          }}
        >
          Save Decision
        </button>
      </div>

      {/* Decision Log */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted)" }}
        >
          RECENT DECISIONS
        </p>

        {log.length === 0 ? (
          <div
            className="card p-8 text-center"
            style={{ border: "1px dashed var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No decisions logged yet. Use the compass above to evaluate
              your next move.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {log.map((entry) => {
              const vs = verdictLabel(entry.verdict);
              const passedIds = Object.entries(entry.results)
                .filter(([, v]) => v === "pass")
                .map(([id]) => filters.find((f) => f.id === id)?.title ?? id);
              const failedIds = Object.entries(entry.results)
                .filter(([, v]) => v === "fail")
                .map(([id]) => filters.find((f) => f.id === id)?.title ?? id);
              return (
                <div key={entry.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{ color: "var(--text)" }}
                      >
                        {entry.decision}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {entry.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: vs.bg,
                          color: vs.color,
                          border: `1px solid ${vs.border}`,
                        }}
                      >
                        {entry.verdict}
                      </span>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
                        style={{
                          color: "var(--muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {passedIds.map((name) => (
                      <span
                        key={name}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#f0fdf4",
                          color: "#15803d",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {name}
                      </span>
                    ))}
                    {failedIds.map((name) => (
                      <span
                        key={name}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#fef2f2",
                          color: "var(--danger)",
                          border: "1px solid #fecaca",
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
