"use client";

import { useState } from "react";
import type { TeamMember, Task, Department } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import type { AccountabilityStats } from "./TeamPage";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getDeptInfo(id: Department) {
  return DEPARTMENTS.find((d) => d.id === id) ?? { label: id, icon: "◈", color: "#6b7280" };
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6b7280",
};

// ─── Accountability Scorecard ─────────────────────────────────────
type SortField = "name" | "assigned" | "onTrackPct" | "status";

export function AccountabilityScorecard({
  members,
  statsMap,
}: {
  members: TeamMember[];
  statsMap: Record<string, AccountabilityStats>;
}) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sorted = [...members].sort((a, b) => {
    const sa = statsMap[a.id] ?? { assigned: 0, onTrackPct: 100, status: "on-track" };
    const sb = statsMap[b.id] ?? { assigned: 0, onTrackPct: 100, status: "on-track" };
    let cmp = 0;
    if (sortField === "name") cmp = a.name.localeCompare(b.name);
    else if (sortField === "assigned") cmp = sa.assigned - sb.assigned;
    else if (sortField === "onTrackPct") cmp = sa.onTrackPct - sb.onTrackPct;
    else if (sortField === "status") {
      const order: Record<string, number> = { "on-track": 0, "at-capacity": 1, behind: 2 };
      cmp = (order[sa.status] ?? 0) - (order[sb.status] ?? 0);
    }
    return sortAsc ? cmp : -cmp;
  });

  const statusIcon: Record<string, string> = {
    "on-track": "🟢",
    "at-capacity": "🟡",
    behind: "🔴",
  };
  const statusLabel: Record<string, string> = {
    "on-track": "On Track",
    "at-capacity": "At Capacity",
    behind: "Behind",
  };
  const statusColor: Record<string, string> = {
    "on-track": "#10b981",
    "at-capacity": "#f59e0b",
    behind: "#ef4444",
  };

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    const active = sortField === field;
    return (
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide hover:opacity-80 transition-opacity"
        style={{ color: active ? "var(--accent)" : "var(--muted)" }}
      >
        {label}
        <span>{active ? (sortAsc ? "↑" : "↓") : ""}</span>
      </button>
    );
  }

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b themed-border flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-semibold themed-text">Accountability Scorecard</h2>
        <div className="flex items-center gap-4">
          <SortBtn field="name" label="Name" />
          <SortBtn field="assigned" label="Tasks" />
          <SortBtn field="onTrackPct" label="On-Track %" />
          <SortBtn field="status" label="Status" />
        </div>
      </div>

      <div
        className="hidden md:grid px-5 py-2 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
          color: "var(--muted)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span>Member</span>
        <span className="text-center">Assigned</span>
        <span className="text-center">Done</span>
        <span className="text-center">Overdue</span>
        <span className="text-center">On-Track</span>
        <span className="text-center">Status</span>
      </div>

      <div className="divide-y themed-border">
        {sorted.map((member) => {
          const s = statsMap[member.id] ?? {
            assigned: 0, completed: 0, overdue: 0,
            onTrackPct: 100, streak: 0, status: "on-track" as const,
          };
          const dept = getDeptInfo(member.department);
          return (
            <div
              key={member.id}
              className="px-5 py-3 grid gap-2 items-center"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium themed-text truncate">{member.name}</p>
                  <p className="text-[10px] truncate" style={{ color: dept.color }}>
                    {dept.icon} {dept.label}
                    {s.streak > 0 && (
                      <span className="ml-1" title={`${s.streak}-day streak`}>🔥{s.streak}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold themed-text">{s.assigned}</span>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold" style={{ color: "#10b981" }}>{s.completed}</span>
              </div>

              <div className="text-center">
                <span
                  className="text-sm font-semibold"
                  style={{ color: s.overdue > 0 ? "#ef4444" : "var(--muted)" }}
                >
                  {s.overdue}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: s.onTrackPct >= 75 ? "#10b981" : s.onTrackPct >= 50 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {s.onTrackPct}%
                </span>
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.onTrackPct}%`,
                      backgroundColor: s.onTrackPct >= 75 ? "#10b981" : s.onTrackPct >= 50 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: (statusColor[s.status] ?? "#6b7280") + "22",
                    color: statusColor[s.status] ?? "#6b7280",
                  }}
                >
                  {statusIcon[s.status] ?? ""} {statusLabel[s.status] ?? s.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Blockers Board ───────────────────────────────────────────────
export function BlockersBoard({
  members,
  tasks,
  onUnblock,
  onEscalate,
}: {
  members: TeamMember[];
  tasks: Task[];
  onUnblock: (taskId: string) => void;
  onEscalate: (task: Task) => void;
}) {
  const blockers = tasks.filter((t) => t.status === "waiting");

  if (blockers.length === 0) {
    return (
      <div className="card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b themed-border">
          <h2 className="text-sm font-semibold themed-text">Blockers Board</h2>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm themed-muted">No blockers. Team is unblocked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b themed-border flex items-center justify-between">
        <h2 className="text-sm font-semibold themed-text">Blockers Board</h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
        >
          {blockers.length} blocked
        </span>
      </div>
      <div className="divide-y themed-border">
        {blockers.map((task) => {
          const assignee = members.find((m) => m.id === task.assigned_to);
          const blockedSince = task.updated_at
            ? new Date(task.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "Unknown";
          const daysSince = task.updated_at
            ? Math.floor((Date.now() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return (
            <div key={task.id} className="px-5 py-3 flex items-start gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? "#6b7280" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium themed-text truncate">{task.title}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {assignee ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ backgroundColor: assignee.avatarColor }}
                      >
                        {getInitials(assignee.name)}
                      </div>
                      <span className="text-xs themed-muted">{assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs themed-muted">Unassigned</span>
                  )}
                  <span className="text-xs themed-muted">
                    Blocked since {blockedSince}
                    {daysSince > 0 && (
                      <span className="ml-1 font-medium" style={{ color: daysSince >= 3 ? "#ef4444" : "#f59e0b" }}>
                        ({daysSince}d)
                      </span>
                    )}
                  </span>
                  {task.client && <span className="text-xs themed-muted">Client: {task.client}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onUnblock(task.id)}
                  className="text-xs px-2.5 py-1 rounded-xl font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#10b98122", color: "#10b981" }}
                >
                  Unblock
                </button>
                {assignee?.slackId && (
                  <button
                    onClick={() => onEscalate(task)}
                    className="text-xs px-2.5 py-1 rounded-xl font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
                  >
                    Escalate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Deadline Item (internal helper) ─────────────────────────────
function DeadlineItem({
  task,
  daysLeft,
  assignee,
  color,
}: {
  task: Task;
  daysLeft: number;
  assignee?: TeamMember;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs themed-text flex-1 truncate">{task.title}</span>
      {assignee && (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
          style={{ backgroundColor: assignee.avatarColor }}
          title={assignee.name}
        >
          {getInitials(assignee.name)}
        </div>
      )}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 whitespace-nowrap"
        style={{ backgroundColor: color + "22", color }}
      >
        {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? "Today" : `${daysLeft}d`}
      </span>
    </div>
  );
}

// ─── Deadlines Timeline ───────────────────────────────────────────
export function DeadlinesTimeline({
  members,
  tasks,
}: {
  members: TeamMember[];
  tasks: Task[];
}) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const in14 = new Date(now);
  in14.setDate(in14.getDate() + 14);
  const in14Str = in14.toISOString().split("T")[0];

  function dayColor(daysLeft: number) {
    if (daysLeft < 0) return "#ef4444";
    if (daysLeft <= 3) return "#f59e0b";
    return "#10b981";
  }

  function dayLabel(dateStr: string, daysLeft: number) {
    if (daysLeft < 0) return `Overdue (${Math.abs(daysLeft)}d ago)`;
    if (daysLeft === 0) return "Today";
    if (daysLeft === 1) return "Tomorrow";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  const overdue = tasks
    .filter((t) => t.due_date && t.due_date < todayStr && t.status !== "completed")
    .map((t) => ({
      task: t,
      daysLeft: Math.ceil((new Date(t.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

  const upcoming = tasks
    .filter((t) => t.due_date && t.due_date >= todayStr && t.due_date <= in14Str && t.status !== "completed")
    .map((t) => ({
      task: t,
      daysLeft: Math.ceil((new Date(t.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => (a.task.due_date ?? "").localeCompare(b.task.due_date ?? ""));

  const grouped: Record<string, { task: Task; daysLeft: number }[]> = {};
  for (const item of upcoming) {
    const key = item.task.due_date ?? "unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  if (overdue.length === 0 && upcoming.length === 0) {
    return (
      <div className="card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b themed-border">
          <h2 className="text-sm font-semibold themed-text">Deadlines Timeline</h2>
          <p className="text-xs themed-muted mt-0.5">Next 14 days</p>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm themed-muted">No upcoming deadlines in the next 14 days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b themed-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold themed-text">Deadlines Timeline</h2>
          <p className="text-xs themed-muted mt-0.5">Next 14 days</p>
        </div>
        <span className="text-xs themed-muted">{upcoming.length + overdue.length} tasks</span>
      </div>
      <div className="divide-y themed-border">
        {overdue.length > 0 && (
          <div className="px-5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#ef4444" }} />
              <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>Overdue</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
              >
                {overdue.length}
              </span>
            </div>
            <div className="space-y-1.5 pl-4">
              {overdue.map(({ task, daysLeft }) => (
                <DeadlineItem
                  key={task.id}
                  task={task}
                  daysLeft={daysLeft}
                  assignee={members.find((m) => m.id === task.assigned_to)}
                  color="#ef4444"
                />
              ))}
            </div>
          </div>
        )}
        {Object.keys(grouped).sort().map((dateStr) => {
          const items = grouped[dateStr];
          const daysLeft = items[0].daysLeft;
          const color = dayColor(daysLeft);
          return (
            <div key={dateStr} className="px-5 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold" style={{ color }}>{dayLabel(dateStr, daysLeft)}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                  style={{ backgroundColor: color + "22", color }}
                >
                  {items.length}
                </span>
              </div>
              <div className="space-y-1.5 pl-4">
                {items.map(({ task }) => (
                  <DeadlineItem
                    key={task.id}
                    task={task}
                    daysLeft={daysLeft}
                    assignee={members.find((m) => m.id === task.assigned_to)}
                    color={color}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly Summary ───────────────────────────────────────────────
export function WeeklySummary({
  members,
  tasks,
  statsMap,
}: {
  members: TeamMember[];
  tasks: Task[];
  statsMap: Record<string, AccountabilityStats>;
}) {
  const [open, setOpen] = useState(false);

  const now = new Date();
  const weekStartStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const prevWeekStartStr = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const completedThisWeek = tasks.filter(
    (t) => t.status === "completed" && t.updated_at >= weekStartStr
  ).length;
  const completedLastWeek = tasks.filter(
    (t) => t.status === "completed" && t.updated_at >= prevWeekStartStr && t.updated_at < weekStartStr
  ).length;
  const blockerCount = tasks.filter((t) => t.status === "waiting").length;

  let topMember: TeamMember | null = null;
  let topCompleted = -1;
  for (const m of members) {
    const s = statsMap[m.id];
    if (s && s.completed > topCompleted) { topCompleted = s.completed; topMember = m; }
  }

  let mostBlockedMember: TeamMember | null = null;
  let maxBlocked = 0;
  for (const m of members) {
    const count = tasks.filter((t) => t.assigned_to === m.id && t.status === "waiting").length;
    if (count > maxBlocked) { maxBlocked = count; mostBlockedMember = m; }
  }

  const velocity = completedLastWeek > 0
    ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
    : null;

  return (
    <div className="card rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold themed-text">Weekly Summary</h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            This week
          </span>
        </div>
        <span className="themed-muted text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Top Performer",
              content: topMember ? (
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: topMember.avatarColor }}
                  >
                    {getInitials(topMember.name)}
                  </div>
                  <span className="text-sm font-semibold themed-text truncate">{topMember.name.split(" ")[0]}</span>
                </div>
              ) : <span className="text-xs themed-muted">No data</span>,
            },
            {
              label: "Most Blocked",
              content: mostBlockedMember ? (
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ backgroundColor: mostBlockedMember.avatarColor }}
                  >
                    {getInitials(mostBlockedMember.name)}
                  </div>
                  <span className="text-sm font-semibold themed-text truncate">{mostBlockedMember.name.split(" ")[0]}</span>
                </div>
              ) : <span className="text-xs themed-muted">No blockers</span>,
            },
            {
              label: "Team Velocity",
              content: (
                <div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold themed-text">{completedThisWeek}</span>
                    <span className="text-xs themed-muted">vs {completedLastWeek} last wk</span>
                  </div>
                  {velocity !== null && (
                    <span className="text-[10px] font-medium" style={{ color: velocity >= 0 ? "#10b981" : "#ef4444" }}>
                      {velocity >= 0 ? "+" : ""}{velocity}%
                    </span>
                  )}
                </div>
              ),
            },
            {
              label: "Open Blockers",
              content: (
                <div>
                  <span className="text-lg font-bold mt-1 block" style={{ color: blockerCount > 0 ? "#ef4444" : "#10b981" }}>
                    {blockerCount}
                  </span>
                  <span className="text-[10px] themed-muted">unresolved</span>
                </div>
              ),
            },
          ].map(({ label, content }) => (
            <div
              key={label}
              className="rounded-xl p-3 flex flex-col gap-1"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide themed-muted">{label}</span>
              {content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
