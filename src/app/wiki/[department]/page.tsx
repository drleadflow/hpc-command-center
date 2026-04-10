"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/types";

interface WikiPage {
  title: string;
  content: string;
  created: string;
  updated: string;
  _sha?: string;
  _path?: string;
}

export default function WikiDepartmentPage() {
  const params = useParams();
  const department = params.department as string;
  const deptInfo = DEPARTMENTS.find((d) => d.id === department);

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPages();
  }, [department]);

  const fetchPages = async () => {
    try {
      const res = await fetch(`/api/wiki?department=${department}`);
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);

    await fetch("/api/wiki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department,
        title: formTitle,
        content: formContent,
      }),
    });

    setFormTitle("");
    setFormContent("");
    setShowForm(false);
    setSaving(false);
    fetchPages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/wiki"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Team Wiki
            </Link>
            <span style={{ color: "var(--muted)" }}>/</span>
          </div>
          <div className="flex items-center gap-4">
            {deptInfo && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${deptInfo.color}18`, color: deptInfo.color }}
              >
                {deptInfo.icon}
              </div>
            )}
            <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
              {deptInfo?.label || department} SOPs
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {showForm ? "Cancel" : "Add SOP"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-6" style={{ backgroundColor: "var(--surface)" }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., How to onboard a new client"
                className="w-full px-4 py-2 rounded-xl text-sm"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                Content
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                placeholder="Write the SOP content here..."
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim()}
                className="px-5 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  opacity: saving || !formTitle.trim() ? 0.5 : 1,
                }}
              >
                {saving ? "Saving..." : "Save SOP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOPs List */}
      {loading ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          Loading SOPs...
        </div>
      ) : pages.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: "var(--muted)" }}>
          No SOPs yet. Click "Add SOP" to create the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page._path || page.title}
              className="card overflow-hidden"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <button
                onClick={() => setExpanded(expanded === page.title ? null : page.title)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
                style={{ borderBottom: expanded === page.title ? "1px solid var(--border)" : "none" }}
              >
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {page.title}
                </span>
                <span
                  className="text-lg transition-transform"
                  style={{
                    color: "var(--muted)",
                    transform: expanded === page.title ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>
              {expanded === page.title && (
                <div className="px-6 py-4" style={{ backgroundColor: "var(--bg)" }}>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                      margin: 0,
                    }}
                  >
                    {page.content || "No content."}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
