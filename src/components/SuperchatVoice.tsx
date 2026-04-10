"use client";

import { useState } from "react";

export function SuperchatVoice() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {expanded && (
        <div
          className="rounded-3xl overflow-hidden shadow-2xl border themed-border themed-surface"
          style={{ width: 360, height: 560 }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b themed-border">
            <span className="text-xs themed-muted font-medium">Jade Voice Agent</span>
            <button onClick={() => setExpanded(false)} className="text-sm themed-muted hover:opacity-60">✕</button>
          </div>
          <iframe
            src="https://dlf-superchat.vercel.app/keyframe"
            width="360"
            height="512"
            allow="microphone; camera"
            style={{ border: "none", display: "block" }}
            sandbox="allow-scripts allow-same-origin allow-microphone allow-forms"
          />
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300"
        style={{
          background: expanded
            ? "linear-gradient(135deg, #ef444420, #ef444405)"
            : "linear-gradient(135deg, #f59e0b20, #f59e0b05)",
          border: `2px solid ${expanded ? "#ef4444" : "#f59e0b"}`,
          boxShadow: `0 0 30px ${expanded ? "#ef444440" : "#f59e0b40"}`,
        }}
        aria-label={expanded ? "Close voice agent" : "Open voice agent"}
      >
        <span className="text-2xl">{expanded ? "✕" : "⚡"}</span>
      </button>
    </div>
  );
}
