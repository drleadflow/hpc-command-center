"use client";

import { useState, useEffect, useCallback } from "react";

type GoalType = "currency" | "count" | "percentage";
type GoalCategory = "revenue" | "leads" | "content" | "sales" | "operations" | "custom";

interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  type: GoalType;
  target: number;
  current: number;
  unit?: string;
  emoji?: string;
  deadline?: string;
  created: string;
  updated: string;
  _sha?: string;
  _path?: string;
}

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  revenue:    "#10b981",
  leads:      "#3b82f6",
  content:    "#8b5cf6",
  sales:      "#f59e0b",
  operations: "#6b7280",
  custom:     "var(--accent)",
};

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  revenue: "Revenue", leads: "Leads", content: "Content",
  sales: "Sales", operations: "Ops", custom: "Custom",
};

const EMOJIS = ["🎯", "💰", "📞", "📈", "🚀", "🏆", "⚡", "🔥", "💡", "🎬"];

function formatValue(value: number, type: GoalType, unit?: string): string {
  if (type === "currency") {
    return value >= 1000
      ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
      : `$${value.toLocaleString()}`;
  }
  if (type === "percentage") return `${value}%`;
  return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
}

function getXPLevel(pct: number): { level: number; label: string; color: string } {
  if (pct >= 100) return { level: 5, label: "COMPLETE", color: "#10b981" };
  if (pct >= 75)  return { level: 4, label: "ALMOST",   color: "#3b82f6" };
  if (pct >= 50)  return { level: 3, label: "HALFWAY",  color: "#8b5cf6" };
  if (pct >= 25)  return { level: 2, label: "MOVING",   color: "#f59e0b" };
  return               { level: 1, label: "STARTED",  color: "#6b7280" };
}

function daysLeft(deadline?: string): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Add/Edit Modal ───────────────────────────────────────────────
function GoalModal({ goal, onClose, onSave }: {
  goal?: Goal;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!goal;
  const [form, setForm] = useState({
    title: goal?.title || "",
    category: goal?.category || "revenue" as GoalCategory,
    type: goal?.type || "currency" as GoalType,
    target: goal?.target?.toString() || "",
    current: goal?.current?.toString() || "0",
    unit: goal?.unit || "",
    emoji: goal?.emoji || "🎯",
    deadline: goal?.deadline || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title || !form.target) return;
    setSaving(true);
    try {
      if (isEdit) {
        await fetch("/api/goals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...goal,
            ...form,
            target: Number(form.target),
            current: Number(form.current),
          }),
        });
      } else {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            target: Number(form.target),
            current: Number(form.current),
          }),
        });
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl w-full max-w-md"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <p className="font-medium themed-text">{isEdit ? "Edit Goal" : "New Goal"}</p>
          <button onClick={onClose} className="themed-muted hover:opacity-60 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-colors"
                  style={{
                    backgroundColor: form.emoji === e ? "var(--accent-bg)" : "var(--bg)",
                    borderColor: form.emoji === e ? "var(--accent)" : "var(--border)",
                  }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Goal</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Hit $50k in webinar revenue"
              className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }} />
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as GoalCategory }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }}>
                {(Object.keys(CATEGORY_LABELS) as GoalCategory[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as GoalType }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }}>
                <option value="currency">$ Currency</option>
                <option value="count"># Count</option>
                <option value="percentage">% Percentage</option>
              </select>
            </div>
          </div>

          {/* Target + Current */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
                Target {form.type === "currency" ? "($)" : form.type === "percentage" ? "(%)" : ""}
              </label>
              <input type="number" value={form.target}
                onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                placeholder="50000"
                className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Current</label>
              <input type="number" value={form.current}
                onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
                placeholder="0"
                className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }} />
            </div>
          </div>

          {/* Unit (for count type) */}
          {form.type === "count" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Unit label</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                placeholder="sales calls, leads, videos..."
                className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }} />
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
              Deadline <span className="normal-case font-normal">(optional)</span>
            </label>
            <input type="date" value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border themed-border themed-muted">
              Cancel
            </button>
            <button onClick={save} disabled={saving || !form.title || !form.target}
              className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)" }}>
              {saving ? "Saving…" : isEdit ? "Update" : "Create Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Update Progress Modal ────────────────────────────────────────
function UpdateModal({ goal, onClose, onSave }: {
  goal: Goal;
  onClose: () => void;
  onSave: () => void;
}) {
  const [value, setValue] = useState(goal.current.toString());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...goal, current: Number(value) }),
      });
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl w-full max-w-sm"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="p-5 border-b themed-border">
          <p className="font-medium themed-text">{goal.emoji} Update Progress</p>
          <p className="text-xs themed-muted mt-0.5">{goal.title}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">
              Current value — target is {formatValue(goal.target, goal.type, goal.unit)}
            </label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)}
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-lg border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }} />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm border themed-border themed-muted">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)" }}>
              {saving ? "Saving…" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Goal Card ────────────────────────────────────────────────────
function GoalCard({ goal, onUpdate, onEdit, onDelete }: {
  goal: Goal;
  onUpdate: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
}) {
  const pct = Math.min(100, goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0);
  const xp = getXPLevel(pct);
  const color = CATEGORY_COLORS[goal.category];
  const days = daysLeft(goal.deadline);
  const [showUpdate, setShowUpdate] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="card p-5 relative group"
        style={{ borderLeft: `3px solid ${color}` }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{goal.emoji}</span>
            <div>
              <p className="text-sm font-medium themed-text leading-snug">{goal.title}</p>
              <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ backgroundColor: `${color}18`, color }}>
                {CATEGORY_LABELS[goal.category]}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(p => !p)}
              className="w-7 h-7 rounded-full flex items-center justify-center themed-muted opacity-0 group-hover:opacity-100 transition-opacity text-sm"
              style={{ backgroundColor: "var(--bg)" }}>
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 rounded-xl shadow-lg z-10 overflow-hidden"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", minWidth: 120 }}>
                <button onClick={() => { setMenuOpen(false); onEdit(goal); }}
                  className="w-full text-left text-xs px-4 py-2.5 hover:opacity-70 themed-text block">
                  Edit goal
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(goal); }}
                  className="w-full text-left text-xs px-4 py-2.5 hover:opacity-70 block"
                  style={{ color: "var(--danger)" }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-end justify-between mb-1.5">
            <div>
              <span className="text-2xl font-serif" style={{ color, fontWeight: 300 }}>
                {formatValue(goal.current, goal.type, goal.unit)}
              </span>
              <span className="text-xs themed-muted ml-1">
                / {formatValue(goal.target, goal.type, goal.unit)}
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${xp.color}18`, color: xp.color }}>
              {xp.label}
            </span>
          </div>

          {/* Track */}
          <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                boxShadow: pct > 0 ? `0 0 8px ${color}60` : "none",
              }} />
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs themed-muted">{pct}% complete</span>
            {days !== null && (
              <span className="text-xs"
                style={{ color: days < 7 ? "var(--danger)" : days < 14 ? "#f59e0b" : "var(--muted)" }}>
                {days < 0 ? "Overdue" : days === 0 ? "Due today" : `${days}d left`}
              </span>
            )}
          </div>
        </div>

        {/* Update button */}
        <button onClick={() => setShowUpdate(true)}
          className="w-full py-2 rounded-xl text-xs font-medium border transition-colors hover:opacity-80"
          style={{
            backgroundColor: pct >= 100 ? `${color}15` : "var(--bg)",
            borderColor: pct >= 100 ? color : "var(--border)",
            color: pct >= 100 ? color : "var(--muted)",
          }}>
          {pct >= 100 ? "🏆 Completed!" : "+ Update progress"}
        </button>
      </div>

      {showUpdate && (
        <UpdateModal
          goal={goal}
          onClose={() => setShowUpdate(false)}
          onSave={() => onUpdate(goal)}
        />
      )}
    </>
  );
}

// ── Main Panel ───────────────────────────────────────────────────
export function GoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const deleteGoal = async (goal: Goal) => {
    if (!confirm(`Delete "${goal.title}"?`)) return;
    await fetch("/api/goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _path: goal._path, _sha: goal._sha, title: goal.title }),
    });
    fetchGoals();
  };

  const completed = goals.filter(g => g.current >= g.target);
  const active = goals.filter(g => g.current < g.target);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            GOALS
          </p>
          {goals.length > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {completed.length}/{goals.length} complete
            </p>
          )}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="text-xs px-3 py-1.5 rounded-xl border themed-border themed-muted hover:opacity-70 flex items-center gap-1">
          + Add Goal
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <p className="text-sm themed-muted">Loading goals…</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm font-medium themed-text mb-1">No goals yet</p>
          <p className="text-xs themed-muted mb-4">Set a goal to track progress — webinar revenue, sales calls, anything</p>
          <button onClick={() => setShowAdd(true)}
            className="text-sm px-4 py-2 rounded-xl text-white"
            style={{ backgroundColor: "var(--accent)" }}>
            Set your first goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {active.map(g => (
            <GoalCard key={g.id} goal={g}
              onUpdate={fetchGoals}
              onEdit={setEditGoal}
              onDelete={deleteGoal}
            />
          ))}
          {completed.map(g => (
            <GoalCard key={g.id} goal={g}
              onUpdate={fetchGoals}
              onEdit={setEditGoal}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}

      {showAdd && <GoalModal onClose={() => setShowAdd(false)} onSave={fetchGoals} />}
      {editGoal && <GoalModal goal={editGoal} onClose={() => setEditGoal(null)} onSave={fetchGoals} />}
    </div>
  );
}
