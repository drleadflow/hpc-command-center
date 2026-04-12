"use client";

import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { useRole } from "@/lib/role-context";

// ── Types ────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  name: string;
  eventType: "birthday" | "anniversary" | "achievement";
  date: string;
  kudosCount: number;
  celebrated?: boolean;
}

interface Streak {
  id: string;
  emoji: string;
  name: string;
  count: number;
  unit: "days" | "weeks";
}

interface Badge {
  id: string;
  name: string;
  emoji: string;
  earned: boolean;
  description: string;
}

// ── Default Data ─────────────────────────────────────────────────────

const DEFAULT_MILESTONES: Milestone[] = [
  { id: "m1", name: "Sarah K.", eventType: "birthday", date: "Apr 14", kudosCount: 3, celebrated: false },
  { id: "m2", name: "Marcus T.", eventType: "anniversary", date: "Apr 18 · 1 Year", kudosCount: 7, celebrated: false },
  { id: "m3", name: "Jordan L.", eventType: "achievement", date: "Apr 20 · First Close", kudosCount: 12, celebrated: false },
  { id: "m4", name: "Priya M.", eventType: "birthday", date: "Apr 28", kudosCount: 2, celebrated: false },
];

const DEFAULT_STREAKS: Streak[] = [
  { id: "s1", emoji: "📋", name: "EOD Report", count: 0, unit: "days" },
  { id: "s2", emoji: "📞", name: "Weekly Call Goal", count: 0, unit: "weeks" },
  { id: "s3", emoji: "⚡", name: "Response Time", count: 0, unit: "days" },
  { id: "s4", emoji: "🤝", name: "Gave Kudos", count: 0, unit: "weeks" },
];

const DEFAULT_BADGES: Badge[] = [
  { id: "b1", name: "First Close", emoji: "🎯", earned: true, description: "Closed your first deal" },
  { id: "b2", name: "30-day Streak", emoji: "🔥", earned: true, description: "30 consecutive tracking days" },
  { id: "b3", name: "100 Calls", emoji: "📞", earned: true, description: "100 outbound calls completed" },
  { id: "b4", name: "Mentor", emoji: "🧑‍🏫", earned: true, description: "Helped onboard a teammate" },
  { id: "b5", name: "Speed Demon", emoji: "⚡", earned: true, description: "Sub-5 min response time for 7 days" },
  { id: "b6", name: "First $10K Month", emoji: "💰", earned: false, description: "Generated $10K in a single month" },
  { id: "b7", name: "Top of Board", emoji: "🏆", earned: false, description: "Led the leaderboard for a full week" },
  { id: "b8", name: "Certified Closer", emoji: "📜", earned: false, description: "Completed closer certification" },
  { id: "b9", name: "100 Kudos", emoji: "🎖️", earned: false, description: "Given 100 kudos to teammates" },
  { id: "b10", name: "6 Month Crew", emoji: "📅", earned: false, description: "6 months with the team" },
  { id: "b11", name: "1 Year Crew", emoji: "🌟", earned: false, description: "1 full year with the team" },
  { id: "b12", name: "Perfect Quarter", emoji: "💎", earned: false, description: "Hit every KPI for a full quarter" },
];

const EVENT_COLORS: Record<Milestone["eventType"], string> = {
  birthday: "#ec4899",
  anniversary: "var(--accent)",
  achievement: "var(--warning)",
};

const EVENT_LABELS: Record<Milestone["eventType"], string> = {
  birthday: "🎂 Birthday",
  anniversary: "🎉 Anniversary",
  achievement: "🏅 Achievement",
};

// ── Page ─────────────────────────────────────────────────────────────

export default function RecognitionPage() {
  const { role } = useRole();

  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [streaks, setStreaks] = useState<Streak[]>(DEFAULT_STREAKS);
  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);
  const [celebrating, setCelebrating] = useState<string | null>(null);

  // Load from store
  useEffect(() => {
    setMilestones(store.read("hpc_milestones", DEFAULT_MILESTONES));
    setStreaks(store.read("hpc_streaks", DEFAULT_STREAKS));
    setBadges(store.read("hpc_badges", DEFAULT_BADGES));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────

  function celebrate(id: string) {
    setCelebrating(id);
    const updated = milestones.map((m) =>
      m.id === id ? { ...m, kudosCount: m.kudosCount + 1, celebrated: true } : m
    );
    setMilestones(updated);
    store.write("hpc_milestones", updated);
    setTimeout(() => setCelebrating(null), 2000);
  }

  function incrementStreak(id: string) {
    const updated = streaks.map((s) =>
      s.id === id ? { ...s, count: s.count + 1 } : s
    );
    setStreaks(updated);
    store.write("hpc_streaks", updated);
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return (
    <main style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          Recognition
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, margin: 0 }}>
          Celebrate milestones, track streaks, and earn badges.
        </p>
      </div>

      {/* ── Section 1: Milestones & Anniversaries ── */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
          Upcoming Milestones
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
          {milestones.map((m) => {
            const isCelebrating = celebrating === m.id;
            return (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: "18px 20px",
                  transition: "border-color 0.3s ease",
                  borderColor: isCelebrating ? "var(--accent)" : undefined,
                  boxShadow: isCelebrating ? "0 0 0 2px var(--accent-bg)" : undefined,
                }}
              >
                {/* Event type badge */}
                <div style={{ marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: isCelebrating ? "var(--accent-bg)" : "var(--bg)",
                      color: EVENT_COLORS[m.eventType],
                      border: `1px solid ${EVENT_COLORS[m.eventType]}33`,
                    }}
                  >
                    {EVENT_LABELS[m.eventType]}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
                  {m.date}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {m.kudosCount} kudos given
                  </span>
                  <button
                    onClick={() => celebrate(m.id)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: isCelebrating ? "var(--accent)" : "var(--accent-bg)",
                      color: isCelebrating ? "#fff" : "var(--accent)",
                      transition: "all 0.2s",
                    }}
                  >
                    {isCelebrating ? "🎉 Celebrated!" : "Celebrate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 2: Active Streaks ── */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
          Active Streaks
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {streaks.map((s) => (
            <div key={s.id} className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{s.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                {s.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: s.count > 0 ? "var(--accent)" : "var(--muted)",
                    lineHeight: 1,
                  }}
                >
                  {s.count}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.unit}</span>
                <button
                  onClick={() => incrementStreak(s.id)}
                  style={{
                    marginLeft: "auto",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "1.5px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--accent)",
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  title={`+1 ${s.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Badges ── */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
          Badges
        </h2>

        {/* Earned */}
        {earnedBadges.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
              Earned ({earnedBadges.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {earnedBadges.map((b) => (
                <div
                  key={b.id}
                  title={b.description}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 14,
                    background: "var(--accent-bg)",
                    border: "1.5px solid var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "default",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{b.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-text)" }}>
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked */}
        {lockedBadges.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
              Locked ({lockedBadges.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {lockedBadges.map((b) => (
                <div
                  key={b.id}
                  title={b.description}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 14,
                    background: "var(--bg)",
                    border: "1.5px dashed var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "default",
                    opacity: 0.6,
                  }}
                >
                  <span style={{ fontSize: 18, filter: "grayscale(1)" }}>{b.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
                    {b.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
