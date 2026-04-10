"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [ttsStatus, setTtsStatus] = useState<{
    configured: boolean;
    provider: string;
  } | null>(null);
  const [testText, setTestText] = useState("Blade Command Center is online.");
  const [testing, setTesting] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    fetch("/api/tts")
      .then((r) => r.json())
      .then(setTtsStatus);

    setSpeechSupported(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  const testTts = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        new Audio(url).play();
      } else {
        alert("TTS test failed. Check console for details.");
      }
    } catch {
      alert("TTS test failed. Is the server running?");
    } finally {
      setTesting(false);
    }
  };

  const clearChat = async () => {
    if (!confirm("Clear all chat history?")) return;
    await fetch("/api/chat", { method: "DELETE" });
    alert("Chat history cleared.");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Settings</h2>
        <p className="text-blade-muted text-sm mb-6">
          Voice configuration and system status.
        </p>
      </div>

      {/* Voice Input */}
      <div className="bg-blade-surface rounded-xl border border-blade-border p-5">
        <h3 className="text-sm font-semibold mb-3">Voice Input (STT)</h3>
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              speechSupported ? "bg-blade-success" : "bg-blade-danger"
            }`}
          />
          <span className="text-sm">
            Browser Speech Recognition:{" "}
            {speechSupported ? "Supported" : "Not supported"}
          </span>
        </div>
        <p className="text-xs text-blade-muted mt-2">
          Uses the Web Speech API. Works best in Chrome.
          Swappable to a dedicated STT provider in the future.
        </p>
      </div>

      {/* Voice Output */}
      <div className="bg-blade-surface rounded-xl border border-blade-border p-5">
        <h3 className="text-sm font-semibold mb-3">Voice Output (TTS)</h3>
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              ttsStatus?.configured ? "bg-blade-success" : "bg-blade-danger"
            }`}
          />
          <span className="text-sm">
            Cartesia API:{" "}
            {ttsStatus?.configured ? "Connected" : "Not configured"}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="flex-1 bg-blade-bg border border-blade-border rounded px-3 py-1.5 text-sm text-blade-text focus:outline-none focus:border-blade-accent"
          />
          <button
            onClick={testTts}
            disabled={testing || !ttsStatus?.configured}
            className="px-4 py-1.5 bg-blade-accent text-white text-sm rounded hover:bg-blade-accent/80 disabled:opacity-40"
          >
            {testing ? "Playing..." : "Test TTS"}
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="bg-blade-surface rounded-xl border border-blade-border p-5">
        <h3 className="text-sm font-semibold mb-3">Data Management</h3>
        <button
          onClick={clearChat}
          className="px-4 py-1.5 bg-blade-danger/20 text-blade-danger text-sm rounded hover:bg-blade-danger/30"
        >
          Clear Chat History
        </button>
        <p className="text-xs text-blade-muted mt-2">
          All data is stored locally in SQLite (blade.db).
        </p>
      </div>
    </div>
  );
}
