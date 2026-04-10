"use client";

import { useState, useRef, useEffect } from "react";
import type { GrowthStage, SopStep, Script, Kpi, Tool, FailurePoint } from "@/lib/growth-engine-data";
import { useStore } from "@/lib/use-store";

type Tab = "sops" | "scripts" | "kpis" | "tools" | "fails";
const TABS: { id: Tab; label: string }[] = [
  { id: "sops", label: "SOPs" },
  { id: "scripts", label: "Scripts" },
  { id: "kpis", label: "KPIs" },
  { id: "tools", label: "Tools" },
  { id: "fails", label: "Failure Points" },
];

// ── Inline Edit Helpers ─────────────────────────────────────────────
function EditField({ value, onChange, multiline, placeholder, style }: {
  value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = () => { onChange(draft); setEditing(false); };

  if (editing) {
    const shared = { value: draft, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: commit, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } if (e.key === "Enter" && !multiline) commit(); }, style: { ...style, outline: "none", backgroundColor: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 4, padding: "4px 8px", width: "100%", fontSize: "inherit", fontFamily: "inherit", color: "var(--text)" } };
    if (multiline) return <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={3} {...shared} />;
    return <input ref={ref as React.RefObject<HTMLInputElement>} {...shared} placeholder={placeholder} />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      style={{ ...style, cursor: "pointer", borderBottom: "1px dashed transparent" }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = "var(--muted)"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = "transparent"; }}
      title="Click to edit"
    >
      {value || placeholder || "Click to edit..."}
    </span>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="text-[10px] opacity-20 hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--danger)" }} title="Remove">✕</button>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="text-[9px] px-2 py-0.5 rounded-sm transition-all flex-shrink-0" style={{ backgroundColor: copied ? "var(--success-bg, #EAF3DE)" : "var(--bg)", color: copied ? "var(--success)" : "var(--muted)", border: "0.5px solid var(--border)" }}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Main Component ──────────────────────────────────────────────────
export function GrowthStagePage({ stage }: { stage: GrowthStage }) {
  const [activeTab, setActiveTab] = useState<Tab>("sops");

  // Each section is independently stored and editable
  const [sops, setSops] = useStore<SopStep[]>(`hpc_ge_sops_${stage.id}` as "hpc_tracking", stage.sops);
  const [scripts, setScripts] = useStore<Script[]>(`hpc_ge_scripts_${stage.id}` as "hpc_tracking", stage.scripts);
  const [kpis, setKpis] = useStore<Kpi[]>(`hpc_ge_kpis_${stage.id}` as "hpc_tracking", stage.kpis);
  const [tools, setTools] = useStore<Tool[]>(`hpc_ge_tools_${stage.id}` as "hpc_tracking", stage.tools);
  const [fails, setFails] = useStore<FailurePoint[]>(`hpc_ge_fails_${stage.id}` as "hpc_tracking", stage.fails);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="px-5 py-4 flex justify-between items-start flex-wrap gap-2" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Stage {stage.num}</span>
              {stage.isPowerStage && <span className="text-[9px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "#FDF3E3", color: "#92610A", border: "0.5px solid #E8C87A" }}>Power Stage</span>}
              {stage.isWebinarTrack && <span className="text-[9px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "#E8F1FB", color: "#1A4F8A", border: "0.5px solid #A8C8F0" }}>Webinar Track</span>}
            </div>
            <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{stage.title}</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{stage.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-6 flex-wrap px-5 py-2.5" style={{ backgroundColor: "var(--bg)" }}>
          {[{ label: "Owner", value: stage.owner }, { label: "Trigger", value: stage.trigger }, { label: "Cadence", value: stage.cadence }].map((m) => (
            <div key={m.label}>
              <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--muted)" }}>{m.label}</div>
              <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-shrink-0 px-4 py-2 text-[11px] transition-all" style={{ color: activeTab === tab.id ? "var(--text)" : "var(--muted)", fontWeight: activeTab === tab.id ? 500 : 400, borderBottom: activeTab === tab.id ? "2px solid var(--text)" : "2px solid transparent", marginBottom: "-0.5px" }}>
              {tab.label} ({tab.id === "sops" ? sops.length : tab.id === "scripts" ? scripts.length : tab.id === "kpis" ? kpis.length : tab.id === "tools" ? tools.length : fails.length})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-5 py-4">

          {/* SOPs — editable */}
          {activeTab === "sops" && (
            <div className="flex flex-col">
              {sops.map((sop, i) => (
                <div key={i} className="flex">
                  <div className="flex flex-col items-center w-7 flex-shrink-0">
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-medium mt-0.5 flex-shrink-0" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--muted)" }}>{i + 1}</div>
                    {i < sops.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: "var(--border-subtle)" }} />}
                  </div>
                  <div className="pl-2 flex-1 flex gap-2" style={{ paddingBottom: i < sops.length - 1 ? "12px" : 0 }}>
                    <div className="flex-1">
                      <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text)" }}>
                        <EditField value={sop.title} onChange={(v) => setSops((prev) => prev.map((s, si) => si === i ? { ...s, title: v } : s))} />
                      </div>
                      <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        <EditField value={sop.description} onChange={(v) => setSops((prev) => prev.map((s, si) => si === i ? { ...s, description: v } : s))} multiline />
                      </div>
                    </div>
                    <RemoveBtn onClick={() => setSops((prev) => prev.filter((_, si) => si !== i))} />
                  </div>
                </div>
              ))}
              <button onClick={() => setSops((prev) => [...prev, { title: "New SOP step", description: "Click to describe this step..." }])} className="text-[10px] mt-3 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>+ Add SOP step</button>
            </div>
          )}

          {/* Scripts — editable */}
          {activeTab === "scripts" && (
            <div className="flex flex-col gap-3">
              {scripts.map((script, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg)", borderLeft: "2px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] uppercase tracking-wider flex-1" style={{ color: "var(--muted)" }}>
                      <EditField value={script.label} onChange={(v) => setScripts((prev) => prev.map((s, si) => si === i ? { ...s, label: v } : s))} placeholder="Script label" />
                    </div>
                    <div className="flex gap-1.5">
                      <CopyButton text={script.text} />
                      <RemoveBtn onClick={() => setScripts((prev) => prev.filter((_, si) => si !== i))} />
                    </div>
                  </div>
                  <div className="text-[11px] leading-relaxed" style={{ color: "var(--text)" }}>
                    <EditField value={script.text} onChange={(v) => setScripts((prev) => prev.map((s, si) => si === i ? { ...s, text: v } : s))} multiline />
                  </div>
                </div>
              ))}
              <button onClick={() => setScripts((prev) => [...prev, { label: "New Script", text: "Click to write script..." }])} className="text-[10px] mt-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>+ Add script</button>
            </div>
          )}

          {/* KPIs — editable */}
          {activeTab === "kpis" && (
            <div>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))" }}>
                {kpis.map((kpi, i) => (
                  <div key={i} className="rounded-lg p-3 relative group" style={{ backgroundColor: "var(--bg)" }}>
                    <div className="text-[10px] mb-1 leading-tight" style={{ color: "var(--muted)" }}>
                      <EditField value={kpi.metric} onChange={(v) => setKpis((prev) => prev.map((k, ki) => ki === i ? { ...k, metric: v } : k))} placeholder="Metric name" />
                    </div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      <EditField value={kpi.target} onChange={(v) => setKpis((prev) => prev.map((k, ki) => ki === i ? { ...k, target: v } : k))} placeholder="Target value" />
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RemoveBtn onClick={() => setKpis((prev) => prev.filter((_, ki) => ki !== i))} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setKpis((prev) => [...prev, { metric: "New metric", target: "Set target" }])} className="text-[10px] mt-3 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>+ Add KPI</button>
            </div>
          )}

          {/* Tools — editable */}
          {activeTab === "tools" && (
            <div>
              <div className="flex flex-wrap gap-2">
                {tools.map((tool, i) => (
                  <div key={i} className="rounded-lg px-3 py-2 relative group" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)" }}>
                    <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>
                      <EditField value={tool.name} onChange={(v) => setTools((prev) => prev.map((t, ti) => ti === i ? { ...t, name: v } : t))} placeholder="Tool name" />
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                      <EditField value={tool.usage} onChange={(v) => setTools((prev) => prev.map((t, ti) => ti === i ? { ...t, usage: v } : t))} placeholder="Usage" />
                    </div>
                    <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RemoveBtn onClick={() => setTools((prev) => prev.filter((_, ti) => ti !== i))} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setTools((prev) => [...prev, { name: "New Tool", usage: "Click to describe usage" }])} className="text-[10px] mt-3 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>+ Add tool</button>
            </div>
          )}

          {/* Failure Points — editable */}
          {activeTab === "fails" && (
            <div className="flex flex-col gap-2">
              {fails.map((fail, i) => (
                <div key={i} className="rounded-lg px-3 py-3 flex gap-2" style={{ backgroundColor: "#FDF5F5", border: "0.5px solid #F0C0C0" }}>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium mb-1" style={{ color: "#8B2020" }}>
                      <EditField value={fail.warning} onChange={(v) => setFails((prev) => prev.map((f, fi) => fi === i ? { ...f, warning: v } : f))} placeholder="Warning" />
                    </div>
                    <div className="text-[10px] leading-relaxed" style={{ color: "#A33030" }}>
                      <EditField value={fail.fix} onChange={(v) => setFails((prev) => prev.map((f, fi) => fi === i ? { ...f, fix: v } : f))} placeholder="How to fix" />
                    </div>
                  </div>
                  <RemoveBtn onClick={() => setFails((prev) => prev.filter((_, fi) => fi !== i))} />
                </div>
              ))}
              <button onClick={() => setFails((prev) => [...prev, { warning: "New failure point", fix: "Click to describe the fix..." }])} className="text-[10px] mt-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>+ Add failure point</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
