"use client";

import { useState, useEffect, useMemo } from "react";

type ContentType = "reel" | "youtube" | "static" | "podcast" | "email" | "ad" | "webinar" | "story" | "carousel";

interface MediaCard {
  id: string;
  title: string;
  phase: string;
  contentType: ContentType;
  client: string;
  platforms: string[];
  assignedTo: string[];
  script?: string;
  driveLink?: string;
  imageUrl?: string;
  postDate?: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

const TYPE_COLORS: Record<ContentType, string> = {
  reel: "#ec4899",
  youtube: "#ef4444",
  static: "#6366f1",
  podcast: "#f59e0b",
  email: "#0891b2",
  ad: "#8b5cf6",
  webinar: "#10b981",
  story: "#f97316",
  carousel: "#3b82f6",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function CardPill({ card, onClick }: { card: MediaCard; onClick: () => void }) {
  const color = TYPE_COLORS[card.contentType] || "#6b7280";
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-2 py-1 rounded-lg truncate font-medium transition-opacity hover:opacity-80"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {card.title}
    </button>
  );
}

function CardPopover({ card, onClose }: { card: MediaCard; onClose: () => void }) {
  const color = TYPE_COLORS[card.contentType] || "#6b7280";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl w-full max-w-md p-5"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium" style={{ color: "var(--text)" }}>
              {card.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {card.contentType}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}
              >
                {card.client}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-lg hover:opacity-60"
            style={{ color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {card.postDate && (
          <div className="mb-3">
            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
              Post Date
            </span>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>
              {new Date(card.postDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {card.assignedTo.length > 0 && (
          <div className="mb-3">
            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
              Assigned To
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {card.assignedTo.map((m) => (
                <span
                  key={m}
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.platforms.length > 0 && (
          <div className="mb-3">
            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
              Platforms
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {card.platforms.map((p) => (
                <span
                  key={p}
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.script && (
          <div>
            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--muted)" }}>
              Script / Notes
            </span>
            <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
              {card.script.slice(0, 200)}
              {card.script.length > 200 && "..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [cards, setCards] = useState<MediaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<MediaCard | null>(null);

  useEffect(() => {
    fetch("/api/media-cards")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const unscheduled = useMemo(() => cards.filter((c) => !c.postDate), [cards]);

  // Month view helpers
  const monthStart = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return d;
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const days: Date[] = [];
    const firstDay = monthStart.getDay();
    const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(monthStart);
      d.setDate(-i);
      days.push(d);
    }

    // Current month
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    // Next month padding to complete grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
    }

    return days;
  }, [monthStart, currentDate]);

  // Week view helpers
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const getCardsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return cards.filter((c) => c.postDate === dateStr);
  };

  const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const navigateMonth = (delta: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const navigateWeek = (delta: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "var(--muted)" }}>
          Loading calendar...
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Main Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-serif" style={{ color: "var(--text)" }}>
            Content Calendar
          </h1>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div
              className="flex rounded-xl overflow-hidden border"
              style={{ borderColor: "var(--border)" }}
            >
              {(["week", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-4 py-2 text-sm font-medium capitalize transition-colors"
                  style={{
                    backgroundColor: view === v ? "var(--accent-bg)" : "var(--surface)",
                    color: view === v ? "var(--accent-text)" : "var(--muted)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => (view === "month" ? navigateMonth(-1) : navigateWeek(-1))}
            className="p-2 rounded-xl transition-colors hover:opacity-70"
            style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
          >
            ←
          </button>
          <h2 className="text-lg font-medium" style={{ color: "var(--text)" }}>
            {view === "month"
              ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </h2>
          <button
            onClick={() => (view === "month" ? navigateMonth(1) : navigateWeek(1))}
            className="p-2 rounded-xl transition-colors hover:opacity-70"
            style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        {view === "month" ? (
          <div className="card flex-1 flex flex-col overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-auto">
              {monthDays.map((date, idx) => {
                const dayCards = getCardsForDate(date);
                return (
                  <div
                    key={idx}
                    className="p-2 border-b border-r min-h-[80px]"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: isToday(date)
                        ? "var(--accent-bg)"
                        : isCurrentMonth(date)
                          ? "transparent"
                          : "var(--bg)",
                    }}
                  >
                    <div
                      className="text-sm font-medium mb-1"
                      style={{
                        color: isCurrentMonth(date) ? "var(--text)" : "var(--muted)",
                      }}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayCards.slice(0, 3).map((card) => (
                        <CardPill
                          key={card.id}
                          card={card}
                          onClick={() => setSelectedCard(card)}
                        />
                      ))}
                      {dayCards.length > 3 && (
                        <div
                          className="text-xs px-2"
                          style={{ color: "var(--muted)" }}
                        >
                          +{dayCards.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week View */
          <div className="card flex-1 flex flex-col overflow-hidden">
            {/* Day headers for week */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
              {weekDays.map((date, idx) => (
                <div
                  key={idx}
                  className="py-3 text-center border-r last:border-r-0"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: isToday(date) ? "var(--accent-bg)" : "transparent",
                  }}
                >
                  <div
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    {DAYS[(idx + 1) % 7]}
                  </div>
                  <div
                    className="text-lg font-medium mt-1"
                    style={{ color: "var(--text)" }}
                  >
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
            {/* Week content */}
            <div className="flex-1 grid grid-cols-7 overflow-auto">
              {weekDays.map((date, idx) => {
                const dayCards = getCardsForDate(date);
                return (
                  <div
                    key={idx}
                    className="p-3 border-r last:border-r-0 overflow-y-auto"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: isToday(date) ? "var(--accent-bg)" : "transparent",
                    }}
                  >
                    <div className="space-y-2">
                      {dayCards.map((card) => (
                        <CardPill
                          key={card.id}
                          card={card}
                          onClick={() => setSelectedCard(card)}
                        />
                      ))}
                      {dayCards.length === 0 && (
                        <div
                          className="text-xs text-center py-4"
                          style={{ color: "var(--muted)" }}
                        >
                          No content
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unscheduled Sidebar */}
      <div
        className="w-72 shrink-0 rounded-2xl p-4 overflow-y-auto"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h3
          className="text-sm font-semibold uppercase tracking-wide mb-4"
          style={{ color: "var(--muted)" }}
        >
          Unscheduled ({unscheduled.length})
        </h3>
        <div className="space-y-2">
          {unscheduled.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="p-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                {card.title}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${TYPE_COLORS[card.contentType]}20`,
                    color: TYPE_COLORS[card.contentType],
                  }}
                >
                  {card.contentType}
                </span>
              </div>
            </div>
          ))}
          {unscheduled.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>
              All content scheduled!
            </p>
          )}
        </div>
      </div>

      {/* Card Popover */}
      {selectedCard && (
        <CardPopover card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
