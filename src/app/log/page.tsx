"use client";

import { useState } from "react";

const TEAM = [
  { id: "blade", label: "Blade" },
  { id: "chrisd", label: "Chris D" },
];

export default function LogPage() {
  const [action, setAction] = useState("");
  const [by, setBy] = useState("blade");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lastLogged, setLastLogged] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!action.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action.trim(), by }),
      });

      if (res.ok) {
        setLastLogged(action.trim());
        setAction("");
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          TEAM
        </p>
        <h1 className="text-4xl font-serif" style={{ color: "var(--text)", fontWeight: 400, letterSpacing: "-0.5px" }}>
          Log Activity
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Log what you completed. Shows up in the Command Center activity feed instantly.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Who */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "var(--muted)" }}>
            WHO
          </label>
          <div className="flex gap-2">
            {TEAM.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setBy(member.id)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: by === member.id ? "var(--accent)" : "var(--bg)",
                  color: by === member.id ? "white" : "var(--text-secondary)",
                  border: `1px solid ${by === member.id ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {member.label}
              </button>
            ))}
          </div>
        </div>

        {/* What */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "var(--muted)" }}>
            WHAT DID YOU DO
          </label>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. Fixed webhook integration for HealthProceo lead routing"
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!action.trim() || status === "loading"}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: status === "success" ? "#16a34a" : "var(--accent)",
            color: "white",
            opacity: !action.trim() || status === "loading" ? 0.5 : 1,
            cursor: !action.trim() || status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Logging..." : status === "success" ? "✅ Logged!" : "Log It"}
        </button>

        {status === "error" && (
          <p className="text-xs text-center" style={{ color: "var(--danger)" }}>
            Something went wrong. Try again.
          </p>
        )}
      </form>

      {/* Last logged */}
      {lastLogged && (
        <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
            LAST LOGGED
          </p>
          <p className="text-sm" style={{ color: "var(--text)" }}>{lastLogged}</p>
        </div>
      )}

      {/* Link to feed */}
      <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
        Activity shows in the{" "}
        <a href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
          Dashboard feed
        </a>
      </p>
    </div>
  );
}
