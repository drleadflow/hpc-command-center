"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ClientStatus = "active" | "churned" | "paused";
type ClientTier = "agency" | "coaching";
type SortKey = "name" | "tier" | "monthly" | "status" | "startDate" | "ltv";
type SortDir = "asc" | "desc";

interface RevenueClient {
  id: string;
  name: string;
  tier: ClientTier;
  monthly: number;
  status: ClientStatus;
  startDate: string;
  notes: string;
}

interface WaterfallBucket {
  key: string;
  label: string;
  pct: number;
  spent: number;
}

interface MonthlySnapshot {
  month: string;
  mrr: number;
}

interface RevenueData {
  clients: RevenueClient[];
  waterfall: { buckets: WaterfallBucket[] };
  monthlyHistory: MonthlySnapshot[];
  targetMrr: number;
  prevMonthMrr: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

function monthsActive(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(1, months);
}

function statusBadgeStyle(status: ClientStatus): React.CSSProperties {
  if (status === "active") return { backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" };
  if (status === "churned") return { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" };
  if (status === "paused") return { backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" };
  return { backgroundColor: "var(--surface)", color: "var(--muted)" };
}

function bucketBarColor(allocated: number, spent: number): string {
  if (spent === 0) return "#22c55e";
  const ratio = spent / allocated;
  if (ratio > 1) return "#dc2626";
  if (ratio > 0.85) return "#f59e0b";
  return "#22c55e";
}

// ─── Inline Editable Cell ────────────────────────────────────────────────────

function EditCell({
  value,
  type = "text",
  onSave,
  prefix,
  suffix,
  style,
}: {
  value: string | number;
  type?: "text" | "number";
  onSave: (v: string | number) => void;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function commit() {
    if (type === "number") {
      const parsed = parseFloat(draft.replace(/[^0-9.-]/g, ""));
      if (!isNaN(parsed)) onSave(parsed);
    } else {
      onSave(draft);
    }
    setEditing(false);
  }

  const display =
    type === "number"
      ? (prefix || "") + Number(value).toLocaleString("en-US") + (suffix || "")
      : String(value);

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        title="Click to edit"
        style={{
          cursor: "text",
          borderBottom: "1px dashed transparent",
          transition: "border-color 0.15s",
          ...style,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.borderBottomColor = "var(--accent)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.borderBottomColor = "transparent")
        }
      >
        {display}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type === "number" ? "number" : "text"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
        }
      }}
      style={{
        background: "var(--bg)",
        border: "1px solid var(--accent)",
        borderRadius: 4,
        padding: "1px 6px",
        outline: "none",
        color: "var(--text)",
        fontSize: "inherit",
        width: Math.max(60, String(draft).length * 9 + 20),
        ...style,
      }}
    />
  );
}

// ─── Add Client Modal ────────────────────────────────────────────────────────

function AddClientModal({
  onAdd,
  onClose,
}: {
  onAdd: (c: Partial<RevenueClient>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<ClientTier>("coaching");
  const [monthly, setMonthly] = useState(997);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<ClientStatus>("active");

  function tierAmount(t: ClientTier): number {
    return t === "agency" ? 20000 : 997;
  }

  const inp: React.CSSProperties = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--muted)",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card"
        style={{ width: 440, padding: 28, background: "var(--surface)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
            Add New Client
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Client Name</label>
            <input
              style={inp}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Glow Aesthetics"
              autoFocus
            />
          </div>
          <div>
            <label style={lbl}>Tier</label>
            <select
              style={{ ...inp, cursor: "pointer" }}
              value={tier}
              onChange={(e) => {
                const t = e.target.value as ClientTier;
                setTier(t);
                setMonthly(tierAmount(t));
              }}
            >
              <option value="agency">$20K Agency</option>
              <option value="coaching">$997 Coaching</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Monthly Revenue</label>
            <input
              style={inp}
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={lbl}>Start Date</label>
            <input
              style={inp}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select
              style={{ ...inp, cursor: "pointer" }}
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 22,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onAdd({ name, tier, monthly, startDate, status, notes: "" });
              onClose();
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MRR Bar Chart ───────────────────────────────────────────────────────────

function MrrChart({ history }: { history: MonthlySnapshot[] }) {
  if (!history || history.length === 0) return null;
  const maxMrr = Math.max(...history.map((h) => h.mrr), 1);
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}
    >
      {history.map((snap, i) => {
        const heightPct = Math.round((snap.mrr / maxMrr) * 100);
        const isLast = i === history.length - 1;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: isLast ? "var(--accent)" : "var(--muted)",
                whiteSpace: "nowrap",
                fontWeight: isLast ? 700 : 400,
              }}
            >
              {fmt(snap.mrr)}
            </span>
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-end",
                height: 72,
              }}
            >
              <div
                title={`${snap.month}: ${fmt(snap.mrr)}`}
                style={{
                  width: "100%",
                  height: `${Math.max(heightPct, 4)}%`,
                  backgroundColor: isLast ? "var(--accent)" : "var(--border)",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.3s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 9,
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              {snap.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("monthly");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/revenue")
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object") setData(d as RevenueData);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  const triggerSave = useCallback(
    (next: RevenueData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch("/api/revenue", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
        } catch {
          // silent
        }
        setSaving(false);
      }, 800);
    },
    []
  );

  function update(next: RevenueData) {
    setData(next);
    triggerSave(next);
  }

  async function addClient(partial: Partial<RevenueClient>) {
    if (!data) return;
    const res = await fetch("/api/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const body = await res.json();
    if (body.ok && body.client) {
      setData({ ...data, clients: [...data.clients, body.client] });
    }
  }

  async function deleteClient(id: string) {
    if (!data || !confirm("Remove this client from revenue tracking?")) return;
    await fetch("/api/revenue", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    update({ ...data, clients: data.clients.filter((c) => c.id !== id) });
  }

  function updateClient(
    id: string,
    field: keyof RevenueClient,
    value: string | number
  ) {
    if (!data) return;
    update({
      ...data,
      clients: data.clients.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  }

  function updateBucket(
    key: string,
    field: keyof WaterfallBucket,
    value: number
  ) {
    if (!data) return;
    update({
      ...data,
      waterfall: {
        ...data.waterfall,
        buckets: data.waterfall.buckets.map((b) =>
          b.key === key ? { ...b, [field]: value } : b
        ),
      },
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[120, 140, 300].map((h) => (
          <div
            key={h}
            className="card animate-pulse"
            style={{ height: h, background: "var(--surface)" }}
          />
        ))}
      </div>
    );
  }

  if (!data || fetchError) {
    return (
      <div className="card p-10 text-center">
        <p className="text-2xl mb-2">💰</p>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
          {fetchError ? "Could not load revenue data" : "No revenue data yet"}
        </h3>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {fetchError
            ? "Check the /api/revenue endpoint configuration."
            : "Revenue tracking will appear once clients are added."}
        </p>
      </div>
    );
  }

  const activeClients = data.clients.filter((c) => c.status === "active");
  const churnedClients = data.clients.filter((c) => c.status === "churned");
  const totalMrr = activeClients.reduce((s, c) => s + c.monthly, 0);
  const prevMrr = data.prevMonthMrr || 0;
  const mrrGrowth =
    prevMrr > 0 ? ((totalMrr - prevMrr) / prevMrr) * 100 : 0;
  const avgRevenue =
    activeClients.length > 0 ? totalMrr / activeClients.length : 0;
  const churnRate =
    data.clients.length > 0
      ? (churnedClients.length / data.clients.length) * 100
      : 0;
  const targetMrr = data.targetMrr || 50000;
  const mrrPct = Math.min(
    100,
    Math.round((totalMrr / targetMrr) * 100)
  );
  const totalBucketPct = data.waterfall.buckets.reduce(
    (s, b) => s + b.pct,
    0
  );

  // Type-safe sort — 'ltv' is computed, not a RevenueClient field
  const sortedClients = [...data.clients].sort((a, b) => {
    let av: string | number;
    let bv: string | number;
    if (sortKey === "ltv") {
      av = a.monthly * monthsActive(a.startDate);
      bv = b.monthly * monthsActive(b.startDate);
    } else {
      const ka = a as unknown as Record<string, string | number>;
      const kb = b as unknown as Record<string, string | number>;
      av = ka[sortKey] ?? "";
      bv = kb[sortKey] ?? "";
    }
    if (typeof av === "number" && typeof bv === "number")
      return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const statCards = [
    {
      label: "Total MRR",
      value: fmt(totalMrr),
      sub:
        mrrGrowth >= 0
          ? `↑ +${fmtPct(mrrGrowth)} MoM`
          : `↓ ${fmtPct(Math.abs(mrrGrowth))} MoM`,
      color: mrrGrowth >= 0 ? "#22c55e" : "#dc2626",
    },
    {
      label: "Active Clients",
      value: String(activeClients.length),
      sub: `${data.clients.length} total`,
      color: "var(--accent)",
    },
    {
      label: "Avg Revenue / Client",
      value: fmt(Math.round(avgRevenue)),
      sub: "active clients only",
      color: "var(--text)",
    },
    {
      label: "Churn Rate",
      value: fmtPct(churnRate),
      sub: `${churnedClients.length} churned`,
      color:
        churnRate > 10 ? "#dc2626" : churnRate > 5 ? "#f59e0b" : "#22c55e",
    },
    {
      label: "MRR Target",
      value: fmtPct(mrrPct),
      sub: `${fmt(targetMrr)} goal`,
      color: mrrPct >= 80 ? "#22c55e" : "var(--accent)",
    },
  ];

  const thBase: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
    userSelect: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const sortCols: [SortKey, string][] = [
    ["name", "Client"],
    ["tier", "Tier"],
    ["monthly", "Monthly"],
    ["status", "Status"],
    ["startDate", "Start Date"],
    ["ltv", "LTV"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: "26px 30px",
          background:
            "linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              FINANCIAL COMMAND
            </p>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 300,
                color: "var(--text)",
                letterSpacing: "-0.5px",
                marginBottom: 4,
                fontFamily: "Georgia, serif",
              }}
            >
              Revenue Command Center
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Real-time MRR tracking, client revenue, and cash flow allocation.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {saving && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Saving…
              </span>
            )}
            <button
              onClick={() => setShowAddClient(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + Add Client
            </button>
          </div>
        </div>
      </div>

      {/* MRR Dashboard */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
            marginBottom: 12,
          }}
        >
          MRR DASHBOARD
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              className="card"
              style={{ padding: "16px 18px", borderTop: `3px solid ${card.color}` }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 300,
                  color: card.color,
                  letterSpacing: "-0.5px",
                  fontFamily: "Georgia, serif",
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}
              >
                {card.value}
              </p>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Target progress bar */}
        <div className="card" style={{ padding: "14px 18px", marginTop: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Progress to target:{" "}
              <EditCell
                value={targetMrr}
                type="number"
                onSave={(v) => update({ ...data, targetMrr: Number(v) })}
                prefix="$"
                style={{ color: "var(--muted)", fontSize: 12 }}
              />
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {mrrPct}% — {fmt(targetMrr - totalMrr)} remaining
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              backgroundColor: "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${mrrPct}%`,
                backgroundColor: "var(--accent)",
                borderRadius: 4,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* MRR Trend Chart */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
            marginBottom: 12,
          }}
        >
          MRR TREND — LAST 6 MONTHS
        </p>
        <div className="card" style={{ padding: "18px 22px" }}>
          <MrrChart history={data.monthlyHistory || []} />
          <p
            style={{
              fontSize: 11,
              color: "var(--muted)",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Current month highlighted. Historical data stored per save.
          </p>
        </div>
      </div>

      {/* Client Revenue Table */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--muted)",
            }}
          >
            CLIENT REVENUE TABLE
          </p>
          <button
            onClick={() => setShowAddClient(true)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + Add Client
          </button>
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr>
                  {sortCols.map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      style={{
                        ...thBase,
                        color:
                          sortKey === key ? "var(--accent)" : "var(--muted)",
                      }}
                    >
                      {label}
                      {sortKey === key
                        ? sortDir === "asc"
                          ? " ↑"
                          : " ↓"
                        : " ↕"}
                    </th>
                  ))}
                  <th style={{ ...thBase, cursor: "default" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client, i) => {
                  const ltv =
                    client.monthly * monthsActive(client.startDate);
                  return (
                    <tr
                      key={client.id}
                      style={{
                        borderBottom:
                          i < sortedClients.length - 1
                            ? "1px solid var(--border)"
                            : undefined,
                        opacity: client.status === "churned" ? 0.6 : 1,
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "var(--text)",
                          fontWeight: 500,
                        }}
                      >
                        <EditCell
                          value={client.name}
                          onSave={(v) =>
                            updateClient(client.id, "name", v)
                          }
                          style={{ color: "var(--text)", fontWeight: 500 }}
                        />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <select
                          value={client.tier}
                          onChange={(e) =>
                            updateClient(
                              client.id,
                              "tier",
                              e.target.value as ClientTier
                            )
                          }
                          style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: 12,
                            color: "var(--muted)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="agency">$20K Agency</option>
                          <option value="coaching">$997 Coaching</option>
                        </select>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "Georgia, serif",
                          color: "var(--text)",
                        }}
                      >
                        <EditCell
                          value={client.monthly}
                          type="number"
                          onSave={(v) =>
                            updateClient(client.id, "monthly", Number(v))
                          }
                          prefix="$"
                          style={{
                            fontFamily: "Georgia, serif",
                            color: "var(--text)",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <select
                          value={client.status}
                          onChange={(e) =>
                            updateClient(
                              client.id,
                              "status",
                              e.target.value as ClientStatus
                            )
                          }
                          style={{
                            background:
                              statusBadgeStyle(client.status).backgroundColor,
                            color: statusBadgeStyle(client.status).color,
                            border: "none",
                            borderRadius: 20,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="churned">Churned</option>
                        </select>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "var(--muted)",
                          fontSize: 12,
                        }}
                      >
                        <input
                          type="date"
                          value={client.startDate}
                          onChange={(e) =>
                            updateClient(
                              client.id,
                              "startDate",
                              e.target.value
                            )
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--muted)",
                            fontSize: 12,
                            cursor: "pointer",
                            outline: "none",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "Georgia, serif",
                          color: "var(--text-secondary)",
                          fontSize: 13,
                        }}
                      >
                        {fmt(ltv)}
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            marginLeft: 4,
                          }}
                        >
                          {monthsActive(client.startDate)}mo
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          onClick={() => deleteClient(client.id)}
                          title="Remove client"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--muted)",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.color =
                              "#dc2626")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.color =
                              "var(--muted)")
                          }
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <td
                    colSpan={2}
                    style={{
                      padding: "10px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--muted)",
                    }}
                  >
                    Active Total
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "Georgia, serif",
                      fontWeight: 600,
                      color: "var(--accent)",
                      fontSize: 15,
                    }}
                  >
                    {fmt(totalMrr)}
                  </td>
                  <td />
                  <td />
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "Georgia, serif",
                      color: "var(--text)",
                      fontSize: 13,
                    }}
                  >
                    {fmt(
                      activeClients.reduce(
                        (s, c) => s + c.monthly * monthsActive(c.startDate),
                        0
                      )
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Cash Flow Waterfall */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--muted)",
              marginBottom: 4,
            }}
          >
            CASH FLOW WATERFALL
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            Ryan Deiss Profit First framework — click any % or spent amount to
            edit.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 12,
            color: "var(--muted)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            {fmt(totalMrr)} Revenue
          </span>
          {data.waterfall.buckets.map((b) => (
            <span
              key={b.key}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <span>→</span>
              <span>
                {b.label} ({b.pct}%)
              </span>
            </span>
          ))}
          {totalBucketPct !== 100 && (
            <span style={{ color: "#f59e0b", marginLeft: 8, fontSize: 11 }}>
              ⚠ Buckets sum to {totalBucketPct}% (should be 100%)
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
            gap: 10,
          }}
        >
          {data.waterfall.buckets.map((bucket) => {
            const allocated = Math.round((totalMrr * bucket.pct) / 100);
            const remaining = allocated - bucket.spent;
            const barColor = bucketBarColor(allocated, bucket.spent);
            const spentRatio =
              allocated > 0 ? (bucket.spent / allocated) * 100 : 0;
            return (
              <div
                key={bucket.key}
                className="card"
                style={{ padding: "16px 18px", borderTop: `3px solid ${barColor}` }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--muted)",
                    }}
                  >
                    {bucket.label}
                  </p>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    <EditCell
                      value={bucket.pct}
                      type="number"
                      suffix="%"
                      onSave={(v) =>
                        updateBucket(bucket.key, "pct", Number(v))
                      }
                      style={{
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    />
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 300,
                    color: "var(--text)",
                    fontFamily: "Georgia, serif",
                    marginBottom: 2,
                  }}
                >
                  {fmt(allocated)}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 10,
                  }}
                >
                  allocated this month
                </p>
                <div
                  style={{
                    width: "100%",
                    height: 5,
                    backgroundColor: "var(--border)",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, spentRatio)}%`,
                      backgroundColor: barColor,
                      borderRadius: 4,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>
                    Spent:{" "}
                    <EditCell
                      value={bucket.spent}
                      type="number"
                      onSave={(v) =>
                        updateBucket(bucket.key, "spent", Number(v))
                      }
                      prefix="$"
                      style={{ color: barColor, fontWeight: 600 }}
                    />
                  </span>
                  <span
                    style={{
                      color: remaining < 0 ? "#dc2626" : "var(--muted)",
                      fontWeight: remaining < 0 ? 600 : 400,
                    }}
                  >
                    {remaining >= 0
                      ? fmt(remaining) + " left"
                      : "OVER " + fmt(Math.abs(remaining))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onAdd={addClient}
          onClose={() => setShowAddClient(false)}
        />
      )}
    </div>
  );
}
