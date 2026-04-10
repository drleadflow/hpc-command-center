"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/lib/types";

interface Props {
  compact?: boolean;
}

export function ProjectList({ compact }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = useCallback(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    setName("");
    setDesc("");
    setShowForm(false);
    load();
  };

  const archive = async (p: Project) => {
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, status: p.status === "active" ? "archived" : "active" }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
    load();
  };

  const active = projects.filter((p) => p.status === "active");
  const archived = projects.filter((p) => p.status === "archived");
  const display = compact ? active.slice(0, 5) : projects;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          {compact ? "Active Projects" : "All Projects"}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-blade-accent hover:text-blade-accent-light"
        >
          + New
        </button>
      </div>

      {showForm && (
        <div className="mb-3 p-3 bg-blade-bg rounded-lg border border-blade-border space-y-2">
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-blade-surface border border-blade-border rounded px-2 py-1.5 text-sm text-blade-text focus:outline-none focus:border-blade-accent"
          />
          {!compact && (
            <input
              type="text"
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-blade-surface border border-blade-border rounded px-2 py-1.5 text-sm text-blade-text focus:outline-none focus:border-blade-accent"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={add}
              className="px-3 py-1 bg-blade-accent text-white text-xs rounded hover:bg-blade-accent/80"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1 text-blade-muted text-xs hover:text-blade-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {display.length === 0 && (
        <p className="text-blade-muted text-xs">No projects yet.</p>
      )}

      <div className="space-y-1.5">
        {(compact ? display : active).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-2 bg-blade-bg rounded-lg border border-blade-border group"
          >
            <div>
              <div className="text-sm font-medium">{p.name}</div>
              {!compact && p.description && (
                <div className="text-xs text-blade-muted mt-0.5">{p.description}</div>
              )}
            </div>
            {!compact && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => archive(p)}
                  className="text-xs text-blade-muted hover:text-blade-warning px-1"
                >
                  Archive
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="text-xs text-blade-muted hover:text-blade-danger px-1"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!compact && archived.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs text-blade-muted font-semibold mb-2">Archived</h4>
          <div className="space-y-1.5">
            {archived.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 bg-blade-bg/50 rounded-lg border border-blade-border/50 group opacity-60"
              >
                <div className="text-sm">{p.name}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => archive(p)}
                    className="text-xs text-blade-muted hover:text-blade-success px-1"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-xs text-blade-muted hover:text-blade-danger px-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
