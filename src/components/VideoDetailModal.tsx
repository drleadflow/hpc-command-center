"use client";

import { useState } from "react";

interface VideoAsset {
  id: string | null;
  mux_asset_id: string;
  playback_id: string | null;
  title: string;
  status: "draft" | "in-review" | "revisions-needed" | "approved";
  client: string | null;
}

interface VideoDetailModalProps {
  asset: VideoAsset;
  onClose: () => void;
  onSave: () => void;
}

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "in-review", label: "In Review" },
  { value: "revisions-needed", label: "Revisions Needed" },
  { value: "approved", label: "Approved" },
];

export function VideoDetailModal({ asset, onClose, onSave }: VideoDetailModalProps) {
  const [title, setTitle] = useState(asset.title);
  const [status, setStatus] = useState(asset.status);
  const [client, setClient] = useState(asset.client || "");
  const [saving, setSaving] = useState(false);

  const reviewLink = `${typeof window !== "undefined" ? window.location.origin : ""}/review/${asset.mux_asset_id}`;

  const handleSave = async () => {
    if (!asset.id) {
      // Need to create the asset record first
      try {
        setSaving(true);
        const res = await fetch("/api/video/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mux_asset_id: asset.mux_asset_id,
            playback_id: asset.playback_id,
            title,
            client: client || null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          // Now update status if needed
          if (status !== "draft") {
            await fetch(`/api/video/assets/${data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
          }
          onSave();
        }
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    } else {
      // Update existing
      try {
        setSaving(true);
        await fetch(`/api/video/assets/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, status, client: client || null }),
        });
        onSave();
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(reviewLink);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
          Edit Video Details
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VideoAsset["status"])}
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Client
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Client name (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Review Link */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
              Review Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={reviewLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                📋
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
