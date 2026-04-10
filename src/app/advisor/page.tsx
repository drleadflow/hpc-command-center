"use client";

import { useChat } from "ai/react";
import { useEffect, useRef } from "react";

const QUICK_ACTIONS = [
  {
    label: "📊 Morning Briefing",
    prompt: "Give me a morning briefing with yesterday's key metrics",
  },
  {
    label: "🔍 Analyze Client",
    prompt: "Analyze performance for",
  },
  {
    label: "📝 Draft Report",
    prompt: "Draft a weekly client report for",
  },
  {
    label: "🎯 Strategy Check",
    prompt: "Review our quarterly rocks — what's on track vs at risk?",
  },
  {
    label: "⚠️ Risk Assessment",
    prompt: "What are the top 3 risks across all clients?",
  },
];

export default function AdvisorPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/chat",
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleQuickAction(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = e.currentTarget.closest("form");
        form?.requestSubmit();
      }
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100vh - 80px)",
        backgroundColor: "var(--bg)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: "var(--border)" }}
        >
          🧠
        </div>
        <div className="min-w-0">
          <h1
            className="text-lg font-serif themed-text truncate"
            style={{ fontWeight: 400 }}
          >
            AI War Room
          </h1>
          <p className="text-xs themed-muted truncate">
            Strategic advisor — proactive, connected to your operations
          </p>
        </div>
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs themed-muted flex-shrink-0">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: "var(--accent)", animationDelay: "0ms" }}
            />
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: "var(--accent)", animationDelay: "150ms" }}
            />
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: "var(--accent)", animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div
        className="px-4 py-3 border-b flex gap-2 flex-wrap"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 hover:opacity-80 flex-shrink-0"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--text)",
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-4xl">🧠</span>
            <p className="text-sm themed-muted max-w-sm">
              What do you need? Ask anything about the business, use a quick action above, or drop
              a strategic question.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
                style={{ backgroundColor: "var(--border)" }}
              >
                🧠
              </div>
            )}
            <div
              className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={
                msg.role === "user"
                  ? {
                      backgroundColor: "var(--accent)",
                      color: "#ffffff",
                      borderBottomRightRadius: "4px",
                    }
                  : {
                      backgroundColor: "var(--surface)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      borderBottomLeftRadius: "4px",
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5"
              style={{ backgroundColor: "var(--border)" }}
            >
              🧠
            </div>
            <div
              className="px-4 py-3 rounded-2xl text-sm"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderBottomLeftRadius: "4px",
              }}
            >
              <span className="inline-flex gap-1 themed-muted">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                  ·
                </span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                  ·
                </span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                  ·
                </span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t flex gap-3 items-end"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your business..."
          rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none border themed-border themed-text"
          style={{
            backgroundColor: "var(--bg)",
            maxHeight: "140px",
            overflowY: "auto",
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 140) + "px";
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-2.5 rounded-2xl text-sm text-white font-medium disabled:opacity-40 transition-opacity flex-shrink-0"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
