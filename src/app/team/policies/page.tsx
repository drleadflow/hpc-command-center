"use client";

import { useState } from "react";
import { CORE_POLICIES, ONBOARDING_STEPS, TOUCHPOINTS, REVIEW_CYCLES } from "@/lib/team-data";
import { useStore } from "@/lib/use-store";
import type { OnboardingStep, TouchpointItem, ReviewCycle } from "@/lib/team-data";

type Tab = "core" | "onboarding" | "touchpoints" | "reviews";

function EditField({
  value,
  onSave,
  multiline = false,
  placeholder = "Click to edit…",
  className = "",
  style = {},
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { setEditing(false); onSave(draft); };

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={3}
        className={`w-full outline-none bg-transparent resize-none ${className}`}
        style={{ ...style, border: "0.5px solid var(--border)", borderRadius: 4, padding: "2px 4px" }}
      />
    ) : (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`w-full outline-none bg-transparent ${className}`}
        style={{ ...style, border: "0.5px solid var(--border)", borderRadius: 4, padding: "2px 4px" }}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:opacity-70 ${className}`}
      style={style}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder}</span>}
    </span>
  );
}

export default function PoliciesPage() {
  const [tab, setTab] = useState<Tab>("core");

  const [policies, setPolicies] = useStore<string[]>(
    "hpc_policies" as "hpc_policies",
    CORE_POLICIES
  );
  const [onboarding, setOnboarding] = useStore<OnboardingStep[]>(
    "hpc_onboarding" as "hpc_onboarding",
    ONBOARDING_STEPS
  );
  const [touchpoints, setTouchpoints] = useStore<TouchpointItem[]>(
    "hpc_touchpoints" as "hpc_touchpoints",
    TOUCHPOINTS
  );
  const [reviews, setReviews] = useStore<ReviewCycle[]>(
    "hpc_review_cycles" as "hpc_review_cycles",
    REVIEW_CYCLES
  );

  // Core policies
  function updatePolicy(index: number, value: string) {
    setPolicies((prev) => prev.map((p, i) => (i === index ? value : p)));
  }
  function addPolicy() {
    setPolicies((prev) => [...prev, "New policy item."]);
  }
  function removePolicy(index: number) {
    setPolicies((prev) => prev.filter((_, i) => i !== index));
  }

  // Onboarding
  function updateOnboarding(index: number, field: keyof OnboardingStep, value: string) {
    setOnboarding((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }
  function addOnboardingStep() {
    setOnboarding((prev) => [...prev, { day: "Day X", title: "New Step", description: "Description here." }]);
  }
  function removeOnboardingStep(index: number) {
    setOnboarding((prev) => prev.filter((_, i) => i !== index));
  }

  // Touchpoints
  function updateTouchpoint(index: number, field: keyof TouchpointItem, value: string) {
    setTouchpoints((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }
  function addTouchpoint() {
    setTouchpoints((prev) => [...prev, { day: "Day", title: "New Touchpoint", description: "Description here." }]);
  }
  function removeTouchpoint(index: number) {
    setTouchpoints((prev) => prev.filter((_, i) => i !== index));
  }

  // Reviews
  function updateReview(index: number, field: keyof ReviewCycle, value: string) {
    setReviews((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }
  function addReviewCycle() {
    setReviews((prev) => [...prev, { label: "New review", timing: "Timing", description: "Description here." }]);
  }
  function removeReviewCycle(index: number) {
    setReviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>HR Policies</h1>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        All 1099 contractors &middot; Doctor Lead Flow LLC &middot; Click any field to edit
      </p>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {([
          { id: "core" as const, label: "Core Policies" },
          { id: "onboarding" as const, label: "Onboarding" },
          { id: "touchpoints" as const, label: "Touchpoints" },
          { id: "reviews" as const, label: "Reviews" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-full text-xs transition-all"
            style={{
              backgroundColor: tab === t.id ? "var(--text)" : "var(--surface)",
              color: tab === t.id ? "var(--bg)" : "var(--muted)",
              border: tab === t.id ? "none" : "0.5px solid var(--border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "core" && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
          {policies.map((p, i) => (
            <div key={i} className="flex gap-3 py-2 text-[11px] leading-snug group" style={{ color: "var(--text-secondary)", borderBottom: i < policies.length - 1 ? "0.5px solid var(--border-subtle)" : "none" }}>
              <span className="text-[10px] font-medium w-4 flex-shrink-0" style={{ color: "var(--muted)" }}>{i + 1}</span>
              <span className="flex-1">
                <EditField
                  value={p}
                  onSave={(v) => updatePolicy(i, v)}
                  multiline
                  className="text-[11px] leading-snug"
                  style={{ color: "var(--text-secondary)" }}
                />
              </span>
              <button
                onClick={() => removePolicy(i)}
                className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity flex-shrink-0"
                style={{ color: "var(--danger)" }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addPolicy}
            className="mt-3 text-[11px] px-3 py-1.5 rounded-md"
            style={{ color: "var(--accent)", backgroundColor: "var(--bg)", border: "0.5px dashed var(--border)" }}
          >
            + Add policy item
          </button>
        </div>
      )}

      {tab === "onboarding" && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
          <div className="rounded-lg p-3 text-[11px] leading-relaxed mb-4" style={{ backgroundColor: "#EAF3DE", color: "#3B6D11", border: "0.5px solid #C0DD97" }}>
            Every contractor completes all steps before being considered fully onboarded. No shortcuts.
          </div>
          {onboarding.map((s, i) => (
            <div key={i} className="flex gap-3 py-2.5 group" style={{ borderBottom: i < onboarding.length - 1 ? "0.5px solid var(--border-subtle)" : "none" }}>
              <div className="text-[10px] font-medium w-16 flex-shrink-0 pt-0.5" style={{ color: "var(--muted)" }}>
                <EditField
                  value={s.day}
                  onSave={(v) => updateOnboarding(i, "day", v)}
                  className="text-[10px] font-medium"
                  style={{ color: "var(--muted)" }}
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text)" }}>
                  <EditField
                    value={s.title}
                    onSave={(v) => updateOnboarding(i, "title", v)}
                    className="text-xs font-medium"
                    style={{ color: "var(--text)" }}
                  />
                </div>
                <div className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                  <EditField
                    value={s.description}
                    onSave={(v) => updateOnboarding(i, "description", v)}
                    multiline
                    className="text-[11px] leading-snug"
                    style={{ color: "var(--text-secondary)" }}
                  />
                </div>
              </div>
              <button
                onClick={() => removeOnboardingStep(i)}
                className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity flex-shrink-0 self-center"
                style={{ color: "var(--danger)" }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addOnboardingStep}
            className="mt-3 text-[11px] px-3 py-1.5 rounded-md"
            style={{ color: "var(--accent)", backgroundColor: "var(--bg)", border: "0.5px dashed var(--border)" }}
          >
            + Add step
          </button>
        </div>
      )}

      {tab === "touchpoints" && (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg p-3 text-[11px] leading-relaxed" style={{ backgroundColor: "#FDF3E3", color: "#92610A", border: "0.5px solid #E8C87A" }}>
            All touchpoints are async-first. Sync meetings are purposeful and time-bounded.
          </div>
          {touchpoints.map((t, i) => (
            <div key={i} className="rounded-lg p-3 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>
                    <EditField
                      value={t.day}
                      onSave={(v) => updateTouchpoint(i, "day", v)}
                      className="text-[9px] uppercase tracking-wider font-medium"
                      style={{ color: "var(--muted)" }}
                    />
                  </div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
                    <EditField
                      value={t.title}
                      onSave={(v) => updateTouchpoint(i, "title", v)}
                      className="text-xs font-medium"
                      style={{ color: "var(--text)" }}
                    />
                  </div>
                  <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <EditField
                      value={t.description}
                      onSave={(v) => updateTouchpoint(i, "description", v)}
                      multiline
                      className="text-[11px] leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeTouchpoint(i)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity flex-shrink-0"
                  style={{ color: "var(--danger)" }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addTouchpoint}
            className="text-[11px] px-3 py-1.5 rounded-md"
            style={{ color: "var(--accent)", backgroundColor: "var(--surface)", border: "0.5px dashed var(--border)" }}
          >
            + Add touchpoint
          </button>
        </div>
      )}

      {tab === "reviews" && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {reviews.map((r, i) => (
              <div key={i} className="rounded-lg p-3 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
                <div className="flex items-start gap-1">
                  <div className="flex-1">
                    <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>
                      <EditField
                        value={r.label}
                        onSave={(v) => updateReview(i, "label", v)}
                        className="text-[9px] uppercase tracking-wider font-medium"
                        style={{ color: "var(--muted)" }}
                      />
                    </div>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
                      <EditField
                        value={r.timing}
                        onSave={(v) => updateReview(i, "timing", v)}
                        className="text-xs font-medium"
                        style={{ color: "var(--text)" }}
                      />
                    </div>
                    <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      <EditField
                        value={r.description}
                        onSave={(v) => updateReview(i, "description", v)}
                        multiline
                        className="text-[11px] leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeReviewCycle(i)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity flex-shrink-0"
                    style={{ color: "var(--danger)" }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addReviewCycle}
            className="text-[11px] px-3 py-1.5 rounded-md"
            style={{ color: "var(--accent)", backgroundColor: "var(--surface)", border: "0.5px dashed var(--border)" }}
          >
            + Add review cycle
          </button>
        </div>
      )}
    </div>
  );
}
