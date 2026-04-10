"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChecklistState {
  scorecard: boolean;
  agenda: boolean;
  attendees: boolean;
  decisionMaker: boolean;
  actionItems: boolean;
}

interface MeetingType {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  attendees: string;
  purpose: string;
  color: string;
  agendaItems: string[];
  getNextDate: () => Date;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  description: string | null;
  attendees: string[];
  meetLink: string | null;
  status: string;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  return next;
}

function getFirstFridayOfNextMonth(): Date {
  const now = new Date();
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const month = (now.getMonth() + 1) % 12;
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek;
  firstDay.setDate(firstDay.getDate() + daysUntilFriday);
  return firstDay;
}

function getFirstWeekOfNextQuarter(): Date {
  const now = new Date();
  const month = now.getMonth();
  const currentQuarterStart = Math.floor(month / 3) * 3;
  const nextQuarterMonth = (currentQuarterStart + 3) % 12;
  const nextQuarterYear =
    currentQuarterStart + 3 >= 12 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(nextQuarterYear, nextQuarterMonth, 1);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatTimeRange(start: string, end: string): string {
  if (!start) return "";
  // All-day events use date-only strings (no "T")
  if (!start.includes("T")) {
    try {
      return new Date(start + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return start;
    }
  }
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function getDayLabel(isoString: string): string {
  if (!isoString) return "Unknown";
  const eventDate = new Date(isoString.includes("T") ? isoString : isoString + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(eventDate, today)) return "Today";
  if (sameDay(eventDate, tomorrow)) return "Tomorrow";
  return eventDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// ── Static meeting data ───────────────────────────────────────────────────────

const MEETINGS: MeetingType[] = [
  {
    id: "weekly",
    title: "Weekly Scorecard Review",
    frequency: "Weekly",
    duration: "30 min",
    attendees: "All department leads",
    purpose: "Review R/Y/G metrics, identify blockers",
    color: "#10b981",
    agendaItems: [
      "Each lead shares their Red/Yellow metrics (2 min each)",
      "Identify top 3 blockers",
      "Assign action items to turn Red → Yellow → Green",
      "Quick wins celebration",
    ],
    getNextDate: getNextMonday,
  },
  {
    id: "monthly",
    title: "Monthly Business Review",
    frequency: "Monthly",
    duration: "60 min",
    attendees: "CEO + department leads",
    purpose: "Deep dive on trends, strategy adjustments",
    color: "#6366f1",
    agendaItems: [
      "Revenue vs target review (10 min)",
      "Client health overview (10 min)",
      "Growth engine performance (10 min)",
      "Content/brand metrics (10 min)",
      "90-day plan adjustments (15 min)",
      "Action items (5 min)",
    ],
    getNextDate: getFirstFridayOfNextMonth,
  },
  {
    id: "quarterly",
    title: "Quarterly Sprint Planning",
    frequency: "Quarterly",
    duration: "2 hours",
    attendees: "Full team",
    purpose: "Set quarterly rocks, review Clarity Compass",
    color: "#f59e0b",
    agendaItems: [
      "Previous quarter review (20 min)",
      "Clarity Compass refresh (15 min)",
      "Set 3–7 rocks per person (30 min)",
      "Resource allocation (15 min)",
      "Risk identification (15 min)",
      "Commitment ceremony (5 min)",
    ],
    getNextDate: getFirstWeekOfNextQuarter,
  },
];

const MEETING_RULES = [
  { num: "01", rule: "No agenda, no meeting." },
  { num: "02", rule: "No outcome needed, no meeting." },
  { num: "03", rule: "No decision-maker, no meeting." },
  { num: "04", rule: "No scorecard, no meeting." },
];

const DEFAULT_CHECKLIST: ChecklistState = {
  scorecard: false,
  agenda: false,
  attendees: false,
  decisionMaker: false,
  actionItems: false,
};

const CHECKLIST_ITEMS: { key: keyof ChecklistState; label: string }[] = [
  { key: "scorecard", label: "Scorecard updated" },
  { key: "agenda", label: "Agenda distributed" },
  { key: "attendees", label: "All attendees confirmed" },
  { key: "decisionMaker", label: "Decision-maker present" },
  { key: "actionItems", label: "Previous action items reviewed" },
];

// ── localStorage helpers ──────────────────────────────────────────────────────

interface PersistedChecklist {
  state: ChecklistState;
  savedForDate: string;
}

function loadMeetingChecklist(meetingId: string, nextMeetingDate: Date): ChecklistState {
  try {
    const raw = localStorage.getItem(`dlf-meeting-prep-${meetingId}`);
    if (!raw) return { ...DEFAULT_CHECKLIST };
    const parsed = JSON.parse(raw) as PersistedChecklist;
    if (!parsed.state || typeof parsed.state !== "object") return { ...DEFAULT_CHECKLIST };

    if (parsed.savedForDate) {
      const savedDate = new Date(parsed.savedForDate);
      const now = new Date();
      const savedDateOnly = new Date(savedDate.getFullYear(), savedDate.getMonth(), savedDate.getDate());
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (savedDateOnly < todayOnly) {
        localStorage.removeItem(`dlf-meeting-prep-${meetingId}`);
        return { ...DEFAULT_CHECKLIST };
      }
    }

    const restored: ChecklistState = { ...DEFAULT_CHECKLIST };
    for (const { key } of CHECKLIST_ITEMS) {
      if (typeof parsed.state[key] === "boolean") {
        restored[key] = parsed.state[key];
      }
    }
    return restored;
  } catch {
    return { ...DEFAULT_CHECKLIST };
  }
}

function saveMeetingChecklist(meetingId: string, state: ChecklistState, nextMeetingDate: Date) {
  try {
    const payload: PersistedChecklist = {
      state,
      savedForDate: nextMeetingDate.toISOString(),
    };
    localStorage.setItem(`dlf-meeting-prep-${meetingId}`, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

// ── Calendar event card ───────────────────────────────────────────────────────

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="card p-4"
      style={{ borderLeft: "3px solid var(--accent)" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {event.title}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {formatTimeRange(event.start, event.end)}
          </p>
          {event.location && (
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {event.location}
            </p>
          )}
          {event.attendees.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {event.attendees.slice(0, 3).join(", ")}
              {event.attendees.length > 3 && ` +${event.attendees.length - 3} more`}
            </p>
          )}
        </div>
        {event.meetLink && (
          <a
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
            style={{
              background: "var(--accent-bg)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Join Meet
          </a>
        )}
      </div>
    </div>
  );
}

// ── Google Calendar section ───────────────────────────────────────────────────

function GoogleCalendarSection() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = (session as any)?.accessToken as string | undefined;

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/events", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (status === "authenticated" && accessToken) {
      fetchEvents();
    }
  }, [status, accessToken, fetchEvents]);

  // Group events by day label
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const label = getDayLabel(event.start);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(event);
    }
    return map;
  }, [events]);

  if (status === "loading") return null;

  if (status === "unauthenticated") {
    return (
      <div
        className="card p-6"
        style={{ borderLeft: "3px solid var(--warning)", background: "var(--surface)" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Connect Google Calendar
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              See your real upcoming meetings alongside the meeting rhythm below.
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80 min-h-[44px]"
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Connect Google Calendar
          </button>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className="space-y-4">
      {/* Auth bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              className="rounded-full"
              style={{ width: 28, height: 28 }}
            />
          )}
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {session?.user?.name ?? session?.user?.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => signOut()}
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{
              background: "var(--bg)",
              color: "var(--danger)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          Loading calendar events…
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          No upcoming events in the next 7 days.
        </div>
      )}

      {!loading && grouped.size > 0 && (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([dayLabel, dayEvents]) => (
            <div key={dayLabel}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--muted)" }}
              >
                {dayLabel}
              </p>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <CalendarEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  const nextDates = useMemo(
    () => Object.fromEntries(MEETINGS.map((m) => [m.id, m.getNextDate()])),
    []
  );

  const [checklists, setChecklists] = useState<Record<string, ChecklistState>>(
    () =>
      Object.fromEntries(
        MEETINGS.map((m) => [m.id, loadMeetingChecklist(m.id, nextDates[m.id])])
      )
  );

  useEffect(() => {
    for (const m of MEETINGS) {
      saveMeetingChecklist(m.id, checklists[m.id], nextDates[m.id]);
    }
  }, [checklists, nextDates]);

  function toggleChecklist(meetingId: string, key: keyof ChecklistState) {
    setChecklists((prev) => ({
      ...prev,
      [meetingId]: {
        ...prev[meetingId],
        [key]: !prev[meetingId][key],
      },
    }));
  }

  function toggleExpanded(id: string) {
    setExpandedMeeting((prev) => (prev === id ? null : id));
  }

  const checklistCompletion = useMemo(() => {
    return Object.fromEntries(
      MEETINGS.map((m) => {
        const cl = checklists[m.id];
        const total = CHECKLIST_ITEMS.length;
        const done = CHECKLIST_ITEMS.filter((item) => cl[item.key]).length;
        return [m.id, { done, total, pct: Math.round((done / total) * 100) }];
      })
    );
  }, [checklists]);

  return (
    <div className="space-y-8" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--muted)" }}
        >
          MEETING RHYTHM
        </p>
        <h1
          className="text-4xl font-serif mb-2"
          style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}
        >
          Structured Cadence
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No agenda, no meeting. No scorecard, no meeting.
        </p>
      </div>

      {/* Google Calendar section */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted)" }}
        >
          UPCOMING CALENDAR EVENTS
        </p>
        <GoogleCalendarSection />
      </div>

      {/* Meeting Rules */}
      <div className="card p-6" style={{ borderLeft: "3px solid var(--accent)" }}>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--accent)" }}
        >
          The 4 Rules — Ryan Deiss
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MEETING_RULES.map(({ num, rule }) => (
            <div key={num} className="flex items-start gap-3">
              <span
                className="font-serif text-lg flex-shrink-0"
                style={{ color: "var(--accent)", fontWeight: 300, lineHeight: "1.4" }}
              >
                {num}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text)", lineHeight: "1.6" }}
              >
                {rule}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Cards */}
      <div className="space-y-4">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          MEETING SCHEDULE
        </p>
        {MEETINGS.map((meeting) => {
          const nextDate = nextDates[meeting.id];
          const isOpen = expandedMeeting === meeting.id;
          const cl = checklists[meeting.id];
          const { done, total, pct } = checklistCompletion[meeting.id];

          return (
            <div
              key={meeting.id}
              className="card"
              style={{ borderTop: `3px solid ${meeting.color}`, borderRadius: "16px", overflow: "hidden" }}
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                        style={{
                          background: `${meeting.color}18`,
                          color: meeting.color,
                          border: `1px solid ${meeting.color}30`,
                        }}
                      >
                        {meeting.frequency}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {meeting.duration}
                      </span>
                    </div>
                    <h2
                      className="text-xl font-serif mb-1"
                      style={{ color: "var(--text)", fontWeight: 400 }}
                    >
                      {meeting.title}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {meeting.purpose}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                        Next Meeting
                      </p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>
                        {formatDate(nextDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.id === "weekly" && (
                        <Link
                          href="/scorecard"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                          style={{
                            background: "var(--accent-bg)",
                            color: "var(--accent)",
                            border: "1px solid var(--accent)",
                            textDecoration: "none",
                          }}
                        >
                          Prepare Scorecard →
                        </Link>
                      )}
                      <button
                        onClick={() => toggleExpanded(meeting.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                        style={{
                          background: isOpen ? "var(--accent)" : "var(--bg)",
                          color: isOpen ? "var(--accent-text)" : "var(--text)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        {isOpen ? "Close" : "Prepare"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendees */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Attendees
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
                  >
                    {meeting.attendees}
                  </span>
                </div>
              </div>

              {/* Expanded: Agenda + Checklist */}
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Agenda */}
                    <div className="p-6" style={{ borderRight: "1px solid var(--border)" }}>
                      <p
                        className="text-xs font-semibold uppercase tracking-widest mb-4"
                        style={{ color: "var(--muted)" }}
                      >
                        Agenda Template
                      </p>
                      <ol className="space-y-2">
                        {meeting.agendaItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span
                              className="text-xs font-serif flex-shrink-0 mt-0.5"
                              style={{ color: meeting.color, fontWeight: 300, minWidth: "20px" }}
                            >
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Checklist */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p
                          className="text-xs font-semibold uppercase tracking-widest"
                          style={{ color: "var(--muted)" }}
                        >
                          Pre-Meeting Checklist
                        </p>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: pct === 100 ? "#f0fdf4" : "var(--accent-bg)",
                            color: pct === 100 ? "#15803d" : "var(--accent)",
                          }}
                        >
                          {done}/{total}
                        </span>
                      </div>

                      <div
                        className="w-full rounded-full mb-4"
                        style={{ height: "4px", background: "var(--border)" }}
                      >
                        <div
                          className="rounded-full transition-all duration-300"
                          style={{
                            height: "4px",
                            width: `${pct}%`,
                            background: pct === 100 ? "#10b981" : meeting.color,
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        {CHECKLIST_ITEMS.map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <div
                              onClick={() => toggleChecklist(meeting.id, key)}
                              className="flex-shrink-0"
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "5px",
                                border: cl[key]
                                  ? `2px solid ${meeting.color}`
                                  : "2px solid var(--border)",
                                background: cl[key] ? meeting.color : "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                                flexShrink: 0,
                              }}
                            >
                              {cl[key] && (
                                <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>
                                  ✓
                                </span>
                              )}
                            </div>
                            <span
                              className="text-sm"
                              style={{
                                color: cl[key] ? "var(--muted)" : "var(--text-secondary)",
                                textDecoration: cl[key] ? "line-through" : "none",
                                transition: "all 0.15s",
                              }}
                            >
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>

                      {pct === 100 && (
                        <div
                          className="mt-4 px-4 py-3 rounded-xl text-sm font-medium"
                          style={{
                            background: "#f0fdf4",
                            color: "#15803d",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          Ready to run this meeting.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="card p-5" style={{ background: "var(--surface)" }}>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted)" }}
        >
          Quick Links
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Weekly Scorecard", href: "/scorecard" },
            { label: "Clarity Compass", href: "/compass" },
            { label: "Delegation", href: "/delegation" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              {label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
