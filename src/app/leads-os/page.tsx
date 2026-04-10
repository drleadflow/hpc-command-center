"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DropResult } from "@hello-pangea/dnd";
import Pipeline from "./Pipeline";
import ContactDetail from "./ContactDetail";

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

interface GHLPipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; position?: number }[];
}

// Fallback stages when no pipeline is loaded
const DEFAULT_STAGES = [
  { id: "new-lead", label: "New Lead", color: "#6366f1" },
  { id: "contacted", label: "Contacted", color: "#3b82f6" },
  { id: "triage-booked", label: "Triage Booked", color: "#8b5cf6" },
  { id: "hot-prospect", label: "Hot Prospect", color: "#f59e0b" },
  { id: "sent-link", label: "Sent Link", color: "#06b6d4" },
  { id: "deposit", label: "Deposit", color: "#10b981" },
  { id: "closed-won", label: "Closed Won", color: "#22c55e" },
  { id: "closed-lost", label: "Closed Lost", color: "#ef4444" },
];

const STAGE_COLORS = [
  "#6366f1", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4",
  "#10b981", "#22c55e", "#ef4444", "#d97706", "#0891b2",
  "#7c3aed", "#dc2626", "#64748b", "#16a34a", "#2563eb",
  "#ec4899", "#84cc16", "#f97316", "#14b8a6",
];

const STAGE_LS_KEY = "dlf-leads-os-stages";
const FOLLOWUP_LS_KEY = "dlf-leads-os-followups";

type TabId = "pipeline" | "list" | "followups" | "calls" | "activity";

function contactName(c: GHLContact): string {
  return c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown";
}

function stageColorFromList(stageId: string, stageList: { id: string; label: string; color: string }[]): string {
  return stageList.find((s) => s.id === stageId)?.color || "#6b7280";
}

function stageLabelFromList(stageId: string, stageList: { id: string; label: string; color: string }[]): string {
  return stageList.find((s) => s.id === stageId)?.label || stageId;
}

// Auto-assign a stage based on tags
function inferStage(contact: GHLContact): string {
  const tags = (contact.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("closed won") || t.includes("won"))) return "closed-won";
  if (tags.some((t) => t.includes("closed lost") || t.includes("lost"))) return "closed-lost";
  if (tags.some((t) => t.includes("deposit"))) return "deposit";
  if (tags.some((t) => t.includes("sent link") || t.includes("proposal"))) return "sent-link";
  if (tags.some((t) => t.includes("hot") || t.includes("qualified"))) return "hot-prospect";
  if (tags.some((t) => t.includes("triage") || t.includes("booked") || t.includes("call booked"))) return "triage-booked";
  if (tags.some((t) => t.includes("contacted") || t.includes("replied"))) return "contacted";
  return "new-lead";
}

export default function LeadsOSPage() {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabId>("pipeline");
  const [stages, setStages] = useState<Record<string, string>>({});
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [selectedContact, setSelectedContact] = useState<GHLContact | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pipeline state
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>("");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<string>("");

  // Derived: active pipeline stages
  const activePipeline = pipelines.find((p) => p.id === activePipelineId);
  const STAGES = activePipeline
    ? activePipeline.stages.map((s, i) => ({
        id: s.id,
        label: s.name,
        color: STAGE_COLORS[i % STAGE_COLORS.length],
      }))
    : DEFAULT_STAGES;

  // Load localStorage on mount + fetch pipelines
  useEffect(() => {
    try {
      const savedStages = localStorage.getItem(STAGE_LS_KEY);
      if (savedStages) setStages(JSON.parse(savedStages));
      const savedFollowUps = localStorage.getItem(FOLLOWUP_LS_KEY);
      if (savedFollowUps) setFollowUps(JSON.parse(savedFollowUps));
    } catch {
      // ignore parse errors
    }

    // Fetch all GHL pipelines
    fetch("/api/leads-os?action=pipelines")
      .then((r) => r.json())
      .then((data) => {
        const pipelineList: GHLPipeline[] = (data.pipelines || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          stages: (p.stages || [])
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
            .map((s: any) => ({ id: s.id, name: s.name, position: s.position })),
        }));
        setPipelines(pipelineList);
        // Default to Webinar Pipeline if it exists
        const webinarPipeline = pipelineList.find((p) =>
          p.name.toLowerCase().includes("webinar")
        );
        if (webinarPipeline) {
          setActivePipelineId(webinarPipeline.id);
        } else if (pipelineList.length > 0) {
          setActivePipelineId(pipelineList[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Save stages to localStorage
  useEffect(() => {
    if (Object.keys(stages).length > 0) {
      localStorage.setItem(STAGE_LS_KEY, JSON.stringify(stages));
    }
  }, [stages]);

  // Save followups to localStorage
  useEffect(() => {
    if (Object.keys(followUps).length > 0) {
      localStorage.setItem(FOLLOWUP_LS_KEY, JSON.stringify(followUps));
    }
  }, [followUps]);

  const fetchContacts = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      let url = "/api/leads-os?action=contacts";
      if (query) url += `&search=${encodeURIComponent(query)}&tag=`;
      const res = await fetch(url);
      const data = await res.json();
      const fetched: GHLContact[] = data.contacts || [];

      // Auto-assign stages for contacts without a saved stage
      setStages((prev) => {
        const next = { ...prev };
        for (const c of fetched) {
          if (!next[c.id]) {
            next[c.id] = inferStage(c);
          }
        }
        return next;
      });

      setContacts(fetched);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setContacts([]);
    }
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Push all webinar contacts to the active GHL pipeline
  async function handleBulkPush() {
    if (!activePipeline || contacts.length === 0) return;
    const firstStageId = activePipeline.stages[0]?.id;
    if (!firstStageId) return;

    setPushing(true);
    setPushResult("");
    try {
      const res = await fetch("/api/leads-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-push-pipeline",
          contactIds: contacts.map((c) => c.id),
          pipelineId: activePipelineId,
          stageId: firstStageId,
        }),
      });
      const data = await res.json();
      setPushResult(`Pushed ${data.created}/${data.total} contacts to ${activePipeline.name}`);
    } catch {
      setPushResult("Failed to push contacts");
    }
    setPushing(false);
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Debounced search
  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchContacts(val || undefined);
    }, 300);
  }

  // Drag end for pipeline
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const contactId = result.draggableId;
    const newStage = result.destination.droppableId;

    setStages((prev) => ({ ...prev, [contactId]: newStage }));

    // Update contact tags in GHL in the background
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      const existingTags = (contact.tags || []).filter(
        (t) => !STAGES.some((s) => s.label.toLowerCase() === t.toLowerCase())
      );
      const newTag = STAGES.find((s) => s.id === newStage)?.label || newStage;
      fetch("/api/leads-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-contact",
          contactId,
          tags: [...existingTags, newTag],
        }),
      }).catch((err) => console.error("Error updating contact stage:", err));
    }
  }

  function handleStageChange(contactId: string, newStage: string) {
    setStages((prev) => ({ ...prev, [contactId]: newStage }));

    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      const existingTags = (contact.tags || []).filter(
        (t) => !STAGES.some((s) => s.label.toLowerCase() === t.toLowerCase())
      );
      const newTag = STAGES.find((s) => s.id === newStage)?.label || newStage;
      fetch("/api/leads-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-contact",
          contactId,
          tags: [...existingTags, newTag],
        }),
      }).catch((err) => console.error("Error updating contact stage:", err));
    }
  }

  function handleFollowUpChange(contactId: string, date: string) {
    setFollowUps((prev) => ({ ...prev, [contactId]: date }));
  }

  // ─── Stats ─────────────────────────────────────────────────────
  const totalContacts = contacts.length;
  const callsBooked = contacts.filter(
    (c) => stages[c.id] === "triage-booked"
  ).length;
  const hotProspects = contacts.filter(
    (c) => stages[c.id] === "hot-prospect"
  ).length;
  const needsFollowUp = contacts.filter((c) => {
    const fu = followUps[c.id];
    if (!fu) return false;
    return new Date(fu) <= new Date();
  }).length;

  const stats = [
    { label: "Total Contacts", value: totalContacts, color: "#6366f1" },
    { label: "Calls Booked", value: callsBooked, color: "#8b5cf6" },
    { label: "Hot Prospects", value: hotProspects, color: "#f59e0b" },
    { label: "Needs Follow-up", value: needsFollowUp, color: "#ef4444" },
  ];

  const tabs: { id: TabId; label: string }[] = [
    { id: "pipeline", label: "Pipeline" },
    { id: "list", label: "List" },
    { id: "followups", label: "Follow-ups" },
    { id: "calls", label: "Calls" },
    { id: "activity", label: "Activity" },
  ];

  // ─── Follow-ups grouped by date ────────────────────────────────
  function renderFollowUps() {
    const entries = contacts
      .filter((c) => followUps[c.id])
      .map((c) => ({ contact: c, date: followUps[c.id] }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const today = new Date().toISOString().split("T")[0];
    const overdue = entries.filter((e) => e.date < today);
    const todayEntries = entries.filter((e) => e.date === today);
    const upcoming = entries.filter((e) => e.date > today);

    if (entries.length === 0) {
      return (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          <p className="text-lg mb-2">No follow-ups scheduled</p>
          <p className="text-sm">Set follow-up dates from the contact detail panel</p>
        </div>
      );
    }

    function renderGroup(label: string, items: typeof entries, highlight?: string) {
      if (items.length === 0) return null;
      return (
        <div className="mb-6">
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: highlight || "var(--muted)" }}
          >
            {label} ({items.length})
          </h3>
          <div className="space-y-2">
            {items.map((e) => (
              <div
                key={e.contact.id}
                onClick={() => setSelectedContact(e.contact)}
                className="card p-4 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {contactName(e.contact)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {e.contact.phone || e.contact.email || ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${stageColorFromList(stages[e.contact.id] || "new-lead", STAGES)}18`,
                      color: stageColorFromList(stages[e.contact.id] || "new-lead", STAGES),
                    }}
                  >
                    {stageLabelFromList(stages[e.contact.id] || "new-lead", STAGES)}
                  </span>
                  <span className="text-xs" style={{ color: highlight || "var(--muted)" }}>
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        {renderGroup("Overdue", overdue, "var(--danger)")}
        {renderGroup("Today", todayEntries, "var(--accent)")}
        {renderGroup("Upcoming", upcoming)}
      </>
    );
  }

  // ─── Calls tab ─────────────────────────────────────────────────
  function renderCalls() {
    const callContacts = contacts.filter(
      (c) => stages[c.id] === "triage-booked"
    );

    if (callContacts.length === 0) {
      return (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          <p className="text-lg mb-2">No calls booked</p>
          <p className="text-sm">Move contacts to "Triage Booked" stage to see them here</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {callContacts.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedContact(c)}
            className="card p-4 cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {contactName(c)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {c.phone || c.email || ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStageChange(c.id, "hot-prospect");
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: "#10b98118", color: "#10b981" }}
              >
                Confirmed
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStageChange(c.id, "contacted");
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: "#ef444418", color: "#ef4444" }}
              >
                No Show
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Keep in triage-booked, just a visual note
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: "#f59e0b18", color: "#f59e0b" }}
              >
                Rescheduled
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Activity tab ──────────────────────────────────────────────
  function renderActivity() {
    // Show contacts sorted by most recent dateAdded as a simple activity feed
    const sorted = [...contacts].sort((a, b) => {
      const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return db - da;
    });

    if (sorted.length === 0) {
      return (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          <p className="text-lg">No activity yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {sorted.slice(0, 50).map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedContact(c)}
            className="card p-4 cursor-pointer flex items-center gap-4"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
            >
              {contactName(c).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                {contactName(c)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Added{" "}
                {c.dateAdded
                  ? new Date(c.dateAdded).toLocaleDateString()
                  : "unknown"}
                {c.tags && c.tags.length > 0 && (
                  <> &middot; Tags: {c.tags.slice(0, 3).join(", ")}</>
                )}
              </p>
            </div>
            <span
              className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
              style={{
                backgroundColor: `${stageColorFromList(stages[c.id] || "new-lead", STAGES)}18`,
                color: stageColorFromList(stages[c.id] || "new-lead", STAGES),
              }}
            >
              {stageLabelFromList(stages[c.id] || "new-lead", STAGES)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────────
  function renderList() {
    const sorted = [...contacts].sort((a, b) => {
      const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return db - da;
    });

    if (sorted.length === 0 && !loading) {
      return (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          <p className="text-lg">No contacts found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {["Name", "Phone", "Email", "Stage", "Last Activity", "Follow-up"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: "var(--muted)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const sid = stages[c.id] || "new-lead";
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--accent-bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                    {contactName(c)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {c.phone || "-"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {c.email || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-lg inline-block"
                      style={{
                        backgroundColor: `${stageColorFromList(sid, STAGES)}18`,
                        color: stageColorFromList(sid, STAGES),
                      }}
                    >
                      {stageLabelFromList(sid, STAGES)}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {c.dateAdded
                      ? new Date(c.dateAdded).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {followUps[c.id]
                      ? new Date(followUps[c.id]).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              Leads OS
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {activePipeline ? activePipeline.name : "GHL Pipeline"} — {contacts.length} contacts
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pipeline Switcher */}
            {pipelines.length > 0 && (
              <select
                value={activePipelineId}
                onChange={(e) => setActivePipelineId(e.target.value)}
                className="text-sm px-3 py-2 rounded-xl outline-none"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stages.length} stages)
                  </option>
                ))}
              </select>
            )}
            {/* Push to Pipeline */}
            {activePipeline && contacts.length > 0 && (
              <button
                onClick={handleBulkPush}
                disabled={pushing}
                className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: pushing ? "var(--border)" : "var(--accent)",
                  color: "white",
                  opacity: pushing ? 0.6 : 1,
                }}
              >
                {pushing ? "Pushing..." : `Push ${contacts.length} to ${activePipeline.name}`}
              </button>
            )}
          </div>
        </div>
        {pushResult && (
          <div
            className="mt-3 text-sm px-4 py-2 rounded-xl"
            style={{
              backgroundColor: pushResult.includes("Failed") ? "rgba(220,38,38,0.1)" : "rgba(22,163,106,0.1)",
              color: pushResult.includes("Failed") ? "#dc2626" : "#16a34a",
            }}
          >
            {pushResult}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              {s.label}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>
              {loading ? "-" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search contacts by name, email, or phone..."
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-1 mb-6 border-b overflow-x-auto"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              color: tab === t.id ? "var(--accent-text)" : "var(--muted)",
              borderBottom:
                tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          <div
            className="inline-block w-8 h-8 border-2 rounded-full animate-spin mb-3"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
          <p className="text-sm">Loading contacts from GHL...</p>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {tab === "pipeline" && (
            <Pipeline
              contacts={contacts}
              stages={stages}
              stageDefinitions={STAGES}
              onDragEnd={handleDragEnd}
              onContactClick={setSelectedContact}
            />
          )}
          {tab === "list" && renderList()}
          {tab === "followups" && renderFollowUps()}
          {tab === "calls" && renderCalls()}
          {tab === "activity" && renderActivity()}
        </>
      )}

      {/* Contact Detail Panel */}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          stage={stages[selectedContact.id] || "new-lead"}
          followUpDate={followUps[selectedContact.id] || ""}
          onClose={() => setSelectedContact(null)}
          onStageChange={handleStageChange}
          onFollowUpChange={handleFollowUpChange}
        />
      )}
    </div>
  );
}
