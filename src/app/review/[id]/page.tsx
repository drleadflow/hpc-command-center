"use client";

import { useState, useEffect, useRef } from "react";
import MuxPlayer from "@mux/mux-player-react";

interface Comment {
  id: string;
  video_id: string;
  name: string;
  comment: string;
  timestamp_secs: number;
  resolved: boolean;
  parent_id: string | null;
  created_at: string;
  replies?: Comment[];
}

interface VideoAsset {
  mux_asset_id: string;
  playback_id: string | null;
  title: string;
  status: "draft" | "in-review" | "revisions-needed" | "approved";
  client: string | null;
}

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function buildThreads(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  map.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });

  return roots;
}

interface ReplyFormProps {
  videoId: string;
  parentId: string;
  parentTimestamp: number;
  authorName: string;
  onSubmitted: (reply: Comment) => void;
  onCancel: () => void;
}

function ReplyForm({ videoId, parentId, parentTimestamp, authorName, onSubmitted, onCancel }: ReplyFormProps) {
  const [name, setName] = useState(authorName);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/video/comments/${videoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          comment: text.trim(),
          timestamp_secs: parentTimestamp,
          parent_id: parentId,
        }),
      });
      if (res.ok) {
        const reply = await res.json();
        onSubmitted(reply);
        setText("");
      }
    } catch (err) {
      console.error("Failed to submit reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 space-y-2 pl-2" style={{ borderLeft: "2px solid var(--border)" }}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg text-sm border"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
      <textarea
        placeholder="Write a reply..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full px-3 py-1.5 rounded-lg text-sm border resize-none"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !name.trim() || !text.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {submitting ? "Sending..." : "Reply"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs border"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface CommentItemProps {
  comment: Comment;
  videoId: string;
  onSeek: (t: number) => void;
  onToggleResolved: (id: string, current: boolean) => void;
  onReplySubmitted: (reply: Comment) => void;
  lastAuthorName: string;
  onNameUsed: (name: string) => void;
  depth?: number;
}

function CommentItem({
  comment,
  videoId,
  onSeek,
  onToggleResolved,
  onReplySubmitted,
  lastAuthorName,
  onNameUsed,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmitted = (reply: Comment) => {
    onNameUsed(reply.name);
    onReplySubmitted(reply);
    setShowReplyForm(false);
  };

  return (
    <div>
      <div
        className="p-3 rounded-xl flex gap-3"
        style={{
          backgroundColor: comment.resolved
            ? "rgba(34, 197, 94, 0.05)"
            : "var(--surface)",
          border: `1px solid ${comment.resolved ? "rgba(34, 197, 94, 0.2)" : "var(--border)"}`,
          opacity: comment.resolved ? 0.7 : 1,
        }}
      >
        {/* Timestamp */}
        <button
          onClick={() => onSeek(comment.timestamp_secs)}
          className="px-2 py-1 rounded text-xs font-mono shrink-0 self-start"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            color: "#3b82f6",
          }}
        >
          {formatTime(comment.timestamp_secs)}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
              {comment.name}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {formatDate(comment.created_at)}
            </p>
          </div>
          <p
            className="text-sm mt-0.5"
            style={{
              color: "var(--text)",
              textDecoration: comment.resolved ? "line-through" : "none",
              opacity: comment.resolved ? 0.6 : 1,
            }}
          >
            {comment.comment}
          </p>

          {/* Reply button — only on top-level comments */}
          {depth === 0 && !comment.resolved && (
            <button
              onClick={() => setShowReplyForm((v) => !v)}
              className="mt-1.5 text-xs"
              style={{ color: "var(--accent)" }}
            >
              {showReplyForm ? "Cancel reply" : `Reply`}
              {(comment.replies?.length ?? 0) > 0 && !showReplyForm
                ? ` · ${comment.replies!.length} ${comment.replies!.length === 1 ? "reply" : "replies"}`
                : ""}
            </button>
          )}

          {showReplyForm && (
            <ReplyForm
              videoId={videoId}
              parentId={comment.id}
              parentTimestamp={comment.timestamp_secs}
              authorName={lastAuthorName}
              onSubmitted={handleReplySubmitted}
              onCancel={() => setShowReplyForm(false)}
            />
          )}

          {/* Replies */}
          {(comment.replies?.length ?? 0) > 0 && (
            <div className="mt-2 space-y-2 pl-3" style={{ borderLeft: "2px solid var(--border)" }}>
              {comment.replies!.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  videoId={videoId}
                  onSeek={onSeek}
                  onToggleResolved={onToggleResolved}
                  onReplySubmitted={onReplySubmitted}
                  lastAuthorName={lastAuthorName}
                  onNameUsed={onNameUsed}
                  depth={1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resolved toggle — only on top-level comments */}
        {depth === 0 && (
          <button
            onClick={() => onToggleResolved(comment.id, comment.resolved)}
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs self-start"
            style={{
              backgroundColor: comment.resolved
                ? "rgba(34, 197, 94, 0.2)"
                : "var(--border)",
              color: comment.resolved ? "#22c55e" : "var(--muted)",
            }}
            title={comment.resolved ? "Mark as unresolved" : "Mark as resolved"}
          >
            {comment.resolved ? "✓" : "○"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [asset, setAsset] = useState<VideoAsset | null>(null);
  const [flatComments, setFlatComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [name, setName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const videoId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assetsRes = await fetch("/api/video/assets");
        if (assetsRes.ok) {
          const assets = await assetsRes.json();
          const found = assets.find((a: VideoAsset) => a.mux_asset_id === videoId);
          if (found) setAsset(found);
        }

        const commentsRes = await fetch(`/api/video/comments/${videoId}`);
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setFlatComments(data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [videoId]);

  const handleTimeUpdate = (e: Event) => {
    const video = e.target as HTMLVideoElement;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = (e: Event) => {
    const video = e.target as HTMLVideoElement;
    setDuration(video.duration);
    playerRef.current = video;
  };

  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/video/comments/${videoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          comment: commentText.trim(),
          timestamp_secs: currentTime,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setFlatComments((prev) =>
          [...prev, newComment].sort((a, b) => a.timestamp_secs - b.timestamp_secs)
        );
        setCommentText("");
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleResolved = async (commentId: string, currentResolved: boolean) => {
    try {
      await fetch(`/api/video/comments/${videoId}/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !currentResolved }),
      });
      setFlatComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: !currentResolved } : c))
      );
    } catch (err) {
      console.error("Failed to toggle resolved:", err);
    }
  };

  const handleReplySubmitted = (reply: Comment) => {
    setFlatComments((prev) => [...prev, reply]);
  };

  const threads = buildThreads(flatComments);
  // Top-level comments only for timeline dots and count
  const topLevel = flatComments.filter((c) => !c.parent_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  const playbackId = asset?.playback_id;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Approved Banner */}
      {asset?.status === "approved" && (
        <div
          className="w-full py-3 text-center text-sm font-medium"
          style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
        >
          ✓ Approved
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
            {asset?.title || "Video Review"}
          </h1>
          {asset?.client && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Client: {asset.client}
            </p>
          )}
          {asset?.status && asset.status !== "approved" && (
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor:
                  asset.status === "in-review"
                    ? "rgba(59, 130, 246, 0.15)"
                    : asset.status === "revisions-needed"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(107, 114, 128, 0.15)",
                color:
                  asset.status === "in-review"
                    ? "#3b82f6"
                    : asset.status === "revisions-needed"
                    ? "#f59e0b"
                    : "#6b7280",
              }}
            >
              {asset.status.replace(/-/g, " ")}
            </span>
          )}
        </div>

        {/* Player */}
        <div className="relative rounded-xl overflow-hidden">
          {playbackId ? (
            <MuxPlayer
              playbackId={playbackId}
              streamType="on-demand"
              onTimeUpdate={handleTimeUpdate as unknown as EventListener}
              onLoadedMetadata={handleLoadedMetadata as unknown as EventListener}
              style={{ width: "100%", aspectRatio: "16/9" }}
            />
          ) : (
            <div
              className="aspect-video flex items-center justify-center"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <p style={{ color: "#666" }}>Video not available</p>
            </div>
          )}

          {/* Timeline comment dots */}
          {duration > 0 && topLevel.length > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              {topLevel.map((c) => (
                <button
                  key={c.id}
                  onClick={() => seekTo(c.timestamp_secs)}
                  className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1"
                  style={{
                    left: `${(c.timestamp_secs / duration) * 100}%`,
                    backgroundColor: c.resolved ? "#22c55e" : "#f59e0b",
                    cursor: "pointer",
                  }}
                  title={`${formatTime(c.timestamp_secs)} — ${c.name}: ${c.comment}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <form
          onSubmit={submitComment}
          className="p-4 rounded-xl space-y-3"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          <textarea
            placeholder="Leave your feedback..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !commentText.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {submitting ? "Adding..." : `Add comment at ${formatTime(currentTime)}`}
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Comments ({topLevel.length})
          </h2>

          {topLevel.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No comments yet. Be the first to leave feedback!
            </p>
          ) : (
            <div className="space-y-3">
              {threads.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  videoId={videoId}
                  onSeek={seekTo}
                  onToggleResolved={toggleResolved}
                  onReplySubmitted={handleReplySubmitted}
                  lastAuthorName={name}
                  onNameUsed={setName}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Powered by Dr. Lead Flow
          </p>
        </div>
      </div>
    </div>
  );
}
