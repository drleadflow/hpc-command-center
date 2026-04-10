"use client";

import { useRole } from "@/lib/role-context";
import type { HpcRole } from "@/lib/types";

const ROLE_WORK: Record<HpcRole, { title: string; items: { label: string; status: "todo" | "in-progress" | "done"; detail: string }[] }> = {
  ceo: { title: "Leadership Tasks", items: [
    { label: "Riverside Dental renewal call", status: "in-progress", detail: "Path C · Month 3 · Present results snapshot" },
    { label: "Approve yesterday's close handoff", status: "todo", detail: "Confirm handoff brief received by Tech + CSM" },
    { label: "Tuesday leadership sync prep", status: "todo", detail: "Pipeline, capacity, contractor performance" },
  ]},
  ops_manager: { title: "Operations Queue", items: [
    { label: "Daily tracking review", status: "in-progress", detail: "8/9 submitted · Setter outstanding" },
    { label: "Coastal Chiro walkthrough scheduling", status: "todo", detail: "Build at Day 10 · Blocked on Meta access" },
    { label: "Tuesday department sync", status: "todo", detail: "1pm CST · All department leads" },
  ]},
  marketing_lead: { title: "Content & Campaigns", items: [
    { label: "Webinar scorecard — Monday event", status: "todo", detail: "Due by 6pm today · Notion template" },
    { label: "2 Reels copy + direction", status: "in-progress", detail: "Deliver to Content Editor by noon" },
    { label: "A/B test winner deployment", status: "todo", detail: "Cold email Day 1 subject line · Update log" },
  ]},
  content_editor: { title: "Asset Queue", items: [
    { label: "2 Reels from Monday shoot", status: "in-progress", detail: "Export and deliver by 11am" },
    { label: "3 carousels: lead gen, chatbot, social proof", status: "todo", detail: "Brand standard check before upload" },
    { label: "Upload to Canva brand folder", status: "todo", detail: "Tagged and named before EOD" },
  ]},
  appointment_setter: { title: "Lead Queue", items: [
    { label: "Marketing audit — Dr. Smith (medspa)", status: "todo", detail: "Hot lead from Monday webinar · 2hr window" },
    { label: "Marketing audit — Peak Dental", status: "todo", detail: "Hot lead · Generate and review before send" },
    { label: "Pre-call intel — Skyline PT", status: "todo", detail: "Call booked for tomorrow 10am" },
  ]},
  sales_closer: { title: "Call Pipeline", items: [
    { label: "10am: Skyline PT — Path B", status: "todo", detail: "Audit reviewed · Pain points mapped · Qualifier ready" },
    { label: "1pm: Premier Wellness — Path C", status: "todo", detail: "Ad budget confirmed · Payment link queued" },
    { label: "4pm: Dr. Chen — Path A", status: "todo", detail: "Audit prepared · GHL source tag reviewed" },
  ]},
  ai_tech_specialist: { title: "Build Queue", items: [
    { label: "Coastal Chiro — QA all non-Meta components", status: "in-progress", detail: "Day 10 · Meta BM access pending" },
    { label: "Summit Wellness — chatbot + sequences", status: "todo", detail: "Day 5 · Activate 3 core sequences" },
    { label: "Weekly anomaly check", status: "todo", detail: "Test all triggers across active sub-accounts" },
  ]},
  csm_lead_coach: { title: "Client Success Queue", items: [
    { label: "Path A group coaching call", status: "todo", detail: "11am today · Topic: 30-day results reading" },
    { label: "Milestone Loom — Summit Wellness", status: "todo", detail: "First lead captured · 24hr window closing" },
    { label: "Monthly call — Peak Performance PT", status: "todo", detail: "2pm · Path B Month 2 · Pull results snapshot" },
  ]},
  bookkeeper: { title: "Finance Queue", items: [
    { label: "Process 4 bi-weekly invoices", status: "in-progress", detail: "All submitted Friday · Due within 5 business days" },
    { label: "Commission log update", status: "todo", detail: "Yesterday's close · Path B $3K · $300 entry" },
    { label: "Monthly P&L draft", status: "todo", detail: "By offer path · Due to CEO by the 5th" },
  ]},
};

const STATUS_STYLES = {
  todo: { bg: "var(--bg)", color: "var(--muted)", label: "To Do" },
  "in-progress": { bg: "#E8F1FB", color: "#1A4F8A", label: "In Progress" },
  done: { bg: "var(--success-bg, #EAF3DE)", color: "var(--success)", label: "Done" },
};

export default function WorkPage() {
  const { role } = useRole();
  const work = ROLE_WORK[role] ?? ROLE_WORK.ceo;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>My Work</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>{work.title}</p>

      <div className="flex flex-col gap-2">
        {work.items.map((item, i) => {
          const s = STATUS_STYLES[item.status];
          return (
            <div key={i} className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="flex-1">
                <div className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>{item.label}</div>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{item.detail}</div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
