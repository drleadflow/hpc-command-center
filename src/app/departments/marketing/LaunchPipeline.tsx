"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { TeamMember } from "@/lib/types";
import { AssigneeSelect } from "@/components/AssigneeSelect";

const STAGES = [
  { id: "ignition",    label: "IGNITION",    sublabel: "Ideation",         color: "#6366f1" },
  { id: "production",  label: "IN PRODUCTION", sublabel: "Creative Build", color: "#f59e0b" },
  { id: "staged",      label: "STAGED",      sublabel: "Ads in Draft",     color: "#3b82f6" },
  { id: "systems-go",  label: "SYSTEMS GO",  sublabel: "Automation Ready", color: "#10b981", gate: true },
  { id: "deployed",    label: "DEPLOYED",    sublabel: "Live",             color: "#ec4899" },
];

type Priority = "high" | "medium" | "low";

interface Campaign {
  id: string;
  name: string;
  client: string;
  notes: string;
  priority: Priority;
  assetLink?: string;
  adCopyLink?: string;
  automationLink?: string;
  assigned_to?: string | null;
}

type StageMap = Record<string, Campaign[]>;

const STORAGE_KEY = "dlf-launch-pipeline";

const DEFAULT_DATA: StageMap = {
  ignition: [],
  production: [],
  staged: [
    { id: "c3", name: "HealthProceo Q2", client: "HealthProceo", notes: "Creatives ready, automation pending", priority: "high" },
  ],
  "systems-go": [
    { id: "c1", name: "Med Spa Summer Push", client: "Vitality & Aesthetics", notes: "GHL workflow needs testing", priority: "high" },
  ],
  deployed: [
    { id: "c2", name: "IV Wellness Lead Gen", client: "IV Wellness", notes: "58 leads @ $12.97 CPL", priority: "medium" },
  ],
};

function loadData(): StageMap {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_DATA;
}

const PRIORITY_STYLE: Record<Priority, { bg: string; color: string }> = {
  high:   { bg: "#fef2f2", color: "var(--danger, #ef4444)" },
  medium: { bg: "#fffbeb", color: "var(--warning, #f59e0b)" },
  low:    { bg: "var(--bg)", color: "var(--muted)" },
};

export function LaunchPipeline() {
  const [columns, setColumns] = useState<StageMap>(DEFAULT_DATA);
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("high");
  const [editing, setEditing] = useState<{ stageId: string; campaign: Campaign } | null>(null);
  const [memberMap, setMemberMap] = useState<Record<string, TeamMember>>({});

  useEffect(() => {
    fetch("/api/team").then(r => r.json()).then((members: TeamMember[]) => {
      const map: Record<string, TeamMember> = {};
      for (const m of members) map[m.id] = m;
      setMemberMap(map);
    }).catch(() => {});
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    setColumns(loadData());
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    } catch {}
  }, [columns]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const src = source.droppableId;
    const dst = destination.droppableId;
    setColumns(prev => {
      const next = { ...prev };
      const srcList = [...prev[src]];
      const [moved] = srcList.splice(source.index, 1);
      const dstList = src === dst ? srcList : [...prev[dst]];
      dstList.splice(destination.index, 0, moved);
      next[src] = src === dst ? dstList : srcList;
      if (src !== dst) next[dst] = dstList;
      return next;
    });
  };

  const addCampaign = (stageId: string) => {
    if (!newName.trim()) return;
    setColumns(prev => ({
      ...prev,
      [stageId]: [...prev[stageId], {
        id: Date.now().toString(),
        name: newName.trim(),
        client: newClient.trim(),
        notes: newNotes.trim(),
        priority: newPriority,
      }],
    }));
    setNewName(""); setNewClient(""); setNewNotes(""); setNewPriority("high");
    setAdding(null);
  };

  const removeCampaign = (stageId: string, id: string) => {
    setColumns(prev => ({ ...prev, [stageId]: prev[stageId].filter(c => c.id !== id) }));
  };

  const updateCampaign = (stageId: string, updated: Campaign) => {
    setColumns(prev => ({
      ...prev,
      [stageId]: prev[stageId].map(c => c.id === updated.id ? updated : c),
    }));
  };

  const openEdit = (stageId: string, campaign: Campaign) => {
    setEditing({ stageId, campaign: { ...campaign } });
  };

  return (
    <div className="space-y-2">
      {/* Section label */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide themed-muted">⚡ Ad Launch Pipeline</span>
        <span className="text-xs themed-muted opacity-50">· drag campaigns across stages · click cards to edit · nothing deploys without Systems Go</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STAGES.map(stage => {
            const cards = columns[stage.id] || [];
            return (
              <div key={stage.id} className="card flex flex-col" style={{ minHeight: 360 }}>
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                      {stage.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>
                      {cards.length}
                    </span>
                    {stage.gate && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: `${stage.color}20`, color: stage.color, fontSize: "9px" }}>
                        GATE
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setAdding(stage.id); setNewName(""); setNewClient(""); setNewNotes(""); setNewPriority("high"); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-lg leading-none transition-colors hover:opacity-60"
                    style={{ color: "var(--muted)" }}
                  >+</button>
                </div>

                {/* Add form */}
                {adding === stage.id && (
                  <div className="p-3 border-b space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addCampaign(stage.id); if (e.key === "Escape") setAdding(null); }}
                      placeholder="Campaign name..."
                      className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none themed-text themed-border"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    <input
                      value={newClient}
                      onChange={e => setNewClient(e.target.value)}
                      placeholder="Client..."
                      className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none themed-text themed-border"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    <input
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      placeholder="Notes..."
                      className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none themed-text themed-border"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    <div className="flex gap-2">
                      <select
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as Priority)}
                        className="flex-1 rounded-xl px-2 py-1.5 text-xs border themed-border focus:outline-none themed-text"
                        style={{ backgroundColor: "var(--surface)" }}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button onClick={() => addCampaign(stage.id)}
                        className="px-3 py-1.5 rounded-xl text-xs text-white font-medium"
                        style={{ backgroundColor: "var(--accent)" }}>Add</button>
                      <button onClick={() => setAdding(null)}
                        className="px-2 py-1.5 rounded-xl text-xs themed-muted">✕</button>
                    </div>
                  </div>
                )}

                {/* Droppable */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 p-3 space-y-2 overflow-y-auto"
                      style={{
                        backgroundColor: snapshot.isDraggingOver ? `${stage.color}08` : "transparent",
                        transition: "background-color 0.15s ease",
                        minHeight: 60,
                      }}
                    >
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-center py-6 themed-muted">Drop tasks here</p>
                      )}
                      {cards.map((card, index) => {
                        const hasLinks = card.assetLink || card.adCopyLink || card.automationLink;
                        return (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => openEdit(stage.id, card)}
                                className="rounded-2xl p-3 border cursor-pointer active:cursor-grabbing transition-shadow group hover:border-opacity-60"
                                style={{
                                  backgroundColor: snapshot.isDragging ? "var(--surface)" : "var(--bg)",
                                  borderColor: snapshot.isDragging ? stage.color : "var(--border)",
                                  boxShadow: snapshot.isDragging ? "0 8px 24px rgba(0,0,0,0.12)" : "none",
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
                                    {card.name}
                                  </p>
                                  <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: PRIORITY_STYLE[card.priority].bg,
                                      color: PRIORITY_STYLE[card.priority].color,
                                      fontSize: "10px",
                                    }}>
                                    {card.priority}
                                  </span>
                                </div>
                                {(card.client || card.notes) && (
                                  <p className="text-xs mt-1.5 themed-muted line-clamp-2">
                                    {card.client ? `${card.client}${card.notes ? " · " : ""}` : ""}{card.notes}
                                  </p>
                                )}
                                {/* Link indicators */}
                                {hasLinks && (
                                  <div className="flex gap-1.5 mt-2">
                                    {card.assetLink && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--accent-bg, #eef2ff)", color: "var(--accent)" }} title="Assets linked">
                                        Assets
                                      </span>
                                    )}
                                    {card.adCopyLink && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }} title="Ad copy linked">
                                        Copy
                                      </span>
                                    )}
                                    {card.automationLink && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#fefce8", color: "#ca8a04" }} title="Automation linked">
                                        Auto
                                      </span>
                                    )}
                                  </div>
                                )}
                                {card.assigned_to && memberMap[card.assigned_to] && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                                      style={{ backgroundColor: memberMap[card.assigned_to].avatarColor, fontSize: "8px", fontWeight: 600 }}
                                    >
                                      {memberMap[card.assigned_to].name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="text-xs themed-muted truncate">{memberMap[card.assigned_to].name}</span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeCampaign(stage.id, card.id); }}
                                  className="mt-1 text-xs themed-muted opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                                >remove</button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Edit Modal */}
      {editing && (
        <EditModal
          stageId={editing.stageId}
          campaign={editing.campaign}
          memberMap={memberMap}
          onSave={(stageId, updated) => {
            updateCampaign(stageId, updated);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ───────── Edit Modal ───────── */

function EditModal({
  stageId,
  campaign,
  memberMap,
  onSave,
  onClose,
}: {
  stageId: string;
  campaign: Campaign;
  memberMap: Record<string, TeamMember>;
  onSave: (stageId: string, c: Campaign) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Campaign>({ ...campaign });

  const set = (field: keyof Campaign, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const stageMeta = STAGES.find(s => s.id === stageId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            {stageMeta && (
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stageMeta.color }} />
            )}
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Edit Campaign</h2>
            {stageMeta && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${stageMeta.color}15`, color: stageMeta.color }}>
                {stageMeta.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-lg themed-muted hover:opacity-60 transition-opacity">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Campaign Details */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide themed-muted">Campaign Name</span>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border"
                style={{ backgroundColor: "var(--bg)" }}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide themed-muted">Client</span>
                <input
                  value={form.client}
                  onChange={e => set("client", e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide themed-muted">Priority</span>
                <select
                  value={form.priority}
                  onChange={e => set("priority", e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border"
                  style={{ backgroundColor: "var(--bg)" }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>

            {/* Assignee */}
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide themed-muted">Assigned To</span>
              <div className="mt-1">
                <AssigneeSelect
                  value={form.assigned_to || null}
                  onChange={val => setForm(prev => ({ ...prev, assigned_to: val }))}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide themed-muted">Notes</span>
              <textarea
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border resize-none"
                style={{ backgroundColor: "var(--bg)" }}
              />
            </label>
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: "var(--border)" }} />

          {/* Links Section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide themed-muted">Campaign Links</p>

            <label className="block">
              <div className="flex items-center gap-2">
                <span className="text-sm">📁</span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Asset Link (Google Drive, Dropbox, etc.)</span>
              </div>
              <input
                value={form.assetLink || ""}
                onChange={e => set("assetLink", e.target.value)}
                placeholder="https://drive.google.com/..."
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border"
                style={{ backgroundColor: "var(--bg)" }}
              />
            </label>

            <label className="block">
              <div className="flex items-center gap-2">
                <span className="text-sm">✍️</span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Ad Copy Link (Doc, Notion, etc.)</span>
              </div>
              <input
                value={form.adCopyLink || ""}
                onChange={e => set("adCopyLink", e.target.value)}
                placeholder="https://docs.google.com/..."
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border"
                style={{ backgroundColor: "var(--bg)" }}
              />
            </label>

            <label className="block">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚙️</span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Automation Link (GHL Workflow, Zapier, etc.)</span>
              </div>
              <input
                value={form.automationLink || ""}
                onChange={e => set("automationLink", e.target.value)}
                placeholder="https://app.gohighlevel.com/..."
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none themed-text themed-border"
                style={{ backgroundColor: "var(--bg)" }}
              />
            </label>
          </div>

          {/* Quick-open links if they exist */}
          {(form.assetLink || form.adCopyLink || form.automationLink) && (
            <>
              <div className="border-t" style={{ borderColor: "var(--border)" }} />
              <div className="flex flex-wrap gap-2">
                {form.assetLink && (
                  <a href={form.assetLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
                    📁 Open Assets
                  </a>
                )}
                {form.adCopyLink && (
                  <a href={form.adCopyLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "#16a34a" }}>
                    ✍️ Open Ad Copy
                  </a>
                )}
                {form.automationLink && (
                  <a href={form.automationLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "#ca8a04" }}>
                    ⚙️ Open Automation
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium themed-muted hover:opacity-70 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(stageId, form)}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
