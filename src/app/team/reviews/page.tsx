"use client";

import { useState } from "react";
import { REVIEW_CYCLES, ROLES } from "@/lib/team-data";
import { useStore } from "@/lib/use-store";

interface EditableReviewCycle {
  label: string;
  timing: string;
  description: string;
}

interface RoleReviewNote {
  roleNum: string;
  notes: string;
  nextDate: string;
}

const DEFAULT_REVIEW_CYCLES: EditableReviewCycle[] = REVIEW_CYCLES.map((r) => ({ ...r }));
const DEFAULT_REVIEW_NOTES: RoleReviewNote[] = ROLES.map((r) => ({
  roleNum: r.num,
  notes: "",
  nextDate: "",
}));

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

export default function ReviewsPage() {
  const [cycles, setCycles] = useStore<EditableReviewCycle[]>(
    "hpc_review_cycles" as "hpc_review_cycles",
    DEFAULT_REVIEW_CYCLES
  );
  const [notes, setNotes] = useStore<RoleReviewNote[]>(
    "hpc_review_notes" as "hpc_review_notes",
    DEFAULT_REVIEW_NOTES
  );

  function updateCycle(index: number, field: keyof EditableReviewCycle, value: string) {
    setCycles((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function updateNote(roleNum: string, field: keyof Omit<RoleReviewNote, "roleNum">, value: string) {
    setNotes((prev) => prev.map((n) => (n.roleNum === roleNum ? { ...n, [field]: value } : n)));
  }

  function getNoteForRole(roleNum: string): RoleReviewNote {
    return notes.find((n) => n.roleNum === roleNum) ?? { roleNum, notes: "", nextDate: "" };
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Performance Reviews</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Reviews follow the contractor relationship — not an employment relationship &middot; Click any field to edit
      </p>

      {/* Review Cycle Cards */}
      <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {cycles.map((r, i) => (
          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="text-[9px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--muted)" }}>
              <EditField
                value={r.label}
                onSave={(v) => updateCycle(i, "label", v)}
                className="text-[9px] uppercase tracking-wider font-medium"
                style={{ color: "var(--muted)" }}
              />
            </div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--text)" }}>
              <EditField
                value={r.timing}
                onSave={(v) => updateCycle(i, "timing", v)}
                className="text-xs font-medium"
                style={{ color: "var(--text)" }}
              />
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <EditField
                value={r.description}
                onSave={(v) => updateCycle(i, "description", v)}
                multiline
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Team KPI Targets + Review Notes */}
      <h2 className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>
        Team KPI Targets &amp; Review Notes
      </h2>
      <div className="flex flex-col gap-2">
        {ROLES.map((r) => {
          const note = getNoteForRole(r.num);
          return (
            <div key={r.num} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--text)" }}>{r.title}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {r.kpis.map((kpi, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: "var(--bg)", color: "var(--text-secondary)" }}>
                    {kpi}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Review Notes</div>
                  <div
                    className="rounded-md px-2 py-1.5 text-[11px]"
                    style={{ backgroundColor: "var(--bg)", minHeight: 32, color: "var(--text-secondary)" }}
                  >
                    <EditField
                      value={note.notes}
                      onSave={(v) => updateNote(r.num, "notes", v)}
                      multiline
                      placeholder="Add review notes…"
                      className="text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                </div>
                <div style={{ width: 120 }}>
                  <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Next Review Date</div>
                  <div
                    className="rounded-md px-2 py-1.5 text-[11px]"
                    style={{ backgroundColor: "var(--bg)", minHeight: 32, color: "var(--text-secondary)" }}
                  >
                    <EditField
                      value={note.nextDate}
                      onSave={(v) => updateNote(r.num, "nextDate", v)}
                      placeholder="e.g. May 15"
                      className="text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
