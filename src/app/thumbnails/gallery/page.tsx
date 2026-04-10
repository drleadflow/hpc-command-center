"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Thumbnail {
  id: string;
  concept_label: string;
  image_base64: string;
  is_winner: boolean;
  version: number;
}

interface Project {
  id: string;
  title: string;
  topic: string;
  template_id: string;
  created_at: string;
  thumbnails: Thumbnail[];
}

import { timeAgo } from "@/lib/hooks";

function templateLabel(id: string): string {
  const map: Record<string, string> = {
    "hormozi-proof": "Hormozi Proof",
    "curiosity-gap": "Curiosity Gap",
    "bold-statement": "Bold Statement",
    "before-after": "Before/After",
    "listicle": "Listicle",
  };
  return map[id] || id;
}

export default function ThumbnailGalleryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [markingWinner, setMarkingWinner] = useState<string | null>(null);

  const LIMIT = 20;

  const fetchProjects = useCallback(async (currentOffset: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/thumbnails/gallery?limit=${LIMIT}&offset=${currentOffset}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(prev => append ? [...prev, ...data.projects] : data.projects);
      setTotal(data.total);
      setHasMore(currentOffset + LIMIT < data.total);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(0, false);
  }, [fetchProjects]);

  const loadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchProjects(newOffset, true);
  };

  const handleMarkWinner = async (thumbnailId: string, projectId: string) => {
    setMarkingWinner(thumbnailId);
    try {
      await fetch("/api/thumbnails/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnailId, projectId }),
      });
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                thumbnails: p.thumbnails.map(t => ({
                  ...t,
                  is_winner: t.id === thumbnailId,
                })),
              }
            : p
        )
      );
    } finally {
      setMarkingWinner(null);
    }
  };

  const handleDelete = async (projectId: string) => {
    setDeleting(projectId);
    try {
      await fetch(`/api/thumbnails/gallery?projectId=${projectId}`, { method: "DELETE" });
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTotal(prev => prev - 1);
      if (expandedProject === projectId) setExpandedProject(null);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleDownload = (imageBase64: string, label: string, title: string) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `${title}-${label}.png`;
    link.click();
  };

  const handleDownloadAll = (project: Project) => {
    project.thumbnails.forEach((t, i) => {
      setTimeout(() => handleDownload(t.image_base64, t.concept_label, project.title), i * 200);
    });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>
            Thumbnail Gallery
          </h1>
          <p style={{ color: "var(--muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            All past generations{total > 0 ? ` — ${total} project${total !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <Link
          href="/thumbnails"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--accent)",
            color: "#fff",
            fontWeight: 500,
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          + New Thumbnail
        </Link>
      </div>

      {/* Loading state */}
      {loading && projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>
          Loading gallery...
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🖼️</div>
          <h2 style={{ color: "var(--text)", fontWeight: 600, marginBottom: "0.5rem" }}>No thumbnails yet</h2>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>Generate your first thumbnail to see it here.</p>
          <Link
            href="/thumbnails"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--accent)",
              color: "#fff",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Create Your First Thumbnail
          </Link>
        </div>
      )}

      {/* Project Grid */}
      {projects.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {projects.map(project => {
            const isExpanded = expandedProject === project.id;
            const winner = project.thumbnails.find(t => t.is_winner);

            return (
              <div
                key={project.id}
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.12)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
                onClick={() => setExpandedProject(isExpanded ? null : project.id)}
              >
                {/* Card Header */}
                <div style={{ padding: "1rem 1.25rem 0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {project.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                        {timeAgo(project.created_at)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        backgroundColor: "var(--accent-bg, rgba(99,102,241,0.1))",
                        color: "var(--accent)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {templateLabel(project.template_id)}
                    </span>
                  </div>
                </div>

                {/* Thumbnail 2x2 mini-grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2px",
                    padding: "0 1.25rem 1rem",
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {project.thumbnails.slice(0, 4).map(thumb => (
                    <div
                      key={thumb.id}
                      style={{ position: "relative", cursor: "zoom-in" }}
                      onClick={() => setLightboxImage(thumb.image_base64)}
                    >
                      <img
                        src={`data:image/png;base64,${thumb.image_base64}`}
                        alt={`Concept ${thumb.concept_label}`}
                        style={{
                          width: "100%",
                          aspectRatio: "16/9",
                          objectFit: "cover",
                          borderRadius: "0.5rem",
                          display: "block",
                        }}
                      />
                      {thumb.is_winner && (
                        <span
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            fontSize: "1rem",
                            lineHeight: 1,
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                          }}
                        >
                          ⭐
                        </span>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          bottom: "4px",
                          left: "6px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "#fff",
                          backgroundColor: "rgba(0,0,0,0.55)",
                          borderRadius: "4px",
                          padding: "1px 5px",
                        }}
                      >
                        {thumb.concept_label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expand chevron */}
                <div
                  style={{
                    textAlign: "center",
                    paddingBottom: "0.75rem",
                    color: "var(--muted)",
                    fontSize: "0.75rem",
                  }}
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      display: "inline-block",
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div
                    style={{ borderTop: "1px solid var(--border)", padding: "1.25rem" }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        marginBottom: "1rem",
                      }}
                    >
                      {project.thumbnails.map(thumb => (
                        <div key={thumb.id} style={{ position: "relative" }}>
                          <img
                            src={`data:image/png;base64,${thumb.image_base64}`}
                            alt={`Concept ${thumb.concept_label}`}
                            style={{
                              width: "100%",
                              aspectRatio: "16/9",
                              objectFit: "cover",
                              borderRadius: "0.625rem",
                              cursor: "zoom-in",
                              display: "block",
                              border: thumb.is_winner ? "2px solid #f59e0b" : "2px solid transparent",
                            }}
                            onClick={() => setLightboxImage(thumb.image_base64)}
                          />
                          {thumb.is_winner && (
                            <span
                              style={{
                                position: "absolute",
                                top: "6px",
                                right: "6px",
                                fontSize: "1.1rem",
                                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                              }}
                            >
                              ⭐
                            </span>
                          )}
                          <div
                            style={{
                              display: "flex",
                              gap: "0.4rem",
                              marginTop: "0.4rem",
                            }}
                          >
                            <button
                              onClick={() => handleMarkWinner(thumb.id, project.id)}
                              disabled={markingWinner === thumb.id || thumb.is_winner}
                              style={{
                                flex: 1,
                                padding: "0.3rem 0.5rem",
                                borderRadius: "0.5rem",
                                border: "1px solid var(--border)",
                                backgroundColor: thumb.is_winner ? "rgba(245,158,11,0.12)" : "var(--bg)",
                                color: thumb.is_winner ? "#f59e0b" : "var(--muted)",
                                fontSize: "0.7rem",
                                fontWeight: 500,
                                cursor: thumb.is_winner ? "default" : "pointer",
                                transition: "opacity 0.15s",
                                opacity: markingWinner === thumb.id ? 0.5 : 1,
                              }}
                            >
                              {thumb.is_winner ? "⭐ Winner" : "☆ Pick"}
                            </button>
                            <button
                              onClick={() => handleDownload(thumb.image_base64, thumb.concept_label, project.title)}
                              style={{
                                flex: 1,
                                padding: "0.3rem 0.5rem",
                                borderRadius: "0.5rem",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg)",
                                color: "var(--muted)",
                                fontSize: "0.7rem",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              ↓ Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action row */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleDownloadAll(project)}
                        style={{
                          padding: "0.45rem 0.9rem",
                          borderRadius: "0.625rem",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg)",
                          color: "var(--text)",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        ↓ Download All
                      </button>
                      <Link
                        href={`/thumbnails?projectId=${project.id}`}
                        style={{
                          padding: "0.45rem 0.9rem",
                          borderRadius: "0.625rem",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg)",
                          color: "var(--accent)",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        ↺ Iterate
                      </Link>

                      {/* Delete */}
                      {confirmDelete === project.id ? (
                        <>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)", alignSelf: "center" }}>
                            Are you sure?
                          </span>
                          <button
                            onClick={() => handleDelete(project.id)}
                            disabled={deleting === project.id}
                            style={{
                              padding: "0.45rem 0.9rem",
                              borderRadius: "0.625rem",
                              border: "1px solid #dc2626",
                              backgroundColor: "#dc2626",
                              color: "#fff",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              opacity: deleting === project.id ? 0.6 : 1,
                            }}
                          >
                            {deleting === project.id ? "Deleting..." : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            style={{
                              padding: "0.45rem 0.9rem",
                              borderRadius: "0.625rem",
                              border: "1px solid var(--border)",
                              backgroundColor: "var(--bg)",
                              color: "var(--muted)",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(project.id)}
                          style={{
                            marginLeft: "auto",
                            padding: "0.45rem 0.9rem",
                            borderRadius: "0.625rem",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "#dc2626",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Delete Project
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              fontWeight: 500,
              fontSize: "0.9rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
            cursor: "zoom-out",
          }}
        >
          <img
            src={`data:image/png;base64,${lightboxImage}`}
            alt="Thumbnail preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "0.75rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: "fixed",
              top: "1.5rem",
              right: "1.5rem",
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: "1.25rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
