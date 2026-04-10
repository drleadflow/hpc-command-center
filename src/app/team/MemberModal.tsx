"use client";

import { useState } from "react";
import type { TeamMember, Department, Task } from "@/lib/types";
import { DEPARTMENTS, AVATAR_COLORS } from "@/lib/types";

interface SlackMember {
  id: string;
  name: string;
  display: string;
  avatar: string | null;
}

interface Props {
  member?: TeamMember;
  onSave: (member: TeamMember) => void;
  onClose: () => void;
  slackMembers?: SlackMember[];
  tasks?: Task[];
  onAssignTask?: (taskId: string) => Promise<void>;
}

type Tab = "info" | "accountability";

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

// ─── Accountability Tab ───────────────────────────────────────────

function AccountabilityTab({
  member,
  tasks,
  onAssignTask,
}: {
  member: TeamMember;
  tasks: Task[];
  onAssignTask?: (taskId: string) => Promise<void>;
}) {
  const memberTasks = tasks.filter((t) => t.assigned_to === member.id);
  const unassigned = tasks.filter((t) => !t.assigned_to);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const todayStr = new Date().toISOString().split("T")[0];

  const completed = memberTasks.filter((t) => t.status === "completed");
  const inProgress = memberTasks.filter((t) => t.status === "in-progress" || t.status === "today");
  const blocked = memberTasks.filter((t) => t.status === "waiting");
  const overdue = memberTasks.filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== "completed"
  );

  // Weekly trend: tasks completed per week for last 4 weeks
  const now = new Date();
  const weeklyData: number[] = [];
  for (let w = 3; w >= 0; w--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const count = completed.filter(
      (t) => t.updated_at >= weekStartStr && t.updated_at < weekEndStr
    ).length;
    weeklyData.push(count);
  }
  const maxBar = Math.max(...weeklyData, 1);

  const handleAssign = async (taskId: string) => {
    if (!onAssignTask) return;
    setAssigning(taskId);
    try {
      await onAssignTask(taskId);
      setAssigned((prev) => new Set([...prev, taskId]));
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Assigned", value: memberTasks.length, color: "var(--text)" },
          { label: "Done", value: completed.length, color: "#10b981" },
          { label: "Overdue", value: overdue.length, color: overdue.length > 0 ? "#ef4444" : "var(--muted)" },
          { label: "Blocked", value: blocked.length, color: blocked.length > 0 ? "#8b5cf6" : "var(--muted)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <p className="text-lg font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-[10px] themed-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Performance trend — last 4 weeks */}
      <div>
        <p className="text-xs font-semibold themed-muted uppercase tracking-wide mb-2">
          Tasks Completed — Last 4 Weeks
        </p>
        <div className="flex items-end gap-2 h-16">
          {weeklyData.map((count, i) => {
            const pct = maxBar > 0 ? Math.max((count / maxBar) * 100, count > 0 ? 8 : 0) : 0;
            const weekLabel = i === 3 ? "This wk" : i === 2 ? "Last wk" : `${(3 - i) * 7}d ago`;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold themed-text">{count}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${pct}%`,
                    minHeight: count > 0 ? "4px" : "0px",
                    backgroundColor: i === 3 ? "var(--accent)" : "var(--border)",
                  }}
                />
                <span className="text-[9px] themed-muted whitespace-nowrap">{weekLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task history */}
      {memberTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold themed-muted uppercase tracking-wide mb-2">
            Task History
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...inProgress, ...blocked, ...overdue, ...completed].map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{
                    backgroundColor: (STATUS_COLORS[task.status] ?? "#6b7280") + "22",
                    color: STATUS_COLORS[task.status] ?? "#6b7280",
                  }}
                >
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
                <span className="text-xs themed-text flex-1 truncate">{task.title}</span>
                {task.due_date && (
                  <span
                    className="text-[10px] flex-shrink-0 themed-muted"
                    style={{
                      color:
                        task.due_date < todayStr && task.status !== "completed"
                          ? "#ef4444"
                          : undefined,
                    }}
                  >
                    {new Date(task.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Task quick action */}
      {onAssignTask && unassigned.length > 0 && (
        <div>
          <p className="text-xs font-semibold themed-muted uppercase tracking-wide mb-2">
            Assign a Task
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {unassigned.map((task) => {
              const isAssigned = assigned.has(task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs themed-text flex-1 truncate">{task.title}</span>
                  <button
                    onClick={() => handleAssign(task.id)}
                    disabled={assigning === task.id || isAssigned}
                    className="text-[10px] px-2 py-0.5 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50 flex-shrink-0"
                    style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
                  >
                    {isAssigned ? "Assigned" : assigning === task.id ? "..." : "Assign"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {memberTasks.length === 0 && unassigned.length === 0 && (
        <p className="text-sm themed-muted text-center py-4">No task data available.</p>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────

export function MemberModal({
  member,
  onSave,
  onClose,
  slackMembers = [],
  tasks = [],
  onAssignTask,
}: Props) {
  const isEdit = !!member;
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [department, setDepartment] = useState<Department>(member?.department ?? "marketing");
  const [slackId, setSlackId] = useState(member?.slackId ?? "");
  const [avatarColor, setAvatarColor] = useState(member?.avatarColor ?? AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const result: TeamMember = {
        id: member?.id ?? crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        department,
        avatarColor,
        slackId: slackId || null,
        created_at: member?.created_at ?? now,
        updated_at: now,
      };
      onSave(result);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full md:max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b themed-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {member && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: member.avatarColor }}
              >
                {getInitials(member.name)}
              </div>
            )}
            <h2 className="text-base font-semibold themed-text">
              {isEdit ? member!.name : "Add Team Member"}
            </h2>
          </div>
          <button onClick={onClose} className="themed-muted hover:opacity-60 text-lg">
            ✕
          </button>
        </div>

        {/* Tabs — only show when editing */}
        {isEdit && (
          <div
            className="flex border-b themed-border flex-shrink-0"
            style={{ backgroundColor: "var(--bg)" }}
          >
            {(["info", "accountability"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 text-xs font-semibold capitalize transition-colors"
                style={{
                  color: activeTab === tab ? "var(--accent)" : "var(--muted)",
                  borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {tab === "info" ? "Profile" : "Accountability"}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === "accountability" && isEdit ? (
            <AccountabilityTab
              member={member!}
              tasks={tasks}
              onAssignTask={onAssignTask}
            />
          ) : (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                  Role
                </label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Video Editor, Ad Strategist"
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon} {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slack Account */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                  Slack Account
                </label>
                <select
                  value={slackId}
                  onChange={(e) => setSlackId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <option value="">— No Slack account —</option>
                  {slackMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.display && s.display !== s.name ? ` (${s.display})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Color */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                  Avatar Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {avatarColor === color && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only shown on info tab */}
        {activeTab === "info" && (
          <div className="flex items-center justify-between px-6 py-4 border-t themed-border flex-shrink-0 gap-3">
            {isEdit ? (
              <button
                onClick={() => onSave({ ...member!, _delete: true } as any)}
                className="text-sm px-4 py-2 rounded-xl font-medium transition-colors"
                style={{ color: "var(--danger)", backgroundColor: "rgba(185,28,28,0.08)" }}
              >
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-xl border themed-border themed-text hover:opacity-70 transition-opacity"
                style={{ backgroundColor: "var(--bg)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="text-sm px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
