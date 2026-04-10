"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/use-store";
import type { StoredSettings } from "@/lib/store";

const DEFAULT_SETTINGS: StoredSettings = {};

interface FieldConfig {
  key: keyof StoredSettings;
  label: string;
  placeholder: string;
  type?: "text" | "password";
  help?: string;
}

const SECTIONS: { title: string; description: string; icon: string; fields: FieldConfig[] }[] = [
  {
    title: "GoHighLevel (GHL)",
    description: "CRM, pipeline, automations, daily tracking forms",
    icon: "⚡",
    fields: [
      { key: "ghlApiKey", label: "API Key", placeholder: "Bearer eyJ...", type: "password", help: "From GHL Settings → API Keys" },
      { key: "ghlLocationId", label: "Location ID", placeholder: "loc_abc123...", help: "Your GHL sub-account location ID" },
    ],
  },
  {
    title: "Meta Ads",
    description: "Ad performance, campaign data, CPL, ROAS",
    icon: "📈",
    fields: [
      { key: "metaToken", label: "System User Token", placeholder: "EAAPUZBNv...", type: "password", help: "Business.facebook.com → System Users → Generate Token (never expires)" },
      { key: "metaAdAccounts", label: "Ad Account IDs", placeholder: "act_123,act_456", help: "Comma-separated. Find in Meta Business Manager → Ad Accounts" },
    ],
  },
  {
    title: "Supabase",
    description: "Database for team data, tracking, clients, revenue",
    icon: "🗄️",
    fields: [
      { key: "supabaseUrl", label: "Project URL", placeholder: "https://abc.supabase.co", help: "From Supabase Dashboard → Settings → API" },
      { key: "supabaseAnonKey", label: "Anon Key", placeholder: "eyJhbGc...", type: "password", help: "Public anon key from same page" },
    ],
  },
  {
    title: "Slack",
    description: "Team notifications, alerts, content publish",
    icon: "💬",
    fields: [
      { key: "slackBotToken", label: "Bot Token", placeholder: "xoxb-...", type: "password", help: "From Slack App → OAuth & Permissions → Bot User OAuth Token" },
    ],
  },
  {
    title: "Airtable",
    description: "Content OS, outreach campaigns",
    icon: "📋",
    fields: [
      { key: "airtableApiKey", label: "Personal Access Token", placeholder: "pat...", type: "password", help: "From airtable.com/create/tokens" },
      { key: "airtableBaseId", label: "Base ID", placeholder: "app93tcET7...", help: "From Airtable URL: airtable.com/[BASE_ID]" },
    ],
  },
  {
    title: "Stripe",
    description: "Payment tracking, MRR, commission triggers",
    icon: "💳",
    fields: [
      { key: "stripeSecretKey", label: "Secret Key", placeholder: "sk_live_...", type: "password", help: "From Stripe Dashboard → Developers → API Keys" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useStore<StoredSettings>("hpc_settings" as "hpc_settings", DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const updateField = (key: keyof StoredSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const connectedCount = SECTIONS.reduce((count, section) => {
    const hasValue = section.fields.some((f) => settings[f.key]);
    return count + (hasValue ? 1 : 0);
  }, 0);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--text)" }}>Settings</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            API connections &middot; {connectedCount} / {SECTIONS.length} configured
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ backgroundColor: saved ? "var(--success)" : "var(--accent)" }}
        >
          {saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-3 gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" }}>
        {SECTIONS.map((s) => {
          const connected = s.fields.some((f) => settings[f.key]);
          return (
            <div key={s.title} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "var(--bg)" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: connected ? "var(--success)" : "var(--border)" }} />
              <span className="text-[11px]" style={{ color: connected ? "var(--text)" : "var(--muted)" }}>{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const connected = section.fields.some((f) => settings[f.key]);
          return (
            <div key={section.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                <span className="text-lg">{section.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{section.title}</div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>{section.description}</div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-sm" style={{
                  backgroundColor: connected ? "var(--success-bg, #EAF3DE)" : "var(--bg)",
                  color: connected ? "var(--success)" : "var(--muted)",
                }}>
                  {connected ? "Connected" : "Not configured"}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-3">
                {section.fields.map((field) => {
                  const isPassword = field.type === "password";
                  const showPw = showPasswords[field.key];
                  return (
                    <div key={field.key}>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
                        {field.label}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={isPassword && !showPw ? "password" : "text"}
                          value={settings[field.key] ?? ""}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }}
                        />
                        {isPassword && (
                          <button
                            onClick={() => togglePassword(field.key)}
                            className="px-2 rounded-lg text-[10px]"
                            style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--muted)" }}
                          >
                            {showPw ? "Hide" : "Show"}
                          </button>
                        )}
                      </div>
                      {field.help && (
                        <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>{field.help}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Management */}
      <div className="rounded-xl p-4 mt-4" style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}>
        <div className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Data Management</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const data = JSON.stringify(settings, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "hpc-settings.json";
              a.click();
            }}
            className="px-3 py-1.5 rounded-lg text-[11px]"
            style={{ backgroundColor: "var(--bg)", border: "0.5px solid var(--border)", color: "var(--text)" }}
          >
            Export Settings
          </button>
          <button
            onClick={() => {
              if (confirm("Clear ALL local data? This resets the dashboard to defaults.")) {
                const keys = ["hpc_team", "hpc_metrics", "hpc_clients", "hpc_builds", "hpc_commissions", "hpc_invoices", "hpc_tracking", "hpc_work_items", "hpc_kpi_values", "hpc_scorecard", "hpc_settings", "hpc_priorities"];
                keys.forEach((k) => localStorage.removeItem(k));
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-[11px]"
            style={{ backgroundColor: "var(--danger-bg, #FCEBEB)", border: "0.5px solid var(--danger)", color: "var(--danger)" }}
          >
            Reset All Data
          </button>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--muted)" }}>
          All data is stored in your browser&apos;s localStorage. Connect Supabase above to sync across devices.
        </p>
      </div>
    </div>
  );
}
