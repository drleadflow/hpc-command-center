"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// ── Slack Notify Modal ───────────────────────────────────────────
type SlackMember = { id: string; name: string; display: string; avatar: string | null };

function SlackNotifyModal({ card, onClose }: { card: MediaCard; onClose: () => void }) {
  const [members, setMembers] = useState<SlackMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selected, setSelected] = useState<SlackMember[]>([]);
  const [search, setSearch] = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [schedule, setSchedule] = useState<"now" | "morning">("now");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ member: string; status: string; error?: string }[] | null>(null);

  useEffect(() => {
    fetch("/api/slack/members")
      .then(r => r.json())
      .then(data => { setMembers(data.members || []); setLoadingMembers(false); })
      .catch(() => setLoadingMembers(false));
  }, []);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.display.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (m: SlackMember) => {
    setSelected(prev =>
      prev.find(s => s.id === m.id) ? prev.filter(s => s.id !== m.id) : [...prev, m]
    );
  };

  const send = async () => {
    if (!selected.length) return;
    setSending(true);
    try {
      const res = await fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignees: selected,
          cardTitle: card.title,
          cardType: card.contentType,
          cardClient: card.client,
          message: customMsg.trim() || undefined,
          schedule,
        }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([{ member: "all", status: "error", error: "Network error" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b themed-border shrink-0">
          <div>
            <p className="font-medium themed-text">Notify via Slack</p>
            <p className="text-xs themed-muted mt-0.5">{card.title}</p>
          </div>
          <button onClick={onClose} className="themed-muted hover:opacity-60 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!results ? (
            <>
              {/* Member search + select */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-2">
                  Select recipients
                </label>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search workspace members…"
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none mb-2"
                  style={{ backgroundColor: "var(--bg)" }}
                />

                {loadingMembers ? (
                  <p className="text-xs themed-muted text-center py-4">Loading members…</p>
                ) : (
                  <div className="rounded-2xl border themed-border overflow-y-auto" style={{ maxHeight: 200 }}>
                    {filtered.map(m => {
                      const isSelected = !!selected.find(s => s.id === m.id);
                      return (
                        <button key={m.id} onClick={() => toggle(m)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:opacity-80 border-b themed-border last:border-0"
                          style={{ backgroundColor: isSelected ? "var(--accent-bg)" : "transparent" }}>
                          {m.avatar
                            ? <img src={m.avatar} alt="" className="w-7 h-7 rounded-full shrink-0" />
                            : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                                {m.name[0].toUpperCase()}
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm themed-text truncate">{m.name}</p>
                            {m.display && m.display !== m.name && (
                              <p className="text-xs themed-muted truncate">@{m.display}</p>
                            )}
                          </div>
                          {isSelected && <span style={{ color: "var(--accent)" }}>✓</span>}
                        </button>
                      );
                    })}
                    {!filtered.length && (
                      <p className="text-xs themed-muted text-center py-4">No members found</p>
                    )}
                  </div>
                )}

                {/* Selected chips */}
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.map(m => (
                      <span key={m.id} onClick={() => toggle(m)}
                        className="text-xs px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1"
                        style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                        {m.name} <span className="opacity-60">✕</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule toggle */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-2">When</label>
                <div className="flex gap-2">
                  {(["now", "morning"] as const).map(opt => (
                    <button key={opt} onClick={() => setSchedule(opt)}
                      className="flex-1 py-2 rounded-xl text-sm border transition-colors"
                      style={{
                        backgroundColor: schedule === opt ? "var(--accent-bg)" : "var(--bg)",
                        borderColor: schedule === opt ? "var(--accent)" : "var(--border)",
                        color: schedule === opt ? "var(--accent-text)" : "var(--muted)",
                        fontWeight: schedule === opt ? 600 : 400,
                      }}>
                      {opt === "now" ? "⚡ Send Now" : "🌅 Morning (9am ET)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom message */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-2">
                  Message <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  rows={3}
                  placeholder="Default: assignment notification with card title + board link"
                  className="w-full rounded-2xl px-4 py-3 text-sm border themed-border themed-text focus:outline-none resize-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>
            </>
          ) : (
            /* Results view */
            <div className="space-y-2">
              <p className="text-sm font-medium themed-text mb-3">
                {schedule === "morning" ? "Messages scheduled 🌅" : "Messages sent ⚡"}
              </p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: r.status === "error" ? "#fef2f2" : "#f0fdf4" }}>
                  <span className="font-medium themed-text">{r.member}</span>
                  <span style={{ color: r.status === "error" ? "var(--danger)" : "#16a34a" }}>
                    {r.status === "error" ? `✗ ${r.error}` : r.status === "scheduled" ? "✓ Scheduled 9am" : "✓ Sent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="p-5 pt-0 flex gap-2 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm border themed-border themed-muted">
            {results ? "Close" : "Cancel"}
          </button>
          {!results && (
            <button onClick={send} disabled={sending || selected.length === 0}
              className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-40"
              style={{ backgroundColor: "#4A154B" }}>
              {sending ? "Sending…" : selected.length === 0 ? "Select someone" : schedule === "morning" ? `Schedule → ${selected.length}` : `Send → ${selected.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────
type Phase = "strategy" | "creation" | "review" | "publishing" | "engagement" | "analytics";

type ContentType = "reel" | "youtube" | "static" | "podcast" | "email" | "ad" | "webinar" | "story" | "carousel";
type ClientTag = "dlf-brand" | "healthproceo" | "vitality" | "iv-wellness" | "corrective-skin";
type Platform = "instagram" | "facebook" | "youtube" | "tiktok" | "linkedin" | "email" | "skool";

type TeamMember = "blade" | "christian" | "courtney" | "tope" | "mary" | "luz" | "rogue" | "jess";

interface MediaCard {
  id: string;
  title: string;
  phase: Phase;
  contentType: ContentType;
  client: ClientTag;
  platforms: Platform[];
  assignedTo: TeamMember[];
  script?: string;
  driveLink?: string;
  imageUrl?: string;
  postDate?: string;
  createdAt: string;
  createdBy: TeamMember;
  notes?: string;
}

// ── Constants ────────────────────────────────────────────────────
const PHASES: { id: Phase; label: string; emoji: string; color: string }[] = [
  { id: "strategy", label: "Strategy", emoji: "📐", color: "#6b7280" },
  { id: "creation", label: "Creation", emoji: "✍️", color: "var(--warning)" },
  { id: "review", label: "Review", emoji: "👀", color: "#7c3aed" },
  { id: "publishing", label: "Publishing", emoji: "📅", color: "var(--accent)" },
  { id: "engagement", label: "Engagement", emoji: "💬", color: "#0891b2" },
  { id: "analytics", label: "Analytics", emoji: "📊", color: "#059669" },
];

const CONTENT_TYPES: ContentType[] = ["reel", "youtube", "static", "podcast", "email", "ad", "webinar", "story", "carousel"];
const CLIENTS: { id: ClientTag; label: string }[] = [
  { id: "dlf-brand", label: "DLF Brand" },
  { id: "healthproceo", label: "HealthProceo" },
  { id: "vitality", label: "Vitality" },
  { id: "iv-wellness", label: "IV Wellness" },
  { id: "corrective-skin", label: "Corrective Skin" },
];
const PLATFORMS: Platform[] = ["instagram", "facebook", "youtube", "tiktok", "linkedin", "email", "skool"];
const TEAM: TeamMember[] = ["blade", "christian", "courtney", "tope", "mary", "luz", "rogue", "jess"];

const TYPE_COLORS: Record<ContentType, string> = {
  reel: "#ec4899", youtube: "#ef4444", static: "#6366f1",
  podcast: "#f59e0b", email: "#0891b2", ad: "#8b5cf6",
  webinar: "#10b981", story: "#f97316", carousel: "#3b82f6",
};

// ── Card Detail Modal ────────────────────────────────────────────
function CardModal({ card, onClose, onUpdate, onDelete }: {
  card: MediaCard;
  onClose: () => void;
  onUpdate: (updated: MediaCard) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState({ ...card });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b themed-border">
          <input
            value={editing.title}
            onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
            className="text-lg font-serif themed-text bg-transparent border-none focus:outline-none w-full"
            style={{ fontWeight: 400 }}
          />
          <button onClick={onClose} className="themed-muted hover:opacity-60 ml-4 text-lg">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Row 1: Type, Client, Phase */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Type</label>
              <select value={editing.contentType}
                onChange={e => setEditing(p => ({ ...p, contentType: e.target.value as ContentType }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }}>
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Client</label>
              <select value={editing.client}
                onChange={e => setEditing(p => ({ ...p, client: e.target.value as ClientTag }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }}>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Phase</label>
              <select value={editing.phase}
                onChange={e => setEditing(p => ({ ...p, phase: e.target.value as Phase }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }}>
                {PHASES.map(ph => <option key={ph.id} value={ph.id}>{ph.emoji} {ph.label}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Assigned To (multi) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Assigned To</label>
            <div className="flex flex-wrap gap-2">
              {TEAM.map(member => (
                <button key={member}
                  onClick={() => setEditing(p => ({
                    ...p,
                    assignedTo: p.assignedTo.includes(member)
                      ? p.assignedTo.filter(m => m !== member)
                      : [...p.assignedTo, member]
                  }))}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors capitalize"
                  style={{
                    backgroundColor: editing.assignedTo.includes(member) ? "var(--accent-bg)" : "var(--bg)",
                    borderColor: editing.assignedTo.includes(member) ? "var(--accent)" : "var(--border)",
                    color: editing.assignedTo.includes(member) ? "var(--accent-text)" : "var(--muted)",
                  }}>
                  {member}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Platforms */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p}
                  onClick={() => setEditing(prev => ({
                    ...prev,
                    platforms: prev.platforms.includes(p)
                      ? prev.platforms.filter(x => x !== p)
                      : [...prev.platforms, p]
                  }))}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors capitalize"
                  style={{
                    backgroundColor: editing.platforms.includes(p) ? "var(--accent-bg)" : "var(--bg)",
                    borderColor: editing.platforms.includes(p) ? "var(--accent)" : "var(--border)",
                    color: editing.platforms.includes(p) ? "var(--accent-text)" : "var(--muted)",
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Script */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Script / Copy</label>
            <textarea
              value={editing.script || ""}
              onChange={e => setEditing(p => ({ ...p, script: e.target.value }))}
              rows={6}
              placeholder="Write script, copy, or notes here..."
              className="w-full rounded-2xl px-4 py-3 text-sm border themed-border themed-text focus:outline-none resize-none"
              style={{ backgroundColor: "var(--bg)" }}
            />
          </div>

          {/* Drive Link */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Google Drive Link</label>
            <input
              value={editing.driveLink || ""}
              onChange={e => setEditing(p => ({ ...p, driveLink: e.target.value }))}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }}
            />
            {editing.driveLink && (
              <a href={editing.driveLink} target="_blank" rel="noopener noreferrer"
                className="text-xs mt-1 inline-block" style={{ color: "var(--accent)" }}>
                Open in Drive →
              </a>
            )}
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Thumbnail / Image URL</label>
            <input
              value={editing.imageUrl || ""}
              onChange={e => setEditing(p => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl px-4 py-2.5 text-sm border themed-border themed-text focus:outline-none"
              style={{ backgroundColor: "var(--bg)" }}
            />
            {editing.imageUrl && (
              <img src={editing.imageUrl} alt="thumbnail" className="mt-2 rounded-xl max-h-32 object-cover" />
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Post Date</label>
              <input type="date" value={editing.postDate || ""}
                onChange={e => setEditing(p => ({ ...p, postDate: e.target.value }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                style={{ backgroundColor: "var(--bg)" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Created By</label>
              <select value={editing.createdBy}
                onChange={e => setEditing(p => ({ ...p, createdBy: e.target.value as TeamMember }))}
                className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none capitalize"
                style={{ backgroundColor: "var(--bg)" }}>
                {TEAM.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t themed-border">
            <button onClick={() => { onDelete(card.id); onClose(); }}
              className="text-sm px-4 py-2 rounded-xl transition-colors"
              style={{ color: "var(--danger)", backgroundColor: "#fef2f2" }}>
              Delete
            </button>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="text-sm px-4 py-2 rounded-xl border themed-border themed-secondary">
                Cancel
              </button>
              <button onClick={() => { onUpdate(editing); onClose(); }}
                className="text-sm px-5 py-2 rounded-xl text-white font-medium"
                style={{ backgroundColor: "var(--accent)" }}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filter Bar ───────────────────────────────────────────────────
function FilterBar({ filters, onChange }: {
  filters: { client: ClientTag | "all"; type: ContentType | "all"; assignee: TeamMember | "all" };
  onChange: (f: any) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <span className="text-xs font-semibold uppercase tracking-wide themed-muted">Filter:</span>
      <select value={filters.client}
        onChange={e => onChange({ ...filters, client: e.target.value })}
        className="text-xs rounded-xl px-3 py-1.5 border themed-border themed-text focus:outline-none"
        style={{ backgroundColor: "var(--surface)" }}>
        <option value="all">All Clients</option>
        {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <select value={filters.type}
        onChange={e => onChange({ ...filters, type: e.target.value })}
        className="text-xs rounded-xl px-3 py-1.5 border themed-border themed-text focus:outline-none capitalize"
        style={{ backgroundColor: "var(--surface)" }}>
        <option value="all">All Types</option>
        {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filters.assignee}
        onChange={e => onChange({ ...filters, assignee: e.target.value })}
        className="text-xs rounded-xl px-3 py-1.5 border themed-border themed-text focus:outline-none capitalize"
        style={{ backgroundColor: "var(--surface)" }}>
        <option value="all">All Team</option>
        {TEAM.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}

// ── Main Board ───────────────────────────────────────────────────
export function MediaBoard() {
  const [cards, setCards] = useState<MediaCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MediaCard | null>(null);
  const [slackTarget, setSlackTarget] = useState<MediaCard | null>(null);
  const [adding, setAdding] = useState<Phase | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [filters, setFilters] = useState<{ client: ClientTag | "all"; type: ContentType | "all"; assignee: TeamMember | "all" }>({
    client: "all", type: "all", assignee: "all"
  });
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load cards from GitHub on mount
  useEffect(() => {
    fetch("/api/media-cards")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCards(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Persist cards to GitHub with debounce
  useEffect(() => {
    if (!loaded) return; // Don't save until initial load completes

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      fetch("/api/media-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cards),
      }).catch(console.error);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cards, loaded]);

  const filteredCards = cards.filter(c => {
    if (filters.client !== "all" && c.client !== filters.client) return false;
    if (filters.type !== "all" && c.contentType !== filters.type) return false;
    if (filters.assignee !== "all" && !c.assignedTo.includes(filters.assignee as TeamMember)) return false;
    return true;
  });

  const getPhaseCards = (phase: Phase) => filteredCards.filter(c => c.phase === phase);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    setCards(prev => prev.map(c =>
      c.id === draggableId ? { ...c, phase: destination.droppableId as Phase } : c
    ));
  }, []);

  const addCard = (phase: Phase) => {
    if (!newTitle.trim()) return;
    const card: MediaCard = {
      id: Math.random().toString(36).substring(2),
      title: newTitle.trim(),
      phase,
      contentType: "reel",
      client: "dlf-brand",
      platforms: [],
      assignedTo: [],
      createdAt: new Date().toISOString(),
      createdBy: "blade",
    };
    setCards(prev => [...prev, card]);
    setAdding(null);
    setNewTitle("");
  };

  const updateCard = (updated: MediaCard) => setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  const deleteCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onChange={setFilters} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PHASES.map(phase => {
            const phaseCards = getPhaseCards(phase.id);
            return (
              <div key={phase.id} className="card flex flex-col shrink-0" style={{ width: 280, minHeight: 500 }}>
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b themed-border">
                  <div className="flex items-center gap-2">
                    <span>{phase.emoji}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      {phase.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full themed-muted"
                      style={{ backgroundColor: "var(--bg)" }}>
                      {phaseCards.length}
                    </span>
                  </div>
                  <button onClick={() => { setAdding(phase.id); setNewTitle(""); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-lg themed-muted hover:opacity-60">
                    +
                  </button>
                </div>

                {/* Add card form */}
                {adding === phase.id && (
                  <div className="p-3 border-b themed-border" style={{ backgroundColor: "var(--bg)" }}>
                    <input autoFocus value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addCard(phase.id); if (e.key === "Escape") setAdding(null); }}
                      placeholder="Content title..."
                      className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => addCard(phase.id)}
                        className="flex-1 py-1.5 rounded-xl text-xs text-white font-medium"
                        style={{ backgroundColor: "var(--accent)" }}>Add</button>
                      <button onClick={() => setAdding(null)}
                        className="px-3 py-1.5 rounded-xl text-xs themed-muted">✕</button>
                    </div>
                  </div>
                )}

                {/* Cards */}
                <Droppable droppableId={phase.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className="flex-1 p-3 space-y-2 overflow-y-auto"
                      style={{
                        backgroundColor: snapshot.isDraggingOver ? `${phase.color}08` : "transparent",
                        transition: "background-color 0.15s",
                        minHeight: 60,
                      }}>
                      {phaseCards.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-center py-8 themed-muted">Drop here</p>
                      )}
                      {phaseCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedCard(card)}
                              className="rounded-2xl p-3 border cursor-pointer transition-shadow"
                              style={{
                                backgroundColor: snapshot.isDragging ? "var(--surface)" : "var(--bg)",
                                borderColor: snapshot.isDragging ? phase.color : "var(--border)",
                                boxShadow: snapshot.isDragging ? "0 8px 24px rgba(0,0,0,0.1)" : "none",
                                ...provided.draggableProps.style,
                              }}>
                              {/* Card thumbnail */}
                              {card.imageUrl && (
                                <img src={card.imageUrl} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                              )}

                              {/* Title */}
                              <p className="text-sm font-medium leading-snug themed-text mb-2">{card.title}</p>

                              {/* Tags row */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: `${TYPE_COLORS[card.contentType]}15`, color: TYPE_COLORS[card.contentType] }}>
                                  {card.contentType}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full themed-muted"
                                  style={{ backgroundColor: "var(--border)" }}>
                                  {CLIENTS.find(c => c.id === card.client)?.label || card.client}
                                </span>
                              </div>

                              {/* Assigned To */}
                              {card.assignedTo.length > 0 && (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="text-xs themed-muted">👤</span>
                                  <div className="flex flex-wrap gap-1">
                                    {card.assignedTo.map(m => (
                                      <span key={m} className="text-xs px-2 py-0.5 rounded-full capitalize"
                                        style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                                        {m}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {card.driveLink && (
                                    <span className="text-xs themed-muted">📎</span>
                                  )}
                                  {card.script && (
                                    <span className="text-xs themed-muted">📝</span>
                                  )}
                                  {card.postDate && (
                                    <span className="text-xs themed-muted">
                                      {new Date(card.postDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                  )}
                                </div>
                                {card.assignedTo.length > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSlackTarget(card); }}
                                    title="Notify via Slack"
                                    className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                                    style={{ backgroundColor: "#4A154B", color: "#fff" }}>
                                    Slack
                                  </button>
                                )}
                              </div>
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

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={updateCard}
          onDelete={deleteCard}
        />
      )}

      {/* Slack Notify Modal */}
      {slackTarget && (
        <SlackNotifyModal
          card={slackTarget}
          onClose={() => setSlackTarget(null)}
        />
      )}
    </div>
  );
}
