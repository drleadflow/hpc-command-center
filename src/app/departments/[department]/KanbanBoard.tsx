"use client";

import { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import type { Task, TaskStatus, Department, TeamMember } from "@/lib/types";
import { AssigneeSelect } from "@/components/AssigneeSelect";

// ── Task Detail Modal ────────────────────────────────────────────
function TaskModal({ task, onClose, onUpdate, onDelete }: {
  task: Task;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState({ ...task });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      onUpdate(editing);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const PRIORITY_COLORS = {
    high: { bg: "#fef2f2", color: "var(--danger)" },
    medium: { bg: "#fffbeb", color: "var(--warning)" },
    low: { bg: "var(--bg)", color: "var(--muted)" },
  };

  const STATUS_OPTIONS: TaskStatus[] = ["today", "in-progress", "waiting", "completed"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b themed-border">
          <input
            value={editing.title}
            onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
            className="text-lg font-serif themed-text bg-transparent border-none focus:outline-none w-full leading-snug"
            style={{ fontWeight: 400 }}
          />
          <button onClick={onClose} className="themed-muted hover:opacity-60 ml-4 text-lg shrink-0">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Status</label>
              <select value={editing.status}
                onChange={e => setEditing(p => ({ ...p, status: e.target.value as TaskStatus }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none capitalize"
                style={{ backgroundColor: "var(--bg)" }}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Priority</label>
              <select value={editing.priority}
                onChange={e => setEditing(p => ({ ...p, priority: e.target.value as Task["priority"] }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none capitalize"
                style={{ backgroundColor: "var(--bg)" }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Assigned To</label>
            <AssigneeSelect
              value={editing.assigned_to || null}
              onChange={val => setEditing(p => ({ ...p, assigned_to: val }))}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Due Date</label>
            <input
              type="date"
              value={editing.due_date || ""}
              onChange={e => setEditing(p => ({ ...p, due_date: e.target.value || null }))}
              className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Notes / Description</label>
            <textarea
              value={editing.description || ""}
              onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
              rows={5}
              placeholder="Add notes, blockers, context..."
              className="w-full rounded-2xl px-4 py-3 text-sm border themed-border themed-text focus:outline-none resize-none"
              style={{ backgroundColor: "var(--bg)" }}
            />
          </div>

          {/* Meta */}
          <div className="flex gap-4 text-xs themed-muted">
            <span>Created {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>Updated {new Date(task.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t themed-border">
            <button onClick={() => { onDelete(task.id); onClose(); }}
              className="text-sm px-4 py-2 rounded-xl transition-colors"
              style={{ color: "var(--danger)", backgroundColor: "#fef2f2" }}>
              Delete
            </button>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="text-sm px-4 py-2 rounded-xl border themed-border themed-secondary">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="text-sm px-5 py-2 rounded-xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUSES: { id: TaskStatus; label: string; color: string }[] = [
  { id: "today", label: "Today", color: "#d97706" },
  { id: "in-progress", label: "In Progress", color: "var(--accent)" },
  { id: "waiting", label: "Waiting", color: "#b91c1c" },
  { id: "completed", label: "Done", color: "#6b7280" },
];

interface Props {
  initialTasks: Record<TaskStatus, Task[]>;
  color: string;
  department: Department;
}

export function KanbanBoard({ initialTasks, color, department }: Props) {
  const [columns, setColumns] = useState(initialTasks);
  const [adding, setAdding] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [memberMap, setMemberMap] = useState<Record<string, TeamMember>>({});
  const router = useRouter();

  // Load team members for assignee badges
  useEffect(() => {
    fetch("/api/team").then(r => r.json()).then((members: TeamMember[]) => {
      const map: Record<string, TeamMember> = {};
      for (const m of members) map[m.id] = m;
      setMemberMap(map);
    }).catch(() => {});
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStatus = source.droppableId as TaskStatus;
    const dstStatus = destination.droppableId as TaskStatus;

    // Optimistic update
    setColumns(prev => {
      const next = { ...prev };
      const srcList = [...prev[srcStatus]];
      const [moved] = srcList.splice(source.index, 1);
      const dstList = srcStatus === dstStatus ? srcList : [...prev[dstStatus]];
      dstList.splice(destination.index, 0, { ...moved, status: dstStatus });
      next[srcStatus] = srcStatus === dstStatus ? dstList : srcList;
      if (srcStatus !== dstStatus) next[dstStatus] = dstList;
      return next;
    });

    // Persist
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggableId, status: dstStatus })
      });
    } catch {}
  }, []);

  const addTask = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    const id = Math.random().toString(36).substring(2, 15);
    const task: Task = {
      id, project_id: null, department,
      title: newTitle.trim(), description: "",
      status, priority: newPriority,
      due_date: newDueDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setColumns(prev => ({ ...prev, [status]: [...prev[status], task] }));
    setAdding(null);
    setNewTitle("");
    setNewDueDate("");
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task })
      });
    } catch {}
  };

  const deleteTask = async (taskId: string, status?: TaskStatus) => {
    setColumns(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next) as TaskStatus[]) {
        next[key] = next[key].filter(t => t.id !== taskId);
      }
      return next;
    });
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
    } catch {}
  };

  const updateTask = (updated: Task) => {
    setColumns(prev => {
      const next = { ...prev };
      // Remove from all columns
      for (const key of Object.keys(next) as TaskStatus[]) {
        next[key] = next[key].filter(t => t.id !== updated.id);
      }
      // Insert into correct status column
      next[updated.status] = [updated, ...next[updated.status]];
      return next;
    });
  };

  return (
    <>
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map(col => {
          const tasks = columns[col.id] || [];
          return (
            <div key={col.id} className="card flex flex-col" style={{ minHeight: 400 }}>
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    {col.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>
                    {tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAdding(col.id); setNewTitle(""); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-lg leading-none transition-colors hover:opacity-60"
                  style={{ color: "var(--muted)" }}
                >+</button>
              </div>

              {/* Add task form */}
              {adding === col.id && (
                <div className="p-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addTask(col.id); if (e.key === "Escape") setAdding(null); }}
                    placeholder="Task title..."
                    className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none themed-text themed-border"
                    style={{ backgroundColor: "var(--surface)" }}
                  />
                  <div className="flex gap-2 mt-2">
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as any)}
                      className="flex-1 rounded-xl px-2 py-1.5 text-xs border themed-border focus:outline-none themed-text"
                      style={{ backgroundColor: "var(--surface)" }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                      className="flex-1 rounded-xl px-2 py-1.5 text-xs border themed-border focus:outline-none themed-text"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    <button onClick={() => addTask(col.id)}
                      className="px-3 py-1.5 rounded-xl text-xs text-white font-medium"
                      style={{ backgroundColor: "var(--accent)" }}>Add</button>
                    <button onClick={() => setAdding(null)}
                      className="px-2 py-1.5 rounded-xl text-xs themed-muted">✕</button>
                  </div>
                </div>
              )}

              {/* Droppable task list */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-3 space-y-2 overflow-y-auto"
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? `${col.color}08` : "transparent",
                      transition: "background-color 0.15s ease",
                      minHeight: 60
                    }}
                  >
                    {tasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-xs text-center py-6 themed-muted">Drop tasks here</p>
                    )}
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="rounded-2xl p-3 border cursor-grab active:cursor-grabbing transition-shadow"
                            style={{
                              backgroundColor: snapshot.isDragging ? "var(--surface)" : "var(--bg)",
                              borderColor: snapshot.isDragging ? col.color : "var(--border)",
                              boxShadow: snapshot.isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
                              ...provided.draggableProps.style,
                            }}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
                                {task.title}
                              </p>
                              <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: task.priority === "high" ? "#fef2f2" : task.priority === "medium" ? "#fffbeb" : "var(--bg)",
                                  color: task.priority === "high" ? "var(--danger)" : task.priority === "medium" ? "var(--warning)" : "var(--muted)",
                                  fontSize: "10px"
                                }}>
                                {task.priority}
                              </span>
                              {task.due_date && (() => {
                                const today = new Date().toISOString().split("T")[0];
                                const isOverdue = task.due_date < today && task.status !== "completed";
                                const isDueSoon = !isOverdue && task.due_date <= new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0] && task.status !== "completed";
                                return (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 ml-1"
                                    style={{
                                      backgroundColor: isOverdue ? "#fef2f2" : isDueSoon ? "#fffbeb" : "var(--bg)",
                                      color: isOverdue ? "#dc2626" : isDueSoon ? "#d97706" : "var(--muted)",
                                      fontSize: "10px"
                                    }}>
                                    {isOverdue ? "overdue" : isDueSoon ? "due soon" : new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                );
                              })()}
                            </div>
                            {task.description && (
                              <p className="text-xs mt-1.5 themed-muted line-clamp-2">{task.description}</p>
                            )}
                            {task.assigned_to && memberMap[task.assigned_to] && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                                  style={{ backgroundColor: memberMap[task.assigned_to].avatarColor, fontSize: "8px", fontWeight: 600 }}
                                >
                                  {memberMap[task.assigned_to].name.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-xs themed-muted truncate">{memberMap[task.assigned_to].name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>

    {selectedTask && (
      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={updated => { updateTask(updated); setSelectedTask(null); }}
        onDelete={id => { deleteTask(id); setSelectedTask(null); }}
      />
    )}
    </>
  );
}
