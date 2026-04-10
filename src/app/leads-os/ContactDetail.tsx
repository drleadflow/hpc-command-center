"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────
interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  dateAdded?: string;
  assignedTo?: string;
  customFields?: { id: string; value: string; field_key?: string }[];
  [key: string]: unknown;
}

interface Note {
  id: string;
  body: string;
  dateAdded?: string;
  createdAt?: string;
}

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  assignedTo?: string;
  status?: string;
  description?: string;
  completed?: boolean;
}

interface Message {
  id: string;
  body?: string;
  message?: string;
  direction?: string;
  dateAdded?: string;
  type?: string;
}

const STAGES = [
  { id: "new-lead", label: "New Lead", color: "#6366f1" },
  { id: "contacted", label: "Contacted", color: "#3b82f6" },
  { id: "triage-booked", label: "Triage Booked", color: "#8b5cf6" },
  { id: "hot-prospect", label: "Hot Prospect", color: "#f59e0b" },
  { id: "sent-link", label: "Sent Link", color: "#06b6d4" },
  { id: "deposit", label: "Deposit", color: "#10b981" },
  { id: "closed-won", label: "Closed Won", color: "#22c55e" },
  { id: "closed-lost", label: "Closed Lost", color: "#ef4444" },
];

interface ContactDetailProps {
  contact: GHLContact;
  stage: string;
  followUpDate: string;
  onClose: () => void;
  onStageChange: (contactId: string, stage: string) => void;
  onFollowUpChange: (contactId: string, date: string) => void;
}

export default function ContactDetail({
  contact,
  stage,
  followUpDate,
  onClose,
  onStageChange,
  onFollowUpChange,
}: ContactDetailProps) {
  const [tab, setTab] = useState<"overview" | "notes" | "tasks" | "messages">("overview");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const displayName =
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    "Unknown";

  const stageObj = STAGES.find((s) => s.id === stage) || STAGES[0];

  const fetchTabData = useCallback(async (t: string) => {
    setLoading(true);
    try {
      if (t === "notes") {
        const res = await fetch(`/api/leads-os?action=notes&contactId=${contact.id}`);
        const data = await res.json();
        setNotes(data.notes || []);
      } else if (t === "tasks") {
        const res = await fetch(`/api/leads-os?action=tasks&contactId=${contact.id}`);
        const data = await res.json();
        setTasks(data.tasks || []);
      } else if (t === "messages") {
        const res = await fetch(`/api/leads-os?action=conversations&contactId=${contact.id}`);
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error fetching tab data:", err);
    }
    setLoading(false);
  }, [contact.id]);

  useEffect(() => {
    if (tab !== "overview") {
      fetchTabData(tab);
    }
  }, [tab, fetchTabData]);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // Voice dictation
  function toggleVoice() {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR() as SpeechRecognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setNewNote((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await fetch("/api/leads-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note",
          contactId: contact.id,
          body: newNote.trim(),
        }),
      });
      setNewNote("");
      fetchTabData("notes");
    } catch (err) {
      console.error("Error adding note:", err);
    }
    setSavingNote(false);
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    setSavingTask(true);
    try {
      await fetch("/api/leads-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "task",
          contactId: contact.id,
          title: newTaskTitle.trim(),
          dueDate: newTaskDue || undefined,
        }),
      });
      setNewTaskTitle("");
      setNewTaskDue("");
      fetchTabData("tasks");
    } catch (err) {
      console.error("Error adding task:", err);
    }
    setSavingTask(false);
  }

  const detailTabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "notes" as const, label: "Notes" },
    { id: "tasks" as const, label: "Tasks" },
    { id: "messages" as const, label: "Messages" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg flex flex-col border-l overflow-hidden"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              {displayName}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--muted)", fontSize: 18 }}>&times;</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
              >
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {contact.email}
              </span>
            )}
          </div>
        </div>

        {/* Detail Tabs */}
        <div
          className="flex border-b px-6 gap-1"
          style={{ borderColor: "var(--border)" }}
        >
          {detailTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: tab === t.id ? "var(--accent-text)" : "var(--muted)",
                borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Stage */}
              <div className="card p-4">
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--muted)" }}>
                  Pipeline Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => onStageChange(contact.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stageObj.color }}
                  />
                  <span className="text-sm" style={{ color: "var(--text)" }}>
                    {stageObj.label}
                  </span>
                </div>
              </div>

              {/* Follow-up Date */}
              <div className="card p-4">
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--muted)" }}>
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => onFollowUpChange(contact.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="card p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--muted)" }}>
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: "var(--accent-bg)",
                          color: "var(--accent-text)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="card p-4">
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--muted)" }}>
                  Details
                </label>
                <div className="space-y-2 text-sm">
                  {contact.dateAdded && (
                    <div className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Added</span>
                      <span style={{ color: "var(--text)" }}>
                        {new Date(contact.dateAdded).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {contact.assignedTo && (
                    <div className="flex justify-between">
                      <span style={{ color: "var(--muted)" }}>Assigned To</span>
                      <span style={{ color: "var(--text)" }}>{contact.assignedTo}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {tab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="card p-4">
                <div className="flex gap-2 mb-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-xl text-sm resize-none"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleVoice}
                    className="px-3 py-1.5 rounded-xl text-sm"
                    style={{
                      backgroundColor: listening ? "var(--danger)" : "var(--surface)",
                      color: listening ? "#fff" : "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {listening ? "Stop" : "Voice"}
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote || !newNote.trim()}
                    className="px-4 py-1.5 rounded-xl text-sm font-medium text-white"
                    style={{
                      backgroundColor: "var(--accent)",
                      opacity: savingNote || !newNote.trim() ? 0.5 : 1,
                    }}
                  >
                    {savingNote ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                  Loading notes...
                </p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                  No notes yet
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="card p-4">
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                      {note.body}
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                      {new Date(note.dateAdded || note.createdAt || "").toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {tab === "tasks" && (
            <div className="space-y-4">
              {/* Add task */}
              <div className="card p-4 space-y-2">
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm"
                    style={{
                      backgroundColor: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={savingTask || !newTaskTitle.trim()}
                    className="px-4 py-1.5 rounded-xl text-sm font-medium text-white"
                    style={{
                      backgroundColor: "var(--accent)",
                      opacity: savingTask || !newTaskTitle.trim() ? 0.5 : 1,
                    }}
                  >
                    {savingTask ? "Saving..." : "Add Task"}
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                  Loading tasks...
                </p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                  No tasks yet
                </p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5"
                        style={{
                          borderColor: task.completed ? "var(--accent)" : "var(--border)",
                          backgroundColor: task.completed ? "var(--accent)" : "transparent",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: "var(--text)",
                            textDecoration: task.completed ? "line-through" : "none",
                          }}
                        >
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Messages Tab */}
          {tab === "messages" && (
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                  Loading messages...
                </p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                  No conversation history
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="card p-3"
                    style={{
                      marginLeft: msg.direction === "outbound" ? "2rem" : 0,
                      marginRight: msg.direction === "inbound" ? "2rem" : 0,
                      backgroundColor:
                        msg.direction === "outbound"
                          ? "var(--accent-bg)"
                          : "var(--surface)",
                    }}
                  >
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      {msg.body || msg.message || "(no content)"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {msg.direction === "outbound" ? "Sent" : "Received"}
                      {msg.dateAdded
                        ? ` - ${new Date(msg.dateAdded).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div
          className="px-6 py-4 border-t flex gap-2 flex-wrap"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setTab("notes")}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            Add Note
          </button>
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
