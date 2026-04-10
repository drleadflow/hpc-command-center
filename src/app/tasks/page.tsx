"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task, TaskStatus, TaskPriority, Department, DEPARTMENTS, CLIENTS } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "today",       label: "Today",       color: "#f59e0b" },
  { id: "in-progress", label: "In Progress", color: "#3b82f6" },
  { id: "waiting",     label: "Waiting",     color: "#8b5cf6" },
  { id: "completed",   label: "Completed",   color: "#10b981" },
];

const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  high:   { bg: "var(--danger-bg)",  text: "var(--danger)",  label: "High"   },
  medium: { bg: "var(--warning-bg)", text: "var(--warning)", label: "Medium" },
  low:    { bg: "var(--success-bg)", text: "var(--success)", label: "Low"    },
};

const DEPT_MAP = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): { label: string; overdue: boolean } {
  if (!dateStr) return { label: "", overdue: false };
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdue = d < now;
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label, overdue };
}

// ─── Add Task Form ─────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  defaultStatus?: TaskStatus;
  onAdd: (task: Task) => void;
  onCancel: () => void;
}

function AddTaskForm({ defaultStatus = "today", onAdd, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<Department>("ceo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          department,
          priority,
          status,
          assigned_to: assignee.trim() || null,
          due_date: dueDate || null,
          client: client || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const created: Task = await res.json();
      onAdd(created);
    } catch {
      setError("Could not save task. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-blade-border bg-blade-bg px-3 py-2 text-sm text-blade-text placeholder:text-blade-muted focus:outline-none focus:ring-1";
  const labelCls = "block text-xs font-medium text-blade-muted mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-blade-surface border border-blade-border rounded-xl p-4 mb-3 space-y-3">
      <div>
        <label className={labelCls}>Title *</label>
        <input
          className={inputCls}
          placeholder="Task title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Department</label>
          <select className={inputCls} value={department} onChange={(e) => setDepartment(e.target.value as Department)}>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>{col.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Assignee</label>
          <input className={inputCls} placeholder="Name or email…" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Client</label>
          <select className={inputCls} value={client} onChange={(e) => setClient(e.target.value)}>
            <option value="">— None —</option>
            {CLIENTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg border border-blade-border text-blade-muted hover:text-blade-text transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-4 py-1.5 text-sm rounded-lg text-white font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}>
          {saving ? "Saving…" : "Add Task"}
        </button>
      </div>
    </form>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, index }: { task: Task; index: number }) {
  const priority = PRIORITY_COLORS[task.priority];
  const dept = DEPT_MAP[task.department];
  const { label: dueDateLabel, overdue } = formatDate(task.due_date);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="rounded-xl border p-3 mb-2 cursor-grab active:cursor-grabbing transition-shadow select-none"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: snapshot.isDragging ? "var(--accent)" : "var(--border)",
            boxShadow: snapshot.isDragging ? "0 25px 50px -12px rgba(0,0,0,0.25)" : undefined,
          }}
        >
          {/* Title */}
          <p className="font-medium text-sm leading-snug mb-2" style={{ color: "var(--text)" }}>{task.title}</p>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: priority.bg, color: priority.text }}
            >
              {priority.label}
            </span>
            {dept && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${dept.color}22`, color: dept.color }}
              >
                {dept.icon} {dept.label}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
            {task.assigned_to && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-4 h-4 rounded-full text-center leading-4 font-bold text-[10px]"
                  style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
                >
                  {task.assigned_to.charAt(0).toUpperCase()}
                </span>
                {task.assigned_to}
              </span>
            )}
            {dueDateLabel && (
              <span style={overdue ? { color: "var(--danger)", fontWeight: 500 } : undefined}>
                {overdue ? "⚠ " : ""}
                {dueDateLabel}
              </span>
            )}
            {task.client && (
              <span className="truncate max-w-[120px]" style={{ color: "var(--muted)" }} title={task.client}>
                {task.client}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: typeof COLUMNS[number];
  tasks: Task[];
  onAddClick: () => void;
  showAddForm: boolean;
  onAddTask: (task: Task) => void;
  onCancelAdd: () => void;
}

function KanbanColumn({ column, tasks, onAddClick, showAddForm, onAddTask, onCancelAdd }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-0 flex-1 min-w-[260px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="font-semibold text-sm text-blade-text">{column.label}</h3>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-blade-border/60 text-blade-muted">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          title="Add task"
          className="w-6 h-6 rounded-md hover:bg-blade-border/40 text-blade-muted hover:text-blade-text transition-colors flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddTaskForm defaultStatus={column.id} onAdd={onAddTask} onCancel={onCancelAdd} />
      )}

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 rounded-xl min-h-[120px] p-2 transition-colors"
            style={{
              backgroundColor: snapshot.isDraggingOver ? "var(--accent-bg)" : "var(--bg)",
              border: snapshot.isDraggingOver ? "1px dashed var(--accent)" : "1px solid transparent",
            }}
          >
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-center mt-4" style={{ color: "var(--muted)", opacity: 0.6 }}>No tasks yet</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState<Department | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");

  // Add form state: which column's form is open
  const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);

  // Fetch tasks on mount
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      setError("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Drag-drop handler
  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      // Roll back on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === draggableId ? { ...t, status: task.status } : t))
      );
    }
  }

  function handleTaskAdded(task: Task) {
    setTasks((prev) => [task, ...prev]);
    setAddingToColumn(null);
  }

  // Apply filters
  const filtered = tasks.filter((t) => {
    if (filterDept !== "all" && t.department !== filterDept) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) ||
        (t.assigned_to ?? "").toLowerCase().includes(q) ||
        (t.client ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Group by status for display
  const byStatus = (status: TaskStatus) => filtered.filter((t) => t.status === status);

  const inputCls = "rounded-lg border border-blade-border bg-blade-bg px-3 py-2 text-sm text-blade-text placeholder:text-blade-muted focus:outline-none focus:ring-1";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-blade-text">Tasks</h2>
          <p className="text-blade-muted text-sm mt-0.5">
            Drag cards between columns to update status.
          </p>
        </div>
        <button
          onClick={() => setAddingToColumn("today")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <span className="text-lg leading-none">+</span>
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          className={`${inputCls} flex-1 min-w-[180px]`}
          placeholder="Search tasks, assignee, client…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className={inputCls}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value as Department | "all")}
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <select
          className={inputCls}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(filterDept !== "all" || filterPriority !== "all" || searchQuery) && (
          <button
            onClick={() => { setFilterDept("all"); setFilterPriority("all"); setSearchQuery(""); }}
            className="px-3 py-2 text-sm rounded-lg border border-blade-border text-blade-muted hover:text-blade-text transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Global add form (when button in header is clicked) */}
      {addingToColumn === "today" && (
        <AddTaskForm
          defaultStatus="today"
          onAdd={handleTaskAdded}
          onCancel={() => setAddingToColumn(null)}
        />
      )}

      {/* Loading / Error states */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-blade-muted text-sm">Loading tasks…</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
          <button onClick={fetchTasks} className="px-4 py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}>
            Retry
          </button>
        </div>
      )}

      {/* Kanban board */}
      {!loading && !error && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 flex-col sm:flex-row">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={byStatus(col.id)}
                onAddClick={() => setAddingToColumn(addingToColumn === col.id ? null : col.id)}
                showAddForm={addingToColumn === col.id}
                onAddTask={handleTaskAdded}
                onCancelAdd={() => setAddingToColumn(null)}
              />
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
