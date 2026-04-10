"use client";

import { useState } from "react";
import { useStore } from "@/lib/use-store";

interface CoachingMember {
  id: string;
  name: string;
  practiceType: string;
  joinDate: string;
  daysSinceJoin: number;
  status: "active" | "at-risk" | "milestone";
  lastCheckIn: string;
  note: string;
}

const STATUS_COLORS = { active: "var(--success)", "at-risk": "var(--danger)", milestone: "var(--warning)" };
const STATUS_LABELS = { active: "Active", "at-risk": "At Risk", milestone: "Milestone Due" };
const STATUS_CYCLE: Record<CoachingMember["status"], CoachingMember["status"]> = {
  active: "milestone",
  milestone: "at-risk",
  "at-risk": "active",
};

const DEFAULT_MEMBERS: CoachingMember[] = [
  { id: "1", name: "Dr. Chen", practiceType: "Chiropractic", joinDate: "2026-03-25", daysSinceJoin: 16, status: "active", lastCheckIn: "Apr 8", note: "Attending weekly calls. Implementing Module 2." },
  { id: "2", name: "Harmony Medspa", practiceType: "Medspa", joinDate: "2026-03-10", daysSinceJoin: 31, status: "milestone", lastCheckIn: "Apr 7", note: "Day 30 check-in due. First lead captured this week." },
  { id: "3", name: "Mindful Psych", practiceType: "Psychiatry", joinDate: "2026-02-20", daysSinceJoin: 49, status: "active", lastCheckIn: "Apr 9", note: "Highly engaged. Completed Module 4. Potential upsell to Path B." },
];

function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder = "",
  style = {},
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    onSave(draft);
    setEditing(false);
  }

  if (editing) {
    const shared = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      autoFocus: true,
      placeholder,
      style: { ...style, backgroundColor: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 4, outline: "none", width: "100%", padding: "2px 6px" },
      className,
    };
    return multiline
      ? <textarea {...shared} onKeyDown={(e) => { if (e.key === "Escape") commit(); }} rows={2} style={{ ...shared.style, resize: "vertical" }} />
      : <input {...shared} onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commit(); }} />;
  }

  return (
    <span
      style={{ ...style, cursor: "pointer", borderBottom: "1px dashed var(--border)" }}
      className={className}
      title="Click to edit"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder || "Click to edit"}</span>}
    </span>
  );
}

export default function CoachingPage() {
  const [members, setMembers] = useStore<CoachingMember[]>(
    "hpc_coaching_members" as "hpc_coaching_members",
    DEFAULT_MEMBERS
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    practiceType: "",
    joinDate: new Date().toISOString().slice(0, 10),
    lastCheckIn: "",
    note: "",
  });

  function updateMember(id: string, patch: Partial<CoachingMember>) {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
  }

  function cycleStatus(id: string) {
    setMembers((prev) =>
      prev.map((m) => m.id === id ? { ...m, status: STATUS_CYCLE[m.status] } : m)
    );
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function submitForm() {
    if (!form.name.trim()) return;
    const today = new Date();
    const join = new Date(form.joinDate);
    const days = Math.max(0, Math.floor((today.getTime() - join.getTime()) / 86400000));
    const member: CoachingMember = {
      id: `${Date.now()}`,
      name: form.name.trim(),
      practiceType: form.practiceType.trim() || "—",
      joinDate: form.joinDate,
      daysSinceJoin: days,
      status: "active",
      lastCheckIn: form.lastCheckIn.trim() || "—",
      note: form.note.trim() || "",
    };
    setMembers((prev) => [member, ...prev]);
    setForm({ name: "", practiceType: "", joinDate: new Date().toISOString().slice(0, 10), lastCheckIn: "", note: "" });
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Path A Coaching</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[11px] px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Health Pro CEO Skool &middot; {members.length} active members &middot; Weekly group call &middot; click status to cycle
      </p>

      {/* Next Call */}
      <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#E8F1FB", border: "0.5px solid #A8C8F0" }}>
        <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "#1A4F8A" }}>Next Group Call</div>
        <div className="text-sm font-medium" style={{ color: "#1A4F8A" }}>Tuesday 11:00 AM CST — Reading Your First 30-Day Results</div>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: "var(--muted)" }}>New Member</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Name / Practice</div>
              <input placeholder="e.g. Dr. Smith" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Practice Type</div>
              <input placeholder="e.g. Chiropractic" value={form.practiceType} onChange={(e) => setForm((f) => ({ ...f, practiceType: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Join Date</div>
              <input type="date" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Last Check-In</div>
              <input placeholder="e.g. Apr 10" value={form.lastCheckIn} onChange={(e) => setForm((f) => ({ ...f, lastCheckIn: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Note</div>
            <textarea placeholder="Progress notes..." value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none", resize: "vertical" }} />
          </div>
          <button onClick={submitForm} className="text-[11px] px-4 py-1.5 rounded" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>Add Member</button>
        </div>
      )}

      {/* Members */}
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.id} className="rounded-xl p-4 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  <InlineEdit value={m.name} onSave={(v) => updateMember(m.id, { name: v })} style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }} />
                </div>
                <div className="text-[10px] flex items-center gap-1 flex-wrap mt-0.5" style={{ color: "var(--muted)" }}>
                  <InlineEdit value={m.practiceType} onSave={(v) => updateMember(m.id, { practiceType: v })} style={{ color: "var(--muted)", fontSize: 10 }} />
                  <span>&middot; Day {m.daysSinceJoin} &middot; Last check-in:</span>
                  <InlineEdit value={m.lastCheckIn} onSave={(v) => updateMember(m.id, { lastCheckIn: v })} style={{ color: "var(--muted)", fontSize: 10 }} />
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => cycleStatus(m.id)}
                  className="text-[10px] px-2 py-0.5 rounded-sm font-medium cursor-pointer"
                  style={{ backgroundColor: `${STATUS_COLORS[m.status]}18`, color: STATUS_COLORS[m.status], border: "none" }}
                  title="Click to cycle status"
                >
                  {STATUS_LABELS[m.status]}
                </button>
                <button onClick={() => removeMember(m.id)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--danger)" }} title="Remove">✕</button>
              </div>
            </div>
            <InlineEdit
              value={m.note}
              onSave={(v) => updateMember(m.id, { note: v })}
              multiline
              placeholder="Progress notes..."
              style={{ color: "var(--text-secondary)", fontSize: 11, lineHeight: 1.6 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
