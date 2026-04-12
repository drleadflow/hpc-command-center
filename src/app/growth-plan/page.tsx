"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import { useStore } from "@/lib/use-store";
import type { HpcRole } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────

type OnboardingStatus = "completed" | "in-progress" | "locked";

interface OnboardingStep {
  id: string;
  label: string;
  status: OnboardingStatus;
}

interface CareerRung {
  title: string;
  comp: string;
  requirements: string[];
}

interface SkillRow {
  id: string;
  label: string;
  selfRating: number;   // 0–5
  verifiedRating: number; // 0–5
}

interface OneOnOneAgendaItem {
  id: string;
  text: string;
  checked: boolean;
}

interface OneOnOneData {
  nextDate: string;
  nextTime: string;
  agenda: OneOnOneAgendaItem[];
  lastItems: OneOnOneAgendaItem[];
}

// ── Default data ─────────────────────────────────────────────────────

const DEFAULT_ONBOARDING: OnboardingStep[] = [
  { id: "ob1", label: "Welcome video + intro", status: "completed" },
  { id: "ob2", label: "Company values & policies", status: "completed" },
  { id: "ob3", label: "GHL & dialer setup", status: "completed" },
  { id: "ob4", label: "Tool access confirmed", status: "completed" },
  { id: "ob5", label: "Shadow a team member", status: "in-progress" },
  { id: "ob6", label: "Complete first task independently", status: "locked" },
  { id: "ob7", label: "30-day review", status: "locked" },
];

const QUICK_LINKS = [
  { emoji: "📞", label: "Dialer", href: "https://app.gohighlevel.com" },
  { emoji: "📋", label: "GHL", href: "https://app.gohighlevel.com" },
  { emoji: "🎥", label: "Loom", href: "https://www.loom.com" },
  { emoji: "📚", label: "SOPs", href: "/playbooks" },
  { emoji: "💬", label: "Slack", href: "https://slack.com" },
  { emoji: "📅", label: "Calendar", href: "/calendar" },
  { emoji: "🤖", label: "AI Advisor", href: "/advisor" },
  { emoji: "📊", label: "Reports", href: "/numbers" },
  { emoji: "🆘", label: "Help Desk", href: "/settings" },
];

// Career ladder definitions per department
const CAREER_LADDERS: Record<string, CareerRung[]> = {
  sales: [
    {
      title: "Junior Setter",
      comp: "$800–$1,200/mo base + show bonuses",
      requirements: ["Completes onboarding", "20+ dials/day", "1+ appointments/week"],
    },
    {
      title: "Senior Setter",
      comp: "$1,200–$1,600/mo base + bonuses",
      requirements: ["90%+ show rate", "5+ sets/week", "GHL mastery"],
    },
    {
      title: "Lead Setter",
      comp: "$1,600–$2,000/mo + team bonus",
      requirements: ["Trains new setters", "10+ sets/week", "Quality scores 9+"],
    },
    {
      title: "Junior Closer",
      comp: "Base + 8% commission",
      requirements: ["25%+ close rate", "Full discovery mastery", "Path A certified"],
    },
    {
      title: "Senior Closer",
      comp: "Base + 10% commission",
      requirements: ["35%+ close rate", "All paths certified", "50+ closes total"],
    },
    {
      title: "Sales Lead",
      comp: "Base + 10% + 2% team override",
      requirements: ["Manages closer team", "Pipeline ownership", "Weekly reporting"],
    },
  ],
  marketing: [
    {
      title: "Content Editor",
      comp: "Per asset / retainer",
      requirements: ["Video editing proficiency", "Brand standards passed", "3+ assets/week"],
    },
    {
      title: "Senior Content Editor",
      comp: "Retainer + performance bonus",
      requirements: ["6+ assets/week", "Thumbnail A/B testing", "Script collaboration"],
    },
    {
      title: "Marketing Lead",
      comp: "Retainer + KPI bonuses",
      requirements: ["Campaign strategy", "Ad management", "Team coordination"],
    },
    {
      title: "Marketing Director",
      comp: "Retainer + equity consideration",
      requirements: ["Full funnel ownership", "Budget management", "Reporting to CEO"],
    },
  ],
  tech: [
    {
      title: "AI & Tech Specialist",
      comp: "Retainer",
      requirements: ["GHL sub-account builds", "Automation deployment", "API integrations"],
    },
    {
      title: "Senior Tech Specialist",
      comp: "Higher retainer",
      requirements: ["Multi-client simultaneous builds", "Custom integrations", "QA ownership"],
    },
    {
      title: "Tech Lead",
      comp: "Retainer + bonus",
      requirements: ["Systems architecture", "Team training", "Innovation roadmap"],
    },
  ],
  "client-success": [
    {
      title: "CSM / Lead Coach",
      comp: "Retainer",
      requirements: ["Client onboarding", "Group coaching calls", "NPS 8+"],
    },
    {
      title: "Senior CSM",
      comp: "Higher retainer + retention bonus",
      requirements: ["90%+ client retention", "Upsell facilitation", "Case study production"],
    },
    {
      title: "Client Success Lead",
      comp: "Retainer + performance bonus",
      requirements: ["Team lead", "Renewal strategy", "Executive relationships"],
    },
  ],
  finance: [
    {
      title: "Bookkeeper",
      comp: "Fractional / monthly",
      requirements: ["Invoicing", "P&L reporting", "Commission logs"],
    },
    {
      title: "Senior Bookkeeper",
      comp: "Higher retainer",
      requirements: ["Forecast models", "Tax prep coordination", "Multi-entity"],
    },
    {
      title: "Finance Lead",
      comp: "Retainer + bonus",
      requirements: ["CFO-lite function", "Board reporting", "Financial strategy"],
    },
  ],
  ceo: [
    {
      title: "Operations Manager",
      comp: "Retainer",
      requirements: ["SOPs ownership", "Team tracking", "Weekly ops reports"],
    },
    {
      title: "Director of Operations",
      comp: "Higher retainer + equity consideration",
      requirements: ["Process architecture", "Hiring decisions", "Department oversight"],
    },
    {
      title: "COO",
      comp: "Equity + senior retainer",
      requirements: ["P&L ownership", "CEO partnership", "Company-wide execution"],
    },
  ],
};

// Skills per role category
const ROLE_SKILLS: Record<string, string[]> = {
  sales: [
    "Cold outreach",
    "Discovery qualification",
    "Objection handling",
    "CRM hygiene",
    "Lead nurturing",
    "Tonality & rapport",
    "Calendar discipline",
    "Pipeline forecasting",
  ],
  marketing: [
    "Content strategy",
    "Copywriting",
    "Email marketing",
    "Social media",
    "Analytics",
    "Ad management",
    "SEO/SEM",
    "Brand voice",
  ],
  tech: [
    "System architecture",
    "API integration",
    "Automation",
    "Database management",
    "Security",
    "AI/ML",
    "Documentation",
    "Testing",
  ],
  "client-success": [
    "Client onboarding",
    "Coaching & facilitation",
    "Retention strategy",
    "NPS management",
    "Escalation handling",
    "Upsell identification",
    "Reporting & milestones",
    "Relationship building",
  ],
  finance: [
    "Bookkeeping",
    "Invoice management",
    "Commission tracking",
    "P&L reporting",
    "Tax coordination",
    "Cash flow analysis",
    "Financial forecasting",
    "Compliance",
  ],
  ceo: [
    "Strategic planning",
    "Team leadership",
    "Process design",
    "KPI management",
    "Communication",
    "Decision-making",
    "Hiring & culture",
    "Financial acumen",
  ],
};

// Map HpcRole to skill/ladder categories
const ROLE_CATEGORY: Record<HpcRole, string> = {
  ceo: "ceo",
  ops_manager: "ceo",
  marketing_lead: "marketing",
  content_editor: "marketing",
  appointment_setter: "sales",
  sales_closer: "sales",
  ai_tech_specialist: "tech",
  csm_lead_coach: "client-success",
  bookkeeper: "finance",
};

// Map HpcRole to current rung index (0-based) in their ladder
const ROLE_RUNG: Record<HpcRole, number> = {
  ceo: 2,
  ops_manager: 0,
  marketing_lead: 2,
  content_editor: 0,
  appointment_setter: 1,
  sales_closer: 3,
  ai_tech_specialist: 0,
  csm_lead_coach: 0,
  bookkeeper: 0,
};

const DEFAULT_ONE_ON_ONE: OneOnOneData = {
  nextDate: "",
  nextTime: "",
  agenda: [
    { id: "a1", text: "Wins from last week", checked: false },
    { id: "a2", text: "Current blockers", checked: false },
    { id: "a3", text: "Goals for next week", checked: false },
  ],
  lastItems: [
    { id: "l1", text: "Review performance metrics", checked: true },
    { id: "l2", text: "Discuss onboarding progress", checked: false },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────

function buildDefaultSkills(role: HpcRole): SkillRow[] {
  const cat = ROLE_CATEGORY[role];
  const labels = ROLE_SKILLS[cat] ?? ROLE_SKILLS.ceo;
  return labels.map((label, i) => ({
    id: `skill_${i}`,
    label,
    selfRating: 0,
    verifiedRating: 0,
  }));
}

function statusIcon(s: OnboardingStatus): string {
  if (s === "completed") return "✓";
  if (s === "in-progress") return "●";
  return "🔒";
}

function statusColor(s: OnboardingStatus): string {
  if (s === "completed") return "var(--success)";
  if (s === "in-progress") return "var(--accent)";
  return "var(--muted)";
}

function cycleStatus(s: OnboardingStatus): OnboardingStatus {
  if (s === "locked") return "locked";
  return s === "completed" ? "in-progress" : "completed";
}

// ── Sub-components ───────────────────────────────────────────────────

function DotRating({
  value,
  color,
  onClick,
}: {
  value: number;
  color: string;
  onClick?: (rating: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onClick?.(n)}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: `1.5px solid ${n <= value ? color : "var(--border)"}`,
            backgroundColor: n <= value ? color : "transparent",
            cursor: onClick ? "pointer" : "default",
            padding: 0,
          }}
          title={onClick ? `Rate ${n}/5` : undefined}
        />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function GrowthPlanPage() {
  const { role, memberName } = useRole();
  const category = ROLE_CATEGORY[role];

  // Onboarding
  const [onboarding, setOnboarding] = useStore<OnboardingStep[]>(
    "hpc_onboarding_progress",
    DEFAULT_ONBOARDING
  );

  // Skills
  const [skills, setSkills] = useStore<SkillRow[]>(
    `hpc_skills_matrix_${role}`,
    buildDefaultSkills(role)
  );

  // 1:1
  const [oneOnOne, setOneOnOne] = useStore<OneOnOneData>(
    "hpc_one_on_one",
    DEFAULT_ONE_ON_ONE
  );

  // New agenda item input
  const [newAgenda, setNewAgenda] = useState("");

  const completedCount = onboarding.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedCount / onboarding.length) * 100);

  const ladder = CAREER_LADDERS[category] ?? CAREER_LADDERS.sales;
  const currentRung = ROLE_RUNG[role] ?? 0;

  function toggleOnboarding(id: string) {
    setOnboarding(
      onboarding.map((s) =>
        s.id === id && s.status !== "locked"
          ? { ...s, status: cycleStatus(s.status) }
          : s
      )
    );
  }

  function updateSelfRating(skillId: string, rating: number) {
    setSkills(
      skills.map((sk) =>
        sk.id === skillId
          ? { ...sk, selfRating: sk.selfRating === rating ? 0 : rating }
          : sk
      )
    );
  }

  function addAgendaItem() {
    if (!newAgenda.trim()) return;
    const item: OneOnOneAgendaItem = {
      id: `a${Date.now()}`,
      text: newAgenda.trim(),
      checked: false,
    };
    setOneOnOne({ ...oneOnOne, agenda: [...oneOnOne.agenda, item] });
    setNewAgenda("");
  }

  function removeAgendaItem(id: string) {
    setOneOnOne({ ...oneOnOne, agenda: oneOnOne.agenda.filter((a) => a.id !== id) });
  }

  function toggleAgendaItem(id: string) {
    setOneOnOne({
      ...oneOnOne,
      agenda: oneOnOne.agenda.map((a) =>
        a.id === id ? { ...a, checked: !a.checked } : a
      ),
    });
  }

  function toggleLastItem(id: string) {
    setOneOnOne({
      ...oneOnOne,
      lastItems: oneOnOne.lastItems.map((a) =>
        a.id === id ? { ...a, checked: !a.checked } : a
      ),
    });
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="themed-text" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Growth & Development
        </h1>
        <p className="themed-muted" style={{ fontSize: 13, marginTop: 4 }}>
          {memberName ? `${memberName} · ` : ""}Career progress, skills, and 1:1 prep
        </p>
      </div>

      {/* Grid layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
          gap: 20,
        }}
      >
        {/* ── Section 1: Onboarding Hub ── */}
        <div className="card" style={{ padding: 22, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="themed-text" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Onboarding Hub
            </h2>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>
              {progress}% complete
            </span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 6,
              borderRadius: 99,
              backgroundColor: "var(--border)",
              marginBottom: 18,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: "var(--accent)",
                borderRadius: 99,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 8,
            }}
          >
            {onboarding.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleOnboarding(step.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `1px solid var(--border)`,
                  backgroundColor:
                    step.status === "completed"
                      ? "var(--success-bg)"
                      : step.status === "in-progress"
                      ? "var(--accent-bg)"
                      : "var(--bg)",
                  cursor: step.status === "locked" ? "not-allowed" : "pointer",
                  textAlign: "left",
                  opacity: step.status === "locked" ? 0.5 : 1,
                  transition: "background 0.15s",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: statusColor(step.status),
                    minWidth: 16,
                  }}
                >
                  {statusIcon(step.status)}
                </span>
                <span className="themed-text" style={{ fontSize: 13 }}>
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Section 2: Quick Links ── */}
        <div className="card" style={{ padding: 22 }}>
          <h2 className="themed-text" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Quick Links
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {QUICK_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "14px 8px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg)",
                  textDecoration: "none",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--accent-bg)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--bg)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                }}
              >
                <span style={{ fontSize: 22 }}>{link.emoji}</span>
                <span className="themed-muted" style={{ fontSize: 11, fontWeight: 500 }}>
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Section 3: Career Ladder ── */}
        <div className="card" style={{ padding: 22 }}>
          <h2 className="themed-text" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Career Ladder
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ladder.map((rung, i) => {
              const isCurrent = i === currentRung;
              const isPast = i < currentRung;
              return (
                <div
                  key={rung.title}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: `1.5px solid ${isCurrent ? "var(--accent)" : "var(--border)"}`,
                    backgroundColor: isCurrent
                      ? "var(--accent-bg)"
                      : isPast
                      ? "var(--success-bg)"
                      : "var(--bg)",
                    opacity: !isCurrent && !isPast ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isCurrent ? "var(--accent)" : isPast ? "var(--success)" : "var(--text)",
                      }}
                    >
                      {rung.title}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 99,
                          backgroundColor: "var(--accent)",
                          color: "#fff",
                        }}
                      >
                        YOU ARE HERE
                      </span>
                    )}
                    {isPast && (
                      <span style={{ fontSize: 12, color: "var(--success)" }}>✓</span>
                    )}
                  </div>
                  <div className="themed-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    {rung.comp}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {rung.requirements.map((req) => (
                      <span
                        key={req}
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 99,
                          border: "1px solid var(--border)",
                          color: "var(--muted)",
                          backgroundColor: "var(--surface)",
                        }}
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 4: Skills Matrix ── */}
        <div className="card" style={{ padding: 22, gridColumn: "1 / -1" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 className="themed-text" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Skills Matrix
            </h2>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                  }}
                />
                <span className="themed-muted" style={{ fontSize: 11 }}>
                  Self-rated
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "var(--success)",
                  }}
                />
                <span className="themed-muted" style={{ fontSize: 11 }}>
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 2,
            }}
          >
            {/* Header row */}
            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1fr 130px 130px",
                padding: "0 12px 8px",
                gap: 8,
              }}
            >
              <span className="themed-muted" style={{ fontSize: 11, fontWeight: 600 }}>
                SKILL
              </span>
              <span className="themed-muted" style={{ fontSize: 11, fontWeight: 600 }}>
                SELF
              </span>
              <span className="themed-muted" style={{ fontSize: 11, fontWeight: 600 }}>
                VERIFIED
              </span>
            </div>

            {skills.map((sk) => (
              <div
                key={sk.id}
                style={{
                  gridColumn: "1 / -1",
                  display: "grid",
                  gridTemplateColumns: "1fr 130px 130px",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 10,
                  gap: 8,
                  backgroundColor: "var(--bg)",
                }}
              >
                <span className="themed-text" style={{ fontSize: 13 }}>
                  {sk.label}
                </span>
                <DotRating
                  value={sk.selfRating}
                  color="var(--accent)"
                  onClick={(r) => updateSelfRating(sk.id, r)}
                />
                <DotRating value={sk.verifiedRating} color="var(--success)" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 5: Next 1:1 Prep ── */}
        <div className="card" style={{ padding: 22, gridColumn: "1 / -1" }}>
          <h2 className="themed-text" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Next 1:1 Prep
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {/* Date / Time */}
            <div>
              <p className="themed-muted" style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                SCHEDULED
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="date"
                  value={oneOnOne.nextDate}
                  onChange={(e) =>
                    setOneOnOne({ ...oneOnOne, nextDate: e.target.value })
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                    flex: 1,
                  }}
                />
                <input
                  type="time"
                  value={oneOnOne.nextTime}
                  onChange={(e) =>
                    setOneOnOne({ ...oneOnOne, nextTime: e.target.value })
                  }
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                    width: 110,
                  }}
                />
              </div>

              {/* From last 1:1 */}
              <p
                className="themed-muted"
                style={{ fontSize: 11, fontWeight: 600, margin: "16px 0 8px" }}
              >
                FROM LAST 1:1
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {oneOnOne.lastItems.map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleLastItem(item.id)}
                      style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
                    />
                    <span
                      className="themed-text"
                      style={{
                        fontSize: 13,
                        textDecoration: item.checked ? "line-through" : "none",
                        opacity: item.checked ? 0.5 : 1,
                      }}
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div>
              <p className="themed-muted" style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                AGENDA
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {oneOnOne.agenda.map((item) => (
                  <div
                    key={item.id}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleAgendaItem(item.id)}
                      style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
                    />
                    <span
                      className="themed-text"
                      style={{
                        fontSize: 13,
                        flex: 1,
                        textDecoration: item.checked ? "line-through" : "none",
                        opacity: item.checked ? 0.5 : 1,
                      }}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeAgendaItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        fontSize: 14,
                        lineHeight: 1,
                        padding: "0 2px",
                      }}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newAgenda}
                  onChange={(e) => setNewAgenda(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addAgendaItem();
                  }}
                  placeholder="Add agenda item…"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={addAgendaItem}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
