"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import { useStore } from "@/lib/use-store";
import type { HpcRole } from "@/lib/types";
import type { StoredTracking } from "@/lib/store";

const ROLE_TRACKING_FIELDS: Record<HpcRole, string[]> = {
  ceo: [], ops_manager: [],
  marketing_lead: ["Content pieces produced today (with titles)", "Ad or email tests in progress", "Webinar scorecard status", "A/B test log updated (Yes/No)"],
  content_editor: ["Assets completed today (with titles)", "Turnaround time on track (Yes/No)", "Brand standard check passed (Yes/No)"],
  appointment_setter: ["Triggers monitored and actioned", "Openers sent today (#)", "Replies received (#)", "Audits generated and delivered (#)", "Calls booked today (#)", "Reactivation touchpoints sent (#)"],
  sales_closer: ["Calls held today (#) and outcomes", "Deals closed today (path + practice type)", "Lost deals tagged with reason", "Lost deal Day 1 follow-up sent", "Commission log — notify Bookkeeper"],
  ai_tech_specialist: ["Active builds status (client + % complete)", "Anomalies detected and resolved", "Client walkthroughs completed", "Capacity status"],
  csm_lead_coach: ["Client check-ins or calls completed", "Milestones triggered and Looms sent", "Group Slack posts this week (#)", "Path A group call prep", "Satisfaction scores received"],
  bookkeeper: ["Invoices processed today", "Commission log entries updated", "P&L draft status"],
};

const ROLE_LABELS: Record<HpcRole, string> = {
  ceo: "CEO", ops_manager: "Operations Manager", marketing_lead: "Marketing Lead", content_editor: "Content Editor",
  appointment_setter: "Appointment Setter", sales_closer: "Sales Closer", ai_tech_specialist: "AI & Tech Specialist",
  csm_lead_coach: "CSM / Lead Coach", bookkeeper: "Bookkeeper / Finance",
};

const DEFAULT_PRIORITIES: Record<HpcRole, string[]> = {
  ceo: ["Review team dashboard and blockers", "Leadership sync prep"],
  ops_manager: ["Review daily tracking submissions", "Client delivery timeline check"],
  marketing_lead: ["Complete webinar scorecard — due by 6pm today.", "Finish copy for 2 Reels — deliver to Content Editor by noon.", "Deploy A/B test winner and update Notion log."],
  content_editor: ["Edit and export 2 Reels from Monday shoot — deliver by 11am.", "Produce 3 carousels: lead gen, chatbot demo, social proof.", "Upload finished assets to Canva — tagged before EOD."],
  appointment_setter: ["Submit daily tracking form — required before any other work.", "Generate and deliver 3 marketing audits to hot leads.", "Complete pre-call intel sheets for booked calls."],
  sales_closer: ["10am: Skyline PT — Path B close. Audit reviewed.", "1pm: Premier Wellness — Path C. Payment link queued.", "4pm: Dr. Chen Chiro — Path A conversion."],
  ai_tech_specialist: ["Coastal Chiro (Day 10): QA everything except Meta access.", "Summit Wellness (Day 5): chatbot config + activate sequences.", "Weekly anomaly check across all active sub-accounts."],
  csm_lead_coach: ["11am: Weekly Path A group coaching call.", "Send milestone Loom to Summit Wellness — 24hr window.", "2pm: Monthly optimization call — Peak Performance PT."],
  bookkeeper: ["Process 4 contractor bi-weekly invoices.", "Update commission log for yesterday's close — $300 entry.", "Draft monthly P&L by offer path — due by the 5th."],
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MyDayDashboard() {
  const { role, memberName } = useRole();
  const todayKey = new Date().toISOString().split("T")[0];
  const storeKey = `hpc_tracking_${role}_${todayKey}`;

  const [priorities, setPriorities] = useStore<string[]>(`hpc_priorities_${role}` as "hpc_priorities", DEFAULT_PRIORITIES[role] ?? []);
  const [savedTracking, setSavedTracking] = useStore<StoredTracking | null>(storeKey as "hpc_tracking", null);

  const [top3, setTop3] = useState(savedTracking?.top3 ?? ["", "", ""]);
  const [blocker, setBlocker] = useState(savedTracking?.blocker ?? "");
  const [flagReview, setFlagReview] = useState(savedTracking?.flagReview ?? false);
  const [trackingFields, setTrackingFields] = useState<Record<string, string>>(savedTracking?.roleFields ?? {});
  const [editingPriority, setEditingPriority] = useState<number | null>(null);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const roleFields = ROLE_TRACKING_FIELDS[role] ?? [];
  const displayName = memberName || ROLE_LABELS[role];
  const submitted = !!savedTracking;

  const handleSubmit = () => {
    const entry: StoredTracking = {
      id: Date.now().toString(), role, date: todayKey,
      top3, blocker, flagReview, roleFields: trackingFields,
      submittedAt: new Date().toISOString(),
    };
    setSavedTracking(entry);
  };

  const handleUnsubmit = () => {
    setSavedTracking(null);
  };

  const updatePriority = (idx: number, val: string) => {
    setPriorities((prev) => prev.map((p, i) => i === idx ? val : p));
  };
  const addPriority = () => {
    setPriorities((prev) => [...prev, "New priority — click to edit"]);
  };
  const removePriority = (idx: number) => {
    setPriorities((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="mb-6">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>{getGreeting()}, {displayName}</h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{ROLE_LABELS[role]} &middot; {today}</p>
      </div>

      {/* Priorities — editable */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Today&apos;s Priorities</h2>
        <div className="flex flex-col gap-2">
          {priorities.map((p, i) => (
            <div key={i} className="flex gap-3 text-sm leading-snug items-start" style={{ color: "var(--text-secondary)" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>{i + 1}</span>
              {editingPriority === i ? (
                <input
                  autoFocus
                  value={p}
                  onChange={(e) => updatePriority(i, e.target.value)}
                  onBlur={() => setEditingPriority(null)}
                  onKeyDown={(e) => { if (e.key === "Enter") setEditingPriority(null); }}
                  className="flex-1 outline-none rounded px-2 py-1 text-sm"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--accent)", color: "var(--text)" }}
                />
              ) : (
                <span className="flex-1 cursor-pointer" onClick={() => setEditingPriority(i)} title="Click to edit">{p}</span>
              )}
              <button onClick={() => removePriority(i)} className="text-[10px] opacity-30 hover:opacity-100 flex-shrink-0" style={{ color: "var(--danger)" }}>✕</button>
            </div>
          ))}
          <button onClick={addPriority} className="text-[10px] mt-1 opacity-50 hover:opacity-100" style={{ color: "var(--accent)" }}>+ Add priority</button>
        </div>
      </div>

      {/* Daily Tracking Form */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Daily Tracking</h2>
          {submitted && (
            <div className="flex gap-2 items-center">
              <span className="text-[10px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "var(--success-bg, #EAF3DE)", color: "var(--success)" }}>Submitted ✓</span>
              <button onClick={handleUnsubmit} className="text-[10px] underline" style={{ color: "var(--muted)" }}>Edit</button>
            </div>
          )}
        </div>

        {submitted ? (
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="mb-2"><span className="font-medium">Top 3:</span> {savedTracking.top3.filter(Boolean).join(" · ") || "—"}</div>
            <div className="mb-2"><span className="font-medium">Blocker:</span> {savedTracking.blocker || "None"}</div>
            <div><span className="font-medium">Flagged:</span> {savedTracking.flagReview ? "Yes" : "No"}</div>
            {Object.entries(savedTracking.roleFields).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="mt-1"><span className="font-medium">{k}:</span> {v}</div>
            ))}
            <div className="text-[10px] mt-2" style={{ color: "var(--muted)" }}>Submitted at {new Date(savedTracking.submittedAt).toLocaleTimeString()}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>Top 3 things completed today</label>
              {top3.map((val, i) => (
                <input key={i} type="text" value={val} onChange={(e) => { const u = [...top3]; u[i] = e.target.value; setTop3(u); }} placeholder={`${i + 1}. Be specific`} className="w-full rounded-lg px-3 py-2 text-sm mb-1.5 outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
              ))}
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>Blocker or support needed</label>
              <input type="text" value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder="None" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Flag for manager review?</label>
              <button onClick={() => setFlagReview(!flagReview)} className="px-3 py-1 rounded-md text-[11px]" style={{ backgroundColor: flagReview ? "var(--warning, #BA7517)" : "var(--bg)", color: flagReview ? "#fff" : "var(--muted)", border: flagReview ? "none" : "0.5px solid var(--border)" }}>
                {flagReview ? "Yes" : "No"}
              </button>
            </div>
            {roleFields.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2 mt-1" style={{ color: "var(--muted)" }}>Role-Specific</div>
                {roleFields.map((field) => (
                  <div key={field} className="mb-2">
                    <label className="text-[11px] block mb-1" style={{ color: "var(--text-secondary)" }}>{field}</label>
                    <input type="text" value={trackingFields[field] ?? ""} onChange={(e) => setTrackingFields({ ...trackingFields, [field]: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleSubmit} className="w-full py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--accent)" }}>Submit Daily Tracking</button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Notifications</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>No new notifications.</p>
      </div>
    </div>
  );
}
