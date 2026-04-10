"use client";

import { useState } from "react";
import type { GrowthStage } from "@/lib/growth-engine-data";

type Tab = "sops" | "scripts" | "kpis" | "tools" | "fails";

const TABS: { id: Tab; label: string }[] = [
  { id: "sops", label: "SOPs" },
  { id: "scripts", label: "Scripts" },
  { id: "kpis", label: "KPIs" },
  { id: "tools", label: "Tools" },
  { id: "fails", label: "Failure Points" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="text-[9px] px-2 py-0.5 rounded-sm transition-all flex-shrink-0"
      style={{
        backgroundColor: copied ? "var(--success-bg, #EAF3DE)" : "var(--bg)",
        color: copied ? "var(--success)" : "var(--muted)",
        border: "0.5px solid var(--border)",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function GrowthStagePage({ stage }: { stage: GrowthStage }) {
  const [activeTab, setActiveTab] = useState<Tab>("sops");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header Panel */}
      <div
        className="rounded-xl overflow-hidden mb-4"
        style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        {/* Title Row */}
        <div className="px-5 py-4 flex justify-between items-start flex-wrap gap-2" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Stage {stage.num}</span>
              {stage.isPowerStage && (
                <span className="text-[9px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "#FDF3E3", color: "#92610A", border: "0.5px solid #E8C87A" }}>
                  Power Stage
                </span>
              )}
              {stage.isWebinarTrack && (
                <span className="text-[9px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "#E8F1FB", color: "#1A4F8A", border: "0.5px solid #A8C8F0" }}>
                  Webinar Track
                </span>
              )}
            </div>
            <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{stage.title}</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{stage.subtitle}</p>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex gap-6 flex-wrap px-5 py-2.5" style={{ backgroundColor: "var(--bg)" }}>
          {[
            { label: "Owner", value: stage.owner },
            { label: "Trigger", value: stage.trigger },
            { label: "Cadence", value: stage.cadence },
          ].map((m) => (
            <div key={m.label}>
              <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--muted)" }}>{m.label}</div>
              <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 px-4 py-2 text-[11px] transition-all"
              style={{
                color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
                fontWeight: activeTab === tab.id ? 500 : 400,
                borderBottom: activeTab === tab.id ? "2px solid var(--text)" : "2px solid transparent",
                marginBottom: "-0.5px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-5 py-4">
          {activeTab === "sops" && (
            <div className="flex flex-col">
              {stage.sops.map((sop, i) => (
                <div key={i} className="flex">
                  {/* Step line */}
                  <div className="flex flex-col items-center w-7 flex-shrink-0">
                    <div
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-medium mt-0.5 flex-shrink-0"
                      style={{
                        backgroundColor: stage.isPowerStage ? "#FDF3E3" : "var(--bg)",
                        border: stage.isPowerStage ? "0.5px solid #E8C87A" : "0.5px solid var(--border)",
                        color: stage.isPowerStage ? "#92610A" : "var(--muted)",
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < stage.sops.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pl-2 flex-1" style={{ paddingBottom: i < stage.sops.length - 1 ? "12px" : 0 }}>
                    <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text)" }}>{sop.title}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{sop.description}</div>
                    {sop.tag && (
                      <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-sm mt-1" style={{ backgroundColor: "var(--bg)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
                        {sop.tag}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "scripts" && (
            <div className="flex flex-col gap-3">
              {stage.scripts.map((script, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg)", borderLeft: "2px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{script.label}</div>
                    <CopyButton text={script.text} />
                  </div>
                  <div className="text-[11px] leading-relaxed whitespace-pre-line italic" style={{ color: "var(--text)" }}>
                    {script.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "kpis" && (
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))" }}>
              {stage.kpis.map((kpi, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg)" }}>
                  <div className="text-[10px] mb-1 leading-tight" style={{ color: "var(--muted)" }}>{kpi.metric}</div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{kpi.target}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "tools" && (
            <div className="flex flex-wrap gap-2">
              {stage.tools.map((tool, i) => (
                <div key={i} className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)" }}>
                  <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{tool.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{tool.usage}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "fails" && (
            <div className="flex flex-col gap-2">
              {stage.fails.map((fail, i) => (
                <div key={i} className="rounded-lg px-3 py-3" style={{ backgroundColor: "#FDF5F5", border: "0.5px solid #F0C0C0" }}>
                  <div className="text-[11px] font-medium mb-1" style={{ color: "#8B2020" }}>{fail.warning}</div>
                  <div className="text-[10px] leading-relaxed" style={{ color: "#A33030" }}>{fail.fix}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
