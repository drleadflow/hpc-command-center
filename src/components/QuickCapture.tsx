"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Department, TeamMember } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<Department>("ceo");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      if (members.length === 0) {
        fetch("/api/team").then(r => r.json()).then(setMembers).catch(() => {});
      }
    } else {
      setTitle("");
      setDepartment("ceo");
      setPriority("medium");
      setDueDate("");
      setAssignedTo("");
      setSaved(false);
    }
  }, [open]);

  const submit = useCallback(async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          department,
          priority,
          status: "today",
          due_date: dueDate || null,
          assigned_to: assignedTo || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setOpen(false), 800);
    } finally {
      setSaving(false);
    }
  }, [title, department, priority, dueDate, assignedTo, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={e => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Quick Task</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>
              {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘N" : "Ctrl+N"}
            </span>
          </div>
          <button onClick={() => setOpen(false)} className="text-lg" style={{ color: "var(--muted)" }}>✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            placeholder="What needs to be done?"
            className="w-full text-base px-0 py-1 bg-transparent border-none focus:outline-none font-medium"
            style={{ color: "var(--text)" }}
          />

          {/* Row: Department + Priority + Due Date */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={department}
              onChange={e => setDepartment(e.target.value as Department)}
              className="rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.label}</option>
              ))}
            </select>

            <select
              value={priority}
              onChange={e => setPriority(e.target.value as "high" | "medium" | "low")}
              className="rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />

            {members.length > 0 && (
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Press Enter to create
          </span>
          <button
            onClick={submit}
            disabled={!title.trim() || saving}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--accent)" }}
          >
            {saved ? "Created!" : saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
