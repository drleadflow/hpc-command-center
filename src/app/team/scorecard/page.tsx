"use client";

import { useState } from "react";
import { ROLES } from "@/lib/team-data";
import { useStore } from "@/lib/use-store";

type StatusType = "ok" | "warn" | "bad";

interface KpiCell {
  value: string;
  status: StatusType;
}

type ScorecardData = Record<string, KpiCell[]>;

const DEFAULT_SCORECARD: ScorecardData = {
  "01": [{ value: "$24,500", status: "warn" }, { value: "100%", status: "ok" }, { value: "28%", status: "ok" }, { value: "$24.5K", status: "warn" }, { value: "38%", status: "warn" }],
  "02": [{ value: "1/2", status: "warn" }, { value: "89%", status: "bad" }, { value: "0", status: "ok" }, { value: "N/A", status: "ok" }, { value: "85%", status: "warn" }],
  "03": [{ value: "38%", status: "warn" }, { value: "$8.40", status: "ok" }, { value: "41%", status: "ok" }, { value: "9%", status: "ok" }, { value: "Yes", status: "ok" }],
  "04": [{ value: "4/6", status: "warn" }, { value: "On track", status: "ok" }, { value: "0", status: "ok" }, { value: "On schedule", status: "ok" }],
  "05": [{ value: "Pending", status: "bad" }, { value: "33%", status: "ok" }, { value: "72%", status: "ok" }, { value: "35%", status: "ok" }, { value: "100%", status: "ok" }],
  "06": [{ value: "33%", status: "ok" }, { value: "25%", status: "ok" }, { value: "20%", status: "ok" }, { value: "75%", status: "ok" }, { value: "100%", status: "ok" }, { value: "100%", status: "ok" }],
  "07": [{ value: "1/2", status: "bad" }, { value: "100%", status: "ok" }, { value: "Done", status: "ok" }, { value: "Yes", status: "ok" }],
  "08": [{ value: "60%+", status: "ok" }, { value: "72%", status: "ok" }, { value: "78%", status: "ok" }, { value: "8.7", status: "ok" }, { value: "1 pending", status: "warn" }, { value: "Yes", status: "ok" }],
  "09": [{ value: "4 in process", status: "ok" }, { value: "18hrs", status: "warn" }, { value: "In progress", status: "ok" }, { value: "N/A", status: "ok" }, { value: "0", status: "ok" }],
};

const STATUS_COLORS: Record<StatusType, string> = { ok: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };
const STATUS_CYCLE: StatusType[] = ["ok", "warn", "bad"];

function EditableKpiCell({
  cell,
  label,
  onChangeValue,
  onCycleStatus,
}: {
  cell: KpiCell;
  label: string;
  onChangeValue: (v: string) => void;
  onCycleStatus: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cell.value);

  return (
    <div className="rounded-md px-2.5 py-2" style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-[9px] leading-tight mb-1" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="flex items-center gap-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); onChangeValue(draft); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setEditing(false); onChangeValue(draft); }
              if (e.key === "Escape") setEditing(false);
            }}
            className="text-sm font-medium w-full outline-none bg-transparent"
            style={{ color: STATUS_COLORS[cell.status] }}
          />
        ) : (
          <span
            className="text-sm font-medium cursor-pointer hover:opacity-70 flex-1"
            style={{ color: STATUS_COLORS[cell.status] }}
            onClick={() => { setDraft(cell.value); setEditing(true); }}
            title="Click to edit value"
          >
            {cell.value}
          </span>
        )}
        <button
          onClick={onCycleStatus}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: STATUS_COLORS[cell.status] }}
          title={`Status: ${cell.status} — click to cycle`}
        />
      </div>
    </div>
  );
}

export default function ScorecardPage() {
  const [data, setData] = useStore<ScorecardData>("hpc_scorecard_data" as "hpc_scorecard_data", DEFAULT_SCORECARD);

  function updateValue(roleNum: string, kpiIndex: number, value: string) {
    setData((prev) => ({
      ...prev,
      [roleNum]: (prev[roleNum] ?? []).map((cell, i) =>
        i === kpiIndex ? { ...cell, value } : cell
      ),
    }));
  }

  function cycleStatus(roleNum: string, kpiIndex: number) {
    setData((prev) => {
      const cells = prev[roleNum] ?? [];
      const current = cells[kpiIndex];
      if (!current) return prev;
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current.status) + 1) % STATUS_CYCLE.length];
      return {
        ...prev,
        [roleNum]: cells.map((cell, i) =>
          i === kpiIndex ? { ...cell, status: nextStatus } : cell
        ),
      };
    });
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Team Scorecard</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Weekly performance snapshot &middot; Click a value to edit &middot; Click the dot to cycle status (green / yellow / red)
      </p>

      <div className="flex flex-col gap-3">
        {ROLES.map((r) => {
          const cells = data[r.num] ?? r.kpis.map(() => ({ value: "—", status: "ok" as StatusType }));
          return (
            <div key={r.num} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="px-4 py-2.5" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{r.title}</div>
              </div>
              <div className="px-4 py-3">
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
                  {r.kpis.map((kpi, i) => (
                    <EditableKpiCell
                      key={i}
                      cell={cells[i] ?? { value: "—", status: "ok" }}
                      label={kpi}
                      onChangeValue={(v) => updateValue(r.num, i, v)}
                      onCycleStatus={() => cycleStatus(r.num, i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
