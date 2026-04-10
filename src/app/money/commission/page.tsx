"use client";

import { COMMISSION_TABLE } from "@/lib/team-data";

interface CommissionEntry {
  date: string;
  client: string;
  practiceType: string;
  path: "A" | "B" | "C";
  firstPayment: number;
  commission: number;
  onCallBonus: number;
  status: "paid" | "pending" | "processing";
}

const ENTRIES: CommissionEntry[] = [
  { date: "2026-04-09", client: "Skyline PT", practiceType: "Physical Therapy", path: "B", firstPayment: 3000, commission: 300, onCallBonus: 100, status: "pending" },
  { date: "2026-04-03", client: "Summit Wellness", practiceType: "Wellness", path: "B", firstPayment: 3000, commission: 300, onCallBonus: 0, status: "processing" },
  { date: "2026-03-25", client: "Dr. Chen", practiceType: "Chiropractic", path: "A", firstPayment: 997, commission: 99.70, onCallBonus: 50, status: "paid" },
  { date: "2026-03-20", client: "Premier Wellness", practiceType: "Wellness", path: "C", firstPayment: 5000, commission: 500, onCallBonus: 150, status: "paid" },
];

const STATUS_STYLES = {
  paid: { bg: "var(--success-bg, #EAF3DE)", color: "var(--success)" },
  pending: { bg: "var(--warning-bg, #FDF3E3)", color: "var(--warning)" },
  processing: { bg: "#E8F1FB", color: "#1A4F8A" },
};

export default function CommissionPage() {
  const totalEarned = ENTRIES.reduce((s, e) => s + e.commission + e.onCallBonus, 0);
  const totalPaid = ENTRIES.filter((e) => e.status === "paid").reduce((s, e) => s + e.commission + e.onCallBonus, 0);
  const totalPending = totalEarned - totalPaid;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Commission Log</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        Sales Closer &middot; 10% first-month commission + on-call bonuses
      </p>

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
        {ENTRIES.map((e, i) => (
          <div key={i} className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
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
            <span className="text-[9px] px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: STATUS_STYLES[e.status].bg, color: STATUS_STYLES[e.status].color }}>
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
