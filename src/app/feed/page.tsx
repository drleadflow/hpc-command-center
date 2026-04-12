"use client";

import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import { ROLE_LABELS } from "@/lib/types";
import type { HpcRole } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────

type PostType = "Update" | "Win" | "Announcement" | "Kudos";
type FeedFilter = "All" | "Wins" | "Announcements" | "Kudos" | "Life Events";

interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  authorColor: string;
  type: PostType;
  body: string;
  likedBy: string[];
  commentCount: number;
  createdAt: string;
}

interface KudosReceived {
  id: string;
  from: string;
  category: string;
  message: string;
  createdAt: string;
}

interface CoffeeRoulette {
  optedIn: boolean;
  matchName: string;
  confirmed: boolean | null;
}

interface Suggestion {
  id: string;
  text: string;
  actedOn: boolean;
  createdAt: string;
}

// ── Constants ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  ceo: "#f59e0b",
  ops_manager: "#3b82f6",
  marketing_lead: "#ec4899",
  content_editor: "#8b5cf6",
  appointment_setter: "#10b981",
  sales_closer: "#ef4444",
  ai_tech_specialist: "#06b6d4",
  csm_lead_coach: "#f97316",
  bookkeeper: "#6b7280",
};

const TEAM_MEMBERS = [
  { name: "Alex R.", role: "ceo" },
  { name: "Sarah K.", role: "ops_manager" },
  { name: "Marcus T.", role: "marketing_lead" },
  { name: "Jordan L.", role: "sales_closer" },
  { name: "Priya M.", role: "content_editor" },
  { name: "Devon W.", role: "appointment_setter" },
  { name: "Riley C.", role: "ai_tech_specialist" },
  { name: "Morgan B.", role: "csm_lead_coach" },
];

const KUDOS_CATEGORIES = [
  { value: "above", label: "🎯 Going Above" },
  { value: "helping", label: "🤝 Helping Out" },
  { value: "values", label: "💎 Living Values" },
  { value: "crushing", label: "🔥 Crushing It" },
];

const POST_TYPE_COLORS: Record<PostType, string> = {
  Update: "#3b82f6",
  Win: "#059669",
  Announcement: "#f59e0b",
  Kudos: "#ec4899",
};

const SEED_POSTS: FeedPost[] = [
  {
    id: "p1",
    authorName: "Jordan L.",
    authorRole: "sales_closer",
    authorInitials: "JL",
    authorColor: "#ef4444",
    type: "Win",
    body: "Just closed HealthProceo on Path C! $4,200/mo. Three calls, one follow-up. They said the webinar replay sealed it. Let's go! 🎯",
    likedBy: [],
    commentCount: 4,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "p2",
    authorName: "Sarah K.",
    authorRole: "ops_manager",
    authorInitials: "SK",
    authorColor: "#3b82f6",
    type: "Announcement",
    body: "Reminder: EOD tracking forms are due by 5PM EST daily. We're at 88% compliance this week — let's hit 100% before the weekend. Form link is pinned in Notion.",
    likedBy: [],
    commentCount: 2,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p3",
    authorName: "Marcus T.",
    authorRole: "marketing_lead",
    authorInitials: "MT",
    authorColor: "#ec4899",
    type: "Kudos",
    body: "Big shoutout to Priya for turning around those webinar graphics in under 3 hours yesterday. Brand standards were on point and the client loved them. 💎",
    likedBy: [],
    commentCount: 5,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p4",
    authorName: "Devon W.",
    authorRole: "appointment_setter",
    authorInitials: "DW",
    authorColor: "#10b981",
    type: "Update",
    body: "Cold outreach numbers for Tuesday: 87 openers sent, 29 replies, 11 audits booked. Highest single-day audit book rate so far this month. New subject line is working.",
    likedBy: [],
    commentCount: 3,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p5",
    authorName: "Riley C.",
    authorRole: "ai_tech_specialist",
    authorInitials: "RC",
    authorColor: "#06b6d4",
    type: "Win",
    body: "GHL automation for IV Wellness is fully live. Appointment confirmation, no-show follow-up, and post-call nurture all firing correctly. Zero manual touches needed now.",
    likedBy: [],
    commentCount: 6,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "p6",
    authorName: "Alex R.",
    authorRole: "ceo",
    authorInitials: "AR",
    authorColor: "#f59e0b",
    type: "Announcement",
    body: "We hit $38K MRR this week — new all-time high. Thank you for the grind. Team dinner is happening next Friday. Details coming from Sarah. Keep pushing.",
    likedBy: [],
    commentCount: 12,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_KUDOS_RECEIVED: KudosReceived[] = [
  { id: "k1", from: "Marcus T.", category: "🔥 Crushing It", message: "Absolutely nailed the webinar graphics under deadline pressure.", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: "k2", from: "Sarah K.", category: "🤝 Helping Out", message: "Helped me troubleshoot the GHL issue at 8PM — appreciated.", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "k3", from: "Jordan L.", category: "🎯 Going Above", message: "The new email sequence copy converted 3 audits this week alone.", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
];

const DEFAULT_KUDOS_LEADERBOARD = [
  { name: "Marcus T.", count: 14 },
  { name: "Sarah K.", count: 11 },
  { name: "Jordan L.", count: 9 },
];

const DEFAULT_COFFEE_ROULETTE: CoffeeRoulette = {
  optedIn: true,
  matchName: "Devon W.",
  confirmed: null,
};

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { id: "sg1", text: "Add a async Slack digest for daily wins so we don't miss them.", actedOn: true, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "sg2", text: "Monthly team retrospective doc shared with everyone, not just leadership.", actedOn: true, createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "sg3", text: "Onboarding buddy system for new contractors.", actedOn: false, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

// ── Helpers ──────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Page ─────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { role, memberName } = useRole();

  const [posts, setPosts] = useState<FeedPost[]>(SEED_POSTS);
  const [filter, setFilter] = useState<FeedFilter>("All");
  const [composerText, setComposerText] = useState("");
  const [composerType, setComposerType] = useState<PostType>("Update");

  // Kudos form
  const [showKudosForm, setShowKudosForm] = useState(false);
  const [kudosRecipient, setKudosRecipient] = useState(TEAM_MEMBERS[0].name);
  const [kudosCategory, setKudosCategory] = useState(KUDOS_CATEGORIES[0].value);
  const [kudosMessage, setKudosMessage] = useState("");

  // Kudos received / given
  const [kudosReceived, setKudosReceived] = useState<KudosReceived[]>(DEFAULT_KUDOS_RECEIVED);
  const [kudosGivenCount, setKudosGivenCount] = useState(7);

  // Coffee roulette
  const [coffee, setCoffee] = useState<CoffeeRoulette>(DEFAULT_COFFEE_ROULETTE);

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>(DEFAULT_SUGGESTIONS);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);

  // Load from store
  useEffect(() => {
    const storedPosts = store.read<FeedPost[]>("hpc_feed_posts", SEED_POSTS);
    setPosts(storedPosts.length > 0 ? storedPosts : SEED_POSTS);
    setKudosReceived(store.read("hpc_kudos_received", DEFAULT_KUDOS_RECEIVED));
    setKudosGivenCount(store.read("hpc_kudos_given", 7));
    setCoffee(store.read("hpc_coffee_roulette", DEFAULT_COFFEE_ROULETTE));
    setSuggestions(store.read("hpc_suggestions", DEFAULT_SUGGESTIONS));
  }, []);

  // ── Filtered posts ──────────────────────────────────────────────────

  const filteredPosts = posts.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Wins") return p.type === "Win";
    if (filter === "Announcements") return p.type === "Announcement";
    if (filter === "Kudos") return p.type === "Kudos";
    if (filter === "Life Events") return false; // no life events in seed
    return true;
  });

  // ── Handlers ────────────────────────────────────────────────────────

  function submitPost() {
    if (!composerText.trim()) return;
    const authorRole = role as string;
    const name = memberName || ROLE_LABELS[role as HpcRole] || "Team Member";
    const newPost: FeedPost = {
      id: `p${Date.now()}`,
      authorName: name,
      authorRole,
      authorInitials: initials(name),
      authorColor: ROLE_COLORS[authorRole] ?? "#6b7280",
      type: composerType,
      body: composerText.trim(),
      likedBy: [],
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    store.write("hpc_feed_posts", updated);
    setComposerText("");
  }

  function toggleLike(postId: string) {
    const viewerId = role;
    const updated = posts.map((p) => {
      if (p.id !== postId) return p;
      const alreadyLiked = p.likedBy.includes(viewerId);
      return {
        ...p,
        likedBy: alreadyLiked
          ? p.likedBy.filter((id) => id !== viewerId)
          : [...p.likedBy, viewerId],
      };
    });
    setPosts(updated);
    store.write("hpc_feed_posts", updated);
  }

  function submitKudos() {
    if (!kudosMessage.trim()) return;
    const cat = KUDOS_CATEGORIES.find((c) => c.value === kudosCategory)?.label ?? "";
    const authorName = memberName || ROLE_LABELS[role as HpcRole] || "Team Member";
    const newPost: FeedPost = {
      id: `p${Date.now()}`,
      authorName,
      authorRole: role as string,
      authorInitials: initials(authorName),
      authorColor: ROLE_COLORS[role as string] ?? "#6b7280",
      type: "Kudos",
      body: `${cat} — Shoutout to ${kudosRecipient}: ${kudosMessage.trim()}`,
      likedBy: [],
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    store.write("hpc_feed_posts", updatedPosts);
    const newCount = kudosGivenCount + 1;
    setKudosGivenCount(newCount);
    store.write("hpc_kudos_given", newCount);
    setKudosMessage("");
    setShowKudosForm(false);
  }

  function toggleCoffeeOptIn() {
    const updated = { ...coffee, optedIn: !coffee.optedIn };
    setCoffee(updated);
    store.write("hpc_coffee_roulette", updated);
  }

  function setCoffeeConfirmed(val: boolean) {
    const updated = { ...coffee, confirmed: val };
    setCoffee(updated);
    store.write("hpc_coffee_roulette", updated);
  }

  function submitSuggestion() {
    if (!suggestionText.trim()) return;
    const newSugg: Suggestion = {
      id: `sg${Date.now()}`,
      text: suggestionText.trim(),
      actedOn: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSugg, ...suggestions];
    setSuggestions(updated);
    store.write("hpc_suggestions", updated);
    setSuggestionText("");
    setSuggestionSubmitted(true);
    setTimeout(() => setSuggestionSubmitted(false), 2500);
  }

  // ── Render ────────────────────────────────────────────────────────

  const FILTERS: FeedFilter[] = ["All", "Wins", "Announcements", "Kudos", "Life Events"];

  return (
    <main style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          Team Feed
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, margin: 0 }}>
          Wins, updates, kudos, and everything in between.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ── Left: Feed ─────────────────────────────────────────── */}
        <div>
          {/* Composer */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
            <textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="Share a win, update, or shoutout…"
              rows={3}
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--text)",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
              {(["Update", "Win", "Announcement", "Kudos"] as PostType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setComposerType(t)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: "1px solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: composerType === t ? POST_TYPE_COLORS[t] : "var(--bg)",
                    color: composerType === t ? "#fff" : "var(--muted)",
                    borderColor: composerType === t ? POST_TYPE_COLORS[t] : "var(--border)",
                  }}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={submitPost}
                disabled={!composerText.trim()}
                style={{
                  marginLeft: "auto",
                  padding: "6px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: composerText.trim() ? "pointer" : "default",
                  opacity: composerText.trim() ? 1 : 0.5,
                  transition: "opacity 0.15s",
                }}
              >
                Post
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 14px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  background: filter === f ? "var(--accent)" : "var(--surface)",
                  color: filter === f ? "#fff" : "var(--muted)",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredPosts.length === 0 && (
              <div
                className="card"
                style={{ padding: 28, textAlign: "center", color: "var(--muted)", fontSize: 13 }}
              >
                No posts yet in this category.
              </div>
            )}
            {filteredPosts.map((post) => {
              const liked = post.likedBy.includes(role as string);
              return (
                <div key={post.id} className="card" style={{ padding: "18px 20px" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: post.authorColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {post.authorInitials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                          {post.authorName}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "1px 7px",
                            borderRadius: 20,
                            background: ROLE_COLORS[post.authorRole] + "22",
                            color: ROLE_COLORS[post.authorRole] ?? "var(--muted)",
                            border: `1px solid ${ROLE_COLORS[post.authorRole] ?? "var(--border)"}44`,
                          }}
                        >
                          {ROLE_LABELS[post.authorRole as HpcRole] ?? post.authorRole}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: 20,
                            background: POST_TYPE_COLORS[post.type] + "22",
                            color: POST_TYPE_COLORS[post.type],
                          }}
                        >
                          {post.type}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {timeAgo(post.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, margin: "0 0 14px 0" }}>
                    {post.body}
                  </p>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <button
                      onClick={() => toggleLike(post.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        color: liked ? "#ec4899" : "var(--muted)",
                        padding: 0,
                        transition: "color 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{liked ? "♥" : "♡"}</span>
                      <span>{post.likedBy.length}</span>
                    </button>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--muted)" }}
                    >
                      <span style={{ fontSize: 14 }}>💬</span>
                      <span>{post.commentCount}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Sidebar ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Give Kudos Panel */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Kudos
              </h3>
              <button
                onClick={() => setShowKudosForm(!showKudosForm)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: "var(--accent)",
                  color: "#fff",
                }}
              >
                {showKudosForm ? "Cancel" : "Give Kudos"}
              </button>
            </div>

            {showKudosForm && (
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <select
                  value={kudosRecipient}
                  onChange={(e) => setKudosRecipient(e.target.value)}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
                <select
                  value={kudosCategory}
                  onChange={(e) => setKudosCategory(e.target.value)}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {KUDOS_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <textarea
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  placeholder="Why are you recognizing them?"
                  rows={3}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 13,
                    color: "var(--text)",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={submitKudos}
                  disabled={!kudosMessage.trim()}
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: kudosMessage.trim() ? "pointer" : "default",
                    opacity: kudosMessage.trim() ? 1 : 0.5,
                  }}
                >
                  Send Kudos
                </button>
              </div>
            )}

            {/* Kudos Received */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Kudos Received
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {kudosReceived.slice(0, 3).map((k) => (
                  <div key={k.id} style={{ padding: "8px 10px", background: "var(--bg)", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{k.from}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{timeAgo(k.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#ec4899", marginBottom: 2 }}>{k.category}</div>
                    <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}>{k.message}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kudos Given / Leaderboard */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Weekly Leaderboard
              </p>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                You&apos;ve given <strong style={{ color: "var(--text)" }}>{kudosGivenCount}</strong> kudos total
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {DEFAULT_KUDOS_LEADERBOARD.map((l, i) => (
                  <div key={l.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text)" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {l.name}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{l.count} sent</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coffee Roulette */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 12px 0" }}>
              ☕ Coffee Roulette
            </h3>

            {/* Opt-in toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text)" }}>Opted In</span>
              <button
                onClick={toggleCoffeeOptIn}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  border: "none",
                  cursor: "pointer",
                  background: coffee.optedIn ? "var(--accent)" : "var(--border)",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: coffee.optedIn ? 20 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>

            {coffee.optedIn && (
              <>
                <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>This week&apos;s match</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    {coffee.matchName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Friday · 2:00 PM · 15 min</div>
                </div>
                {coffee.confirmed === null && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setCoffeeConfirmed(true)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 600 }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setCoffeeConfirmed(false)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", background: "var(--bg)", color: "var(--muted)", fontSize: 12, fontWeight: 600 }}
                    >
                      Skip
                    </button>
                  </div>
                )}
                {coffee.confirmed === true && (
                  <p style={{ fontSize: 12, color: "var(--success)", margin: 0, fontWeight: 600 }}>
                    Confirmed! See you Friday.
                  </p>
                )}
                {coffee.confirmed === false && (
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                    Skipped this week.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Suggestion Box */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>
              Anonymous Suggestion Box
            </h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 12px 0" }}>
              No tracking · No IP · No login attached
            </p>

            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="What would make this team better?"
              rows={3}
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 13,
                color: "var(--text)",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: 8,
                boxSizing: "border-box",
              }}
            />
            {suggestionSubmitted ? (
              <p style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, margin: 0 }}>
                Submitted anonymously. Thank you.
              </p>
            ) : (
              <button
                onClick={submitSuggestion}
                disabled={!suggestionText.trim()}
                style={{
                  width: "100%",
                  padding: "7px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: suggestionText.trim() ? "pointer" : "default",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: suggestionText.trim() ? 1 : 0.5,
                }}
              >
                Submit Anonymously
              </button>
            )}

            {/* Recent acted-on suggestions */}
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Recently Acted On
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.filter((s) => s.actedOn).slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      fontSize: 12,
                      color: "var(--text)",
                      padding: "6px 10px",
                      background: "var(--success-bg)",
                      borderRadius: 8,
                      borderLeft: "3px solid var(--success)",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
