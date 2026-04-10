"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceInput } from "./VoiceInput";
import { SlashCommands } from "./SlashCommands";
import type { Message } from "@/lib/types";

export function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakBack, setSpeakBack] = useState(false); // default OFF
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then(setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // Stop audio immediately when voice is toggled off
  const handleVoiceToggle = useCallback(() => {
    const newState = !speakBack;
    setSpeakBack(newState);
    if (!newState) {
      stopAudio();
    }
  }, [speakBack, stopAudio]);

  const speakText = useCallback(async (text: string) => {
    if (!speakBack) return; // respect the toggle
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      stopAudio();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener("ended", () => URL.revokeObjectURL(url));
      audio.play().catch(() => URL.revokeObjectURL(url));
    } catch {}
  }, [speakBack, stopAudio]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: text.trim() }),
        });
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
        if (data.reply && speakBack) speakText(data.reply);
      } catch {}
      finally { setLoading(false); }
    },
    [loading, speakBack, speakText]
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--surface)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b themed-border">
        <h2 className="text-sm font-medium themed-text">Assistant</h2>
        <button
          onClick={handleVoiceToggle}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors"
          style={{
            backgroundColor: speakBack ? "var(--accent)" : "var(--bg)",
            borderColor: speakBack ? "var(--accent)" : "var(--border)",
            color: speakBack ? "#ffffff" : "var(--muted)",
          }}
        >
          {speakBack ? "🔊 Voice On" : "🔇 Voice Off"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-12 themed-muted">
            Start a conversation or use the mic button.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" ? "ml-auto" : ""
            }`}
            style={{
              backgroundColor: msg.role === "user" ? "var(--accent)" : "var(--bg)",
              color: msg.role === "user" ? "#ffffff" : "var(--text)",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="px-4 py-2.5 rounded-2xl text-sm max-w-[82%] themed-muted"
            style={{ backgroundColor: "var(--bg)" }}>
            <span className="inline-flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t themed-border flex gap-2 items-center" style={{ position: "relative" }}>
        <SlashCommands
          visible={input.startsWith("/") && !input.includes(" ")}
          filter={input}
          onSelect={(cmd) => {
            if (cmd) {
              setInput(cmd + " ");
            } else {
              setInput("");
            }
          }}
        />
        <VoiceInput onResult={(t) => sendMessage(t)} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (input.startsWith("/") && !input.includes(" ") && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Tab")) {
              // Let SlashCommands handle these keys
              return;
            }
            if (e.key === "Enter") {
              if (input.startsWith("/") && !input.includes(" ")) {
                // Let SlashCommands handle Enter for selection
                return;
              }
              sendMessage(input);
            }
          }}
          placeholder="Type a message or / for commands..."
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm focus:outline-none border themed-border themed-text"
          style={{ backgroundColor: "var(--bg)" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded-2xl text-sm text-white font-medium disabled:opacity-40 transition-colors"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
