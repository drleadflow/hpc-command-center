"use client";

import { useState, useEffect } from "react";
import MuxUploader from "@mux/mux-uploader-react";
import { VideoDetailModal } from "@/components/VideoDetailModal";

interface VideoAsset {
  id: string | null;
  mux_asset_id: string;
  playback_id: string | null;
  title: string;
  status: "draft" | "in-review" | "revisions-needed" | "approved";
  client: string | null;
  created_at: string | null;
  updated_at: string | null;
  mux_created_at?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "rgba(107, 114, 128, 0.15)", text: "#6b7280" },
  "in-review": { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  "revisions-needed": { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  approved: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
};

export default function VideoPage() {
  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<VideoAsset | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/video/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const startUpload = async () => {
    try {
      const res = await fetch("/api/video/upload");
      if (res.ok) {
        const data = await res.json();
        setUploadUrl(data.url);
        setShowUploader(true);
      }
    } catch (err) {
      console.error("Failed to get upload URL:", err);
    }
  };

  const handleUploadSuccess = async (e: CustomEvent<{ id: string }>) => {
    const assetId = e.detail?.id;
    if (assetId) {
      setPendingAssetId(assetId);
    }
  };

  const saveNewVideo = async () => {
    if (!pendingAssetId || !newTitle) return;

    try {
      await fetch("/api/video/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mux_asset_id: pendingAssetId,
          title: newTitle,
          client: newClient || null,
        }),
      });
      setShowUploader(false);
      setUploadUrl(null);
      setPendingAssetId(null);
      setNewTitle("");
      setNewClient("");
      fetchAssets();
    } catch (err) {
      console.error("Failed to save video:", err);
    }
  };

  const copyReviewLink = (muxAssetId: string) => {
    const url = `${window.location.origin}/review/${muxAssetId}`;
    navigator.clipboard.writeText(url);
  };

  const handleModalSave = () => {
    setSelectedAsset(null);
    fetchAssets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--muted)" }}
          >
            CLIENT DELIVERABLES
          </p>
          <h1
            className="text-3xl font-serif flex items-center gap-3"
            style={{ color: "var(--text)", fontWeight: 400 }}
          >
            <span>🎥</span> Video Library
          </h1>
        </div>
        <button
          onClick={startUpload}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          + Upload Video
        </button>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-6 w-full max-w-lg"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text)" }}>
              Upload New Video
            </h2>

            {!pendingAssetId ? (
              <>
                {uploadUrl && (
                  <MuxUploader
                    endpoint={uploadUrl}
                    onSuccess={handleUploadSuccess as unknown as EventListener}
                  />
                )}
                <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
                  Drag and drop a video file or click to browse
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Video uploaded! Add details:
                </p>
                <input
                  type="text"
                  placeholder="Video Title *"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Client Name (optional)"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveNewVideo}
                    disabled={!newTitle}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    Save Video
                  </button>
                  <button
                    onClick={() => {
                      setShowUploader(false);
                      setUploadUrl(null);
                      setPendingAssetId(null);
                      setNewTitle("");
                      setNewClient("");
                    }}
                    className="px-4 py-2 rounded-lg text-sm border"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!pendingAssetId && (
              <button
                onClick={() => {
                  setShowUploader(false);
                  setUploadUrl(null);
                }}
                className="mt-4 text-sm"
                style={{ color: "var(--muted)" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          Loading videos...
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          No videos yet. Upload your first video to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.mux_asset_id}
              className="rounded-xl overflow-hidden border"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              {/* Thumbnail */}
              <div
                className="aspect-video bg-gray-900 relative cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
              >
                {asset.playback_id ? (
                  <img
                    src={`https://image.mux.com/${asset.playback_id}/thumbnail.jpg?width=400`}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Processing...
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <h3
                  className="font-medium cursor-pointer hover:underline"
                  style={{ color: "var(--text)" }}
                  onClick={() => setSelectedAsset(asset)}
                >
                  {asset.title}
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: statusColors[asset.status]?.bg || statusColors.draft.bg,
                      color: statusColors[asset.status]?.text || statusColors.draft.text,
                    }}
                  >
                    {asset.status.replace("-", " ")}
                  </span>
                  {asset.client && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: "var(--accent-bg)",
                        color: "var(--accent-text)",
                      }}
                    >
                      {asset.client}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => copyReviewLink(asset.mux_asset_id)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs border"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  📋 Copy Review Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAsset && (
        <VideoDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
