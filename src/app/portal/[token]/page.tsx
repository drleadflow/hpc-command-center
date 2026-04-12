"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

/* ── Types ── */
interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  reach: number;
}

interface DailySpend {
  date: string;
  spend: number;
  leads: number;
}

interface WorkbookModule {
  id: string;
  moduleId: string;
  moduleName: string;
  status: "completed" | "in_progress" | "not_started";
  progress: number;
  lastActivity?: string;
}

interface WorkbookData {
  workbookUrl: string;
  clinicAppUrl: string;
  modules: WorkbookModule[];
  overallProgress: number;
  lastLogin?: string;
}

interface PortalData {
  clientName: string;
  accountId: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  leads: number;
  cpl: number;
  campaigns: Campaign[];
  dailySpend: DailySpend[];
  workbook?: WorkbookData;
  generatedAt: string;
  expiresAt: string;
}

type TabId = "performance" | "workbook" | "resources";

/* ── Helpers ── */
const fmt$ = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v);

const fmtN = (v: number) => new Intl.NumberFormat("en-US").format(v);

const fmtPct = (v: number) => `${v.toFixed(2)}%`;

const shortDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

import { timeAgo } from "@/lib/hooks";

/* ── Styles (self-contained, no CSS vars) ── */
const S = {
  page: {
    minHeight: "100vh",
    background: "#f8f9fb",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1a1d23",
  } as React.CSSProperties,

  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e8eaed",
    padding: "0 24px",
  } as React.CSSProperties,

  headerInner: {
    maxWidth: 960,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
  } as React.CSSProperties,

  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  } as React.CSSProperties,

  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "-0.5px",
  } as React.CSSProperties,

  logoText: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1d23",
    letterSpacing: "-0.3px",
  } as React.CSSProperties,

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  } as React.CSSProperties,

  content: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 24px 64px",
  } as React.CSSProperties,

  clientHeader: {
    marginBottom: 28,
  } as React.CSSProperties,

  clientName: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1a1d23",
    letterSpacing: "-0.5px",
    marginBottom: 4,
  } as React.CSSProperties,

  clientSub: {
    fontSize: 13,
    color: "#6b7280",
  } as React.CSSProperties,

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 24,
  } as React.CSSProperties,

  statCard: {
    background: "#ffffff",
    border: "1px solid #e8eaed",
    borderRadius: 12,
    padding: "18px 20px",
  } as React.CSSProperties,

  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 6,
  } as React.CSSProperties,

  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1d23",
    letterSpacing: "-0.5px",
  } as React.CSSProperties,

  statSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 3,
  } as React.CSSProperties,

  card: {
    background: "#ffffff",
    border: "1px solid #e8eaed",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  } as React.CSSProperties,

  cardHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e8eaed",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1d23",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  } as React.CSSProperties,

  th: {
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 600,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    background: "#f8f9fb",
    borderBottom: "1px solid #e8eaed",
  } as React.CSSProperties,

  td: {
    padding: "13px 16px",
    fontSize: 13,
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
  } as React.CSSProperties,

  footer: {
    textAlign: "center" as const,
    padding: "24px",
    fontSize: 12,
    color: "#9ca3af",
    borderTop: "1px solid #e8eaed",
    background: "#ffffff",
    marginTop: 40,
  } as React.CSSProperties,

  tabBar: {
    display: "flex",
    gap: 2,
    background: "#f3f4f6",
    borderRadius: 10,
    padding: 4,
    marginBottom: 28,
  } as React.CSSProperties,

  tab: {
    flex: 1,
    padding: "8px 16px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "#6b7280",
    transition: "all 0.15s",
  } as React.CSSProperties,

  tabActive: {
    background: "#ffffff",
    color: "#1a1d23",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    fontWeight: 600,
  } as React.CSSProperties,
};

/* ── Stat Card ── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={S.statCard}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      style={{
        ...S.badge,
        background: isActive ? "#ede9fe" : "#f3f4f6",
        color: isActive ? "#6d28d9" : "#6b7280",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isActive ? "#7c3aed" : "#9ca3af",
          display: "inline-block",
        }}
      />
      {isActive ? "Active" : "Paused"}
    </span>
  );
}

/* ── Spend Chart ── */
function SpendChart({ data }: { data: DailySpend[] }) {
  if (data.length === 0) return null;
  const maxSpend = Math.max(...data.map(d => d.spend), 1);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div style={S.cardTitle}>Daily Spend — Last 14 Days</div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Hover bars for detail</div>
      </div>
      <div style={{ padding: "20px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
          {data.map(d => {
            const pct = (d.spend / maxSpend) * 100;
            return (
              <div
                key={d.date}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}
              >
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(pct, 3)}%`,
                      background: "linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)",
                      borderRadius: "3px 3px 0 0",
                      cursor: "default",
                      minHeight: 3,
                    }}
                    title={`${shortDate(d.date)}: ${fmt$(d.spend)}${d.leads > 0 ? ` · ${d.leads} leads` : ""}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {data.map((d, i) => (
            <div
              key={d.date}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 9,
                color: "#9ca3af",
                overflow: "hidden",
              }}
            >
              {i % 3 === 0 ? shortDate(d.date) : ""}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#9ca3af" }}>
          <span>$0</span>
          <span>{fmt$(maxSpend)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Campaign Table ── */
function CampaignTable({ campaigns, title }: { campaigns: Campaign[]; title: string }) {
  if (campaigns.length === 0) return null;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div style={S.cardTitle}>
          {title} <span style={{ color: "#9ca3af", fontWeight: 400 }}>({campaigns.length})</span>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Campaign", "Status", "Spend", "Leads", "CPL", "CTR"].map(h => (
                <th
                  key={h}
                  style={{ ...S.th, textAlign: h === "Campaign" ? "left" : "right" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td style={{ ...S.td, maxWidth: 280, fontWeight: 500, color: "#1a1d23" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                </td>
                <td style={{ ...S.td, textAlign: "right" }}>
                  <StatusBadge status={c.status} />
                </td>
                <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {fmt$(c.spend)}
                </td>
                <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {c.leads > 0 ? fmtN(c.leads) : <span style={{ color: "#9ca3af" }}>—</span>}
                </td>
                <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {c.cpl > 0 ? fmt$(c.cpl) : <span style={{ color: "#9ca3af" }}>—</span>}
                </td>
                <td style={{ ...S.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {fmtPct(c.ctr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Workbook Status Badge ── */
function WorkbookStatusBadge({ status }: { status: WorkbookModule["status"] }) {
  const map = {
    completed: { bg: "#dcfce7", color: "#15803d", label: "Completed", dot: "#16a34a" },
    in_progress: { bg: "#ede9fe", color: "#6d28d9", label: "In Progress", dot: "#7c3aed" },
    not_started: { bg: "#f3f4f6", color: "#6b7280", label: "Not Started", dot: "#9ca3af" },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        color: s.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

/* ── Progress Bar ── */
function ProgressBar({ value, height = 6 }: { value: number; height?: number }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#f3f4f6",
        borderRadius: height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: "100%",
          background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
          borderRadius: height,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

/* ── Progress Ring ── */
function ProgressRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Workbook Progress Tab ── */
function WorkbookProgressTab({ workbook, clientName }: { workbook: WorkbookData; clientName: string }) {
  return (
    <div>
      {/* Overall progress hero */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e8eaed",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing value={workbook.overallProgress} size={88} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23", lineHeight: 1 }}>
              {workbook.overallProgress}%
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1d23", marginBottom: 4 }}>
            Client OS Progress
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            {workbook.modules.filter(m => m.status === "completed").length} of{" "}
            {workbook.modules.length} modules completed
          </div>
          <ProgressBar value={workbook.overallProgress} height={8} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href={`${workbook.workbookUrl}/login`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open Workbook ↗
          </a>
          <a
            href={workbook.clinicAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              background: "#f3f4f6",
              color: "#374151",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Clinic App ↗
          </a>
        </div>
      </div>

      {/* Module cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {workbook.modules.map((mod, i) => (
          <div
            key={mod.moduleId}
            style={{
              background: "#ffffff",
              border: "1px solid #e8eaed",
              borderRadius: 12,
              padding: "18px 20px",
              cursor: "default",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", lineHeight: 1.3 }}>
                  {mod.moduleName}
                </div>
              </div>
              <WorkbookStatusBadge status={mod.status} />
            </div>
            <ProgressBar value={mod.progress} height={5} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                {mod.lastActivity ? `Last active ${mod.lastActivity}` : "Not started yet"}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1" }}>
                {mod.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Resources Tab ── */
function ResourcesTab({ workbook, clientName }: { workbook: WorkbookData; clientName: string }) {
  const resources = [
    {
      title: "Client OS Workbook",
      description: "Your step-by-step playbook for building a lead-generating medical clinic. Access all 8 modules, track progress, and follow proven frameworks.",
      url: `${workbook.workbookUrl}/login`,
      icon: "📖",
      cta: "Open Workbook",
      accent: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    },
    {
      title: "Clinic Project App",
      description: "Track your clinic's project milestones, tasks, and implementation status in real-time alongside your campaigns.",
      url: workbook.clinicAppUrl,
      icon: "🏥",
      cta: "Open Clinic App",
      accent: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, fontSize: 14, color: "#6b7280" }}>
        Quick access to all your {clientName} resources and tools.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 28 }}>
        {resources.map(r => (
          <div
            key={r.url}
            style={{
              background: "#ffffff",
              border: "1px solid #e8eaed",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div style={{ height: 6, background: r.accent }} />
            <div style={{ padding: "22px 22px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{r.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23", marginBottom: 6 }}>
                {r.title}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 18 }}>
                {r.description}
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  background: r.accent,
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {r.cta} ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded iframe with fallback */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div style={S.cardTitle}>Workbook Preview</div>
          <a
            href={`${workbook.workbookUrl}/login`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: "#6366f1", textDecoration: "none", fontWeight: 500 }}
          >
            Open in new tab ↗
          </a>
        </div>
        <div style={{ position: "relative", height: 420 }}>
          <iframe
            src={`${workbook.workbookUrl}/login`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            title="Client Workbook"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          {/* Fallback overlay — shown via CSS if iframe fails to load */}
          <noscript>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8f9fb",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 32 }}>🔒</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>
                Preview unavailable — the site blocks embedding.
              </div>
              <a
                href={`${workbook.workbookUrl}/login`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 16px",
                  background: "#6366f1",
                  color: "#fff",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Open directly
              </a>
            </div>
          </noscript>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function PortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("performance");

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Invalid or expired link");
        return json;
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={S.page}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #e8eaed",
              borderTopColor: "#6366f1",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ fontSize: 14, color: "#6b7280" }}>Loading your report...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={S.page}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #fecaca",
              borderRadius: 16,
              padding: 40,
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23", marginBottom: 8 }}>
              Link Not Found
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              {error === "Invalid or expired portal link"
                ? "This link has expired or is no longer valid. Please contact Dr. Lead Flow for a new report link."
                : error}
            </div>
            <div
              style={{
                marginTop: 24,
                padding: "12px 20px",
                background: "#f8f9fb",
                borderRadius: 8,
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              Need help? Email us at hello@drleadflow.com
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeCampaigns = data.campaigns.filter(c => c.status === "ACTIVE");
  const pausedCampaigns = data.campaigns.filter(c => c.status === "PAUSED");

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>DLF</div>
            <div style={S.logoText}>Dr. Lead Flow</div>
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Powered by Dr. Lead Flow
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={S.content}>

        {/* ── Client Header ── */}
        <div style={{ ...S.clientHeader, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={S.clientName}>{data.clientName}</div>
            <div style={S.clientSub}>Client Dashboard · Dr. Lead Flow</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <StatusBadge status={activeCampaigns.length > 0 ? "ACTIVE" : "PAUSED"} />
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              Last updated {timeAgo(data.generatedAt)}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div style={S.tabBar}>
          {(["performance", "workbook", "resources"] as TabId[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...S.tab,
                ...(activeTab === tab ? S.tabActive : {}),
              }}
            >
              {tab === "performance" && "Performance"}
              {tab === "workbook" && "Workbook Progress"}
              {tab === "resources" && "Resources"}
            </button>
          ))}
        </div>

        {/* ── Performance Tab ── */}
        {activeTab === "performance" && (
          <>
            {/* Stats Grid */}
            <div style={S.statsGrid}>
              <StatCard label="Total Spend" value={fmt$(data.spend)} sub="Last 30 days" />
              <StatCard label="Total Leads" value={fmtN(data.leads)} sub="All campaigns" />
              <StatCard
                label="Cost Per Lead"
                value={data.cpl > 0 ? fmt$(data.cpl) : "—"}
                sub={data.leads > 0 ? `${data.leads} leads generated` : "No leads yet"}
              />
              <StatCard label="CTR" value={fmtPct(data.ctr)} sub="Click-through rate" />
              <StatCard label="Impressions" value={fmtN(data.impressions)} sub="Total views" />
              <StatCard label="Reach" value={fmtN(data.reach)} sub="Unique people reached" />
            </div>

            {/* Daily Spend Chart */}
            <SpendChart data={data.dailySpend} />

            {/* Campaign Tables */}
            <CampaignTable campaigns={activeCampaigns} title="Active Campaigns" />
            <CampaignTable campaigns={pausedCampaigns} title="Paused Campaigns" />

            {/* Empty state */}
            {data.campaigns.length === 0 && (
              <div
                style={{
                  ...S.card,
                  padding: 48,
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 14,
                }}
              >
                No campaigns found for this account.
              </div>
            )}
          </>
        )}

        {/* ── Workbook Tab ── */}
        {activeTab === "workbook" && (
          data.workbook ? (
            <WorkbookProgressTab workbook={data.workbook} clientName={data.clientName} />
          ) : (
            <div style={{ ...S.card, padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              Workbook data is not yet available for this account.
            </div>
          )
        )}

        {/* ── Resources Tab ── */}
        {activeTab === "resources" && (
          data.workbook ? (
            <ResourcesTab workbook={data.workbook} clientName={data.clientName} />
          ) : (
            <div style={{ ...S.card, padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
              No resources configured for this account.
            </div>
          )
        )}

        {/* ── Expiry notice ── */}
        <div
          style={{
            marginTop: 32,
            padding: "14px 20px",
            background: "#fefce8",
            border: "1px solid #fde68a",
            borderRadius: 10,
            fontSize: 12,
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>&#128274;</span>
          This report link expires on{" "}
          {new Date(data.expiresAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          . Contact Dr. Lead Flow for a renewed link.
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={S.footer}>
        <div style={{ marginBottom: 4 }}>
          Confidential — prepared exclusively for {data.clientName}
        </div>
        <div>
          &copy; {new Date().getFullYear()} Dr. Lead Flow &mdash; All rights reserved
        </div>
      </footer>
    </div>
  );
}
