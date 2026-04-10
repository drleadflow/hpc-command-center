"use client";

interface CoachingMember {
  name: string;
  practiceType: string;
  joinDate: string;
  daysSinceJoin: number;
  status: "active" | "at-risk" | "milestone";
  lastCheckIn: string;
  note: string;
}

const MEMBERS: CoachingMember[] = [
  { name: "Dr. Chen", practiceType: "Chiropractic", joinDate: "2026-03-25", daysSinceJoin: 16, status: "active", lastCheckIn: "Apr 8", note: "Attending weekly calls. Implementing Module 2." },
  { name: "Harmony Medspa", practiceType: "Medspa", joinDate: "2026-03-10", daysSinceJoin: 31, status: "milestone", lastCheckIn: "Apr 7", note: "Day 30 check-in due. First lead captured this week." },
  { name: "Mindful Psych", practiceType: "Psychiatry", joinDate: "2026-02-20", daysSinceJoin: 49, status: "active", lastCheckIn: "Apr 9", note: "Highly engaged. Completed Module 4. Potential upsell to Path B." },
];

const STATUS_COLORS = { active: "var(--success)", "at-risk": "var(--danger)", milestone: "var(--warning)" };
const STATUS_LABELS = { active: "Active", "at-risk": "At Risk", milestone: "Milestone Due" };

export default function CoachingPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Path A Coaching</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Health Pro CEO Skool &middot; {MEMBERS.length} active members &middot; Weekly group call
      </p>

      {/* Next Call */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#E8F1FB", border: "0.5px solid #A8C8F0" }}>
        <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "#1A4F8A" }}>Next Group Call</div>
        <div className="text-sm font-medium" style={{ color: "#1A4F8A" }}>Tuesday 11:00 AM CST — Reading Your First 30-Day Results</div>
      </div>

      {/* Members */}
      <div className="flex flex-col gap-2">
        {MEMBERS.map((m) => (
          <div key={m.name} className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{m.name}</div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>{m.practiceType} &middot; Day {m.daysSinceJoin} &middot; Last check-in: {m.lastCheckIn}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-sm font-medium" style={{ backgroundColor: `${STATUS_COLORS[m.status]}18`, color: STATUS_COLORS[m.status] }}>
                {STATUS_LABELS[m.status]}
              </span>
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{m.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
