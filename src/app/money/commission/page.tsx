"use client";

import { useState } from "react";
import { useStore } from "@/lib/use-store";
import { COMMISSION_TABLE } from "@/lib/team-data";
import type { StoredCommission } from "@/lib/store";

const STATUS_STYLES = {
  paid: { bg: "var(--success-bg, #EAF3DE)", color: "var(--success)" },
  pending: { bg: "var(--warning-bg, #FDF3E3)", color: "var(--warning)" },
  processing: { bg: "#E8F1FB", color: "#1A4F8A" },
};

const STATUS_CYCLE: Record<StoredCommission["status"], StoredCommission["status"]> = {
  pending: "processing",
  processing: "paid",
  paid: "pending",
};

const DEFAULT_ENTRIES: StoredCommission[] = [
  { id: "1", date: "2026-04-09", client: "Skyline PT", practiceType: "Physical Therapy", path: "B", firstPayment: 3000, commission: 300, onCallBonus: 100, status: "pending" },
  { id: "2", date: "2026-04-03", client: "Summit Wellness", practiceType: "Wellness", path: "B", firstPayment: 3000, commission: 300, onCallBonus: 0, status: "processing" },
  { id: "3", date: "2026-03-25", client: "Dr. Chen", practiceType: "Chiropractic", path: "A", firstPayment: 997, commission: 99.70, onCallBonus: 50, status: "paid" },
  { id: "4", date: "2026-03-20", client: "Premier Wellness", practiceType: "Wellness", path: "C", firstPayment: 5000, commission: 500, onCallBonus: 150, status: "paid" },
];

export default function CommissionPage() {
  const [entries, setEntries] = useStore<StoredCommission[]>(
    "hpc_commissions" as "hpc_commissions",
    DEFAULT_ENTRIES
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    client: "",
    practiceType: "",
    path: "B" as "A" | "B" | "C",
    firstPayment: "",
    onCallBonus: "",
    hasOnCallBonus: false,
  });

  const totalEarned = entries.reduce((s, e) => s + e.commission + e.onCallBonus, 0);
  const totalPaid = entries.filter((e) => e.status === "paid").reduce((s, e) => s + e.commission + e.onCallBonus, 0);
  const totalPending = totalEarned - totalPaid;

  function cycleStatus(id: string) {
    setEntries((prev) =>
      prev.map((e) => e.id === id ? { ...e, status: STATUS_CYCLE[e.status] } : e)
    );
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function submitForm() {
    const fp = parseFloat(form.firstPayment.replace(/[^0-9.]/g, ""));
    const bonus = form.hasOnCallBonus ? parseFloat(form.onCallBonus.replace(/[^0-9.]/g, "") || "0") : 0;
    if (!form.client.trim() || isNaN(fp)) return;
    const commission = fp * 0.1;
    const entry: StoredCommission = {
      id: `${Date.now()}`,
      date: form.date,
      client: form.client.trim(),
      practiceType: form.practiceType.trim() || "—",
      path: form.path,
      firstPayment: fp,
      commission,
      onCallBonus: isNaN(bonus) ? 0 : bonus,
      status: "pending",
    };
    setEntries((prev) => [entry, ...prev]);
    setForm({ date: new Date().toISOString().slice(0, 10), client: "", practiceType: "", path: "B", firstPayment: "", onCallBonus: "", hasOnCallBonus: false });
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Commission Log</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-[11px] px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {showForm ? "Cancel" : "+ Log New Deal"}
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Sales Closer &middot; 10% first-month commission + on-call bonuses &middot; click status to cycle
      </p>

      {/* Add Deal Form */}
      {showForm && (
        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--accent)" }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: "var(--muted)" }}>New Deal</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Date</div>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full text-[11px] rounded px-2 py-1.5"
                style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Path</div>
              <select
                value={form.path}
                onChange={(e) => setForm((f) => ({ ...f, path: e.target.value as "A" | "B" | "C" }))}
                className="w-full text-[11px] rounded px-2 py-1.5"
                style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
              >
                <option value="A">Path A — $997/mo</option>
                <option value="B">Path B — $3K/mo</option>
                <option value="C">Path C — $5K/mo</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Client</div>
              <input
                placeholder="Client name"
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                className="w-full text-[11px] rounded px-2 py-1.5"
                style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Practice Type</div>
              <input
                placeholder="e.g. Chiropractic"
                value={form.practiceType}
                onChange={(e) => setForm((f) => ({ ...f, practiceType: e.target.value }))}
                className="w-full text-[11px] rounded px-2 py-1.5"
                style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>First Payment ($)</div>
              <input
                placeholder="e.g. 3000"
                value={form.firstPayment}
                onChange={(e) => setForm((f) => ({ ...f, firstPayment: e.target.value }))}
                className="w-full text-[11px] rounded px-2 py-1.5"
                style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
              {form.firstPayment && !isNaN(parseFloat(form.firstPayment)) && (
                <div className="text-[10px] mt-1" style={{ color: "var(--success)" }}>
                  Commission: ${(parseFloat(form.firstPayment) * 0.1).toFixed(2)}
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] mb-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                On-Call Bonus
                <input
                  type="checkbox"
                  checked={form.hasOnCallBonus}
                  onChange={(e) => setForm((f) => ({ ...f, hasOnCallBonus: e.target.checked }))}
                />
              </div>
              {form.hasOnCallBonus && (
                <input
                  placeholder="Bonus amount"
                  value={form.onCallBonus}
                  onChange={(e) => setForm((f) => ({ ...f, onCallBonus: e.target.value }))}
                  className="w-full text-[11px] rounded px-2 py-1.5"
                  style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)", outline: "none" }}
                />
              )}
            </div>
          </div>
          <button
            onClick={submitForm}
            className="text-[11px] px-4 py-1.5 rounded"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Log Deal
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Total Earned</div>
          <div className="text-lg font-medium" style={{ color: "var(--text)" }}>${totalEarned.toFixed(2)}</div>
        </div>
        <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Paid</div>
          <div className="text-lg font-medium" style={{ color: "var(--success)" }}>${totalPaid.toFixed(2)}</div>
        </div>
        <div className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>Pending</div>
          <div className="text-lg font-medium" style={{ color: "var(--warning)" }}>${totalPending.toFixed(2)}</div>
        </div>
      </div>

      {/* Rate Table */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "0.5px solid var(--border)" }}>
        <div className="px-3 py-2" style={{ backgroundColor: "var(--bg)", borderBottom: "0.5px solid var(--border)" }}>
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--muted)" }}>Commission Structure</span>
        </div>
        <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {COMMISSION_TABLE.map((row) => (
              <tr key={row.path} style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <td className="px-3 py-2 font-medium" style={{ color: "var(--text)" }}>{row.path}</td>
                <td className="px-3 py-2" style={{ color: "var(--success)" }}>{row.earned}</td>
                <td className="px-3 py-2" style={{ color: "var(--muted)" }}>{row.bonus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log */}
      <div className="text-[10px] uppercase tracking-widest font-medium mb-2" style={{ color: "var(--muted)" }}>Deal Log</div>
      <div className="flex flex-col gap-1.5">
        {entries.map((e) => (
          <div key={e.id} className="rounded-lg px-4 py-3 flex items-center gap-3 group" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
            <div className="flex-1">
              <div className="text-xs font-medium" style={{ color: "var(--text)" }}>{e.client}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>{e.date} &middot; Path {e.path} &middot; {e.practiceType}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium" style={{ color: "var(--success)" }}>
                ${(e.commission + e.onCallBonus).toFixed(2)}
              </div>
              {e.onCallBonus > 0 && <div className="text-[9px]" style={{ color: "var(--muted)" }}>incl. ${e.onCallBonus} bonus</div>}
            </div>
            <button
              onClick={() => cycleStatus(e.id)}
              className="text-[9px] px-1.5 py-0.5 rounded-sm cursor-pointer"
              style={{ backgroundColor: STATUS_STYLES[e.status].bg, color: STATUS_STYLES[e.status].color }}
              title="Click to cycle status"
            >
              {e.status}
            </button>
            <button
              onClick={() => removeEntry(e.id)}
              className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              style={{ color: "var(--danger)" }}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
