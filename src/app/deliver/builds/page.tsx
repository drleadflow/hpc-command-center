"use client";

import { useState } from "react";
import { useStore } from "@/lib/use-store";
import type { StoredBuild } from "@/lib/store";

const STATUS_COLORS = { "on-track": "var(--success)", blocked: "var(--warning)", complete: "var(--accent)" };
const STATUS_LABELS = { "on-track": "On Track", blocked: "Blocked", complete: "Complete" };

const DEFAULT_BUILDS: StoredBuild[] = [
  { id: "1", client: "Coastal Chiropractic", path: "B", practiceType: "Chiropractic", dayCount: 10, progress: 70, status: "blocked", blocker: "Meta Business Manager access not granted by client", techNote: "All other components QA'd. Chatbot installed. Waiting on Meta access for ad integration." },
  { id: "2", client: "Summit Wellness", path: "B", practiceType: "Wellness", dayCount: 5, progress: 40, status: "on-track", techNote: "Chatbot config today. 3 core sequences activating. On schedule for Day 10 walkthrough." },
  { id: "3", client: "Premier Wellness", path: "C", practiceType: "Wellness", dayCount: 14, progress: 95, status: "on-track", techNote: "Build complete. Ads launching this week. Final QA before client walkthrough." },
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

export default function BuildsPage() {
  const [builds, setBuilds] = useStore<StoredBuild[]>(
    "hpc_builds" as "hpc_builds",
    DEFAULT_BUILDS
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client: "",
    path: "B" as "B" | "C",
    practiceType: "",
    dayCount: "",
    techNote: "",
  });

  function updateBuild(id: string, patch: Partial<StoredBuild>) {
    setBuilds((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
  }

  function removeBuild(id: string) {
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  }

  function submitForm() {
    if (!form.client.trim()) return;
    const build: StoredBuild = {
      id: `${Date.now()}`,
      client: form.client.trim(),
      path: form.path,
      practiceType: form.practiceType.trim() || "—",
      dayCount: parseInt(form.dayCount) || 1,
      progress: 0,
      status: "on-track",
      techNote: form.techNote.trim() || "",
    };
    setBuilds((prev) => [build, ...prev]);
    setForm({ client: "", path: "B", practiceType: "", dayCount: "", techNote: "" });
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Active Builds</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[11px] px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {showForm ? "Cancel" : "+ New Build"}
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Path B &amp; C client setups &middot; Target: 7–14 business days &middot; click text to edit
      </p>

      {/* New Build Form */}
      {showForm && (
        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: "var(--muted)" }}>New Build</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Client</div>
              <input placeholder="Client name" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Path</div>
              <select value={form.path} onChange={(e) => setForm((f) => ({ ...f, path: e.target.value as "B" | "C" }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}>
                <option value="B">Path B</option>
                <option value="C">Path C</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Practice Type</div>
              <input placeholder="e.g. Chiropractic" value={form.practiceType} onChange={(e) => setForm((f) => ({ ...f, practiceType: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Current Day #</div>
              <input placeholder="e.g. 1" value={form.dayCount} onChange={(e) => setForm((f) => ({ ...f, dayCount: e.target.value }))} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Tech Note</div>
            <textarea placeholder="Status notes..." value={form.techNote} onChange={(e) => setForm((f) => ({ ...f, techNote: e.target.value }))} rows={2} className="w-full text-[11px] rounded px-2 py-1.5" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none", resize: "vertical" }} />
          </div>
          <button onClick={submitForm} className="text-[11px] px-4 py-1.5 rounded" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>Add Build</button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {builds.map((b) => (
          <div
            key={b.id}
            className="rounded-xl p-4 group"
            style={{
              backgroundColor: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderLeft: `3px solid ${STATUS_COLORS[b.status]}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  <InlineEdit value={b.client} onSave={(v) => updateBuild(b.id, { client: v })} style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }} />
                </div>
                <div className="text-[10px] mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: "var(--muted)" }}>
                  <span>Path {b.path}</span>
                  <span>&middot;</span>
                  <InlineEdit value={b.practiceType} onSave={(v) => updateBuild(b.id, { practiceType: v })} style={{ color: "var(--muted)", fontSize: 10 }} />
                  <span>&middot; Day</span>
                  <InlineEdit
                    value={String(b.dayCount)}
                    onSave={(v) => { const n = parseInt(v); if (!isNaN(n)) updateBuild(b.id, { dayCount: n }); }}
                    style={{ color: "var(--muted)", fontSize: 10 }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <select
                  value={b.status}
                  onChange={(e) => updateBuild(b.id, { status: e.target.value as StoredBuild["status"] })}
                  className="text-[10px] px-2 py-0.5 rounded-sm font-medium"
                  style={{ backgroundColor: `${STATUS_COLORS[b.status]}18`, color: STATUS_COLORS[b.status], border: "none", outline: "none", cursor: "pointer" }}
                >
                  <option value="on-track">On Track</option>
                  <option value="blocked">Blocked</option>
                  <option value="complete">Complete</option>
                </select>
                <button onClick={() => removeBuild(b.id)} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--danger)" }} title="Remove">✕</button>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${b.progress}%`, backgroundColor: STATUS_COLORS[b.status] }} />
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={b.progress}
                onChange={(e) => { const n = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); updateBuild(b.id, { progress: n }); }}
                className="text-[10px] w-12 text-right rounded px-1"
                style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--muted)", outline: "none" }}
              />
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>%</span>
            </div>

            {/* Blocker */}
            {(b.status === "blocked" || b.blocker) && (
              <div className="rounded-md px-3 py-2 mb-2" style={{ backgroundColor: "#FDF3E3", border: "0.5px solid #E8C87A" }}>
                <span className="text-[10px] font-medium mr-1" style={{ color: "#854F0B" }}>Blocker:</span>
                <InlineEdit
                  value={b.blocker || ""}
                  onSave={(v) => updateBuild(b.id, { blocker: v })}
                  placeholder="Describe the blocker..."
                  style={{ color: "#854F0B", fontSize: 11 }}
                />
              </div>
            )}

            <InlineEdit
              value={b.techNote}
              onSave={(v) => updateBuild(b.id, { techNote: v })}
              multiline
              placeholder="Tech notes..."
              style={{ color: "var(--text-secondary)", fontSize: 11, lineHeight: 1.6 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
