"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TeamMember, Task, Department } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { MemberModal } from "./MemberModal";

interface SlackMember {
  id: string;
  name: string;
  display: string;
  avatar: string | null;
}

export interface AccountabilityStats {
  assigned: number;
  completed: number;
  overdue: number;
  onTrackPct: number;
  streak: number;
  status: "on-track" | "at-capacity" | "behind";
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getDeptInfo(id: Department) {
  return DEPARTMENTS.find((d) => d.id === id) ?? { label: id, icon: "◈", color: "#6b7280" };
}

const STATUS_LABELS: Record<string, string> = {
  today: "Today",
  "in-progress": "In Progress",
  waiting: "Waiting",
  completed: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  today: "#f59e0b",
  "in-progress": "#3b82f6",
  waiting: "#8b5cf6",
  completed: "#10b981",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6b7280",
};

// ─── Accountability helpers ────────────────────────────────────────

function computeAccountabilityStats(memberId: string, tasks: Task[]): AccountabilityStats {
  const memberTasks = tasks.filter((t) => t.assigned_to === memberId);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const completed = memberTasks.filter((t) => t.status === "completed").length;
  const overdue = memberTasks.filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== "completed"
  ).length;
  const assigned = memberTasks.length;

  const withDueDate = memberTasks.filter((t) => t.due_date && t.status === "completed");
  const onTime = withDueDate.filter((t) => t.updated_at.split("T")[0] <= t.due_date!).length;
  const onTrackPct = withDueDate.length > 0 ? Math.round((onTime / withDueDate.length) * 100) : 100;

  // Streak: consecutive days (last N days) with at least 1 completed task
  let streak = 0;
  const completedTasks = memberTasks.filter((t) => t.status === "completed");
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    const hadCompletion = completedTasks.some((t) => t.updated_at.startsWith(dStr));
    if (hadCompletion) {
      streak++;
    } else {
      break;
    }
  }

  let status: AccountabilityStats["status"] = "on-track";
  if (overdue >= 2 || onTrackPct < 50) status = "behind";
  else if (overdue === 1 || assigned >= 6) status = "at-capacity";

  return { assigned, completed, overdue, onTrackPct, streak, status };
}

function computeWeeklySummary(
  members: TeamMember[],
  tasks: Task[],
  statsMap: Record<string, AccountabilityStats>
) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);
  const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];

  const completedThisWeek = tasks.filter(
    (t) => t.status === "completed" && t.updated_at >= weekStartStr
  ).length;
  const completedLastWeek = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.updated_at >= prevWeekStartStr &&
      t.updated_at < weekStartStr
  ).length;

  const blockerCount = tasks.filter((t) => t.status === "waiting").length;

  // Top performer: most completed tasks
  let topMember: TeamMember | null = null;
  let topCompleted = -1;
  for (const m of members) {
    const s = statsMap[m.id];
    if (s && s.completed > topCompleted) {
      topCompleted = s.completed;
      topMember = m;
    }
  }

  // Most blocked
  let mostBlockedMember: TeamMember | null = null;
  let maxOverdue = -1;
  for (const m of members) {
    const memberBlocked = tasks.filter(
      (t) => t.assigned_to === m.id && t.status === "waiting"
    ).length;
    if (memberBlocked > maxOverdue) {
      maxOverdue = memberBlocked;
      mostBlockedMember = m;
    }
  }
  if (maxOverdue === 0) mostBlockedMember = null;

  return { completedThisWeek, completedLastWeek, blockerCount, topMember, mostBlockedMember };
}

// ─── Ping Popup ───────────────────────────────────────────────────
function PingPopup({
  member,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
  const [channel, setChannel] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const ping = async (type: "dm" | "channel") => {
    if (!member.slackId) return;
    setSending(true);
    try {
      const body =
        type === "dm"
          ? { userId: member.slackId, message: `Hey ${member.name.split(" ")[0]}! 👋` }
          : {
              channel: channel.replace(/^#/, ""),
              message: `<@${member.slackId}> — heads up!`,
            };
      await fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSent(type === "dm" ? "DM sent!" : "Posted to channel!");
      setTimeout(() => { setSent(null); onClose(); }, 1500);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-20 rounded-2xl shadow-lg p-3 w-56 space-y-2"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {sent ? (
        <p className="text-xs text-center py-2" style={{ color: "#10b981" }}>{sent}</p>
      ) : (
        <>
          <button
            onClick={() => ping("dm")}
            disabled={sending}
            className="w-full text-left text-sm px-3 py-2 rounded-xl transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            💬 DM on Slack
          </button>
          <div className="space-y-1">
            <input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="#channel-name"
              className="w-full rounded-xl px-3 py-1.5 text-xs border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }}
            />
            <button
              onClick={() => ping("channel")}
              disabled={sending || !channel.trim()}
              className="w-full text-sm px-3 py-2 rounded-xl transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              📢 Post to Channel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Member Card ─────────────────────────────────────────────────
function MemberCard({
  member,
  onClick,
}: {
  member: TeamMember;
  onClick: () => void;
}) {
  const [pingOpen, setPingOpen] = useState(false);
  const dept = getDeptInfo(member.department);

  return (
    <div
      className="card rounded-2xl p-5 cursor-pointer group relative hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          style={{ backgroundColor: member.avatarColor }}
        >
          {getInitials(member.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm themed-text truncate">{member.name}</span>
            {/* Slack status dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: member.slackId ? "#10b981" : "#6b7280" }}
              title={member.slackId ? "Linked to Slack" : "No Slack account"}
            />
          </div>
          <p className="text-xs themed-muted truncate mt-0.5">{member.role || "—"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: dept.color + "22",
                color: dept.color,
              }}
            >
              {dept.icon} {dept.label}
            </span>
          </div>
          <p className="text-xs themed-muted mt-1.5 truncate">{member.email}</p>
        </div>
      </div>

      {/* Ping button — visible on hover, only if slack linked */}
      {member.slackId && (
        <div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={() => setPingOpen((v) => !v)}
              className="text-xs px-2.5 py-1 rounded-xl font-medium transition-colors"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
            >
              Ping
            </button>
            {pingOpen && (
              <PingPopup member={member} onClose={() => setPingOpen(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────
function TaskRow({
  task,
  members,
  onReassign,
}: {
  task: Task;
  members: TeamMember[];
  onReassign: (taskId: string, memberId: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:opacity-80 transition-opacity group">
      <span
        className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
        style={{
          backgroundColor: (STATUS_COLORS[task.status] ?? "#6b7280") + "22",
          color: STATUS_COLORS[task.status] ?? "#6b7280",
        }}
      >
        {STATUS_LABELS[task.status] ?? task.status}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? "#6b7280" }}
        title={task.priority}
      />
      <span className="text-sm themed-text flex-1 truncate">{task.title}</span>
      {/* Reassign dropdown */}
      <select
        value={task.assigned_to ?? ""}
        onChange={(e) => onReassign(task.id, e.target.value || null)}
        onClick={(e) => e.stopPropagation()}
        className="text-xs rounded-lg px-2 py-1 border themed-border themed-text focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Task Assignments Section ─────────────────────────────────────
function TaskAssignments({
  members,
  tasks,
  onReassign,
}: {
  members: TeamMember[];
  tasks: Task[];
  onReassign: (taskId: string, memberId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const assignedToMember = (memberId: string) =>
    tasks.filter((t) => t.assigned_to === memberId);

  const unassigned = tasks.filter(
    (t) => !t.assigned_to || !members.find((m) => m.id === t.assigned_to)
  );

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b themed-border">
        <h2 className="text-sm font-semibold themed-text">Task Assignments</h2>
      </div>
      <div className="divide-y themed-border">
        {members.map((member) => {
          const memberTasks = assignedToMember(member.id);
          const open = expanded[member.id] ?? false;
          return (
            <div key={member.id}>
              <button
                onClick={() => toggle(member.id)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {getInitials(member.name)}
                </div>
                <span className="text-sm themed-text font-medium flex-1 text-left">{member.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
                >
                  {memberTasks.length}
                </span>
                <span className="themed-muted text-xs">{open ? "▲" : "▼"}</span>
              </button>
              {open && (
                <div className="px-3 pb-3 space-y-0.5" style={{ backgroundColor: "var(--bg)" }}>
                  {memberTasks.length === 0 ? (
                    <p className="text-xs themed-muted px-3 py-2">No tasks assigned</p>
                  ) : (
                    memberTasks.map((t) => (
                      <TaskRow key={t.id} task={t} members={members} onReassign={onReassign} />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned */}
        <div>
          <button
            onClick={() => toggle("__unassigned__")}
            className="w-full flex items-center gap-3 px-5 py-3 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: "var(--border)", color: "var(--muted)" }}
            >
              ?
            </div>
            <span className="text-sm themed-muted font-medium flex-1 text-left">Unassigned</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "var(--border)", color: "var(--muted)" }}
            >
              {unassigned.length}
            </span>
            <span className="themed-muted text-xs">
              {expanded["__unassigned__"] ? "▲" : "▼"}
            </span>
          </button>
          {expanded["__unassigned__"] && (
            <div className="px-3 pb-3 space-y-0.5" style={{ backgroundColor: "var(--bg)" }}>
              {unassigned.length === 0 ? (
                <p className="text-xs themed-muted px-3 py-2">No unassigned tasks</p>
              ) : (
                unassigned.map((t) => (
                  <TaskRow key={t.id} task={t} members={members} onReassign={onReassign} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Accountability Scorecard ─────────────────────────────────────
type SortField = "name" | "assigned" | "onTrackPct" | "status";

function AccountabilityScorecard({
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
      const order = { "on-track": 0, "at-capacity": 1, behind: 2 };
      cmp = order[sa.status] - order[sb.status];
    }
    return sortAsc ? cmp : -cmp;
  });

  const statusIcon: Record<AccountabilityStats["status"], string> = {
    "on-track": "🟢",
    "at-capacity": "🟡",
    behind: "🔴",
  };
  const statusLabel: Record<AccountabilityStats["status"], string> = {
    "on-track": "On Track",
    "at-capacity": "At Capacity",
    behind: "Behind",
  };
  const statusColor: Record<AccountabilityStats["status"], string> = {
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

      {/* Header row */}
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
            assigned: 0,
            completed: 0,
            overdue: 0,
            onTrackPct: 100,
            streak: 0,
            status: "on-track" as const,
          };
          const dept = getDeptInfo(member.department);
          return (
            <div
              key={member.id}
              className="px-5 py-3 grid gap-2 items-center"
              style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr" }}
            >
              {/* Member */}
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
                      <span className="ml-1" title={`${s.streak}-day streak`}>
                        🔥{s.streak}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Assigned */}
              <div className="text-center">
                <span className="text-sm font-semibold themed-text">{s.assigned}</span>
              </div>

              {/* Completed */}
              <div className="text-center">
                <span className="text-sm font-semibold" style={{ color: "#10b981" }}>
                  {s.completed}
                </span>
              </div>

              {/* Overdue */}
              <div className="text-center">
                <span
                  className="text-sm font-semibold"
                  style={{ color: s.overdue > 0 ? "#ef4444" : "var(--muted)" }}
                >
                  {s.overdue}
                </span>
              </div>

              {/* On-track % */}
              <div className="flex flex-col items-center gap-1">
                <span
                  className="text-sm font-semibold"
                  style={{
                    color:
                      s.onTrackPct >= 75 ? "#10b981" : s.onTrackPct >= 50 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  {s.onTrackPct}%
                </span>
                <div
                  className="w-16 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${s.onTrackPct}%`,
                      backgroundColor:
                        s.onTrackPct >= 75 ? "#10b981" : s.onTrackPct >= 50 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: statusColor[s.status] + "22",
                    color: statusColor[s.status],
                  }}
                >
                  {statusIcon[s.status]} {statusLabel[s.status]}
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
function BlockersBoard({
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
            ? new Date(task.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "Unknown";
          const daysSince = task.updated_at
            ? Math.floor(
                (Date.now() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0;

          return (
            <div key={task.id} className="px-5 py-3 flex items-start gap-3">
              {/* Priority dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: PRIORITY_COLORS[task.priority] ?? "#6b7280" }}
              />

              {/* Task info */}
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
                      <span
                        className="ml-1 font-medium"
                        style={{ color: daysSince >= 3 ? "#ef4444" : "#f59e0b" }}
                      >
                        ({daysSince}d)
                      </span>
                    )}
                  </span>
                  {task.client && (
                    <span className="text-xs themed-muted">Client: {task.client}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
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

// ─── Deadlines Timeline ────────────────────────────────────────────
function DeadlinesTimeline({
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

  const upcoming = tasks
    .filter((t) => t.due_date && t.status !== "completed")
    .map((t) => {
      const daysLeft = Math.ceil(
        (new Date(t.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { task: t, daysLeft };
    })
    .filter(({ task }) => !task.due_date || task.due_date <= in14Str)
    .sort((a, b) => (a.task.due_date ?? "").localeCompare(b.task.due_date ?? ""));

  // Group by day
  const grouped: Record<string, { task: Task; daysLeft: number }[]> = {};
  for (const item of upcoming) {
    const key = item.task.due_date ?? "unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  // Also add overdue
  const overdue = tasks
    .filter((t) => t.due_date && t.due_date < todayStr && t.status !== "completed")
    .map((t) => {
      const daysLeft = Math.ceil(
        (new Date(t.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { task: t, daysLeft };
    });

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

  const allDates = [
    ...(overdue.length > 0 ? ["__overdue__"] : []),
    ...Object.keys(grouped).sort(),
  ];

  if (allDates.length === 0) {
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
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: "#ef4444" }}
              />
              <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                Overdue
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
              >
                {overdue.length}
              </span>
            </div>
            <div className="space-y-1.5 pl-4">
              {overdue.map(({ task, daysLeft }) => {
                const assignee = members.find((m) => m.id === task.assigned_to);
                return (
                  <DeadlineItem
                    key={task.id}
                    task={task}
                    daysLeft={daysLeft}
                    assignee={assignee}
                    color="#ef4444"
                  />
                );
              })}
            </div>
          </div>
        )}
        {Object.keys(grouped)
          .sort()
          .map((dateStr) => {
            const items = grouped[dateStr];
            const { daysLeft } = items[0];
            const color = dayColor(daysLeft);
            return (
              <div key={dateStr} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-semibold" style={{ color }}>
                    {dayLabel(dateStr, daysLeft)}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                    style={{ backgroundColor: color + "22", color }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="space-y-1.5 pl-4">
                  {items.map(({ task }) => {
                    const assignee = members.find((m) => m.id === task.assigned_to);
                    return (
                      <DeadlineItem
                        key={task.id}
                        task={task}
                        daysLeft={daysLeft}
                        assignee={assignee}
                        color={color}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

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

// ─── Weekly Summary ───────────────────────────────────────────────
function WeeklySummary({
  members,
  tasks,
  statsMap,
}: {
  members: TeamMember[];
  tasks: Task[];
  statsMap: Record<string, AccountabilityStats>;
}) {
  const [open, setOpen] = useState(false);
  const { completedThisWeek, completedLastWeek, blockerCount, topMember, mostBlockedMember } =
    computeWeeklySummary(members, tasks, statsMap);

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
          {/* Top Performer */}
          <div
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide themed-muted">
              Top Performer
            </span>
            {topMember ? (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: topMember.avatarColor }}
                >
                  {getInitials(topMember.name)}
                </div>
                <span className="text-sm font-semibold themed-text truncate">
                  {topMember.name.split(" ")[0]}
                </span>
              </div>
            ) : (
              <span className="text-xs themed-muted">No data</span>
            )}
          </div>

          {/* Most Blocked */}
          <div
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide themed-muted">
              Most Blocked
            </span>
            {mostBlockedMember ? (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: mostBlockedMember.avatarColor }}
                >
                  {getInitials(mostBlockedMember.name)}
                </div>
                <span className="text-sm font-semibold themed-text truncate">
                  {mostBlockedMember.name.split(" ")[0]}
                </span>
              </div>
            ) : (
              <span className="text-xs themed-muted">No blockers</span>
            )}
          </div>

          {/* Team Velocity */}
          <div
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide themed-muted">
              Team Velocity
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold themed-text">{completedThisWeek}</span>
              <span className="text-xs themed-muted">vs {completedLastWeek} last wk</span>
            </div>
            {velocity !== null && (
              <span
                className="text-[10px] font-medium"
                style={{ color: velocity >= 0 ? "#10b981" : "#ef4444" }}
              >
                {velocity >= 0 ? "+" : ""}{velocity}%
              </span>
            )}
          </div>

          {/* Unresolved Blockers */}
          <div
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide themed-muted">
              Open Blockers
            </span>
            <span
              className="text-lg font-bold mt-1"
              style={{ color: blockerCount > 0 ? "#ef4444" : "#10b981" }}
            >
              {blockerCount}
            </span>
            <span className="text-[10px] themed-muted">unresolved</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main TeamPage ────────────────────────────────────────────────
export function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [slackMembers, setSlackMembers] = useState<SlackMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMember, setModalMember] = useState<TeamMember | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [membersRes, tasksRes, slackRes] = await Promise.allSettled([
        fetch("/api/team").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/slack/members").then((r) => r.json()),
      ]);
      if (membersRes.status === "fulfilled" && Array.isArray(membersRes.value)) {
        setMembers(membersRes.value);
      }
      if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value)) {
        setTasks(tasksRes.value);
      }
      if (slackRes.status === "fulfilled") {
        const slackData = slackRes.value?.members ?? slackRes.value;
        if (Array.isArray(slackData)) setSlackMembers(slackData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setModalMember(undefined);
    setModalOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setModalMember(m);
    setModalOpen(true);
  };

  const handleSave = async (saved: TeamMember & { _delete?: boolean }) => {
    const isDelete = (saved as any)._delete === true;
    const isNew = !members.find((m) => m.id === saved.id);

    // Optimistic update
    if (isDelete) {
      setMembers((prev) => prev.filter((m) => m.id !== saved.id));
    } else if (isNew) {
      setMembers((prev) => [...prev, saved]);
    } else {
      setMembers((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
    }

    setModalOpen(false);

    // Sync to API
    try {
      if (isDelete) {
        await fetch(`/api/team?id=${saved.id}`, { method: "DELETE" });
      } else if (isNew) {
        await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saved),
        });
      } else {
        await fetch("/api/team", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saved),
        });
      }
    } catch {
      // Revert on failure
      load();
    }
  };

  const handleReassign = async (taskId: string, memberId: string | null) => {
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assigned_to: memberId } : t))
    );
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, assigned_to: memberId }),
      });
    } catch {
      load();
    }
  };

  const handleUnblock = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in-progress" as const } : t))
    );
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: "in-progress" }),
      });
    } catch {
      load();
    }
  };

  const handleEscalate = async (task: Task) => {
    const assignee = members.find((m) => m.id === task.assigned_to);
    if (!assignee?.slackId) return;
    try {
      await fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assignee.slackId,
          message: `Hey ${assignee.name.split(" ")[0]}, task *"${task.title}"* is blocked and needs attention. Can you unblock it?`,
        }),
      });
    } catch {
      // non-fatal
    }
  };

  // Compute accountability stats per member from tasks
  const statsMap: Record<string, AccountabilityStats> = {};
  for (const member of members) {
    statsMap[member.id] = computeAccountabilityStats(member.id, tasks);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm themed-muted">Loading team…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold themed-text">Team</h1>
          <p className="text-sm themed-muted mt-0.5">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="text-sm px-4 py-2 rounded-xl text-white font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--accent)" }}
        >
          + Add Member
        </button>
      </div>

      {/* Member Roster */}
      {members.length === 0 ? (
        <div className="card rounded-2xl p-10 text-center">
          <p className="themed-muted text-sm">No team members yet.</p>
          <button
            onClick={openCreate}
            className="mt-3 text-sm px-4 py-2 rounded-xl text-white font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Add your first member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} onClick={() => openEdit(m)} />
          ))}
        </div>
      )}

      {/* Weekly Summary — collapsible */}
      {members.length > 0 && (
        <WeeklySummary members={members} tasks={tasks} statsMap={statsMap} />
      )}

      {/* Accountability Scorecard */}
      {members.length > 0 && (
        <AccountabilityScorecard members={members} statsMap={statsMap} />
      )}

      {/* Blockers Board + Deadlines Timeline side by side on lg */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlockersBoard
            members={members}
            tasks={tasks}
            onUnblock={handleUnblock}
            onEscalate={handleEscalate}
          />
          <DeadlinesTimeline members={members} tasks={tasks} />
        </div>
      )}

      {/* Task Assignments */}
      {tasks.length > 0 && (
        <TaskAssignments
          members={members}
          tasks={tasks}
          onReassign={handleReassign}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <MemberModal
          member={modalMember}
          slackMembers={slackMembers}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          tasks={tasks}
          onAssignTask={async (taskId: string) => {
            if (!modalMember) return;
            await handleReassign(taskId, modalMember.id);
          }}
        />
      )}
    </div>
  );
}
