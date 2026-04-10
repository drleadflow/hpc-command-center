"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import type { HpcRole } from "@/lib/types";

// ── Role-specific tracking fields ───────────────────────────────────
const ROLE_TRACKING_FIELDS: Record<HpcRole, string[]> = {
  ceo: [],
  ops_manager: [],
  marketing_lead: [
    "Content pieces produced today (with titles)",
    "Ad or email tests in progress",
    "Webinar scorecard status (webinar days only)",
    "A/B test log updated (Yes/No)",
  ],
  content_editor: [
    "Assets completed today (with titles)",
    "Turnaround time on track (Yes/No)",
    "Brand standard check passed (Yes/No)",
  ],
  appointment_setter: [
    "Triggers monitored and actioned",
    "Openers sent today (#)",
    "Replies received (#)",
    "Audits generated and delivered (#)",
    "Calls booked today (#)",
    "Reactivation touchpoints sent (#)",
  ],
  sales_closer: [
    "Calls held today (#) and outcomes",
    "Deals closed today (path + practice type)",
    "Lost deals tagged with reason",
    "Lost deal Day 1 follow-up sent (if applicable)",
    "Commission log — notify Bookkeeper of close",
  ],
  ai_tech_specialist: [
    "Active builds status (client name + % complete)",
    "Anomalies detected and resolved",
    "Client walkthroughs completed",
    "Capacity status (on track / approaching limit / flag needed)",
  ],
  csm_lead_coach: [
    "Client check-ins or calls completed today",
    "Milestones triggered and Looms sent",
    "Group Slack posts this week (#)",
    "Path A group call prep (call day only)",
    "Satisfaction scores received and actions taken",
  ],
  bookkeeper: [
    "Invoices processed today",
    "Commission log entries updated",
    "P&L draft status",
  ],
};

const ROLE_LABELS: Record<HpcRole, string> = {
  ceo: "CEO",
  ops_manager: "Operations Manager",
  marketing_lead: "Marketing Lead",
  content_editor: "Content Editor",
  appointment_setter: "Appointment Setter",
  sales_closer: "Sales Closer",
  ai_tech_specialist: "AI & Tech Specialist",
  csm_lead_coach: "CSM / Lead Coach",
  bookkeeper: "Bookkeeper / Finance",
};

// Placeholder priorities per role (would come from Supabase in production)
const ROLE_PRIORITIES: Record<HpcRole, string[]> = {
  ceo: ["Review team dashboard and blockers", "Leadership sync prep"],
  ops_manager: ["Review daily tracking submissions", "Client delivery timeline check"],
  marketing_lead: [
    "Complete webinar scorecard — due by 6pm today.",
    "Finish copy for 2 Reels — deliver to Content Editor by noon.",
    "Deploy A/B test winner and update Notion log.",
  ],
  content_editor: [
    "Edit and export 2 Reels from Monday shoot — deliver by 11am.",
    "Produce 3 carousels: lead gen, chatbot demo, social proof.",
    "Upload finished assets to Canva — tagged before EOD.",
  ],
  appointment_setter: [
    "Submit daily tracking form — required before any other work.",
    "Generate and deliver 3 marketing audits to hot leads.",
    "Complete pre-call intel sheets for booked calls.",
  ],
  sales_closer: [
    "10am: Skyline PT — Path B close. Audit reviewed.",
    "1pm: Premier Wellness — Path C. Payment link queued.",
    "4pm: Dr. Chen Chiro — Path A conversion.",
  ],
  ai_tech_specialist: [
    "Coastal Chiro (Day 10): QA everything except Meta access.",
    "Summit Wellness (Day 5): chatbot config + activate sequences.",
    "Weekly anomaly check across all active sub-accounts.",
  ],
  csm_lead_coach: [
    "11am: Weekly Path A group coaching call.",
    "Send milestone Loom to Summit Wellness — 24hr window.",
    "2pm: Monthly optimization call — Peak Performance PT.",
  ],
  bookkeeper: [
    "Process 4 contractor bi-weekly invoices.",
    "Update commission log for yesterday's close — $300 entry.",
    "Draft monthly P&L by offer path — due by the 5th.",
  ],
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MyDayDashboard() {
  const { role, memberName } = useRole();
  const [trackingFields, setTrackingFields] = useState<Record<string, string>>({});
  const [top3, setTop3] = useState(["", "", ""]);
  const [blocker, setBlocker] = useState("");
  const [flagReview, setFlagReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const priorities = ROLE_PRIORITIES[role] ?? [];
  const roleFields = ROLE_TRACKING_FIELDS[role] ?? [];
  const displayName = memberName || ROLE_LABELS[role];

  const handleSubmit = () => {
    // In production: POST to /api/tracking with role-specific fields
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {ROLE_LABELS[role]} &middot; {today}
        </p>
      </div>

      {/* Today's Priorities */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Today&apos;s Priorities
        </h2>
        <div className="flex flex-col gap-2">
          {priorities.map((p, i) => (
            <div key={i} className="flex gap-3 text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}
              >
                {i + 1}
              </span>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tracking Form */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Daily Tracking
          </h2>
          {submitted && (
            <span className="text-[10px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "var(--success-bg, #EAF3DE)", color: "var(--success)" }}>
              Submitted ✓
            </span>
          )}
        </div>

        {submitted ? (
          <p className="text-sm" style={{ color: "var(--success)" }}>
            Tracking submitted for today. You&apos;re all set.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Universal: Top 3 completed */}
            <div>
              <label className="text-[11px] font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>
                Top 3 things completed today
              </label>
              {top3.map((val, i) => (
                <input
                  key={i}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const updated = [...top3];
                    updated[i] = e.target.value;
                    setTop3(updated);
                  }}
                  placeholder={`${i + 1}. Be specific, not vague`}
                  className="w-full rounded-lg px-3 py-2 text-sm mb-1.5 outline-none"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "0.5px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
              ))}
            </div>

            {/* Universal: Blocker */}
            <div>
              <label className="text-[11px] font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>
                Blocker or support needed
              </label>
              <input
                type="text"
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                placeholder="None"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg)",
                  border: "0.5px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>

            {/* Universal: Flag for review */}
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                Flag for manager review?
              </label>
              <button
                onClick={() => setFlagReview(!flagReview)}
                className="px-3 py-1 rounded-md text-[11px] transition-all"
                style={{
                  backgroundColor: flagReview ? "var(--warning, #BA7517)" : "var(--bg)",
                  color: flagReview ? "#fff" : "var(--muted)",
                  border: flagReview ? "none" : "0.5px solid var(--border)",
                }}
              >
                {flagReview ? "Yes" : "No"}
              </button>
            </div>

            {/* Role-specific fields */}
            {roleFields.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2 mt-1" style={{ color: "var(--muted)" }}>
                  Role-Specific
                </div>
                {roleFields.map((field) => (
                  <div key={field} className="mb-2">
                    <label className="text-[11px] block mb-1" style={{ color: "var(--text-secondary)" }}>
                      {field}
                    </label>
                    <input
                      type="text"
                      value={trackingFields[field] ?? ""}
                      onChange={(e) => setTrackingFields({ ...trackingFields, [field]: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--bg)",
                        border: "0.5px solid var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Submit Daily Tracking
            </button>
          </div>
        )}
      </div>

      {/* Notifications placeholder */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
      >
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          Notifications
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No new notifications.
        </p>
      </div>
    </div>
  );
}
