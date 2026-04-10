"use client";

import { useState } from "react";
import { ROLES, SCALE_PHASES, COMMISSION_TABLE } from "@/lib/team-data";
import { useStore } from "@/lib/use-store";
import type { ScalePhase } from "@/lib/team-data";

type ViewTab = "org" | "roles" | "scale" | "commission";

interface OrgCard {
  num: string;
  title: string;
  rate: string;
  tier: "ceo" | "lead" | "ic";
  tag?: string;
}

const ORG_ROWS: OrgCard[][] = [
  [{ num: "01", title: "CEO", rate: "Equity / draw", tier: "ceo" }],
  [
    { num: "02", title: "Operations Manager", rate: "Retainer", tier: "lead" },
    { num: "03", title: "Marketing Lead", rate: "Retainer", tier: "lead" },
    { num: "06", title: "Sales Closer", rate: "Base + 10% commission", tier: "lead" },
    { num: "07", title: "AI & Tech Specialist", rate: "Retainer", tier: "lead", tag: "Combined" },
    { num: "08", title: "CSM / Lead Coach", rate: "Retainer", tier: "lead", tag: "Combined" },
  ],
  [
    { num: "04", title: "Content Editor", rate: "Per asset or retainer", tier: "ic" },
    { num: "05", title: "Appointment Setter", rate: "Base + bonuses", tier: "ic" },
    { num: "09", title: "Bookkeeper / Finance", rate: "Fractional / monthly", tier: "ic", tag: "Fractional" },
  ],
];

const TIER_COLORS = { ceo: "#C4860A", lead: "#2D7DD2", ic: "var(--border)" };

// Per-role editable functions and KPIs stored in localStorage
type RoleFunctionsMap = Record<string, string[]>;
type RoleKpisMap = Record<string, string[]>;

const DEFAULT_ROLE_FUNCTIONS: RoleFunctionsMap = Object.fromEntries(
  ROLES.map((r) => [r.num, [...r.functions]])
);
const DEFAULT_ROLE_KPIS: RoleKpisMap = Object.fromEntries(
  ROLES.map((r) => [r.num, [...r.kpis]])
);

const DEFAULT_SCALE_PHASES: ScalePhase[] = SCALE_PHASES.map((p) => ({
  ...p,
  actions: [...p.actions],
}));

function EditField({
  value,
  onSave,
  placeholder = "Click to edit…",
  className = "",
  style = {},
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { setEditing(false); onSave(draft); };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`w-full outline-none bg-transparent ${className}`}
        style={{ ...style, border: "0.5px solid var(--border)", borderRadius: 4, padding: "1px 4px" }}
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

export default function TeamOverview() {
  const [tab, setTab] = useState<ViewTab>("org");

  const [roleFunctions, setRoleFunctions] = useStore<RoleFunctionsMap>(
    "hpc_role_functions" as "hpc_role_functions",
    DEFAULT_ROLE_FUNCTIONS
  );
  const [roleKpis, setRoleKpis] = useStore<RoleKpisMap>(
    "hpc_role_kpis" as "hpc_role_kpis",
    DEFAULT_ROLE_KPIS
  );
  const [scalePhases, setScalePhases] = useStore<ScalePhase[]>(
    "hpc_scale_phases" as "hpc_scale_phases",
    DEFAULT_SCALE_PHASES
  );

  // Functions CRUD
  function updateFunction(roleNum: string, index: number, value: string) {
    setRoleFunctions((prev) => ({
      ...prev,
      [roleNum]: (prev[roleNum] ?? []).map((f, i) => (i === index ? value : f)),
    }));
  }
  function addFunction(roleNum: string) {
    setRoleFunctions((prev) => ({
      ...prev,
      [roleNum]: [...(prev[roleNum] ?? []), "New function"],
    }));
  }
  function removeFunction(roleNum: string, index: number) {
    setRoleFunctions((prev) => ({
      ...prev,
      [roleNum]: (prev[roleNum] ?? []).filter((_, i) => i !== index),
    }));
  }

  // KPIs CRUD
  function updateKpi(roleNum: string, index: number, value: string) {
    setRoleKpis((prev) => ({
      ...prev,
      [roleNum]: (prev[roleNum] ?? []).map((k, i) => (i === index ? value : k)),
    }));
  }
  function addKpi(roleNum: string) {
    setRoleKpis((prev) => ({
      ...prev,
      [roleNum]: [...(prev[roleNum] ?? []), "New KPI"],
    }));
  }
  function removeKpi(roleNum: string, index: number) {
    setRoleKpis((prev) => ({
      ...prev,
      [roleNum]: (prev[roleNum] ?? []).filter((_, i) => i !== index),
    }));
  }

  // Scale phases CRUD
  function updatePhaseTrigger(index: number, value: string) {
    setScalePhases((prev) => prev.map((p, i) => (i === index ? { ...p, trigger: value } : p)));
  }
  function updatePhaseAction(phaseIndex: number, actionIndex: number, value: string) {
    setScalePhases((prev) =>
      prev.map((p, i) =>
        i === phaseIndex
          ? { ...p, actions: p.actions.map((a, j) => (j === actionIndex ? value : a)) }
          : p
      )
    );
  }
  function addPhaseAction(phaseIndex: number) {
    setScalePhases((prev) =>
      prev.map((p, i) =>
        i === phaseIndex ? { ...p, actions: [...p.actions, "New action"] } : p
      )
    );
  }
  function removePhaseAction(phaseIndex: number, actionIndex: number) {
    setScalePhases((prev) =>
      prev.map((p, i) =>
        i === phaseIndex
          ? { ...p, actions: p.actions.filter((_, j) => j !== actionIndex) }
          : p
      )
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Team</h1>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        All 1099 independent contractors &middot; No W-2 employees
      </p>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {([
          { id: "org" as const, label: "Org Chart" },
          { id: "roles" as const, label: "All Positions" },
          { id: "scale" as const, label: "Scale-Up Roadmap" },
          { id: "commission" as const, label: "Commission" },
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

      {/* Org Chart — static structural view */}
      {tab === "org" && (
        <div className="flex flex-col gap-2 items-center">
          <div className="rounded-lg p-3 text-[11px] leading-relaxed mb-2 w-full" style={{ backgroundColor: "#E8F1FB", color: "#1A4F8A", border: "0.5px solid #A8C8F0" }}>
            All 9 roles are 1099 independent contractors. Two combined roles scale to split positions. One fractional role.
          </div>
          {ORG_ROWS.map((row, ri) => (
            <div key={ri}>
              <div className="flex gap-2 justify-center flex-wrap">
                {row.map((card) => (
                  <div
                    key={card.num}
                    className="rounded-lg px-4 py-3 text-center min-w-[140px]"
                    style={{
                      backgroundColor: "var(--surface)",
                      border: "0.5px solid var(--border)",
                      borderTop: `${card.tier === "ceo" ? 3 : card.tier === "lead" ? 2 : 1}px solid ${TIER_COLORS[card.tier]}`,
                    }}
                  >
                    <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{card.num} — {card.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{card.rate}</div>
                    {card.tag && (
                      <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-sm mt-1.5" style={{
                        backgroundColor: card.tag === "Combined" ? "#FDF3E3" : "#EEEDFE",
                        color: card.tag === "Combined" ? "#92610A" : "#534AB7",
                        border: `0.5px solid ${card.tag === "Combined" ? "#E8C87A" : "#AFA9EC"}`,
                      }}>
                        {card.tag} role
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {ri < ORG_ROWS.length - 1 && (
                <div className="text-center text-sm py-1" style={{ color: "var(--muted)" }}>↓</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* All Positions — editable functions + KPIs */}
      {tab === "roles" && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] mb-1" style={{ color: "var(--muted)" }}>Click any function or KPI to edit. Use + to add, ✕ to remove.</p>
          {ROLES.map((r) => {
            const fns = roleFunctions[r.num] ?? r.functions;
            const kpis = roleKpis[r.num] ?? r.kpis;
            return (
              <details key={r.num} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
                <summary className="px-4 py-3 cursor-pointer flex justify-between items-center list-none">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--muted)" }}>
                      {r.isCombined ? "Combined role" : r.isFractional ? "Fractional" : "1099 Contractor"}
                    </div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                      Reports to: {r.reportsTo} &middot; Manages: {r.manages}
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>&#9660;</span>
                </summary>
                <div className="px-4 py-3" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
                  <div className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: "var(--muted)" }}>Daily Functions</div>
                  {fns.map((fn, i) => (
                    <div key={i} className="flex gap-2 text-[11px] py-0.5 leading-snug group items-center" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--muted)" }}>&middot;</span>
                      <span className="flex-1">
                        <EditField
                          value={fn}
                          onSave={(v) => updateFunction(r.num, i, v)}
                          className="text-[11px]"
                          style={{ color: "var(--text-secondary)" }}
                        />
                      </span>
                      <button
                        onClick={() => removeFunction(r.num, i)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity"
                        style={{ color: "var(--danger)" }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addFunction(r.num)}
                    className="mt-1.5 text-[10px] px-2 py-1 rounded-md"
                    style={{ color: "var(--accent)", backgroundColor: "var(--bg)", border: "0.5px dashed var(--border)" }}
                  >
                    + Add function
                  </button>

                  <div className="text-[10px] uppercase tracking-wider font-medium mb-2 mt-4" style={{ color: "var(--muted)" }}>KPIs</div>
                  {kpis.map((kpi, i) => (
                    <div key={i} className="flex gap-2 text-[11px] py-0.5 leading-snug group items-center" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--muted)" }}>&middot;</span>
                      <span className="flex-1">
                        <EditField
                          value={kpi}
                          onSave={(v) => updateKpi(r.num, i, v)}
                          className="text-[11px]"
                          style={{ color: "var(--text-secondary)" }}
                        />
                      </span>
                      <button
                        onClick={() => removeKpi(r.num, i)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity"
                        style={{ color: "var(--danger)" }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addKpi(r.num)}
                    className="mt-1.5 text-[10px] px-2 py-1 rounded-md"
                    style={{ color: "var(--accent)", backgroundColor: "var(--bg)", border: "0.5px dashed var(--border)" }}
                  >
                    + Add KPI
                  </button>

                  {r.isCombined && r.combinedNote && (
                    <div className="rounded-md p-2.5 mt-3" style={{ backgroundColor: "var(--bg)" }}>
                      <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>Split Trigger</div>
                      <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.combinedNote}</div>
                    </div>
                  )}
                  {r.isFractional && r.fractionalNote && (
                    <div className="rounded-md p-2.5 mt-3" style={{ backgroundColor: "var(--bg)" }}>
                      <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>Fractional Details</div>
                      <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.fractionalNote}</div>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* Scale-Up Roadmap — editable triggers + actions */}
      {tab === "scale" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg p-3 text-[11px] leading-relaxed" style={{ backgroundColor: "#FDF3E3", color: "#92610A", border: "0.5px solid #E8C87A" }}>
            The lean 9-contractor team scales in 3 documented phases. Each has a specific trigger — do not hire ahead of the trigger.
          </div>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Click any trigger or action to edit. Use + to add actions, ✕ to remove.</p>
          {scalePhases.map((ph, pi) => (
            <div key={ph.phase} className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)", borderLeft: `3px solid ${ph.color}` }}>
              <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: ph.color }}>{ph.phase} trigger</div>
              <div className="text-xs font-medium mb-3" style={{ color: "var(--text)" }}>
                <EditField
                  value={ph.trigger}
                  onSave={(v) => updatePhaseTrigger(pi, v)}
                  className="text-xs font-medium"
                  style={{ color: "var(--text)" }}
                />
              </div>
              {ph.actions.map((a, ai) => (
                <div key={ai} className="flex gap-2 text-[11px] py-0.5 group items-center" style={{ color: "var(--text-secondary)" }}>
                  <span>→</span>
                  <span className="flex-1">
                    <EditField
                      value={a}
                      onSave={(v) => updatePhaseAction(pi, ai, v)}
                      className="text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </span>
                  <button
                    onClick={() => removePhaseAction(pi, ai)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity"
                    style={{ color: "var(--danger)" }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addPhaseAction(pi)}
                className="mt-2 text-[10px] px-2 py-1 rounded-md"
                style={{ color: "var(--accent)", backgroundColor: "var(--bg)", border: "0.5px dashed var(--border)" }}
              >
                + Add action
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Commission — reference table, kept static */}
      {tab === "commission" && (
        <div>
          <div className="rounded-lg p-3 text-[11px] leading-relaxed mb-4" style={{ backgroundColor: "#EEEDFE", color: "#534AB7", border: "0.5px solid #AFA9EC" }}>
            Sales Closer earns 10% commission on the first month&apos;s payment of every deal closed. Structure documented in contractor agreement before the first call.
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid var(--border)" }}>
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg)" }}>
                  {["Offer Path", "First Payment", "Rate", "Commission", "On-call Bonus"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)", borderBottom: "0.5px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TABLE.map((row) => (
                  <tr key={row.path} style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text)" }}>{row.path}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text)" }}>{row.deal}</td>
                    <td className="px-3 py-2.5 font-medium" style={{ color: "var(--success)" }}>{row.rate}</td>
                    <td className="px-3 py-2.5 font-medium" style={{ color: "var(--success)" }}>{row.earned}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text)" }}>{row.bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] mt-2 italic" style={{ color: "var(--muted)" }}>
            Commission earned on first month&apos;s payment only — not on recurring monthly revenue.
          </div>
        </div>
      )}
    </div>
  );
}
