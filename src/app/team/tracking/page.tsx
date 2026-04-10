"use client";

import { ROLES } from "@/lib/team-data";

const TRACKING_STATUS = [
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

export default function TrackingPage() {
  const submitted = TRACKING_STATUS.filter((t) => t.submitted).length;
  const total = TRACKING_STATUS.length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Daily Tracking</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        All contractors submit via GHL by 5pm CST daily &middot; Today: {submitted} / {total} submitted
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
        {TRACKING_STATUS.map((t) => (
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
              <span className="text-[10px]" style={{ color: "var(--success)" }}>Submitted {t.time}</span>
            ) : (
              <span className="text-[10px] font-medium" style={{ color: "var(--danger)" }}>Outstanding</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
