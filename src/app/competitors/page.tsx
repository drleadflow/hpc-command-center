"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Competitor {
  id: string;
  name: string;
  category: string;
  instagramHandle: string;
  instagramFollowers: string;
  youtubeChannel: string;
  youtubeSubscribers: string;
  tiktokHandle: string;
  notes: string;
  addedAt: string;
  lastUpdated: string;
  scannedData?: {
    platform: "instagram" | "youtube" | "tiktok";
    followers: number | null;
    postsCount: number | null;
    engagement: number | null;
    bio: string;
    profileUrl: string;
    recentContent: RecentPost[];
    scannedAt: string;
  };
}

interface RecentPost {
  url?: string;
  caption?: string;
  title?: string;
  likes?: number;
  comments?: number;
  views?: number;
  shares?: number;
  publishedAt?: string;
}

interface GoogleTrend {
  term: string;
  value: number;
  direction: "up" | "down" | "flat";
  geo: string;
}

interface TikTokHashtag {
  hashtag: string;
  viewCount: number | null;
  videoCount: number | null;
  trending: boolean;
}

interface TrendingData {
  googleTrends: GoogleTrend[];
  tiktokTrending: TikTokHashtag[];
  cached: boolean;
  lastFetched: string;
}

interface RepurposeItem {
  id: string;
  topic: string;
  sourcePlatform: string;
  targetPlatforms: string[];
  status: "idea" | "scripted" | "filmed" | "posted";
  notes: string;
  addedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "dlf_competitors_v1";
const REPURPOSE_KEY = "dlf-repurpose-queue";

const MY_HANDLES = [
  { platform: "YouTube", handle: "@doctablademd", url: "https://www.youtube.com/@doctablademd", color: "#FF0000", label: "YT" },
  { platform: "TikTok", handle: "@doctablademd", url: "https://www.tiktok.com/@doctablademd", color: "#000000", label: "TK" },
  { platform: "Instagram", handle: "@doctablamd", url: "https://www.instagram.com/doctablamd", color: "#e1306c", label: "IG" },
  { platform: "LinkedIn", handle: "in/emekaajufo", url: "https://www.linkedin.com/in/emekaajufo", color: "#0a66c2", label: "LI" },
];

const CONTENT_IDEAS: Record<string, string> = {
  "medical marketing": "Create a TikTok: '3 marketing tactics my med practice uses that most docs don't know about'",
  "AI lead generation": "Create a TikTok about how you use AI for patient acquisition at scale",
  "healthcare automation": "Behind-the-scenes Reel: a day running a practice with AI automation",
  "patient acquisition": "YouTube Short: 'How I get 20+ new patients a month without paid ads'",
  "med spa marketing": "Instagram carousel: before/after marketing results for med spa clients",
  "medicalmarketing": "TikTok: 'The #medicalmarketing strategy no one talks about'",
  "medspa": "Instagram Reel: day in the life running a med spa business",
  "healthcarebusiness": "LinkedIn post: the business side of medicine nobody teaches in med school",
  "leadgeneration": "TikTok: 'How I generate leads for doctors using AI'",
  "aiautomation": "YouTube: full walkthrough of my AI automation stack for lead gen",
};

const SEED_DATA: Competitor[] = [
  {
    id: "1",
    name: "Alex Hormozi",
    category: "Business / Agency",
    instagramHandle: "@hormozi",
    instagramFollowers: "4.1M",
    youtubeChannel: "Alex Hormozi",
    youtubeSubscribers: "4.5M",
    tiktokHandle: "@ahormozi",
    notes: "Heavy long-form YouTube + short-form clips. Posts daily.",
    addedAt: "2026-03-01",
    lastUpdated: "2026-03-01",
  },
  {
    id: "2",
    name: "Gary Vaynerchuk",
    category: "Marketing / Agency",
    instagramHandle: "@garyvee",
    instagramFollowers: "10.2M",
    youtubeChannel: "GaryVee",
    youtubeSubscribers: "3.8M",
    tiktokHandle: "@garyvee",
    notes: "Extreme volume. 50+ pieces/day. Omnichannel.",
    addedAt: "2026-03-01",
    lastUpdated: "2026-03-01",
  },
];

const STATUS_COLORS: Record<RepurposeItem["status"], { bg: string; text: string; label: string }> = {
  idea: { bg: "var(--accent-bg)", text: "var(--accent-text)", label: "Idea" },
  scripted: { bg: "#fef3c7", text: "#92400e", label: "Scripted" },
  filmed: { bg: "#dbeafe", text: "#1e40af", label: "Filmed" },
  posted: { bg: "#d1fae5", text: "#065f46", label: "Posted" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function directionArrow(d: "up" | "down" | "flat"): string {
  if (d === "up") return "↑";
  if (d === "down") return "↓";
  return "→";
}

function directionColor(d: "up" | "down" | "flat"): string {
  if (d === "up") return "#16a34a";
  if (d === "down") return "var(--danger, #b91c1c)";
  return "var(--muted)";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function PlatformBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: color, color: "white" }}
    >
      {label}
    </span>
  );
}

// ── Competitor Card ───────────────────────────────────────────────────────────

function CompetitorCard({
  competitor,
  onEdit,
  onDelete,
  onScan,
}: {
  competitor: Competitor;
  onEdit: () => void;
  onDelete: () => void;
  onScan: (platform: "instagram" | "youtube" | "tiktok", handle: string) => void;
}) {
  const [scanPlatform, setScanPlatform] = useState<"instagram" | "youtube" | "tiktok">("instagram");
  const [scanHandle, setScanHandle] = useState(competitor.instagramHandle.replace(/^@/, ""));
  const [scanning, setScanning] = useState(false);
  const scanned = competitor.scannedData;

  async function handleScan() {
    if (!scanHandle.trim()) return;
    setScanning(true);
    await onScan(scanPlatform, scanHandle.trim());
    setScanning(false);
  }

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-serif font-medium truncate" style={{ color: "var(--text)" }}>
            {competitor.name}
          </h3>
          <span
            className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
          >
            {competitor.category}
          </span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-xs px-2 py-1 rounded-lg transition-colors min-h-[32px]"
            style={{ color: "var(--muted)" }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1 rounded-lg transition-colors min-h-[32px]"
            style={{ color: "var(--danger, #b91c1c)" }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Handles */}
      <div className="space-y-1.5">
        {competitor.instagramHandle && (
          <div className="flex items-center gap-2">
            <PlatformBadge label="IG" color="#e1306c" />
            <span className="text-sm" style={{ color: "var(--text)" }}>{competitor.instagramHandle}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{competitor.instagramFollowers}</span>
          </div>
        )}
        {competitor.youtubeChannel && (
          <div className="flex items-center gap-2">
            <PlatformBadge label="YT" color="#FF0000" />
            <span className="text-sm" style={{ color: "var(--text)" }}>{competitor.youtubeChannel}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{competitor.youtubeSubscribers}</span>
          </div>
        )}
        {competitor.tiktokHandle && (
          <div className="flex items-center gap-2">
            <PlatformBadge label="TK" color="#010101" />
            <span className="text-sm" style={{ color: "var(--text)" }}>{competitor.tiktokHandle}</span>
          </div>
        )}
      </div>

      {/* Scanned data */}
      {scanned && (
        <div
          className="rounded-xl p-3 space-y-2 text-xs"
          style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--border)", border: "1px solid" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Live Data · {scanned.platform}
            </span>
            <span style={{ color: "var(--muted)" }}>
              {new Date(scanned.scannedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="font-serif text-base font-medium" style={{ color: "var(--text)" }}>
                {formatNumber(scanned.followers)}
              </div>
              <div style={{ color: "var(--muted)" }}>Followers</div>
            </div>
            <div>
              <div className="font-serif text-base font-medium" style={{ color: "var(--text)" }}>
                {formatNumber(scanned.postsCount)}
              </div>
              <div style={{ color: "var(--muted)" }}>Posts</div>
            </div>
            <div>
              <div className="font-serif text-base font-medium" style={{ color: "var(--text)" }}>
                {scanned.engagement != null ? `${scanned.engagement}%` : "—"}
              </div>
              <div style={{ color: "var(--muted)" }}>Eng. Rate</div>
            </div>
          </div>
          {scanned.recentContent.length > 0 && (
            <div className="space-y-1 pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div className="font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                Recent
              </div>
              {scanned.recentContent.slice(0, 3).map((post, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                    {post.title ?? post.caption ?? "(no caption)"}
                  </span>
                  {(post.views ?? post.likes) != null && (
                    <span className="flex-shrink-0" style={{ color: "var(--muted)" }}>
                      {formatNumber(post.views ?? post.likes)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scan form */}
      <div className="flex gap-2 items-center">
        <select
          value={scanPlatform}
          onChange={(e) => {
            const p = e.target.value as "instagram" | "youtube" | "tiktok";
            setScanPlatform(p);
            setScanHandle(
              p === "instagram"
                ? competitor.instagramHandle.replace(/^@/, "")
                : p === "youtube"
                ? competitor.youtubeChannel
                : competitor.tiktokHandle.replace(/^@/, "")
            );
          }}
          className="text-xs px-2 py-2 rounded-xl border min-h-[36px]"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
        </select>
        <input
          type="text"
          value={scanHandle}
          onChange={(e) => setScanHandle(e.target.value)}
          placeholder="handle"
          className="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl border min-h-[36px]"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <button
          onClick={handleScan}
          disabled={scanning || !scanHandle.trim()}
          className="text-xs px-3 py-2 rounded-xl border transition-colors font-medium min-h-[36px] disabled:opacity-50"
          style={{
            backgroundColor: "var(--accent-bg)",
            borderColor: "var(--accent)",
            color: "var(--accent-text)",
          }}
        >
          {scanning ? "…" : "Scan"}
        </button>
      </div>

      {competitor.notes && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {competitor.notes}
        </p>
      )}

      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Added {competitor.addedAt}
      </div>
    </div>
  );
}

// ── Quick-Add Bar ─────────────────────────────────────────────────────────────

function QuickScanBar({ onAdd }: { onAdd: (platform: "instagram" | "youtube" | "tiktok", handle: string, name: string) => void }) {
  const [platform, setPlatform] = useState<"instagram" | "youtube" | "tiktok">("instagram");
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim() || !name.trim()) return;
    onAdd(platform, handle.trim().replace(/^@/, ""), name.trim());
    setHandle("");
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 flex gap-2 flex-wrap items-center">
      <span className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--muted)" }}>
        Quick Add
      </span>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. Jay Shetty)"
        className="text-xs px-3 py-2 rounded-xl border min-h-[36px] flex-1 min-w-[140px]"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value as "instagram" | "youtube" | "tiktok")}
        className="text-xs px-2 py-2 rounded-xl border min-h-[36px]"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        <option value="instagram">Instagram</option>
        <option value="youtube">YouTube</option>
        <option value="tiktok">TikTok</option>
      </select>
      <input
        type="text"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="@handle"
        className="text-xs px-3 py-2 rounded-xl border min-h-[36px] w-36"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      />
      <button
        type="submit"
        disabled={!handle.trim() || !name.trim()}
        className="text-xs px-4 py-2 rounded-xl border transition-colors font-medium min-h-[36px] disabled:opacity-50"
        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-text)" }}
      >
        + Add &amp; Scan
      </button>
    </form>
  );
}

// ── Repurpose Queue Item ──────────────────────────────────────────────────────

function RepurposeCard({
  item,
  onStatusChange,
  onDelete,
  onNotesChange,
}: {
  item: RepurposeItem;
  onStatusChange: (id: string, status: RepurposeItem["status"]) => void;
  onDelete: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const colors = STATUS_COLORS[item.status];
  const STATUSES: RepurposeItem["status"][] = ["idea", "scripted", "filmed", "posted"];

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {item.topic}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {colors.label}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              from {item.sourcePlatform}
            </span>
            {item.targetPlatforms.length > 0 && (
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                → {item.targetPlatforms.join(", ")}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-xs px-2 py-1 rounded-lg flex-shrink-0 min-h-[32px]"
          style={{ color: "var(--danger, #b91c1c)" }}
        >
          ×
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(item.id, s)}
            className="text-xs px-2 py-1 rounded-lg border transition-colors min-h-[28px]"
            style={{
              backgroundColor: item.status === s ? STATUS_COLORS[s].bg : "var(--surface)",
              borderColor: item.status === s ? "transparent" : "var(--border)",
              color: item.status === s ? STATUS_COLORS[s].text : "var(--text-secondary)",
              fontWeight: item.status === s ? 600 : 400,
            }}
          >
            {STATUS_COLORS[s].label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={item.notes}
        onChange={(e) => onNotesChange(item.id, e.target.value)}
        placeholder="Notes..."
        className="w-full text-xs px-3 py-2 rounded-xl border min-h-[32px]"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    instagramHandle: "",
    instagramFollowers: "",
    youtubeChannel: "",
    youtubeSubscribers: "",
    tiktokHandle: "",
    notes: "",
  });

  // Trending state
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Repurpose queue
  const [repurposeQueue, setRepurposeQueue] = useState<RepurposeItem[]>([]);
  const [repurposeFilter, setRepurposeFilter] = useState<RepurposeItem["status"] | "all">("all");

  // ── Persistence ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setCompetitors(JSON.parse(stored)); } catch { setCompetitors(SEED_DATA); }
    } else {
      setCompetitors(SEED_DATA);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    }

    const storedQueue = localStorage.getItem(REPURPOSE_KEY);
    if (storedQueue) {
      try { setRepurposeQueue(JSON.parse(storedQueue)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (competitors.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(competitors));
    }
  }, [competitors]);

  useEffect(() => {
    localStorage.setItem(REPURPOSE_KEY, JSON.stringify(repurposeQueue));
  }, [repurposeQueue]);

  // ── Trending fetch ───────────────────────────────────────────────────────────

  const fetchTrending = useCallback(async (refresh = false) => {
    setTrendingLoading(true);
    setTrendingError(null);
    try {
      const res = await fetch(`/api/competitors/trending${refresh ? "?refresh=true" : ""}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const data: TrendingData = await res.json();
      setTrendingData(data);
    } catch (err) {
      setTrendingError(err instanceof Error ? err.message : String(err));
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  // ── Competitor CRUD ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingCompetitor(null);
    setFormData({ name: "", category: "", instagramHandle: "", instagramFollowers: "", youtubeChannel: "", youtubeSubscribers: "", tiktokHandle: "", notes: "" });
    setModalOpen(true);
  };

  const openEditModal = (c: Competitor) => {
    setEditingCompetitor(c);
    setFormData({
      name: c.name, category: c.category, instagramHandle: c.instagramHandle,
      instagramFollowers: c.instagramFollowers, youtubeChannel: c.youtubeChannel,
      youtubeSubscribers: c.youtubeSubscribers, tiktokHandle: c.tiktokHandle, notes: c.notes,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString().split("T")[0];
    if (editingCompetitor) {
      setCompetitors((prev) =>
        prev.map((c) => c.id === editingCompetitor.id ? { ...c, ...formData, lastUpdated: now } : c)
      );
    } else {
      setCompetitors((prev) => [
        ...prev,
        { id: Date.now().toString(), ...formData, addedAt: now, lastUpdated: now },
      ]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this competitor?")) {
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // ── Scan handler ──────────────────────────────────────────────────────────────

  const handleScan = useCallback(
    async (competitorId: string, platform: "instagram" | "youtube" | "tiktok", handle: string) => {
      try {
        const res = await fetch("/api/competitors/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, handle }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

        const profile = json.profile;
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === competitorId
              ? { ...c, scannedData: { platform, ...profile, scannedAt: new Date().toISOString() } }
              : c
          )
        );
      } catch (err) {
        alert(`Scan failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    []
  );

  // Quick-add: create competitor then trigger scan
  const handleQuickAdd = useCallback(
    async (platform: "instagram" | "youtube" | "tiktok", handle: string, name: string) => {
      const now = new Date().toISOString().split("T")[0];
      const newId = Date.now().toString();
      const newCompetitor: Competitor = {
        id: newId,
        name,
        category: "Competitor",
        instagramHandle: platform === "instagram" ? `@${handle}` : "",
        instagramFollowers: "",
        youtubeChannel: platform === "youtube" ? handle : "",
        youtubeSubscribers: "",
        tiktokHandle: platform === "tiktok" ? `@${handle}` : "",
        notes: "",
        addedAt: now,
        lastUpdated: now,
      };
      setCompetitors((prev) => [...prev, newCompetitor]);
      await handleScan(newId, platform, handle);
    },
    [handleScan]
  );

  // ── Repurpose queue handlers ──────────────────────────────────────────────────

  const addToRepurposeQueue = (topic: string, sourcePlatform: string) => {
    const item: RepurposeItem = {
      id: Date.now().toString(),
      topic,
      sourcePlatform,
      targetPlatforms: ["TikTok", "Instagram"],
      status: "idea",
      notes: "",
      addedAt: new Date().toISOString(),
    };
    setRepurposeQueue((prev) => [item, ...prev]);
  };

  const updateRepurposeStatus = (id: string, status: RepurposeItem["status"]) => {
    setRepurposeQueue((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  };

  const deleteRepurposeItem = (id: string) => {
    setRepurposeQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const updateRepurposeNotes = (id: string, notes: string) => {
    setRepurposeQueue((prev) => prev.map((i) => i.id === id ? { ...i, notes } : i));
  };

  const filteredQueue =
    repurposeFilter === "all"
      ? repurposeQueue
      : repurposeQueue.filter((i) => i.status === repurposeFilter);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
            COMPETITOR INTEL
          </p>
          <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
            Competitor Intel
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Track, scan, and repurpose what's working in your niche
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openAddModal}
            className="text-xs px-4 py-2 rounded-xl border transition-colors font-medium min-h-[40px]"
            style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            + Add Competitor
          </button>
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {(["cards", "table"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="text-xs px-3 py-2 transition-colors capitalize"
                style={{
                  backgroundColor: viewMode === mode ? "var(--accent-bg)" : "var(--surface)",
                  color: viewMode === mode ? "var(--accent-text)" : "var(--text-secondary)",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 1: Your Handles ── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          YOUR HANDLES
        </p>
        <div className="card p-4 flex flex-wrap gap-4">
          {MY_HANDLES.map((h) => (
            <a
              key={h.platform}
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group min-h-[36px]"
            >
              <PlatformBadge label={h.label} color={h.color} />
              <div>
                <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{h.platform}</div>
                <div className="text-xs group-hover:underline" style={{ color: "var(--muted)" }}>{h.handle}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Section 2: Competitor Research ── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          COMPETITOR RESEARCH
        </p>

        <QuickScanBar onAdd={handleQuickAdd} />

        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((c) => (
              <CompetitorCard
                key={c.id}
                competitor={c}
                onEdit={() => openEditModal(c)}
                onDelete={() => handleDelete(c.id)}
                onScan={(platform, handle) => handleScan(c.id, platform, handle)}
              />
            ))}
          </div>
        )}

        {viewMode === "table" && (
          <div className="card overflow-hidden">
            <div
              className="px-5 py-2.5 grid grid-cols-6 gap-2 text-xs font-semibold uppercase tracking-wide border-b"
              style={{ color: "var(--muted)", backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
            >
              <div>Name</div>
              <div>Category</div>
              <div>Instagram</div>
              <div>YouTube</div>
              <div>Notes</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {competitors.map((c) => (
                <div key={c.id} className="px-5 py-3.5 grid grid-cols-6 gap-2 items-center">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}>
                      {c.category}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: "var(--text)" }}>{c.instagramHandle}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{c.instagramFollowers}</div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: "var(--text)" }}>{c.youtubeChannel}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{c.youtubeSubscribers}</div>
                  </div>
                  <div className="text-sm truncate" style={{ color: "var(--text-secondary)" }} title={c.notes}>
                    {c.notes}
                  </div>
                  <div className="text-right flex gap-2 justify-end">
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors min-h-[32px]"
                      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors min-h-[32px]"
                      style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2", color: "#b91c1c" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {competitors.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>No competitors added yet</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-xs px-4 py-2 rounded-xl border transition-colors min-h-[40px]"
              style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-text)" }}
            >
              + Add Your First Competitor
            </button>
          </div>
        )}
      </section>

      {/* ── Section 3: Trending Topics ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            TRENDING TOPICS
          </p>
          <button
            onClick={() => fetchTrending(true)}
            disabled={trendingLoading}
            className="text-xs px-3 py-1.5 rounded-xl border transition-colors min-h-[32px] disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            {trendingLoading ? "Fetching…" : "↻ Refresh"}
          </button>
        </div>

        {trendingError && (
          <div className="card p-4 text-sm" style={{ color: "var(--danger, #b91c1c)" }}>
            Error loading trends: {trendingError}
          </div>
        )}

        {trendingLoading && !trendingData && (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            Fetching trending data from Apify…
          </div>
        )}

        {trendingData && (
          <div className="space-y-6">
            {/* Google Trends */}
            {trendingData.googleTrends.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Google Trends · US · Past 7 Days
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trendingData.googleTrends.map((trend, i) => (
                    <div key={i} className="card p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                          {trend.term}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          Interest: {trend.value}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className="text-lg font-serif font-medium"
                          style={{ color: directionColor(trend.direction) }}
                        >
                          {directionArrow(trend.direction)}
                        </span>
                        <button
                          onClick={() => addToRepurposeQueue(
                            CONTENT_IDEAS[trend.term.toLowerCase()] ?? `Create content about: ${trend.term}`,
                            "Google Trends"
                          )}
                          className="text-xs px-2 py-0.5 rounded-lg border transition-colors min-h-[24px]"
                          style={{ borderColor: "var(--border)", color: "var(--accent-text)" }}
                          title="Add content idea to queue"
                        >
                          + Queue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TikTok Hashtags */}
            {trendingData.tiktokTrending.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  TikTok Trending Hashtags
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trendingData.tiktokTrending.map((tag, i) => (
                    <div key={i} className="card p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          #{tag.hashtag}
                        </div>
                        <div className="text-xs mt-0.5 space-x-2" style={{ color: "var(--muted)" }}>
                          {tag.viewCount != null && <span>{formatNumber(tag.viewCount)} views</span>}
                          {tag.videoCount != null && <span>{formatNumber(tag.videoCount)} videos</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => addToRepurposeQueue(
                          CONTENT_IDEAS[tag.hashtag.toLowerCase()] ?? `Create a TikTok using #${tag.hashtag}`,
                          "TikTok"
                        )}
                        className="text-xs px-2 py-0.5 rounded-lg border transition-colors min-h-[24px] flex-shrink-0"
                        style={{ borderColor: "var(--border)", color: "var(--accent-text)" }}
                        title="Add content idea to queue"
                      >
                        + Queue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Ideas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                CONTENT IDEAS FROM TRENDS
              </p>
              <div className="space-y-2">
                {[
                  ...trendingData.googleTrends.map((t) => ({ term: t.term.toLowerCase(), source: "Google Trends", direction: t.direction })),
                  ...trendingData.tiktokTrending.map((t) => ({ term: t.hashtag.toLowerCase(), source: "TikTok", direction: "up" as const })),
                ]
                  .filter((t) => CONTENT_IDEAS[t.term])
                  .slice(0, 6)
                  .map((t, i) => (
                    <div
                      key={i}
                      className="card p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-sm flex-shrink-0" style={{ color: directionColor(t.direction) }}>
                          {directionArrow(t.direction)}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-medium" style={{ color: "var(--accent-text)" }}>
                            Trending: {t.term}
                          </span>
                          <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>
                            {CONTENT_IDEAS[t.term]}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => addToRepurposeQueue(CONTENT_IDEAS[t.term], t.source)}
                        className="text-xs px-3 py-1.5 rounded-xl border transition-colors font-medium min-h-[32px] flex-shrink-0"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-text)" }}
                      >
                        + Queue
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {trendingData.cached && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Cached · last fetched {new Date(trendingData.lastFetched).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Section 4: Content Repurpose Queue ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            CONTENT REPURPOSE QUEUE
          </p>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {repurposeQueue.length} item{repurposeQueue.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "idea", "scripted", "filmed", "posted"] as const).map((f) => {
            const count = f === "all" ? repurposeQueue.length : repurposeQueue.filter((i) => i.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setRepurposeFilter(f)}
                className="text-xs px-3 py-1.5 rounded-xl border transition-colors min-h-[32px]"
                style={{
                  backgroundColor: repurposeFilter === f ? "var(--accent-bg)" : "var(--surface)",
                  borderColor: repurposeFilter === f ? "var(--accent)" : "var(--border)",
                  color: repurposeFilter === f ? "var(--accent-text)" : "var(--text-secondary)",
                  fontWeight: repurposeFilter === f ? 600 : 400,
                }}
              >
                {f === "all" ? "All" : STATUS_COLORS[f].label} ({count})
              </button>
            );
          })}
        </div>

        {filteredQueue.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {repurposeQueue.length === 0
                ? "No items yet. Click + Queue on any trend to add a content idea."
                : `No items with status "${repurposeFilter}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredQueue.map((item) => (
              <RepurposeCard
                key={item.id}
                item={item}
                onStatusChange={updateRepurposeStatus}
                onDelete={deleteRepurposeItem}
                onNotesChange={updateRepurposeNotes}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-6 space-y-5">
          <h2 className="text-xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
            {editingCompetitor ? "Edit Competitor" : "Add Competitor"}
          </h2>

          <div className="space-y-4">
            {[
              { label: "Name", key: "name", placeholder: "e.g. Alex Hormozi" },
              { label: "Category", key: "category", placeholder: "e.g. Business / Agency" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                  placeholder={placeholder}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Instagram Handle</label>
                <input type="text" value={formData.instagramHandle} onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} placeholder="@username" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Instagram Followers</label>
                <input type="text" value={formData.instagramFollowers} onChange={(e) => setFormData({ ...formData, instagramFollowers: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} placeholder="e.g. 4.1M" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>YouTube Channel</label>
                <input type="text" value={formData.youtubeChannel} onChange={(e) => setFormData({ ...formData, youtubeChannel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} placeholder="Channel name or handle" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>YouTube Subscribers</label>
                <input type="text" value={formData.youtubeSubscribers} onChange={(e) => setFormData({ ...formData, youtubeSubscribers: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} placeholder="e.g. 4.5M" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>TikTok Handle</label>
              <input type="text" value={formData.tiktokHandle} onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} placeholder="@username" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border text-sm" style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                rows={3} placeholder="Observations about their content strategy…" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)}
              className="flex-1 text-sm px-4 py-2.5 rounded-xl border transition-colors min-h-[44px]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!formData.name}
              className="flex-1 text-sm px-4 py-2.5 rounded-xl border transition-colors font-medium disabled:opacity-50 min-h-[44px]"
              style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent-text)" }}>
              {editingCompetitor ? "Save Changes" : "Add Competitor"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
