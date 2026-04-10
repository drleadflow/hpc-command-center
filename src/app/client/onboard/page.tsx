"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type ClientInfo = {
  name: string;
  website: string;
  tier: "$997 Coaching" | "$20K Agency" | "";
  email: string;
};

type AuditResult = {
  practiceType: string;
  services: string[];
  teamSize: string;
  bookingSystem: string;
  ctaAnalysis: string;
  trustSignals: string[];
  messagingAnalysis: string;
  marketingSignals: string[];
  socialLinks: Record<string, string>;
  opportunities: string[];
};

type ChecklistItem = {
  id: number;
  label: string;
  category: string;
};

// ── Checklist data ─────────────────────────────────────────────────────────────

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Account Setup
  { id: 1, label: "Create GHL sub-account", category: "Account Setup" },
  { id: 2, label: "Configure GHL pipeline stages", category: "Account Setup" },
  { id: 3, label: "Set up appointment calendar", category: "Account Setup" },
  { id: 4, label: "Import client contacts", category: "Account Setup" },
  { id: 5, label: "Configure email/SMS templates", category: "Account Setup" },
  // Ad Account
  { id: 6, label: "Get Meta ad account access", category: "Ad Account" },
  { id: 7, label: "Verify pixel installation", category: "Ad Account" },
  { id: 8, label: "Review existing campaigns", category: "Ad Account" },
  { id: 9, label: "Set up conversion tracking", category: "Ad Account" },
  { id: 10, label: "Create lookalike audiences", category: "Ad Account" },
  // Creative Assets
  { id: 11, label: "Collect brand guidelines (colors, fonts, logo)", category: "Creative Assets" },
  { id: 12, label: "Gather client testimonials", category: "Creative Assets" },
  { id: 13, label: "Collect before/after photos (if applicable)", category: "Creative Assets" },
  { id: 14, label: "Create initial ad creative set", category: "Creative Assets" },
  { id: 15, label: "Write initial ad copy variants", category: "Creative Assets" },
  // Campaign Setup
  { id: 16, label: "Build landing page", category: "Campaign Setup" },
  { id: 17, label: "QA landing page (mobile + desktop)", category: "Campaign Setup" },
  { id: 18, label: "Create lead magnet/offer", category: "Campaign Setup" },
  { id: 19, label: "Set up thank you page", category: "Campaign Setup" },
  { id: 20, label: "Configure form/funnel tracking", category: "Campaign Setup" },
  // Launch Prep
  { id: 21, label: "Set monthly budget with client", category: "Launch Prep" },
  { id: 22, label: "Define KPI targets (CPL, lead volume)", category: "Launch Prep" },
  { id: 23, label: "Create reporting template", category: "Launch Prep" },
  { id: 24, label: "Schedule kickoff call", category: "Launch Prep" },
  { id: 25, label: "Send welcome email", category: "Launch Prep" },
  // Post-Launch
  { id: 26, label: "Launch campaigns (PAUSED for review)", category: "Post-Launch" },
  { id: 27, label: "Client approval to go live", category: "Post-Launch" },
  { id: 28, label: "Monitor first 48 hours", category: "Post-Launch" },
  { id: 29, label: "Send 7-day performance report", category: "Post-Launch" },
  { id: 30, label: "Schedule 30-day review", category: "Post-Launch" },
];

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Client Info" },
    { n: 2, label: "Website Audit" },
    { n: 3, label: "Checklist" },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
              style={{
                backgroundColor: current === s.n ? "var(--accent)" : current > s.n ? "#059669" : "var(--bg)",
                color: current >= s.n ? "white" : "var(--muted)",
                border: current < s.n ? "1px solid var(--border)" : "none",
              }}
            >
              {current > s.n ? "✓" : s.n}
            </div>
            <span
              className="text-sm font-medium hidden sm:block"
              style={{ color: current === s.n ? "var(--text)" : "var(--muted)" }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-12 h-px mx-3"
              style={{ backgroundColor: current > s.n ? "#059669" : "var(--border)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Client Info ────────────────────────────────────────────────────────

function Step1({
  info,
  onChange,
  onNext,
}: {
  info: ClientInfo;
  onChange: (f: Partial<ClientInfo>) => void;
  onNext: () => void;
}) {
  const valid = info.name.trim() && info.website.trim() && info.tier && info.email.trim();

  return (
    <div className="card p-8 space-y-6 max-w-xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
          STEP 1 OF 3
        </p>
        <h2 className="text-2xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Client Information
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Enter the new client's basic details to get started.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--muted)" }}>
            Client Name
          </label>
          <input
            type="text"
            value={info.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Vitality Med Spa"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--muted)" }}>
            Website URL
          </label>
          <input
            type="url"
            value={info.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://example.com"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--muted)" }}>
            Client Tier
          </label>
          <select
            value={info.tier}
            onChange={(e) => onChange({ tier: e.target.value as ClientInfo["tier"] })}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors appearance-none"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: info.tier ? "var(--text)" : "var(--muted)",
            }}
          >
            <option value="" disabled>Select tier...</option>
            <option value="$997 Coaching">$997 Coaching</option>
            <option value="$20K Agency">$20K Agency</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--muted)" }}>
            Primary Contact Email
          </label>
          <input
            type="email"
            value={info.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="contact@example.com"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--accent)",
          color: "white",
        }}
      >
        Next: Run Website Audit
      </button>
    </div>
  );
}

// ── Step 2: Website Audit ──────────────────────────────────────────────────────

function Step2({
  info,
  auditResult,
  auditLoading,
  auditError,
  onNext,
}: {
  info: ClientInfo;
  auditResult: AuditResult | null;
  auditLoading: boolean;
  auditError: string | null;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
          STEP 2 OF 3
        </p>
        <h2 className="text-2xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Website Audit
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Analyzing <span style={{ color: "var(--accent)" }}>{info.website}</span>
        </p>
      </div>

      {auditLoading && (
        <div className="card p-10 flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Running website audit…</p>
        </div>
      )}

      {auditError && !auditLoading && (
        <div className="card p-6">
          <p className="text-sm mb-1 font-medium" style={{ color: "#b91c1c" }}>Audit failed</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{auditError}</p>
          <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
            You can still proceed to the checklist — the audit results will be empty.
          </p>
        </div>
      )}

      {auditResult && !auditLoading && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Practice Type", value: auditResult.practiceType },
              { label: "Team Size", value: auditResult.teamSize },
              { label: "Booking System", value: auditResult.bookingSystem },
            ].map((m) => (
              <div key={m.label} className="card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
                  {m.label}
                </div>
                <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{m.value || "—"}</div>
              </div>
            ))}
          </div>

          {/* Services */}
          {auditResult.services.length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                SERVICES DETECTED
              </p>
              <div className="flex flex-wrap gap-2">
                {auditResult.services.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA Analysis */}
          {auditResult.ctaAnalysis && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                CTA ANALYSIS
              </p>
              <p className="text-sm" style={{ color: "var(--text)" }}>{auditResult.ctaAnalysis}</p>
            </div>
          )}

          {/* Trust signals */}
          {auditResult.trustSignals.length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                TRUST SIGNALS
              </p>
              <ul className="space-y-1.5">
                {auditResult.trustSignals.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                    <span style={{ color: "#059669" }}>✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messaging analysis */}
          {auditResult.messagingAnalysis && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                MESSAGING ANALYSIS
              </p>
              <p className="text-sm" style={{ color: "var(--text)" }}>{auditResult.messagingAnalysis}</p>
            </div>
          )}

          {/* Marketing signals */}
          {auditResult.marketingSignals.length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                MARKETING SIGNALS
              </p>
              <div className="flex flex-wrap gap-2">
                {auditResult.marketingSignals.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social links */}
          {Object.keys(auditResult.socialLinks).length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                SOCIAL MEDIA
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(auditResult.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-xl border transition-opacity hover:opacity-70"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--accent)",
                    }}
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {auditResult.opportunities.length > 0 && (
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
                OPPORTUNITIES
              </p>
              <ul className="space-y-2">
                {auditResult.opportunities.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span> {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={auditLoading}
        className="px-8 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--accent)",
          color: "white",
        }}
      >
        Next: Onboarding Checklist
      </button>
    </div>
  );
}

// ── Step 3: Checklist ──────────────────────────────────────────────────────────

function Step3({
  checked,
  onToggle,
  onComplete,
}: {
  checked: Set<number>;
  onToggle: (id: number) => void;
  onComplete: () => void;
}) {
  const total = CHECKLIST_ITEMS.length;
  const done = checked.size;
  const pct = Math.round((done / total) * 100);

  const categories = Array.from(new Set(CHECKLIST_ITEMS.map((i) => i.category)));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
            STEP 3 OF 3
          </p>
          <h2 className="text-2xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
            Onboarding Checklist
          </h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-serif" style={{ color: done === total ? "#059669" : "var(--text)", fontWeight: 300 }}>
            {done}/{total}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: done === total ? "#059669" : "var(--accent)" }}
        />
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = CHECKLIST_ITEMS.filter((i) => i.category === cat);
          const catDone = items.filter((i) => checked.has(i.id)).length;
          return (
            <div key={cat} className="card overflow-hidden">
              <div
                className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  {cat}
                </p>
                <span
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: catDone === items.length ? "#dcfce7" : "var(--surface)",
                    color: catDone === items.length ? "#059669" : "var(--muted)",
                  }}
                >
                  {catDone}/{items.length}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:opacity-80"
                    style={{ backgroundColor: checked.has(item.id) ? "var(--accent-bg)" : "var(--surface)" }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                      style={{
                        backgroundColor: checked.has(item.id) ? "var(--accent)" : "var(--bg)",
                        border: checked.has(item.id) ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {checked.has(item.id) && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked.has(item.id)}
                      onChange={() => onToggle(item.id)}
                      className="sr-only"
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: checked.has(item.id) ? "var(--accent-text)" : "var(--text)",
                        textDecoration: checked.has(item.id) ? "line-through" : "none",
                        opacity: checked.has(item.id) ? 0.7 : 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          backgroundColor: done === total ? "#059669" : "var(--accent)",
          color: "white",
        }}
      >
        {done === total ? "Onboarding Complete!" : `Complete Onboarding (${done}/${total} done)`}
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [info, setInfo] = useState<ClientInfo>({ name: "", website: "", tier: "", email: "" });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);

  const handleStep1Next = async () => {
    setStep(2);
    setAuditLoading(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const res = await fetch("/api/client/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: info.website }),
      });
      if (!res.ok) throw new Error(`Audit API returned ${res.status}`);
      const data = await res.json();
      setAuditResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setAuditError(msg);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          OPERATIONS
        </p>
        <h1 className="text-3xl font-serif" style={{ color: "var(--text)", fontWeight: 400 }}>
          Client Onboarding
        </h1>
        {info.name && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--muted)" }}>Client:</span>
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent-text)" }}
            >
              {info.name}
            </span>
            {info.tier && (
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                {info.tier}
              </span>
            )}
          </div>
        )}
      </div>

      {completed ? (
        <div className="card p-12 max-w-xl text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h2 className="text-2xl font-serif" style={{ color: "#059669", fontWeight: 400 }}>
            Onboarding Complete
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            <strong style={{ color: "var(--text)" }}>{info.name}</strong> has been fully onboarded.{" "}
            {checked.size}/{CHECKLIST_ITEMS.length} checklist items completed.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setInfo({ name: "", website: "", tier: "", email: "" });
              setAuditResult(null);
              setAuditError(null);
              setChecked(new Set());
              setCompleted(false);
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            Onboard Another Client
          </button>
        </div>
      ) : (
        <>
          <StepIndicator current={step} />

          {step === 1 && (
            <Step1
              info={info}
              onChange={(f) => setInfo((p) => ({ ...p, ...f }))}
              onNext={handleStep1Next}
            />
          )}

          {step === 2 && (
            <Step2
              info={info}
              auditResult={auditResult}
              auditLoading={auditLoading}
              auditError={auditError}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Step3
              checked={checked}
              onToggle={handleToggle}
              onComplete={handleComplete}
            />
          )}
        </>
      )}
    </div>
  );
}
