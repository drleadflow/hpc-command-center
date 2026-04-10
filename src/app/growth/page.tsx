"use client";

import Link from "next/link";
import { GROWTH_STAGES, FUNNEL_COUNTS } from "@/lib/growth-engine-data";

const STAGE_COLORS = [
  "#639922", "#2D7DD2", "#2D7DD2", "#534AB7",
  "#534AB7", "#C4860A", "#C4860A", "#639922",
];

export default function GrowthOverview() {
  const maxCount = Math.max(...Object.values(FUNNEL_COUNTS));

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>
        Growth Engine
      </h1>
      <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
        8-stage customer acquisition journey &middot; Click any stage to view SOPs, scripts, KPIs
      </p>

      {/* Funnel Visualization */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        <div className="text-[10px] uppercase tracking-widest mb-4 font-medium" style={{ color: "var(--muted)" }}>
          Pipeline Funnel
        </div>
        <div className="flex flex-col gap-2">
          {GROWTH_STAGES.map((stage, i) => {
            const count = FUNNEL_COUNTS[stage.id] ?? 0;
            const width = maxCount > 0 ? Math.max((count / maxCount) * 100, 12) : 12;
            return (
              <Link
                key={stage.id}
                href={`/growth/${stage.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-6 text-[10px] font-medium flex-shrink-0" style={{ color: "var(--muted)" }}>
                  {stage.num}
                </div>
                <div className="flex-1">
                  <div
                    className="rounded-md px-3 py-2 flex items-center justify-between transition-all group-hover:opacity-80"
                    style={{
                      width: `${width}%`,
                      backgroundColor: `${STAGE_COLORS[i]}18`,
                      border: `0.5px solid ${STAGE_COLORS[i]}40`,
                      minWidth: 120,
                    }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: STAGE_COLORS[i] }}>
                      {stage.title}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: STAGE_COLORS[i] }}>
                      {count}
                    </span>
                  </div>
                </div>
                <div className="w-20 text-right">
                  {i > 0 && (
                    <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                      {Math.round((count / (FUNNEL_COUNTS[GROWTH_STAGES[i - 1].id] ?? 1)) * 100)}%
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {GROWTH_STAGES.map((stage, i) => (
          <Link
            key={stage.id}
            href={`/growth/${stage.id}`}
            className="rounded-xl p-4 transition-all hover:opacity-90"
            style={{
              backgroundColor: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderTop: `3px solid ${STAGE_COLORS[i]}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>
                Stage {stage.num}
              </span>
              {stage.isPowerStage && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: "#FDF3E3", color: "#92610A" }}>
                  Power
                </span>
              )}
              {stage.isWebinarTrack && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: "#E8F1FB", color: "#1A4F8A" }}>
                  Webinar
                </span>
              )}
            </div>
            <div className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>{stage.title}</div>
            <div className="text-[10px] mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>{stage.subtitle}</div>
            <div className="flex gap-3 text-[10px]" style={{ color: "var(--muted)" }}>
              <span>{stage.sops.length} SOPs</span>
              <span>{stage.scripts.length} Scripts</span>
              <span>{stage.kpis.length} KPIs</span>
            </div>
            <div className="text-[10px] mt-2" style={{ color: "var(--text-secondary)" }}>
              Owner: {stage.owner}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
