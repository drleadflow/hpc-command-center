"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/use-store";

interface ClientRow {
  id: string;
  name: string;
  slug: string;
  path: "A" | "B" | "C";
  practiceType: string;
  health: number;
  healthStatus: "ok" | "warn" | "bad";
  nextAction: string;
  onboardDate: string;
  renewalDate: string;
}

const DEFAULT_CLIENTS: ClientRow[] = [
  { id: "1", name: "Skyline PT", slug: "skyline-pt", path: "B", practiceType: "Physical Therapy", health: 92, healthStatus: "ok", nextAction: "Monthly optimization call", onboardDate: "2026-01-15", renewalDate: "2026-04-15" },
  { id: "2", name: "Coastal Chiropractic", slug: "coastal-chiro", path: "B", practiceType: "Chiropractic", health: 68, healthStatus: "warn", nextAction: "Build blocked — Meta access", onboardDate: "2026-03-28", renewalDate: "2026-06-28" },
  { id: "3", name: "Premier Wellness", slug: "premier-wellness", path: "C", practiceType: "Wellness", health: 88, healthStatus: "ok", nextAction: "Week 2 — ads launch", onboardDate: "2026-03-20", renewalDate: "2026-06-20" },
  { id: "4", name: "Riverside Dental", slug: "riverside-dental", path: "C", practiceType: "Dental", health: 95, healthStatus: "ok", nextAction: "Month 3 renewal call", onboardDate: "2026-01-10", renewalDate: "2026-04-10" },
  { id: "5", name: "Peak Performance PT", slug: "peak-pt", path: "B", practiceType: "Physical Therapy", health: 82, healthStatus: "ok", nextAction: "Month 2 optimization", onboardDate: "2026-02-05", renewalDate: "2026-05-05" },
  { id: "6", name: "Summit Wellness", slug: "summit-wellness", path: "B", practiceType: "Wellness", health: 75, healthStatus: "warn", nextAction: "Day 5 — chatbot config", onboardDate: "2026-04-03", renewalDate: "2026-07-03" },
  { id: "7", name: "Dr. Chen Chiropractic", slug: "dr-chen", path: "A", practiceType: "Chiropractic", health: 85, healthStatus: "ok", nextAction: "Week 2 coaching check-in", onboardDate: "2026-03-25", renewalDate: "—" },
  { id: "8", name: "Harmony Medspa", slug: "harmony-medspa", path: "A", practiceType: "Medspa", health: 78, healthStatus: "ok", nextAction: "Day 30 check-in", onboardDate: "2026-03-10", renewalDate: "—" },
  { id: "9", name: "Mindful Psych", slug: "mindful-psych", path: "A", practiceType: "Psychiatry", health: 90, healthStatus: "ok", nextAction: "Group coaching — active", onboardDate: "2026-02-20", renewalDate: "—" },
];

const PATH_COLORS = { A: "#639922", B: "#2D7DD2", C: "#C4860A" };
const HEALTH_COLORS = { ok: "var(--success)", warn: "var(--warning)", bad: "var(--danger)" };
const PRACTICE_TYPES = ["Medspa", "Dental", "Chiropractic", "Psychiatry", "Wellness", "Physical Therapy", "Weight Loss", "Other"];

function InlineEdit({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (editing) {
    return <input ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => { onChange(draft); setEditing(false); }} onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }} className="outline-none rounded px-1" style={{ ...style, backgroundColor: "var(--bg)", border: "1px solid var(--accent)", width: "100%" }} />;
  }
  return <span onClick={() => setEditing(true)} style={{ ...style, cursor: "pointer" }} title="Click to edit">{value}</span>;
}

export default function DeliverPage() {
  const [clients, setClients] = useStore<ClientRow[]>("hpc_clients" as "hpc_clients", DEFAULT_CLIENTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", practiceType: "Medspa", path: "B" as "A" | "B" | "C" });

  const pathCounts = { A: clients.filter((c) => c.path === "A").length, B: clients.filter((c) => c.path === "B").length, C: clients.filter((c) => c.path === "C").length };

  const updateClient = (id: string, patch: Partial<ClientRow>) => {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  };

  const addClient = () => {
    if (!newClient.name.trim()) return;
    const id = Date.now().toString();
    const slug = newClient.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const client: ClientRow = {
      id, name: newClient.name, slug, path: newClient.path, practiceType: newClient.practiceType,
      health: 50, healthStatus: "warn", nextAction: "Onboarding", onboardDate: new Date().toISOString().split("T")[0], renewalDate: "—",
    };
    setClients((prev) => [...prev, client]);
    setNewClient({ name: "", practiceType: "Medspa", path: "B" });
    setShowAddForm(false);
  };

  const removeClient = (id: string) => {
    if (confirm("Remove this client?")) setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Deliver</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Active clients: {clients.length} &middot; Path A: {pathCounts.A} &middot; Path B: {pathCounts.B} &middot; Path C: {pathCounts.C}
          </p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "var(--accent)" }}>
          + Add Client
        </button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] block mb-1" style={{ color: "var(--muted)" }}>Client Name</label>
              <input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Practice name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: "var(--muted)" }}>Path</label>
              <select value={newClient.path} onChange={(e) => setNewClient({ ...newClient, path: e.target.value as "A" | "B" | "C" })} className="rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }}>
                <option value="A">Path A</option><option value="B">Path B</option><option value="C">Path C</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: "var(--muted)" }}>Practice Type</label>
              <select value={newClient.practiceType} onChange={(e) => setNewClient({ ...newClient, practiceType: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }}>
                {PRACTICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={addClient} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: "var(--success)" }}>Add</button>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="flex gap-2 mb-5">
        <Link href="/deliver/builds" className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>Active Builds</Link>
        <Link href="/deliver/coaching" className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>Coaching</Link>
      </div>

      {/* Client Table — editable */}
      <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid var(--border)" }}>
        <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg)" }}>
              {["Client", "Path / Type", "Health", "Next Action", "Renewal", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)", borderBottom: "0.5px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <td className="px-3 py-3">
                  <InlineEdit value={c.name} onChange={(v) => updateClient(c.id, { name: v })} style={{ fontWeight: 500, color: "var(--text)" }} />
                </td>
                <td className="px-3 py-3">
                  <select value={c.path} onChange={(e) => updateClient(c.id, { path: e.target.value as "A" | "B" | "C" })} className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium mr-1.5 outline-none cursor-pointer" style={{ backgroundColor: `${PATH_COLORS[c.path]}18`, color: PATH_COLORS[c.path], border: "none" }}>
                    <option value="A">Path A</option><option value="B">Path B</option><option value="C">Path C</option>
                  </select>
                  <InlineEdit value={c.practiceType} onChange={(v) => updateClient(c.id, { practiceType: v })} style={{ color: "var(--muted)", fontSize: "11px" }} />
                </td>
                <td className="px-3 py-3">
                  <input type="number" value={c.health} onChange={(e) => { const h = parseInt(e.target.value) || 0; updateClient(c.id, { health: h, healthStatus: h >= 80 ? "ok" : h >= 60 ? "warn" : "bad" }); }} className="w-12 text-center outline-none rounded font-medium" style={{ backgroundColor: "transparent", color: HEALTH_COLORS[c.healthStatus], border: "none" }} />
                  <span style={{ color: HEALTH_COLORS[c.healthStatus] }}>%</span>
                </td>
                <td className="px-3 py-3">
                  <InlineEdit value={c.nextAction} onChange={(v) => updateClient(c.id, { nextAction: v })} style={{ color: "var(--text-secondary)", fontSize: "11px" }} />
                </td>
                <td className="px-3 py-3">
                  <InlineEdit value={c.renewalDate} onChange={(v) => updateClient(c.id, { renewalDate: v })} style={{ color: "var(--muted)", fontSize: "11px" }} />
                </td>
                <td className="px-3 py-3">
                  <button onClick={() => removeClient(c.id)} className="text-[10px] opacity-30 hover:opacity-100 transition-opacity" style={{ color: "var(--danger)" }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
