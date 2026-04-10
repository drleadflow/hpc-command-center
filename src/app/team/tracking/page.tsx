"use client";

import { useState } from "react";
import { useStore } from "@/lib/use-store";

interface TrackingEntry {
  role: string;
  submitted: boolean;
  time: string | null;
}

const DEFAULT_TRACKING: TrackingEntry[] = [
  { role: "CEO", submitted: true, time: "8:42am" },
  { role: "Operations Manager", submitted: true, time: "8:15am" },
  { role: "Marketing Lead", submitted: true, time: "9:01am" },
  { role: "Content Editor", submitted: true, time: "8:55am" },
  { role: "Appointment Setter", submitted: false, time: null },
  { role: "Sales Closer", submitted: true, time: "8:30am" },
  { role: "AI & Tech Specialist", submitted: true, time: "9:10am" },
  { role: "CSM / Lead Coach", submitted: true, time: "8:48am" },
  { role: "Bookkeeper / Finance", submitted: true, time: "9:22am" },
];

function EditableTime({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onChange(draft); }}
        onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onChange(draft); } if (e.key === "Escape") setEditing(false); }}
        className="text-[10px] px-1 rounded outline-none w-16 text-center"
        style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--success)" }}
      />
    );
  }
  return (
    <span
      className="text-[10px] cursor-pointer hover:opacity-70"
      style={{ color: "var(--success)" }}
      onClick={() => { setDraft(value ?? ""); setEditing(true); }}
      title="Click to edit time"
    >
      Submitted {value ?? "—"}
    </span>
  );
}

export default function TrackingPage() {
  const [tracking, setTracking] = useStore<TrackingEntry[]>("hpc_daily_tracking" as "hpc_daily_tracking", DEFAULT_TRACKING);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const submitted = tracking.filter((t) => t.submitted).length;
  const total = tracking.length;

  function toggleSubmitted(index: number) {
    setTracking((prev) =>
      prev.map((t, i) =>
        i === index
          ? { ...t, submitted: !t.submitted, time: !t.submitted ? new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase() : null }
          : t
      )
    );
  }

  function updateTime(index: number, time: string) {
    setTracking((prev) =>
      prev.map((t, i) => (i === index ? { ...t, time: time || null } : t))
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Daily Tracking</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        All contractors submit via GHL by 5pm CST daily &middot; {today} &middot; {submitted} / {total} submitted
      </p>

      {/* Compliance bar */}
      <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>Compliance</span>
          <span className="text-sm font-medium" style={{ color: submitted === total ? "var(--success)" : "var(--warning)" }}>
            {Math.round((submitted / total) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(submitted / total) * 100}%`,
              backgroundColor: submitted === total ? "var(--success)" : "var(--warning)",
            }}
          />
        </div>
      </div>

      {/* Roster */}
      <div className="flex flex-col gap-1">
        {tracking.map((t, i) => (
          <div
            key={t.role}
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: t.submitted ? "var(--success)" : "var(--danger)" }}
            />
            <span className="text-sm flex-1" style={{ color: "var(--text)" }}>{t.role}</span>
            {t.submitted ? (
              <EditableTime value={t.time} onChange={(v) => updateTime(i, v)} />
            ) : (
              <span className="text-[10px] font-medium" style={{ color: "var(--danger)" }}>Outstanding</span>
            )}
            <button
              onClick={() => toggleSubmitted(i)}
              className="text-[10px] px-2 py-1 rounded-md transition-all"
              style={{
                backgroundColor: t.submitted ? "var(--bg)" : "var(--success)",
                color: t.submitted ? "var(--muted)" : "white",
                border: t.submitted ? "0.5px solid var(--border)" : "none",
              }}
            >
              {t.submitted ? "Unmark" : "Mark Submitted"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
