"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { ContentItem } from "@/lib/data/content";

// ─── Constants ────────────────────────────────────────────────────
const STATUSES = [
  { id: "💡 Idea",        label: "Idea",        color: "#6366f1" },
  { id: "✍️ Creation",    label: "Creating",    color: "#f59e0b" },
  { id: "Editing",        label: "Editing",     color: "#3b82f6" },
  { id: "For Review",     label: "Review",      color: "#8b5cf6" },
  { id: "🚀 Ready",       label: "Ready",       color: "#10b981" },
  { id: "📆 Scheduled",   label: "Scheduled",   color: "#06b6d4" },
  { id: "✅ Posted",      label: "Posted",      color: "#6b7280" },
];

const ALL_STATUSES = [
  "💡 Idea", "✍️ Creation", "Editing", "For Review",
  "🚀 Ready", "📆 Scheduled", "✅ Posted",
  "📝 Create Now", "Post Now", "❌ Overdue",
  "Heygen", "Eleven labs", "To Do", "In Progress",
];

const PLATFORM_OPTIONS = [
  "📲 Instagram Post", "📹 IG Reels", "🎥 YouTube", "📹 YT Short",
  "👨‍💼 FB Personal", "👨‍👨‍👦‍👦 FB Group", "👨‍👨‍👦‍👦 Skool",
  "💰 Paid Ads", "📧 Email", "TikTok", " Carousel",
];

const CONTENT_TYPES = [
  "🆕 CTA Post", "🎉 Client Win", "📖  Story Post", "🧠 Belief Shifting Post",
  "🔥 Quick Win / Pro-Tip", "❓ Question Post", "🏆 Hype Post",
  "🎥 LIVE Video", "Short Form Video", "👉 Carosel", "Short", "Reel", "Post",
];

function statusColor(s: string) {
  return STATUSES.find(x => x.id === s)?.color || "#6b7280";
}
function statusLabel(s: string) {
  return STATUSES.find(x => x.id === s)?.label || s.replace(/[^\w\s]/g, "").trim();
}

function platformShort(p: string) {
  const map: Record<string, string> = {
    "📲 Instagram Post": "IG Post", "📹 IG Reels": "Reels",
    "🎥 YouTube": "YouTube", "📹 YT Short": "YT Short",
    "👨‍💼 FB Personal": "FB", "👨‍👨‍👦‍👦 FB Group": "FB Group",
    "👨‍👨‍👦‍👦 Skool": "Skool", "💰 Paid Ads": "Ads",
    "📧 Email": "Email", "Tiktok ": "TikTok", "TikTok": "TikTok",
    "Instagram": "IG", " Carousel": "Carousel",
  };
  return map[p] || p.replace(/[^\w\s]/g, "").trim().slice(0, 10);
}

// ─── Video embed helper ───────────────────────────────────────────
function VideoEmbed({ url }: { url: string }) {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        className="w-full rounded-xl" style={{ height: 280 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([^?]+)/);
  if (loomMatch) {
    return (
      <iframe
        src={`https://www.loom.com/embed/${loomMatch[1]}`}
        className="w-full rounded-xl" style={{ height: 280 }}
        allowFullScreen
      />
    );
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
        className="w-full rounded-xl" style={{ height: 280 }}
        allowFullScreen
      />
    );
  }

  // Direct video file
  if (url.match(/\.(mp4|mov|webm)/i)) {
    return <video src={url} controls className="w-full rounded-xl" style={{ maxHeight: 280 }} />;
  }

  // Fallback link
  return (
    <a href={url} target="_blank" rel="noopener"
      className="flex items-center gap-2 p-3 rounded-xl border themed-border themed-muted hover:opacity-70 transition-opacity text-sm">
      🎥 Open Video ↗
    </a>
  );
}

// ─── Full Edit Modal ──────────────────────────────────────────────
function EditModal({ item, onClose, onSave }: {
  item: ContentItem;
  onClose: () => void;
  onSave: (updated: ContentItem) => void;
}) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"write" | "platforms" | "analytics">("write");

  const set = (key: keyof ContentItem, val: any) => setForm(p => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          fields: {
            "👦 Name": form.name,
            "⭐️ Status": form.status,
            "🚀 Content Type": form.contentType,
            "🪝 Hook": form.hook,
            "✍️ Copy": form.copy,
            "✍️ Script": form.script,
            "📲 Upload Location": form.platforms,
            "🗓️ Post Time": form.postTime,
            "🎁 CTA Link": form.ctaLink,
            "🖥️ Finished Video": form.finishedVideo,
            "🎥 Raw Link": form.rawLink,
            "🔗 PostLink": form.postLink,
            "👀 Views": form.views,
            "👍 Likes": form.likes,
            "🔄 Shares": form.shares,
            "🔖 Saves": form.saves,
            "💬 # of Comments": form.comments,
          },
        }),
      });
      if (!res.ok) throw new Error();
      onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", maxHeight: "92vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b themed-border flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor(form.status) }} />
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="text-base font-serif themed-text bg-transparent border-none focus:outline-none flex-1 min-w-0"
              style={{ fontWeight: 400 }}
              placeholder="Content title..."
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={save} disabled={saving}
              className="text-xs px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50 transition-all"
              style={{ backgroundColor: saved ? "#10b981" : "var(--accent)" }}>
              {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
            </button>
            <button onClick={onClose} className="themed-muted hover:opacity-60 text-lg ml-1">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b themed-border px-6 flex-shrink-0">
          {(["write", "platforms", "analytics"] as const).map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide capitalize border-b-2 transition-colors -mb-px"
              style={{
                borderBottomColor: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "var(--text)" : "var(--muted)",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* ── WRITE TAB — everything you need in one place ── */}
          {tab === "write" && (
            <>
              {/* Status + Type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                    style={{ backgroundColor: "var(--bg)" }}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/[^\w\s]/g, "").trim() || s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">Content Type</label>
                  <select value={form.contentType} onChange={e => set("contentType", e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                    style={{ backgroundColor: "var(--bg)" }}>
                    <option value="">— Select type —</option>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/[^\w\s]/g, "").trim()}</option>)}
                  </select>
                </div>
              </div>

              {/* Post time */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">📅 Post Date & Time</label>
                <input type="datetime-local" value={form.postTime?.slice(0, 16) || ""}
                  onChange={e => set("postTime", e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Hook */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">🪝 Hook</label>
                <input value={form.hook} onChange={e => set("hook", e.target.value)}
                  placeholder="What stops the scroll..."
                  className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Copy */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">✍️ Copy / Caption</label>
                <textarea value={form.copy} onChange={e => set("copy", e.target.value)}
                  rows={7} placeholder="Caption / post copy..."
                  className="w-full rounded-2xl px-4 py-3 text-sm border themed-border themed-text focus:outline-none resize-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* Script */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">📝 Script</label>
                <textarea value={form.script} onChange={e => set("script", e.target.value)}
                  rows={8} placeholder="Full script..."
                  className="w-full rounded-2xl px-4 py-3 text-sm border themed-border themed-text focus:outline-none resize-none"
                  style={{ backgroundColor: "var(--bg)" }}
                />
              </div>

              {/* CTA Link */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">🎁 CTA Link</label>
                <div className="flex gap-2">
                  <input value={form.ctaLink || ""} onChange={e => set("ctaLink", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                    style={{ backgroundColor: "var(--bg)" }}
                  />
                  {form.ctaLink && (
                    <a href={form.ctaLink} target="_blank" rel="noopener"
                      className="px-3 py-2 rounded-xl border themed-border themed-muted hover:opacity-70 text-sm flex-shrink-0">↗</a>
                  )}
                </div>
              </div>

              {/* ── LINKS SECTION (inline, no tab-switching needed) ── */}
              <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide themed-muted">🔗 Links</p>

                <div>
                  <label className="text-xs themed-muted block mb-1">🎥 Finished Video</label>
                  <div className="flex gap-2">
                    <input value={form.finishedVideo || ""} onChange={e => set("finishedVideo", e.target.value)}
                      placeholder="YouTube / Loom / Vimeo..."
                      className="flex-1 rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    {form.finishedVideo && (
                      <a href={form.finishedVideo} target="_blank" rel="noopener"
                        className="px-3 py-2 rounded-xl border themed-border themed-muted hover:opacity-70 text-sm flex-shrink-0">↗</a>
                    )}
                  </div>
                  {form.finishedVideo && <div className="mt-2"><VideoEmbed url={form.finishedVideo} /></div>}
                </div>

                <div>
                  <label className="text-xs themed-muted block mb-1">🎞️ Raw Footage</label>
                  <div className="flex gap-2">
                    <input value={form.rawLink || ""} onChange={e => set("rawLink", e.target.value)}
                      placeholder="Drive / Dropbox / direct link..."
                      className="flex-1 rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    {form.rawLink && (
                      <a href={form.rawLink} target="_blank" rel="noopener"
                        className="px-3 py-2 rounded-xl border themed-border themed-muted hover:opacity-70 text-sm flex-shrink-0">↗</a>
                    )}
                  </div>
                  {form.rawLink && !form.rawLink.match(/drive\.google|dropbox|box\.com/) && (
                    <div className="mt-2"><VideoEmbed url={form.rawLink} /></div>
                  )}
                </div>

                <div>
                  <label className="text-xs themed-muted block mb-1">📌 Live Post</label>
                  <div className="flex gap-2">
                    <input value={form.postLink || ""} onChange={e => set("postLink", e.target.value)}
                      placeholder="Link to the live post..."
                      className="flex-1 rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    {form.postLink && (
                      <a href={form.postLink} target="_blank" rel="noopener"
                        className="px-3 py-2 rounded-xl border themed-border themed-muted hover:opacity-70 text-sm flex-shrink-0">↗</a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PLATFORMS TAB ── */}
          {tab === "platforms" && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-2">📲 Where is this going?</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM_OPTIONS.map(p => {
                  const active = form.platforms.includes(p);
                  return (
                    <button key={p} onClick={() => {
                      set("platforms", active
                        ? form.platforms.filter(x => x !== p)
                        : [...form.platforms, p]);
                    }}
                      className="text-left text-sm px-4 py-3 rounded-xl border transition-all font-medium"
                      style={{
                        backgroundColor: active ? `${statusColor(form.status)}15` : "var(--bg)",
                        borderColor: active ? statusColor(form.status) : "var(--border)",
                        color: active ? statusColor(form.status) : "var(--muted)",
                      }}>
                      {active ? "✓ " : ""}{platformShort(p)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {tab === "analytics" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "views", label: "👀 Views" },
                  { key: "likes", label: "❤️ Likes" },
                  { key: "shares", label: "🔄 Shares" },
                  { key: "saves", label: "🔖 Saves" },
                  { key: "comments", label: "💬 Comments" },
                ] as const).map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold uppercase tracking-wide themed-muted block mb-1.5">{label}</label>
                    <input type="number" value={(form as any)[key] || ""}
                      onChange={e => set(key as any, Number(e.target.value))}
                      className="w-full rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
                      style={{ backgroundColor: "var(--bg)" }}
                    />
                  </div>
                ))}
              </div>

              {(form.views > 0 || form.likes > 0) && (
                <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold themed-muted uppercase tracking-wide">Performance</p>
                  <div className="grid grid-cols-2 gap-4">
                    {form.views > 0 && (
                      <div>
                        <p className="text-xs themed-muted">Engagement Rate</p>
                        <p className="text-lg font-serif themed-text">
                          {form.views > 0 ? (((form.likes + form.comments + form.shares + form.saves) / form.views) * 100).toFixed(2) : "0"}%
                        </p>
                      </div>
                    )}
                    {form.saves > 0 && (
                      <div>
                        <p className="text-xs themed-muted">Save Rate</p>
                        <p className="text-lg font-serif themed-text">
                          {((form.saves / form.views) * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer save */}
        <div className="px-6 py-4 border-t themed-border flex-shrink-0 flex items-center justify-between">
          <div className="flex gap-2">
            {ALL_STATUSES.filter(s => s !== form.status).slice(0, 4).map(s => (
              <button key={s} onClick={() => set("status", s)}
                className="text-xs px-3 py-1.5 rounded-xl border themed-border themed-muted hover:opacity-70 transition-opacity">
                → {statusLabel(s)}
              </button>
            ))}
          </div>
          <button onClick={save} disabled={saving}
            className="text-sm px-6 py-2 rounded-xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: saved ? "#10b981" : "var(--accent)" }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Card (compact) ───────────────────────────────────────
function ContentCard({ item, onOpen, selected, onToggleSelect }: {
  item: ContentItem;
  onOpen: () => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const color = statusColor(item.status);
  const hasEngagement = item.views > 0 || item.likes > 0;

  return (
    <div className="rounded-2xl border transition-all cursor-pointer hover:border-opacity-60 group relative"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: selected ? "var(--accent)" : "var(--border)",
        boxShadow: selected ? "0 0 0 1px var(--accent)" : "none",
      }}
      onClick={onToggleSelect ? () => onToggleSelect(item.id) : onOpen}>
      {/* Selection checkbox */}
      {onToggleSelect && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={e => { e.stopPropagation(); onToggleSelect(item.id); }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center border transition-colors"
            style={{
              backgroundColor: selected ? "var(--accent)" : "var(--bg)",
              borderColor: selected ? "var(--accent)" : "var(--border)",
            }}
          >
            {selected && <span style={{ color: "#fff", fontSize: "10px", lineHeight: 1 }}>✓</span>}
          </div>
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start gap-2" style={{ paddingLeft: onToggleSelect ? "1.25rem" : "0" }}>
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium themed-text leading-snug line-clamp-2 group-hover:opacity-80">{item.name}</p>
            {item.hook && (
              <p className="text-xs themed-muted mt-0.5 line-clamp-1 italic">"{item.hook}"</p>
            )}
          </div>
          {item.contentType && (
            <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0 themed-muted border themed-border"
              style={{ fontSize: "9px" }}>
              {item.contentType.replace(/[^\w\s]/g, "").trim().slice(0, 12)}
            </span>
          )}
        </div>

        {item.platforms.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.platforms.slice(0, 3).map(p => (
              <span key={p} className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}15`, color, fontSize: "9px" }}>
                {platformShort(p)}
              </span>
            ))}
            {item.platforms.length > 3 && (
              <span className="text-xs themed-muted" style={{ fontSize: "9px" }}>+{item.platforms.length - 3}</span>
            )}
          </div>
        )}

        {item.postTime && (
          <p className="text-xs themed-muted mt-1.5">
            📅 {new Date(item.postTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}

        {hasEngagement && (
          <div className="flex gap-3 mt-1.5 text-xs themed-muted">
            {item.views > 0 && <span>👀 {item.views.toLocaleString()}</span>}
            {item.likes > 0 && <span>❤️ {item.likes.toLocaleString()}</span>}
            {item.saves > 0 && <span>🔖 {item.saves}</span>}
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-1.5 mt-2">
          {item.finishedVideo && (
            <span className="text-xs px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: "#3b82f620", color: "#3b82f6", fontSize: "10px" }}>🎥 Video</span>
          )}
          {item.postLink && (
            <span className="text-xs px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: "#10b98120", color: "#10b981", fontSize: "10px" }}>🔗 Live</span>
          )}
          {item.rawLink && (
            <span className="text-xs px-2 py-0.5 rounded-lg themed-muted border themed-border" style={{ fontSize: "10px" }}>Raw</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────
function CalendarView({ items, onOpen }: { items: ContentItem[]; onOpen: (item: ContentItem) => void }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0 = Sun
  const totalDays = lastDay.getDate();

  // Build a map of day number -> items for current month
  const dayMap: Record<string, ContentItem[]> = {};
  items.forEach(item => {
    if (!item.postTime) return;
    const d = new Date(item.postTime);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate().toString();
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(item);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build grid: nulls for leading offset, then 1..totalDays, then trailing nulls
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = today.getFullYear() === year && today.getMonth() === month
    ? today.getDate().toString() : null;

  return (
    <div className="card rounded-2xl overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b themed-border">
        <button onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl border themed-border themed-muted hover:opacity-70 transition-opacity text-sm">
          ‹
        </button>
        <span className="text-sm font-semibold themed-text">{monthLabel}</span>
        <button onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl border themed-border themed-muted hover:opacity-70 transition-opacity text-sm">
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b themed-border">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide themed-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const isToday = day !== null && todayKey !== null && day.toString() === todayKey;
          const cellItems = day !== null ? (dayMap[day.toString()] || []) : [];

          return (
            <div key={idx}
              className="border-b border-r themed-border p-1.5"
              style={{
                minHeight: 90,
                backgroundColor: day === null
                  ? "var(--bg)"
                  : isToday
                    ? "rgba(99,102,241,0.06)"
                    : "transparent",
              }}>
              {day !== null && (
                <>
                  <span
                    className="text-xs font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full mb-1"
                    style={{
                      backgroundColor: isToday ? "var(--accent)" : "transparent",
                      color: isToday ? "#fff" : "var(--muted)",
                    }}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {cellItems.slice(0, 3).map(item => (
                      <button key={item.id}
                        onClick={() => onOpen(item)}
                        className="w-full text-left px-1.5 py-0.5 rounded-md truncate transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: `${statusColor(item.status)}20`,
                          color: statusColor(item.status),
                          fontSize: "10px",
                          lineHeight: "1.5",
                        }}
                        title={item.name}>
                        {item.name}
                      </button>
                    ))}
                    {cellItems.length > 3 && (
                      <p className="themed-muted pl-1" style={{ fontSize: "9px" }}>
                        +{cellItems.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────
export function ContentBoard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"pipeline" | "list" | "calendar">("pipeline");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(STATUSES[0].id);
  const [bulkApplying, setBulkApplying] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSelectAll = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) { ids.forEach(id => next.delete(id)); }
      else { ids.forEach(id => next.add(id)); }
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    setBulkApplying(true);
    const ids = Array.from(selectedIds);
    setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, status: bulkStatus } : i));
    try {
      await Promise.all(ids.map(id =>
        fetch("/api/content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, fields: { "⭐️ Status": bulkStatus } }),
        })
      ));
    } catch {}
    setBulkApplying(false);
    clearSelection();
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setItems(prev => [created, ...prev]);
      setNewTitle("");
      setCreating(false);
      setEditItem(created);
    } catch {
      alert("Failed to create content. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;

    // Optimistic update
    setItems(prev => prev.map(i => i.id === draggableId ? { ...i, status: newStatus } : i));

    // Persist to Airtable
    try {
      await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draggableId,
          fields: { "⭐️ Status": newStatus },
        }),
      });
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content?limit=200`);
      if (!res.ok) { setItems([]); return; }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = (updated: ContentItem) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setEditItem(updated);
  };

  const allTypes = [...new Set(items.map(i => i.contentType).filter(Boolean))];

  const filtered = items.filter(i => {
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    const matchType = typeFilter === "all" || i.contentType === typeFilter;
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.hook.toLowerCase().includes(search.toLowerCase()) ||
      i.copy.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const posted = items.filter(i => i.status === "✅ Posted").length;
  const inProgress = items.filter(i => ["Editing", "✍️ Creation", "For Review"].includes(i.status)).length;
  const ready = items.filter(i => i.status === "🚀 Ready").length;
  const totalViews = items.reduce((a, i) => a + i.views, 0);

  const pipelineStatuses = STATUSES.filter(s => !["📆 Scheduled", "✅ Posted"].includes(s.id));

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Pieces", value: items.length, color: "#6366f1" },
          { label: "In Progress", value: inProgress, color: "#f59e0b" },
          { label: "Ready to Post", value: ready, color: "#10b981" },
          { label: "Total Views", value: totalViews > 0 ? totalViews.toLocaleString() : `${posted} posted`, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="card rounded-2xl p-4">
            <p className="text-xs themed-muted uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-serif mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search content..."
          className="rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
          style={{ backgroundColor: "var(--bg)", minWidth: 180 }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
          style={{ backgroundColor: "var(--bg)" }}>
          <option value="all">All Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t.replace(/[^\w\s]/g, "").trim()}</option>)}
        </select>
        {view === "list" && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
            style={{ backgroundColor: "var(--bg)" }}>
            <option value="all">All Statuses ({items.length})</option>
            {STATUSES.map(s => {
              const count = items.filter(i => i.status === s.id).length;
              return <option key={s.id} value={s.id}>{s.label} ({count})</option>;
            })}
          </select>
        )}
        <div className="flex rounded-xl border themed-border overflow-hidden ml-auto">
          <button onClick={() => setView("pipeline")} className="px-3 py-2 text-xs font-medium transition-colors"
            style={{ backgroundColor: view === "pipeline" ? "var(--accent)" : "var(--bg)", color: view === "pipeline" ? "#fff" : "var(--muted)" }}>
            Pipeline
          </button>
          <button onClick={() => setView("list")} className="px-3 py-2 text-xs font-medium transition-colors"
            style={{ backgroundColor: view === "list" ? "var(--accent)" : "var(--bg)", color: view === "list" ? "#fff" : "var(--muted)" }}>
            List
          </button>
          <button onClick={() => setView("calendar")} className="px-3 py-2 text-xs font-medium transition-colors"
            style={{ backgroundColor: view === "calendar" ? "var(--accent)" : "var(--bg)", color: view === "calendar" ? "#fff" : "var(--muted)" }}>
            Calendar
          </button>
        </div>
        <button onClick={load} className="text-xs themed-muted hover:opacity-60 transition-opacity">↻</button>
        <button
          onClick={() => { setCreating(true); setNewTitle(""); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--accent)" }}
        >
          + New
        </button>
      </div>

      {/* Inline create form */}
      {creating && (
        <div className="flex items-center gap-2 p-3 rounded-2xl border themed-border"
          style={{ backgroundColor: "var(--surface)" }}>
          <span className="text-xs themed-muted font-semibold uppercase tracking-wide flex-shrink-0">Title</span>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewTitle(""); }
            }}
            placeholder="Content title..."
            className="flex-1 rounded-xl px-3 py-2 text-sm border themed-border themed-text focus:outline-none"
            style={{ backgroundColor: "var(--bg)" }}
          />
          <button
            onClick={handleCreate}
            disabled={createLoading || !newTitle.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {createLoading ? "Creating..." : "Create"}
          </button>
          <button
            onClick={() => { setCreating(false); setNewTitle(""); }}
            className="px-3 py-2 rounded-xl text-sm themed-muted hover:opacity-60 transition-opacity"
          >
            Cancel
          </button>
        </div>
      )}

      {loading && <div className="text-center py-12 themed-muted text-sm">Loading content...</div>}

      {/* Pipeline */}
      {!loading && view === "pipeline" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {pipelineStatuses.map(col => {
              const colItems = filtered.filter(i => i.status === col.id);
              return (
                <div key={col.id} className="card flex flex-col" style={{ minHeight: 300 }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b themed-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{col.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full themed-muted border themed-border">{colItems.length}</span>
                    </div>
                    {colItems.length > 0 && (
                      <button
                        onClick={() => toggleSelectAll(colItems.map(i => i.id))}
                        className="text-xs themed-muted hover:opacity-70 transition-opacity"
                        title="Select all in column"
                      >
                        <div
                          className="w-4 h-4 rounded border flex items-center justify-center"
                          style={{
                            borderColor: colItems.every(i => selectedIds.has(i.id)) ? "var(--accent)" : "var(--border)",
                            backgroundColor: colItems.every(i => selectedIds.has(i.id)) ? "var(--accent)" : "transparent",
                          }}
                        >
                          {colItems.every(i => selectedIds.has(i.id)) && <span style={{ color: "#fff", fontSize: "10px", lineHeight: 1 }}>✓</span>}
                        </div>
                      </button>
                    )}
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 p-2 space-y-2 overflow-y-auto"
                        style={{
                          backgroundColor: snapshot.isDraggingOver ? `${col.color}08` : "transparent",
                          transition: "background-color 0.15s ease",
                          minHeight: 60,
                        }}
                      >
                        {colItems.length === 0 && !snapshot.isDraggingOver && (
                          <p className="text-xs themed-muted text-center py-6">Drop content here</p>
                        )}
                        {colItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.9 : 1,
                                }}
                              >
                                <ContentCard
                                  item={item}
                                  onOpen={() => { if (selectedIds.size === 0) setEditItem(item); }}
                                  selected={selectedIds.has(item.id)}
                                  onToggleSelect={toggleSelect}
                                />
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
      )}

      {/* List */}
      {!loading && view === "list" && (
        <>
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={() => toggleSelectAll(filtered.map(i => i.id))}
                className="flex items-center gap-1.5 text-xs themed-muted hover:opacity-70 transition-opacity"
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center"
                  style={{
                    borderColor: filtered.every(i => selectedIds.has(i.id)) ? "var(--accent)" : "var(--border)",
                    backgroundColor: filtered.every(i => selectedIds.has(i.id)) ? "var(--accent)" : "transparent",
                  }}
                >
                  {filtered.every(i => selectedIds.has(i.id)) && <span style={{ color: "#fff", fontSize: "10px", lineHeight: 1 }}>✓</span>}
                </div>
                Select All
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.length === 0 && <p className="themed-muted text-sm col-span-3 text-center py-8">No content found</p>}
            {filtered.map(item => (
              <ContentCard
                key={item.id}
                item={item}
                onOpen={() => { if (selectedIds.size === 0) setEditItem(item); }}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        </>
      )}

      {/* Calendar */}
      {!loading && view === "calendar" && (
        <CalendarView items={filtered} onOpen={(item) => setEditItem(item)} />
      )}

      {/* Edit modal */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
        />
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          <span className="text-sm font-semibold themed-text" style={{ whiteSpace: "nowrap" }}>
            {selectedIds.size} selected
          </span>
          <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-sm border themed-border themed-text focus:outline-none"
            style={{ backgroundColor: "var(--bg)" }}
          >
            {STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={applyBulkStatus}
            disabled={bulkApplying}
            className="text-sm px-4 py-1.5 rounded-xl text-white font-medium disabled:opacity-50 transition-all"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {bulkApplying ? "Applying…" : "Apply"}
          </button>
          <button
            onClick={clearSelection}
            className="text-sm px-3 py-1.5 rounded-xl border themed-border themed-muted hover:opacity-70 transition-opacity"
          >
            Clear
          </button>
        </div>
      )}
    </>
  );
}
