"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/use-store";
import { ROLES } from "@/lib/team-data";
import { useRole } from "@/lib/role-context";

interface MrrData {
  total: number;
  pathA: number;
  pathACount: number;
  pathB: number;
  pathBCount: number;
  pathC: number;
  pathCCount: number;
  newMrr: number;
  churnedMrr: number;
}

interface MonthlyEntry {
  id: string;
  month: string;
  mrr: number;
}

const DEFAULT_MRR: MrrData = {
  total: 24500,
  pathA: 2991,
  pathACount: 3,
  pathB: 12000,
  pathBCount: 4,
  pathC: 10000,
  pathCCount: 2,
  newMrr: 3000,
  churnedMrr: 0,
};

interface EarningsYtd {
  total: number;
  target: number;
  lastYear: number;
}

interface BonusTier {
  label: string;
  threshold: number;
  closesNeeded: number;
  closesComplete: number;
  unlocked: boolean;
}

const DEFAULT_EARNINGS_YTD: EarningsYtd = {
  total: 38400,
  target: 96000,
  lastYear: 72000,
};

const DEFAULT_BONUS_TIERS: BonusTier[] = [
  { label: "Tier 2", threshold: 5000, closesNeeded: 0, closesComplete: 0, unlocked: true },
  { label: "Tier 3", threshold: 10000, closesNeeded: 8, closesComplete: 5, unlocked: false },
  { label: "Tier 4", threshold: 18000, closesNeeded: 15, closesComplete: 5, unlocked: false },
];

const DEFAULT_HISTORY: MonthlyEntry[] = [
  { id: "jan", month: "Jan", mrr: 15500 },
  { id: "feb", month: "Feb", mrr: 18500 },
  { id: "mar", month: "Mar", mrr: 21500 },
  { id: "apr", month: "Apr", mrr: 24500 },
];

function EditableNumber({
  value,
  onChange,
  prefix = "",
  className = "",
  style = {},
}: {
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(draft.replace(/[^0-9.]/g, ""));
          if (!isNaN(n)) onChange(n);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            const n = parseFloat(draft.replace(/[^0-9.]/g, ""));
            if (!isNaN(n)) onChange(n);
            setEditing(false);
          }
        }}
        className={className}
        style={{ ...style, background: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 4, outline: "none", minWidth: 80 }}
      />
    );
  }
  return (
    <span
      className={className}
      style={{ ...style, cursor: "pointer", borderBottom: "1px dashed var(--border)" }}
      title="Click to edit"
      onClick={() => { setDraft(String(value)); setEditing(true); }}
    >
      {prefix}{value.toLocaleString()}
    </span>
  );
}

export default function MoneyPage() {
  const { role } = useRole();
  const [mrr, setMrr] = useStore<MrrData>("hpc_mrr_data" as "hpc_mrr_data", DEFAULT_MRR);
  const [history, setHistory] = useStore<MonthlyEntry[]>("hpc_mrr_history" as "hpc_mrr_history", DEFAULT_HISTORY);
  const [earningsYtd, setEarningsYtd] = useStore<EarningsYtd>("hpc_earnings_ytd", DEFAULT_EARNINGS_YTD);
  const [bonusTiers, setBonusTiers] = useStore<BonusTier[]>("hpc_bonus_tiers", DEFAULT_BONUS_TIERS);

  const [newMonth, setNewMonth] = useState("");
  const [newMrrVal, setNewMrrVal] = useState("");

  const computedTotal = mrr.pathA + mrr.pathB + mrr.pathC;
  const maxMrr = Math.max(...history.map((m) => m.mrr), 1);
  const latestMonth = history[history.length - 1]?.month ?? "";

  function updateMrr(field: keyof MrrData, val: number) {
    setMrr((prev) => {
      const next = { ...prev, [field]: val };
      next.total = next.pathA + next.pathB + next.pathC;
      return next;
    });
  }

  function addMonth() {
    const v = parseFloat(newMrrVal.replace(/[^0-9.]/g, ""));
    if (!newMonth.trim() || isNaN(v)) return;
    setHistory((prev) => [...prev, { id: `${Date.now()}`, month: newMonth.trim(), mrr: v }]);
    setNewMonth("");
    setNewMrrVal("");
  }

  function removeMonth(id: string) {
    setHistory((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMonthMrr(id: string, val: number) {
    setHistory((prev) => prev.map((m) => m.id === id ? { ...m, mrr: val } : m));
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Revenue</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        MRR overview &middot; Revenue by offer path &middot; <span style={{ color: "var(--accent)" }}>click values to edit</span>
      </p>

      {/* Quick Links */}
      <div className="flex gap-2 mb-5">
        <Link href="/money/commission" className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
          Commission Log
        </Link>
        <Link href="/money/invoices" className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
          Invoices
        </Link>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Total MRR</div>
          <div className="text-lg font-medium" style={{ color: "var(--text)" }}>${computedTotal.toLocaleString()}</div>
        </div>
        <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>New MRR</div>
          <EditableNumber
            value={mrr.newMrr}
            onChange={(v) => updateMrr("newMrr", v)}
            prefix="+$"
            className="text-lg font-medium"
            style={{ color: "var(--success)" }}
          />
        </div>
        <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Churned MRR</div>
          <EditableNumber
            value={mrr.churnedMrr}
            onChange={(v) => updateMrr("churnedMrr", v)}
            prefix="$"
            className="text-lg font-medium"
            style={{ color: mrr.churnedMrr > 0 ? "var(--danger)" : "var(--success)" }}
          />
        </div>
      </div>

      {/* Revenue by Path */}
      <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>Revenue by Offer Path</div>
        {[
          { label: "Path A — $997/mo", valueKey: "pathA" as keyof MrrData, countKey: "pathACount" as keyof MrrData, value: mrr.pathA, count: mrr.pathACount, color: "#639922" },
          { label: "Path B — $3K/mo", valueKey: "pathB" as keyof MrrData, countKey: "pathBCount" as keyof MrrData, value: mrr.pathB, count: mrr.pathBCount, color: "#2D7DD2" },
          { label: "Path C — $5K/mo", valueKey: "pathC" as keyof MrrData, countKey: "pathCCount" as keyof MrrData, value: mrr.pathC, count: mrr.pathCCount, color: "#C4860A" },
        ].map((p) => (
          <div key={p.label} className="flex items-center gap-3 mb-3">
            <div className="w-36 flex-shrink-0">
              <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{p.label}</div>
              <div className="text-[10px] flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <EditableNumber
                  value={p.count}
                  onChange={(v) => updateMrr(p.countKey, Math.round(v))}
                  style={{ color: "var(--muted)", fontSize: 10 }}
                />
                <span> clients</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-5 rounded-md flex items-center px-2" style={{ width: `${Math.max((p.value / (computedTotal || 1)) * 100, 15)}%`, backgroundColor: `${p.color}20`, border: `0.5px solid ${p.color}40` }}>
                <EditableNumber
                  value={p.value}
                  onChange={(v) => updateMrr(p.valueKey, v)}
                  prefix="$"
                  style={{ color: p.color, fontSize: 10, fontWeight: 500 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MRR Trend */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>MRR Trend</div>
        <div className="flex items-end gap-3 h-32 mb-3">
          {history.map((m) => (
            <div key={m.id} className="flex-1 flex flex-col items-center gap-1 group relative">
              <span className="text-[10px] font-medium" style={{ color: "var(--text)" }}>
                <EditableNumber
                  value={m.mrr}
                  onChange={(v) => updateMonthMrr(m.id, v)}
                  style={{ color: "var(--text)", fontSize: 10, fontWeight: 500 }}
                />
              </span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${(m.mrr / maxMrr) * 100}%`,
                  backgroundColor: "var(--accent)",
                  opacity: m.month === latestMonth ? 1 : 0.4,
                  minHeight: 8,
                }}
              />
              <span className="text-[9px]" style={{ color: "var(--muted)" }}>{m.month}</span>
              <button
                onClick={() => removeMonth(m.id)}
                className="absolute -top-2 -right-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--danger)" }}
                title="Remove month"
              >✕</button>
            </div>
          ))}
        </div>

        {/* Add month */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: "0.5px solid var(--border)" }}>
          <input
            placeholder="Month (e.g. May)"
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            className="text-[11px] rounded px-2 py-1 flex-1"
            style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
          />
          <input
            placeholder="MRR (e.g. 27000)"
            value={newMrrVal}
            onChange={(e) => setNewMrrVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addMonth(); }}
            className="text-[11px] rounded px-2 py-1 flex-1"
            style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
          />
          <button
            onClick={addMonth}
            className="text-[11px] px-3 py-1 rounded"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Earnings YTD ─────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 mt-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>Earnings YTD</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-[10px] mb-0.5" style={{ color: "var(--muted)" }}>Total YTD</div>
            <EditableNumber
              value={earningsYtd.total}
              onChange={(v) => setEarningsYtd((prev) => ({ ...prev, total: v }))}
              prefix="$"
              className="text-xl font-semibold"
              style={{ color: "var(--text)" }}
            />
          </div>
          <div>
            <div className="text-[10px] mb-0.5" style={{ color: "var(--muted)" }}>Annual Target</div>
            <EditableNumber
              value={earningsYtd.target}
              onChange={(v) => setEarningsYtd((prev) => ({ ...prev, target: v }))}
              prefix="$"
              className="text-xl font-semibold"
              style={{ color: "var(--text)" }}
            />
          </div>
        </div>

        {/* Pace bar */}
        {(() => {
          const pct = Math.min(Math.round((earningsYtd.total / (earningsYtd.target || 1)) * 100), 100);
          const projected = Math.round((earningsYtd.total / (new Date().getMonth() + 1)) * 12);
          const vsLastYear = earningsYtd.lastYear > 0
            ? Math.round(((earningsYtd.total - earningsYtd.lastYear * ((new Date().getMonth() + 1) / 12)) / (earningsYtd.lastYear * ((new Date().getMonth() + 1) / 12))) * 100)
            : 0;
          return (
            <>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>Pace vs target</span>
                <span className="text-[11px] font-medium" style={{ color: pct >= 100 ? "var(--success)" : "var(--accent)" }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full mb-3" style={{ backgroundColor: "var(--bg)" }}>
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }} />
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>Projected EOY</div>
                  <div className="text-[12px] font-medium" style={{ color: "var(--text)" }}>${projected.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>vs Last Year</div>
                  <div className="text-[12px] font-medium" style={{ color: vsLastYear >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {vsLastYear >= 0 ? "+" : ""}{vsLastYear}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>Last Year (edit)</div>
                  <EditableNumber
                    value={earningsYtd.lastYear}
                    onChange={(v) => setEarningsYtd((prev) => ({ ...prev, lastYear: v }))}
                    prefix="$"
                    style={{ color: "var(--text)", fontSize: 12, fontWeight: 500 }}
                  />
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Bonus Pacing ─────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 mt-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>Bonus Pacing</div>
        <div className="space-y-3">
          {bonusTiers.map((tier, idx) => {
            const progress = tier.closesNeeded > 0
              ? Math.min(Math.round((tier.closesComplete / tier.closesNeeded) * 100), 100)
              : 100;
            return (
              <div key={tier.label} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{tier.label}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: tier.unlocked ? "#22c55e20" : "var(--border)",
                        color: tier.unlocked ? "#22c55e" : "var(--muted)",
                      }}
                    >
                      {tier.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <EditableNumber
                    value={tier.threshold}
                    onChange={(v) => setBonusTiers((prev) => prev.map((t, i) => i === idx ? { ...t, threshold: v } : t))}
                    prefix="$"
                    style={{ color: "var(--accent)", fontSize: 11, fontWeight: 600 }}
                  />
                </div>
                {tier.closesNeeded > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                        Closes: {tier.closesComplete} / {tier.closesNeeded}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: progress >= 100 ? "#22c55e" : "var(--accent)",
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pay Band Visibility ───────────────────────────────────────── */}
      <div className="rounded-xl p-4 mt-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>Pay Band Visibility</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                {["Role", "Rate Type", "Range", "Equity"].map((h) => (
                  <th key={h} className="text-left pb-2 pr-3 font-medium text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => {
                const isCurrent = r.hpcRole === role;
                return (
                  <tr
                    key={r.hpcRole}
                    style={{
                      borderBottom: "0.5px solid var(--border)",
                      backgroundColor: isCurrent ? "var(--accent-bg, color-mix(in srgb, var(--accent) 10%, transparent))" : "transparent",
                    }}
                  >
                    <td className="py-2 pr-3 font-medium" style={{ color: isCurrent ? "var(--accent)" : "var(--text)" }}>
                      {r.title.replace(/\s*\(.*?\)\s*/g, "").trim()}
                      {isCurrent && <span className="ml-1 text-[9px] opacity-70">(you)</span>}
                    </td>
                    <td className="py-2 pr-3" style={{ color: "var(--text)" }}>{r.rateType}</td>
                    <td className="py-2 pr-3" style={{ color: "var(--muted)" }}>
                      {r.rateType.includes("commission") ? "Base + %"
                        : r.rateType.includes("Equity") ? "—"
                        : r.rateType}
                    </td>
                    <td className="py-2" style={{ color: r.rateType.toLowerCase().includes("equity") ? "#22c55e" : "var(--muted)" }}>
                      {r.rateType.toLowerCase().includes("equity") ? "Yes" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
