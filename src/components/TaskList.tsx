"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, Project, TaskStatus } from "@/lib/types";

interface Props {
  compact?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  today: " themed-secondary",
  "in-progress": " themed-secondary",
  waiting: " themed-secondary",
  completed: "bg-emerald-500/20 text-emerald-400",
};

const priorityDots: Record<string, string> = {
  low: "themed-text",
  medium: "themed-secondary",
  high: "text-red-500",
};

export function TaskList({ compact }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("medium");

  const load = useCallback(() => {
    fetch("/api/tasks").then((r) => r.json()).then(setTasks);
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, project_id: projectId || null, priority, status: "today" }),
    });
    setTitle("");
    setProjectId("");
    setPriority("medium");
    setShowForm(false);
    load();
  };

  const cycleStatus = async (t: Task) => {
    const nextMap: Record<TaskStatus, TaskStatus> = {
      "today": "in-progress",
      "in-progress": "completed",
      "waiting": "in-progress",
      "completed": "today"
    };
    const next = nextMap[t.status];
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, status: next }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    load();
  };

  const pending = tasks.filter((t) => t.status !== "completed");
  const done = tasks.filter((t) => t.status === "completed");
  const display = compact ? pending.slice(0, 6) : pending;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          {compact ? "Current Tasks" : "All Tasks"}
          {pending.length > 0 && (
            <span className="ml-2 text-xs themed-text font-normal">{pending.length} pending</span>
          )}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs  hover: px-3 py-1.5 rounded transition-colors"
        >
          {showForm ? "Cancel" : "+ Task"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full  border themed-border rounded px-3 py-2 text-sm focus:outline-none focus:themed-border"
          />
          <div className="flex gap-2">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex-1  border themed-border rounded px-3 py-2 text-sm"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className=" border themed-border rounded px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button
            onClick={add}
            className="w-full  hover:opacity-70 py-2 rounded text-sm font-medium"
          >
            Add Task
          </button>
        </div>
      )}

      <div className="space-y-2">
        {display.length === 0 && (
          <p className="text-sm themed-text italic">No pending tasks</p>
        )}
        {display.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 p-3  rounded-lg border themed-border hover:themed-border transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => cycleStatus(t)}
                className={`text-[10px] px-2 py-1 rounded font-medium ${statusColors[t.status]}`}
              >
                {t.status === "today" ? "TODAY" : t.status === "in-progress" ? "IN PROGRESS" : t.status === "waiting" ? "WAITING" : "DONE"}
              </button>
              <span className={`text-[10px] ${priorityDots[t.priority]}`}>●</span>
              <span className="text-sm truncate">{t.title}</span>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="themed-text hover:text-red-400 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {done.length > 0 && !compact && (
        <div className="mt-4 pt-4 border-t themed-border">
          <h4 className="text-xs font-medium themed-text mb-2">Completed ({done.length})</h4>
          <div className="space-y-2 opacity-50">
            {done.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2 line-through themed-text">
                <span className="text-[10px]">✓</span>
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
