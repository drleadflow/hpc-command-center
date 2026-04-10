"use client";

import { useState } from "react";
import { useStore } from "@/lib/use-store";

// ── Types ───────────────────────────────────────────────────────────
type LaunchType = "ads" | "ai-voice" | "ai-chat" | "automation" | "full-build";
type LaunchStatus = "planning" | "in-progress" | "review" | "live" | "paused";

interface LaunchCard {
  id: string;
  client: string;
  practiceType: string;
  type: LaunchType;
  status: LaunchStatus;
  description: string;
  assignee: string;
  dueDate: string;
  notes: string;
  createdAt: string;
}

const COLUMNS: { id: LaunchStatus; label: string; color: string }[] = [
  { id: "planning", label: "Planning", color: "#888" },
  { id: "in-progress", label: "In Progress", color: "#2D7DD2" },
  { id: "review", label: "Review / QA", color: "#C4860A" },
  { id: "live", label: "Live", color: "#639922" },
  { id: "paused", label: "Paused", color: "#A32D2D" },
];

const TYPE_LABELS: Record<LaunchType, { label: string; color: string; bg: string }> = {
  ads: { label: "Ads Launch", color: "#1A4F8A", bg: "#E8F1FB" },
  "ai-voice": { label: "AI Voice", color: "#534AB7", bg: "#EEEDFE" },
  "ai-chat": { label: "AI Chat", color: "#92610A", bg: "#FDF3E3" },
  automation: { label: "Automation", color: "#3B6D11", bg: "#EAF3DE" },
  "full-build": { label: "Full Build", color: "#D85A30", bg: "#FAECE7" },
};

const ASSIGNEES = ["CEO", "Ops Manager", "Marketing Lead", "AI & Tech Specialist", "CSM / Lead Coach", "Sales Closer", "Content Editor"];

const DEFAULT_CARDS: LaunchCard[] = [
  { id: "1", client: "Premier Wellness", practiceType: "Wellness", type: "ads", status: "in-progress", description: "Meta ads campaign launch — targeting local wellness seekers. Ad creative approved. Pixel installed.", assignee: "Marketing Lead", dueDate: "2026-04-15", notes: "Budget: $2K/mo. 3 ad sets ready. Waiting on final landing page review.", createdAt: "2026-04-05" },
  { id: "2", client: "Coastal Chiropractic", practiceType: "Chiropractic", type: "ai-chat", status: "review", description: "AI chatbot installation — practice-type configured for chiro. Lead capture flows tested.", assignee: "AI & Tech Specialist", dueDate: "2026-04-12", notes: "Chatbot responds correctly to 15/15 test scenarios. Waiting on client walkthrough approval.", createdAt: "2026-03-30" },
  { id: "3", client: "Summit Wellness", practiceType: "Wellness", type: "full-build", status: "in-progress", description: "Full GHL sub-account build — chatbot + automation + nurture sequences.", assignee: "AI & Tech Specialist", dueDate: "2026-04-18", notes: "Day 5. Chatbot config today. 3 core sequences activating.", createdAt: "2026-04-03" },
  { id: "4", client: "Riverside Dental", practiceType: "Dental", type: "ai-voice", status: "planning", description: "AI voice agent for after-hours call handling — dental-specific scripts.", assignee: "AI & Tech Specialist", dueDate: "2026-04-25", notes: "Script templates drafted. Need client approval on voice tone and call flow.", createdAt: "2026-04-08" },
  { id: "5", client: "Skyline PT", practiceType: "Physical Therapy", type: "ads", status: "live", description: "Meta ads live — 2 weeks running. CPL at $12, optimizing toward $10 target.", assignee: "Marketing Lead", dueDate: "—", notes: "Week 2 review: 23 leads, 3 booked calls. Rotating creative this week.", createdAt: "2026-03-25" },
];

function InlineEdit({ value, onSave, multiline, placeholder, style, className }: {
  value: string; onSave: (v: string) => void; multiline?: boolean; placeholder?: string; style?: React.CSSProperties; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onSave(draft); setEditing(false); };

  if (editing) {
    const shared = { value: draft, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: commit, autoFocus: true, placeholder, style: { ...style, backgroundColor: "var(--bg)", border: "1px solid var(--accent)", borderRadius: 4, outline: "none", width: "100%", padding: "2px 6px" }, className };
    return multiline ? <textarea {...shared} rows={2} style={{ ...shared.style, resize: "vertical" as const }} onKeyDown={(e) => { if (e.key === "Escape") commit(); }} /> : <input {...shared} onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commit(); }} />;
  }
  return <span style={{ ...style, cursor: "pointer", borderBottom: "1px dashed var(--border)" }} className={className} title="Click to edit" onClick={() => { setDraft(value); setEditing(true); }}>{value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder || "Click to edit"}</span>}</span>;
}

export default function LaunchBoard() {
  const [cards, setCards] = useStore<LaunchCard[]>("hpc_launch_board" as "hpc_tracking", DEFAULT_CARDS);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterType, setFilterType] = useState<LaunchType | "all">("all");
  const [form, setForm] = useState({ client: "", practiceType: "", type: "ads" as LaunchType, description: "", assignee: "AI & Tech Specialist", dueDate: "", notes: "" });

  const filteredCards = filterType === "all" ? cards : cards.filter((c) => c.type === filterType);

  function updateCard(id: string, patch: Partial<LaunchCard>) {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  }
  function removeCard(id: string) { setCards((prev) => prev.filter((c) => c.id !== id)); }
  function moveCard(id: string, status: LaunchStatus) { updateCard(id, { status }); }

  function addCard() {
    if (!form.client.trim()) return;
    const card: LaunchCard = { id: Date.now().toString(), client: form.client, practiceType: form.practiceType || "—", type: form.type, status: "planning", description: form.description, assignee: form.assignee, dueDate: form.dueDate || "—", notes: form.notes, createdAt: new Date().toISOString().split("T")[0] };
    setCards((prev) => [...prev, card]);
    setForm({ client: "", practiceType: "", type: "ads", description: "", assignee: "AI & Tech Specialist", dueDate: "", notes: "" });
    setShowForm(false);
  }

  function renderCard(card: LaunchCard) {
    const t = TYPE_LABELS[card.type];
    return (
      <div key={card.id} className="rounded-lg p-3 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: t.bg, color: t.color }}>{t.label}</span>
          <button onClick={() => removeCard(card.id)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--danger)" }}>✕</button>
        </div>
        <div className="text-xs font-medium mb-0.5" style={{ color: "var(--text)" }}>
          <InlineEdit value={card.client} onSave={(v) => updateCard(card.id, { client: v })} style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }} />
        </div>
        <div className="text-[10px] mb-2" style={{ color: "var(--muted)" }}>
          <InlineEdit value={card.practiceType} onSave={(v) => updateCard(card.id, { practiceType: v })} style={{ fontSize: 10, color: "var(--muted)" }} />
        </div>
        <div className="text-[10px] mb-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <InlineEdit value={card.description} onSave={(v) => updateCard(card.id, { description: v })} multiline style={{ fontSize: 10, color: "var(--text-secondary)" }} />
        </div>
        {card.notes && (
          <div className="text-[10px] mb-2 p-2 rounded" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>
            <InlineEdit value={card.notes} onSave={(v) => updateCard(card.id, { notes: v })} multiline style={{ fontSize: 10, color: "var(--muted)" }} placeholder="Add notes..." />
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="text-[9px]" style={{ color: "var(--muted)" }}>
            <InlineEdit value={card.assignee} onSave={(v) => updateCard(card.id, { assignee: v })} style={{ fontSize: 9, color: "var(--muted)" }} />
          </div>
          <div className="text-[9px]" style={{ color: "var(--muted)" }}>
            Due: <InlineEdit value={card.dueDate} onSave={(v) => updateCard(card.id, { dueDate: v })} style={{ fontSize: 9, color: "var(--muted)" }} />
          </div>
        </div>
        {/* Status move buttons */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {COLUMNS.filter((col) => col.id !== card.status).map((col) => (
            <button key={col.id} onClick={() => moveCard(card.id, col.id)} className="text-[8px] px-1.5 py-0.5 rounded-sm opacity-50 hover:opacity-100 transition-opacity" style={{ backgroundColor: `${col.color}18`, color: col.color, border: `0.5px solid ${col.color}40` }}>
              → {col.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Launch Board</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Ad campaigns &amp; AI tech deployments &middot; {cards.length} active launches
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: "var(--bg)" }}>
            {(["kanban", "list"] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)} className="px-2.5 py-1 rounded-md text-[10px]" style={{ backgroundColor: viewMode === v ? "var(--surface)" : "transparent", color: viewMode === v ? "var(--text)" : "var(--muted)", fontWeight: viewMode === v ? 500 : 400, border: viewMode === v ? "0.5px solid var(--border)" : "none" }}>
                {v === "kanban" ? "Board" : "List"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(!showForm)} className="text-[11px] px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {showForm ? "Cancel" : "+ New Launch"}
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-1.5 flex-wrap mb-4 mt-3">
        <button onClick={() => setFilterType("all")} className="px-2.5 py-1 rounded-full text-[10px]" style={{ backgroundColor: filterType === "all" ? "var(--text)" : "var(--surface)", color: filterType === "all" ? "var(--bg)" : "var(--muted)", border: filterType === "all" ? "none" : "0.5px solid var(--border)" }}>All</button>
        {(Object.entries(TYPE_LABELS) as [LaunchType, typeof TYPE_LABELS[LaunchType]][]).map(([key, val]) => (
          <button key={key} onClick={() => setFilterType(key)} className="px-2.5 py-1 rounded-full text-[10px]" style={{ backgroundColor: filterType === key ? val.bg : "var(--surface)", color: filterType === key ? val.color : "var(--muted)", border: filterType === key ? `0.5px solid ${val.color}` : "0.5px solid var(--border)" }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Client</div>
              <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Client name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Practice Type</div>
              <input value={form.practiceType} onChange={(e) => setForm({ ...form, practiceType: e.target.value })} placeholder="e.g. Dental" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Launch Type</div>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LaunchType })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Assignee</div>
              <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }}>
                {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Due Date</div>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Description</div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's being launched..." rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", resize: "vertical" }} />
          </div>
          <button onClick={addCard} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--accent)" }}>Add Launch</button>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {COLUMNS.map((col) => {
            const colCards = filteredCards.filter((c) => c.status === col.id);
            return (
              <div key={col.id} className="flex-shrink-0" style={{ width: 260 }}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{col.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>{colCards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {colCards.map(renderCard)}
                  {colCards.length === 0 && (
                    <div className="rounded-lg p-4 text-center text-[10px]" style={{ backgroundColor: "var(--bg)", color: "var(--muted)", border: "1px dashed var(--border)" }}>
                      No launches
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-2">
          {filteredCards.map((card) => {
            const t = TYPE_LABELS[card.type];
            const col = COLUMNS.find((c) => c.id === card.status);
            return (
              <div key={card.id} className="rounded-lg px-4 py-3 flex items-center gap-3 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)", borderLeft: `3px solid ${col?.color ?? "var(--border)"}` }}>
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0" style={{ backgroundColor: t.bg, color: t.color }}>{t.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{card.client}</div>
                  <div className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{card.description}</div>
                </div>
                <div className="text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>{card.assignee}</div>
                <select value={card.status} onChange={(e) => moveCard(card.id, e.target.value as LaunchStatus)} className="text-[10px] rounded px-1.5 py-0.5 outline-none flex-shrink-0" style={{ backgroundColor: `${col?.color ?? "#888"}18`, color: col?.color, border: "none" }}>
                  {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button onClick={() => removeCard(card.id)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--danger)" }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
