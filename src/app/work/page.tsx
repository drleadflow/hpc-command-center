"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import { useStore } from "@/lib/use-store";
import type { HpcRole } from "@/lib/types";

interface WorkItem {
  id: string;
  label: string;
  detail: string;
  status: "todo" | "in-progress" | "done";
}

const DEFAULT_WORK: Record<HpcRole, WorkItem[]> = {
  ceo: [
    { id: "c1", label: "Riverside Dental renewal call", detail: "Path C · Month 3 · Present results snapshot", status: "in-progress" },
    { id: "c2", label: "Approve yesterday's close handoff", detail: "Confirm handoff brief received by Tech + CSM", status: "todo" },
    { id: "c3", label: "Tuesday leadership sync prep", detail: "Pipeline, capacity, contractor performance", status: "todo" },
  ],
  ops_manager: [
    { id: "o1", label: "Daily tracking review", detail: "8/9 submitted · Setter outstanding", status: "in-progress" },
    { id: "o2", label: "Coastal Chiro walkthrough scheduling", detail: "Build at Day 10 · Blocked on Meta access", status: "todo" },
    { id: "o3", label: "Tuesday department sync", detail: "1pm CST · All department leads", status: "todo" },
  ],
  marketing_lead: [
    { id: "m1", label: "Webinar scorecard — Monday event", detail: "Due by 6pm today · Notion template", status: "todo" },
    { id: "m2", label: "2 Reels copy + direction", detail: "Deliver to Content Editor by noon", status: "in-progress" },
    { id: "m3", label: "A/B test winner deployment", detail: "Cold email Day 1 subject line · Update log", status: "todo" },
  ],
  content_editor: [
    { id: "e1", label: "2 Reels from Monday shoot", detail: "Export and deliver by 11am", status: "in-progress" },
    { id: "e2", label: "3 carousels: lead gen, chatbot, social proof", detail: "Brand standard check before upload", status: "todo" },
    { id: "e3", label: "Upload to Canva brand folder", detail: "Tagged and named before EOD", status: "todo" },
  ],
  appointment_setter: [
    { id: "s1", label: "Marketing audit — Dr. Smith (medspa)", detail: "Hot lead from Monday webinar · 2hr window", status: "todo" },
    { id: "s2", label: "Marketing audit — Peak Dental", detail: "Hot lead · Generate and review before send", status: "todo" },
    { id: "s3", label: "Pre-call intel — Skyline PT", detail: "Call booked for tomorrow 10am", status: "todo" },
  ],
  sales_closer: [
    { id: "cl1", label: "10am: Skyline PT — Path B", detail: "Audit reviewed · Pain points mapped", status: "todo" },
    { id: "cl2", label: "1pm: Premier Wellness — Path C", detail: "Ad budget confirmed · Payment link queued", status: "todo" },
    { id: "cl3", label: "4pm: Dr. Chen — Path A", detail: "Audit prepared · GHL source tag reviewed", status: "todo" },
  ],
  ai_tech_specialist: [
    { id: "t1", label: "Coastal Chiro — QA non-Meta components", detail: "Day 10 · Meta BM access pending", status: "in-progress" },
    { id: "t2", label: "Summit Wellness — chatbot + sequences", detail: "Day 5 · Activate 3 core sequences", status: "todo" },
    { id: "t3", label: "Weekly anomaly check", detail: "Test all triggers across active sub-accounts", status: "todo" },
  ],
  csm_lead_coach: [
    { id: "cs1", label: "Path A group coaching call", detail: "11am today · Topic: 30-day results", status: "todo" },
    { id: "cs2", label: "Milestone Loom — Summit Wellness", detail: "First lead captured · 24hr window closing", status: "todo" },
    { id: "cs3", label: "Monthly call — Peak Performance PT", detail: "2pm · Path B Month 2 · Pull results snapshot", status: "todo" },
  ],
  bookkeeper: [
    { id: "b1", label: "Process 4 bi-weekly invoices", detail: "All submitted Friday · Due within 5 business days", status: "in-progress" },
    { id: "b2", label: "Commission log update", detail: "Yesterday's close · Path B $3K · $300 entry", status: "todo" },
    { id: "b3", label: "Monthly P&L draft", detail: "By offer path · Due to CEO by the 5th", status: "todo" },
  ],
};

const STATUS_CYCLE: Array<"todo" | "in-progress" | "done"> = ["todo", "in-progress", "done"];
const STATUS_STYLES = {
  todo: { bg: "var(--bg)", color: "var(--muted)", label: "To Do" },
  "in-progress": { bg: "#E8F1FB", color: "#1A4F8A", label: "In Progress" },
  done: { bg: "var(--success-bg, #EAF3DE)", color: "var(--success)", label: "Done" },
};

const ROLE_LABELS: Record<HpcRole, string> = {
  ceo: "CEO", ops_manager: "Operations Manager", marketing_lead: "Marketing Lead", content_editor: "Content Editor",
  appointment_setter: "Appointment Setter", sales_closer: "Sales Closer", ai_tech_specialist: "AI & Tech Specialist",
  csm_lead_coach: "CSM / Lead Coach", bookkeeper: "Bookkeeper / Finance",
};

export default function WorkPage() {
  const { role } = useRole();
  const [items, setItems] = useStore<WorkItem[]>(`hpc_work_${role}` as "hpc_work_items", DEFAULT_WORK[role] ?? []);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDetail, setNewDetail] = useState("");

  const cycleStatus = (id: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length];
      return { ...item, status: next };
    }));
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    const item: WorkItem = { id: Date.now().toString(), label: newLabel, detail: newDetail, status: "todo" };
    setItems((prev) => [...prev, item]);
    setNewLabel("");
    setNewDetail("");
    setAdding(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>My Work</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{ROLE_LABELS[role]} &middot; {doneCount}/{items.length} done</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "var(--accent)" }}>+ Add Task</button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>Progress</span>
            <span className="text-xs font-medium" style={{ color: doneCount === items.length ? "var(--success)" : "var(--text)" }}>{Math.round((doneCount / items.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / items.length) * 100}%`, backgroundColor: "var(--success)" }} />
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Task name" className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
          <input value={newDetail} onChange={(e) => setNewDetail(e.target.value)} placeholder="Details (optional)" className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
          <button onClick={addItem} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--success)" }}>Add</button>
        </div>
      )}

      {/* Work items */}
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const s = STATUS_STYLES[item.status];
          return (
            <div key={item.id} className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)", opacity: item.status === "done" ? 0.6 : 1 }}>
              <div className="flex-1">
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)", textDecoration: item.status === "done" ? "line-through" : "none" }}>{item.label}</div>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{item.detail}</div>
              </div>
              <button
                onClick={() => cycleStatus(item.id)}
                className="text-[9px] px-2 py-0.5 rounded-sm flex-shrink-0 cursor-pointer transition-all"
                style={{ backgroundColor: s.bg, color: s.color }}
                title="Click to change status"
              >
                {s.label}
              </button>
              <button onClick={() => removeItem(item.id)} className="text-[10px] opacity-30 hover:opacity-100 flex-shrink-0" style={{ color: "var(--danger)" }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
