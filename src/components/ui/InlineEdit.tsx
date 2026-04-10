"use client";

import { useState, useRef, useEffect } from "react";

// ── Shared inline edit component ────────────────────────────────────
// Replaces 11 duplicate implementations across the codebase.

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder = "Click to edit",
  className = "",
  style = {},
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && !multiline) commit();
  };

  if (editing) {
    const inputStyle: React.CSSProperties = {
      ...style,
      outline: "none",
      backgroundColor: "var(--bg)",
      border: "1px solid var(--accent)",
      borderRadius: 4,
      padding: "2px 6px",
      width: "100%",
      fontSize: "inherit",
      fontFamily: "inherit",
      color: "var(--text)",
    };

    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={3}
          className={className}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      );
    }

    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={className}
        style={inputStyle}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={className}
      style={{
        ...style,
        cursor: "pointer",
        borderBottom: "1px dashed transparent",
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = "var(--muted)"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = "transparent"; }}
      title="Click to edit"
    >
      {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder}</span>}
    </span>
  );
}

// ── Numeric variant ─────────────────────────────────────────────────
interface InlineEditNumberProps {
  value: number;
  onSave: (value: number) => void;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function InlineEditNumber({
  value,
  onSave,
  prefix = "",
  className = "",
  style = {},
}: InlineEditNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const n = parseFloat(draft.replace(/[^0-9.-]/g, ""));
    if (!isNaN(n)) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commit(); }}
        className={className}
        style={{
          ...style,
          background: "var(--bg)",
          border: "1px solid var(--accent)",
          borderRadius: 4,
          outline: "none",
          minWidth: 60,
        }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{ ...style, cursor: "pointer", borderBottom: "1px dashed transparent" }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderBottomColor = "var(--muted)"; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderBottomColor = "transparent"; }}
      title="Click to edit"
      onClick={() => { setDraft(String(value)); setEditing(true); }}
    >
      {prefix}{value.toLocaleString()}
    </span>
  );
}

// ── Remove button ───────────────────────────────────────────────────
export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      style={{ color: "var(--danger)" }}
      title="Remove"
    >
      ✕
    </button>
  );
}

// ── Copy button ─────────────────────────────────────────────────────
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-[9px] px-2 py-0.5 rounded-sm transition-all flex-shrink-0"
      style={{
        backgroundColor: copied ? "var(--success-bg, #EAF3DE)" : "var(--bg)",
        color: copied ? "var(--success)" : "var(--muted)",
        border: "0.5px solid var(--border)",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
