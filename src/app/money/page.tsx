"use client";

import Link from "next/link";

const MRR_DATA = {
  total: 24500,
  pathA: 2991,   // 3 x $997
  pathB: 12000,  // 4 x $3000
  pathC: 10000,  // 2 x $5000
  newMrr: 3000,
  churnedMrr: 0,
  netMrr: 3000,
};

const MONTHLY_HISTORY = [
  { month: "Jan", mrr: 15500 },
  { month: "Feb", mrr: 18500 },
  { month: "Mar", mrr: 21500 },
  { month: "Apr", mrr: 24500 },
];

const maxMrr = Math.max(...MONTHLY_HISTORY.map((m) => m.mrr));

export default function MoneyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-lg font-medium mb-1" style={{ color: "var(--text)" }}>Revenue</h1>
      <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
        MRR overview &middot; Revenue by offer path
      </p>

      {/* Quick Links */}
      <div className="flex gap-2 mb-5">
        <Link href="/money/commission" className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
          Commission Log
        </Link>
        <Link href="/money/invoices" className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "0.5px solid var(--border)" }}>
          Invoices
        </Link>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Total MRR", value: `$${MRR_DATA.total.toLocaleString()}`, color: "var(--text)" },
          { label: "New MRR", value: `+$${MRR_DATA.newMrr.toLocaleString()}`, color: "var(--success)" },
          { label: "Churned MRR", value: `$${MRR_DATA.churnedMrr.toLocaleString()}`, color: MRR_DATA.churnedMrr > 0 ? "var(--danger)" : "var(--success)" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg px-3 py-3" style={{ backgroundColor: "var(--bg)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>{m.label}</div>
            <div className="text-lg font-medium" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue by Path */}
      <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>Revenue by Offer Path</div>
        {[
          { label: "Path A — $997/mo", value: MRR_DATA.pathA, count: 3, color: "#639922" },
          { label: "Path B — $3K/mo", value: MRR_DATA.pathB, count: 4, color: "#2D7DD2" },
          { label: "Path C — $5K/mo", value: MRR_DATA.pathC, count: 2, color: "#C4860A" },
        ].map((p) => (
          <div key={p.label} className="flex items-center gap-3 mb-3">
            <div className="w-36 flex-shrink-0">
              <div className="text-[11px] font-medium" style={{ color: "var(--text)" }}>{p.label}</div>
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>{p.count} clients</div>
            </div>
            <div className="flex-1">
              <div className="h-5 rounded-md flex items-center px-2" style={{ width: `${Math.max((p.value / MRR_DATA.total) * 100, 15)}%`, backgroundColor: `${p.color}20`, border: `0.5px solid ${p.color}40` }}>
                <span className="text-[10px] font-medium" style={{ color: p.color }}>${p.value.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MRR Trend */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: "var(--muted)" }}>MRR Trend</div>
        <div className="flex items-end gap-3 h-32">
          {MONTHLY_HISTORY.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium" style={{ color: "var(--text)" }}>${(m.mrr / 1000).toFixed(1)}K</span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${(m.mrr / maxMrr) * 100}%`,
                  backgroundColor: "var(--accent)",
                  opacity: m.month === "Apr" ? 1 : 0.4,
                  minHeight: 8,
                }}
              />
              <span className="text-[9px]" style={{ color: "var(--muted)" }}>{m.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
