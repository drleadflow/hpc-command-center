"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: string;
  source: "lyra" | "jade" | "code";
  timestamp: number;
  duration?: number;
  userMessage?: string;
  agentMessage?: string;
  messageCount?: number;
  action?: string;
  summary?: string;
  category?: string;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SOURCE_CONFIG = {
  jade: { icon: "⚡", label: "Jade", color: "var(--accent)" },
  lyra: { icon: "🎙️", label: "Lyra", color: "#8b5cf6" },
  code: { icon: "🔨", label: "Deploy", color: "#10b981" },
};

const CATEGORY_COLORS: Record<string, string> = {
  build:   "#3b82f6",
  ads:     "#f59e0b",
  content: "#8b5cf6",
  email:   "#0891b2",
  task:    "#10b981",
  system:  "#6b7280",
  goal:    "var(--accent)",
  slack:   "#4A154B",
  media:   "#ec4899",
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "jade" | "lyra" | "code">("all");

  useEffect(() => {
    fetch("/api/activity")
      .then(r => r.json())
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? activities
    : activities.filter(a => a.source === filter);

  // Group by date
  const grouped: { date: string; items: Activity[] }[] = [];
  for (const a of filtered) {
    const date = formatDate(a.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.items.push(a);
    } else {
      grouped.push({ date, items: [a] });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            ACTIVITY LOG
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Running log of everything Jade has done
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "jade", "lyra", "code"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs px-2.5 py-1 rounded-lg capitalize transition-colors"
              style={{
                backgroundColor: filter === f ? "var(--accent-bg)" : "var(--bg)",
                color: filter === f ? "var(--accent-text)" : "var(--muted)",
                border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: "var(--border)" }} />
              <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--border)" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm themed-muted">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}>{group.date}</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                <span className="text-xs themed-muted">{group.items.length} actions</span>
              </div>

              {/* Activity items */}
              <div className="space-y-2">
                {group.items.map(a => {
                  const src = SOURCE_CONFIG[a.source] || SOURCE_CONFIG.jade;
                  const isExpanded = expanded === a.id;
                  const catColor = a.category ? CATEGORY_COLORS[a.category] : src.color;
                  const hasSummary = !!a.summary || !!a.agentMessage;

                  return (
                    <div key={a.id}
                      className="card px-4 py-3 transition-all"
                      onClick={() => hasSummary && setExpanded(isExpanded ? null : a.id)}
                      style={{ cursor: hasSummary ? "pointer" : "default" }}>

                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5"
                          style={{ backgroundColor: `${catColor}18`, border: `1px solid ${catColor}30` }}>
                          {src.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: src.color }}>
                              {src.label}
                            </span>
                            {a.category && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md"
                                style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                                {a.category}
                              </span>
                            )}
                            <span className="text-xs themed-muted">{timeAgo(a.timestamp)}</span>
                            <span className="text-xs themed-muted">· {formatTime(a.timestamp)}</span>
                            {a.duration && (
                              <span className="text-xs themed-muted">· {Math.round(a.duration / 60)}m call</span>
                            )}
                          </div>

                          <p className="text-sm mt-0.5 themed-text">
                            {a.action || a.userMessage || "—"}
                          </p>

                          {isExpanded && (a.summary || a.agentMessage) && (
                            <div className="mt-2 rounded-xl px-3 py-2.5 text-xs themed-muted leading-relaxed"
                              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                              {a.summary || a.agentMessage}
                            </div>
                          )}
                        </div>

                        {hasSummary && (
                          <span className="text-xs themed-muted shrink-0 mt-1">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
