"use client";

import { useState, useEffect } from "react";
import { store } from "@/lib/store";

// ── Types ────────────────────────────────────────────────────────────

interface CompanyKpis {
  newClients: { value: number; target: number };
  mrr: { value: number; target: number };
  retention: { value: number; target: number };
  nps: { value: number; target: number };
}

interface ClientWin {
  clientName: string;
  quote: string;
  csm: string;
  date: string;
}

// ── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_KPIS: CompanyKpis = {
  newClients: { value: 18, target: 50 },
  mrr: { value: 74000, target: 120000 },
  retention: { value: 87, target: 90 },
  nps: { value: 62, target: 70 },
};

const DEFAULT_WIN: ClientWin = {
  clientName: "Vitality & Aesthetics Clinic",
  quote: "Within 30 days we had 3 new high-ticket patients booked through the AI system. The team held our hand the entire way.",
  csm: "Jordan M.",
  date: "April 2025",
};

const CORE_VALUES = [
  { emoji: "🎯", title: "Outcomes Over Activity", desc: "We measure success by results delivered, not hours logged." },
  { emoji: "💎", title: "Radical Transparency", desc: "We say what we mean, share numbers openly, and never hide problems." },
  { emoji: "🔥", title: "Bias to Action", desc: "We ship, learn, and iterate. Done is better than perfect." },
  { emoji: "🤝", title: "Default to Trust", desc: "We assume best intent from teammates and clients until proven otherwise." },
  { emoji: "📚", title: "Always Learning", desc: "Every win and every loss teaches us something we apply immediately." },
];

// ── Inline Edit ───────────────────────────────────────────────────────

function EditField({
  value,
  onSave,
  multiline = false,
  placeholder = "Click to edit…",
  style = {},
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { setEditing(false); onSave(draft); };

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={3}
        style={{
          ...style,
          width: "100%",
          outline: "none",
          background: "transparent",
          resize: "none",
          border: "0.5px solid var(--border)",
          borderRadius: 4,
          padding: "2px 4px",
          fontFamily: "inherit",
          fontSize: "inherit",
          color: "var(--text)",
        }}
      />
    ) : (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        style={{
          ...style,
          outline: "none",
          background: "transparent",
          border: "0.5px solid var(--border)",
          borderRadius: 4,
          padding: "1px 4px",
          fontFamily: "inherit",
          fontSize: "inherit",
          color: "var(--text)",
          width: "100%",
        }}
      />
    );
  }

  return (
    <span
      style={{ cursor: "pointer", ...style }}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder}</span>}
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────

function ProgressBar({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const color = pct >= 90 ? "var(--success)" : pct >= 60 ? "var(--accent)" : "var(--warning)";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{
        height: 6,
        borderRadius: 6,
        background: "var(--border)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 6,
          transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{pct}% to target</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Target: {target}</span>
      </div>
    </div>
  );
}

// ── KPI Number Edit ───────────────────────────────────────────────────

function KpiNumberEdit({
  value,
  onSave,
  prefix = "",
  suffix = "",
}: {
  value: number;
  onSave: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft.replace(/[^0-9.]/g, ""));
    if (!isNaN(n)) onSave(n);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        style={{
          width: 80,
          outline: "none",
          background: "transparent",
          border: "0.5px solid var(--border)",
          borderRadius: 4,
          padding: "1px 4px",
          fontFamily: "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          color: "var(--text)",
        }}
      />
    );
  }

  const display = prefix === "$"
    ? `$${value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`
    : `${value}${suffix}`;

  return (
    <span
      style={{ cursor: "pointer" }}
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      title="Click to edit"
    >
      {display}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function CompanyPage() {
  const [kpis, setKpis] = useState<CompanyKpis>(DEFAULT_KPIS);
  const [win, setWin] = useState<ClientWin>(DEFAULT_WIN);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setKpis(store.read("hpc_company_kpis", DEFAULT_KPIS));
    setWin(store.read("hpc_client_wins", DEFAULT_WIN));
    setLoaded(true);
  }, []);

  const saveKpis = (next: CompanyKpis) => {
    setKpis(next);
    store.write("hpc_company_kpis", next);
  };

  const saveWin = (next: ClientWin) => {
    setWin(next);
    store.write("hpc_client_wins", next);
  };

  if (!loaded) return null;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", margin: 0 }}>
          Company & Culture
        </h1>
        <p style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
          Our mission, values, and company-wide KPIs — visible to everyone on the team.
        </p>
      </div>

      {/* ── Section 1: Mission / Vision ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          Mission & Vision
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: "22px 24px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Mission
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>
              We help health clinics scale their business with AI, without burning out.
            </p>
          </div>
          <div className="card" style={{ padding: "22px 24px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Vision
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>
              By 2030, every health clinic runs on AI-powered systems that scale impact without scaling stress.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 1b: Core Values ── */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          Core Values
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
          {CORE_VALUES.map((v) => (
            <div
              key={v.title}
              className="card"
              style={{ padding: "18px 20px" }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{v.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                {v.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>
                {v.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Company Q2 KPIs ── */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          Q2 Company KPIs
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>

          {/* New Clients */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>New Clients</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
              <KpiNumberEdit
                value={kpis.newClients.value}
                onSave={(v) => saveKpis({ ...kpis, newClients: { ...kpis.newClients, value: v } })}
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Target:{" "}
              <KpiNumberEdit
                value={kpis.newClients.target}
                onSave={(v) => saveKpis({ ...kpis, newClients: { ...kpis.newClients, target: v } })}
              />
            </div>
            <ProgressBar value={kpis.newClients.value} target={kpis.newClients.target} />
          </div>

          {/* MRR */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Monthly Recurring Revenue</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
              <KpiNumberEdit
                value={kpis.mrr.value}
                onSave={(v) => saveKpis({ ...kpis, mrr: { ...kpis.mrr, value: v } })}
                prefix="$"
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Target:{" "}
              <KpiNumberEdit
                value={kpis.mrr.target}
                onSave={(v) => saveKpis({ ...kpis, mrr: { ...kpis.mrr, target: v } })}
                prefix="$"
              />
            </div>
            <ProgressBar value={kpis.mrr.value} target={kpis.mrr.target} />
          </div>

          {/* Client Retention */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Client Retention</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
              <KpiNumberEdit
                value={kpis.retention.value}
                onSave={(v) => saveKpis({ ...kpis, retention: { ...kpis.retention, value: v } })}
                suffix="%"
              />
              <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 2 }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Target:{" "}
              <KpiNumberEdit
                value={kpis.retention.target}
                onSave={(v) => saveKpis({ ...kpis, retention: { ...kpis.retention, target: v } })}
              />%
            </div>
            <ProgressBar value={kpis.retention.value} target={kpis.retention.target} />
          </div>

          {/* Client NPS */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Client NPS</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
              <KpiNumberEdit
                value={kpis.nps.value}
                onSave={(v) => saveKpis({ ...kpis, nps: { ...kpis.nps, value: v } })}
              />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Target:{" "}
              <KpiNumberEdit
                value={kpis.nps.target}
                onSave={(v) => saveKpis({ ...kpis, nps: { ...kpis.nps, target: v } })}
              />+
            </div>
            <ProgressBar value={kpis.nps.value} target={kpis.nps.target} />
          </div>

        </div>
      </div>

      {/* ── Section 3: Client Win of the Week ── */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          Client Win of the Week
        </h2>
        <div className="card" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--accent-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}>
              🏆
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>
                  <EditField
                    value={win.clientName}
                    onSave={(v) => saveWin({ ...win, clientName: v })}
                    placeholder="Client name…"
                    style={{ fontWeight: 700, fontSize: 16 }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 8 }}>
                  <span>
                    CSM:{" "}
                    <EditField
                      value={win.csm}
                      onSave={(v) => saveWin({ ...win, csm: v })}
                      placeholder="CSM name…"
                      style={{ color: "var(--accent)", fontWeight: 600 }}
                    />
                  </span>
                  <span>·</span>
                  <EditField
                    value={win.date}
                    onSave={(v) => saveWin({ ...win, date: v })}
                    placeholder="Date…"
                  />
                </div>
              </div>
              <blockquote style={{
                margin: 0,
                paddingLeft: 14,
                borderLeft: "3px solid var(--accent)",
                color: "var(--text-secondary)",
                fontSize: 15,
                lineHeight: 1.65,
                fontStyle: "italic",
              }}>
                <EditField
                  value={win.quote}
                  onSave={(v) => saveWin({ ...win, quote: v })}
                  multiline
                  placeholder="Paste the client testimonial or win summary here…"
                  style={{ fontSize: 15, lineHeight: 1.65 }}
                />
              </blockquote>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
