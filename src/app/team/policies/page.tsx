"use client";

import { CORE_POLICIES, ONBOARDING_STEPS, TOUCHPOINTS, REVIEW_CYCLES } from "@/lib/team-data";
import { useState } from "react";

type Tab = "core" | "onboarding" | "touchpoints" | "reviews";

export default function PoliciesPage() {
  const [tab, setTab] = useState<Tab>("core");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>HR Policies</h1>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        All 1099 contractors &middot; Doctor Lead Flow LLC
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
          {CORE_POLICIES.map((p, i) => (
            <div key={i} className="flex gap-3 py-2 text-[11px] leading-snug" style={{ color: "var(--text-secondary)", borderBottom: i < CORE_POLICIES.length - 1 ? "0.5px solid var(--border-subtle)" : "none" }}>
              <span className="text-[10px] font-medium w-4 flex-shrink-0" style={{ color: "var(--muted)" }}>{i + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: p }} />
            </div>
          ))}
        </div>
      )}

      {tab === "onboarding" && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
          <div className="rounded-lg p-3 text-[11px] leading-relaxed mb-4" style={{ backgroundColor: "#EAF3DE", color: "#3B6D11", border: "0.5px solid #C0DD97" }}>
            Every contractor completes all 10 steps before being considered fully onboarded. No shortcuts.
          </div>
          {ONBOARDING_STEPS.map((s, i) => (
            <div key={i} className="flex gap-3 py-2.5" style={{ borderBottom: i < ONBOARDING_STEPS.length - 1 ? "0.5px solid var(--border-subtle)" : "none" }}>
              <div className="text-[10px] font-medium w-16 flex-shrink-0 pt-0.5" style={{ color: "var(--muted)" }}>{s.day}</div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text)" }}>{s.title}</div>
                <div className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{s.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "touchpoints" && (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg p-3 text-[11px] leading-relaxed" style={{ backgroundColor: "#FDF3E3", color: "#92610A", border: "0.5px solid #E8C87A" }}>
            All touchpoints are async-first. Sync meetings are purposeful and time-bounded.
          </div>
          {TOUCHPOINTS.map((t, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>{t.day}</div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text)" }}>{t.title}</div>
              <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.description}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {REVIEW_CYCLES.map((r, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>{r.label}</div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--text)" }}>{r.timing}</div>
              <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
