"use client";

import { useState } from "react";
import type { Task, TaskStatus, Department } from "@/lib/types";
import { useRouter } from "next/navigation";

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  color: string;
  department: Department;
}

const statusColors: Record<TaskStatus, string> = {
  "today": "#f59e0b",
  "in-progress": "#3b82f6",
  "waiting": "#8b5cf6",
  "completed": "#10b981"
};

const allStatuses: { value: TaskStatus; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "in-progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "completed", label: "Completed" },
];

export function TaskColumn({ title, status, tasks, color, department }: TaskColumnProps) {
  const router = useRouter();
  const columnColor = statusColors[status];
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [saving, setSaving] = useState(false);

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus })
    });
    router.refresh();
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const id = Math.random().toString(36).substring(2, 15);
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          department,
          title: newTitle.trim(),
          description: "",
          status,
          priority: newPriority,
          project_id: null,
        })
      });
      setNewTitle("");
      setAdding(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border card flex flex-col h-[600px]">
      {/* Column Header */}
      <div 
        className="p-4 border-b flex items-center justify-between"
        style={{ borderBottomColor: `${columnColor}30` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: columnColor }} />
          <h3 className="font-semibold themed-text text-sm">{title}</h3>
          <span className="text-xs themed-muted px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center themed-muted hover:themed-text hover: transition-colors text-lg leading-none"
          title="Add task"
        >
          +
        </button>
      </div>

      {/* Task Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 && !adding && (
          <div className="text-center py-8 themed-muted text-sm">
            No tasks
          </div>
        )}
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            color={color}
            onMove={moveTask}
          />
        ))}

        {/* Add task inline form */}
        {adding && (
          <div className="rounded-2xl p-3 border themed-border space-y-2" style={{backgroundColor:"var(--surface)"}}>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") addTask();
                if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
              }}
              placeholder="Task title..."
              className="w-full  border themed-border rounded px-2 py-1.5 text-sm themed-text placeholder:themed-muted focus:outline-none focus:themed-border"
            />
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as any)}
                className="flex-1  border themed-border rounded px-2 py-1 text-xs themed-text focus:outline-none"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={addTask}
                disabled={saving || !newTitle.trim()}
                className="px-3 py-1  text-white text-xs rounded hover: disabled:opacity-40 transition-colors"
              >
                {saving ? "..." : "Add"}
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle(""); }}
                className="px-2 py-1 themed-muted hover:themed-text text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  color: string;
  onMove: (id: string, status: TaskStatus) => void;
}

function TaskCard({ task, color, onMove }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const priorityColors = {
    high: "text-red-400 bg-red-400/10 border-red-400/20",
    medium: "themed-secondary  border-amber-400/20",
    low: "themed-muted  themed-border"
  };

  const allStatuses: { value: TaskStatus; label: string; color: string }[] = [
    { value: "today", label: "Today", color: "#f59e0b" },
    { value: "in-progress", label: "In Progress", color: "#3b82f6" },
    { value: "waiting", label: "Waiting", color: "#8b5cf6" },
    { value: "completed", label: "Done", color: "#10b981" },
  ];

  const saveEdit = async () => {
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, title: editTitle, description: editDesc })
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await fetch(`/api/tasks?id=${task.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="rounded-2xl border transition-all hover:shadow-sm" style={{backgroundColor:"var(--bg)",borderColor:"var(--border)"}}>
      {/* Card header - always visible */}
      <div
        className="p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm themed-text font-medium leading-snug">{task.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className="themed-muted text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
        {!expanded && task.description && (
          <p className="text-xs themed-muted mt-1 line-clamp-1">{task.description}</p>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t themed-border pt-3">
          {editing ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full  border themed-border rounded px-2 py-1.5 text-sm themed-text focus:outline-none focus:themed-border"
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Add description..."
                className="w-full  border themed-border rounded px-2 py-1.5 text-xs themed-text placeholder:themed-muted focus:outline-none focus:themed-border resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-3 py-1  text-white text-xs rounded hover: disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditTitle(task.title); setEditDesc(task.description || ""); }}
                  className="px-2 py-1 themed-muted hover:themed-text text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {task.description ? (
                <p className="text-xs themed-muted leading-relaxed">{task.description}</p>
              ) : (
                <p className="text-xs themed-muted italic">No description</p>
              )}

              {/* Move to status buttons */}
              <div className="space-y-1">
                <p className="text-xs themed-muted uppercase tracking-wide">Move to</p>
                <div className="flex flex-wrap gap-1">
                  {allStatuses.filter(s => s.value !== task.status).map(s => (
                    <button
                      key={s.value}
                      onClick={() => onMove(task.id, s.value)}
                      className="text-xs px-2 py-1 rounded border transition-colors"
                      style={{ 
                        color: s.color, 
                        borderColor: `${s.color}40`,
                        backgroundColor: `${s.color}10`
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs themed-muted hover:themed-text transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={deleteTask}
                  className="text-xs text-red-500/60 hover:text-red-400 transition-colors"
                >
                  🗑 Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
