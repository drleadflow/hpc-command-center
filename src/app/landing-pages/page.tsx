"use client";

import { useState } from "react";

interface AuditResult {
  services: string[];
  ctas: string[];
  trustSignals: string[];
  opportunities: string[];
  headline?: string;
  targetAudience?: string;
}

export default function LandingPagesPage() {
  const [clientName, setClientName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [offer, setOffer] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [generatingSoon, setGeneratingSoon] = useState(false);

  const handleAudit = async () => {
    if (!websiteUrl.trim()) {
      setAuditError("Please enter a website URL.");
      return;
    }
    setAuditing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const res = await fetch("/api/client/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim(), clientName: clientName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAuditResult(data);
    } catch (err: any) {
      setAuditError(err.message || "Audit failed. Please try again.");
    } finally {
      setAuditing(false);
    }
  };

  const handleGenerate = () => {
    setGeneratingSoon(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          GROWTH
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Landing Page Builder
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Audit a client website, then generate a high-converting landing page via GHL Site Builder.
        </p>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          CLIENT INFO
        </p>

        {/* Client name */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="e.g. HealthProceo"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
            Client Website URL
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://healthproceo.com"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Offer description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
            Offer Description
          </label>
          <textarea
            value={offer}
            onChange={e => setOffer(e.target.value)}
            placeholder="Describe the offer or campaign this landing page is for..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap pt-1">
          <button
            onClick={handleAudit}
            disabled={auditing}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {auditing ? "Auditing..." : "Audit Website"}
          </button>
          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            Generate Landing Page
          </button>
        </div>

        {/* Generate placeholder message */}
        {generatingSoon && (
          <div
            className="rounded-xl px-4 py-3 text-sm border"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--muted)",
            }}
          >
            Coming soon — GHL-Site-Builder integration
          </div>
        )}
      </div>

      {/* Audit error */}
      {auditError && (
        <div
          className="card p-4 text-sm border-l-4"
          style={{ borderLeftColor: "#b91c1c", color: "#b91c1c" }}
        >
          {auditError}
        </div>
      )}

      {/* Audit loading skeleton */}
      {auditing && (
        <div className="card p-6 space-y-3">
          <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--bg)" }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 rounded animate-pulse" style={{ backgroundColor: "var(--bg)", width: `${70 + i * 5}%` }} />
          ))}
        </div>
      )}

      {/* Audit results */}
      {auditResult && (
        <div className="space-y-5">
          <div className="card p-5 border-b-0 border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
              AUDIT COMPLETE
            </p>
            {auditResult.headline && (
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{auditResult.headline}</p>
            )}
            {auditResult.targetAudience && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Target: {auditResult.targetAudience}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Services */}
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                SERVICES DETECTED
              </p>
              {auditResult.services?.length > 0 ? (
                <ul className="space-y-1.5">
                  {auditResult.services.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span style={{ color: "var(--accent)", marginTop: "2px" }}>•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>None detected</p>
              )}
            </div>

            {/* CTAs */}
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                CALLS TO ACTION
              </p>
              {auditResult.ctas?.length > 0 ? (
                <ul className="space-y-1.5">
                  {auditResult.ctas.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span style={{ color: "#059669", marginTop: "2px" }}>→</span>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>None detected</p>
              )}
            </div>

            {/* Trust signals */}
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                TRUST SIGNALS
              </p>
              {auditResult.trustSignals?.length > 0 ? (
                <ul className="space-y-1.5">
                  {auditResult.trustSignals.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span style={{ color: "#d97706", marginTop: "2px" }}>★</span>
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>None detected</p>
              )}
            </div>

            {/* Opportunities */}
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                OPPORTUNITIES
              </p>
              {auditResult.opportunities?.length > 0 ? (
                <ul className="space-y-1.5">
                  {auditResult.opportunities.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span style={{ color: "var(--accent)", marginTop: "2px" }}>+</span>
                      {o}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>No opportunities identified</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
