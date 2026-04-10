"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import type { HpcRole } from "@/lib/types";
import { isAdminRole } from "@/lib/types";

const ALL_ROLES: { id: HpcRole; label: string; dept: string }[] = [
  { id: "ceo", label: "CEO", dept: "Leadership" },
  { id: "ops_manager", label: "Operations Manager", dept: "Leadership" },
  { id: "marketing_lead", label: "Marketing Lead", dept: "Marketing" },
  { id: "content_editor", label: "Content Editor", dept: "Marketing" },
  { id: "appointment_setter", label: "Appointment Setter", dept: "Sales" },
  { id: "sales_closer", label: "Sales Closer", dept: "Sales" },
  { id: "ai_tech_specialist", label: "AI & Tech Specialist", dept: "Fulfillment" },
  { id: "csm_lead_coach", label: "CSM / Lead Coach", dept: "Fulfillment" },
  { id: "bookkeeper", label: "Bookkeeper / Finance", dept: "Finance" },
];

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
        style={{
          backgroundColor: isAdminRole(role) ? "var(--accent)" : "var(--warning, #BA7517)",
          color: "#fff",
          border: "2px solid var(--surface)",
        }}
        title="Switch role view"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-12 right-0 w-64 rounded-xl shadow-xl overflow-hidden z-50"
            style={{ backgroundColor: "var(--surface)", border: "0.5px solid var(--border)" }}
          >
            <div className="px-3 py-2" style={{ borderBottom: "0.5px solid var(--border-subtle)", backgroundColor: "var(--bg)" }}>
              <div className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--muted)" }}>
                View as role
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {ALL_ROLES.map((r) => {
                const active = role === r.id;
                const admin = isAdminRole(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id); setOpen(false); }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 transition-all"
                    style={{
                      backgroundColor: active ? "var(--accent-bg)" : "transparent",
                      color: active ? "var(--accent-text)" : "var(--text-secondary)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: admin ? "var(--accent)" : "var(--warning, #BA7517)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate">{r.label}</div>
                      <div className="text-[9px]" style={{ color: "var(--muted)" }}>
                        {r.dept}{admin ? " · Admin" : ""}
                      </div>
                    </div>
                    {active && <span className="text-[10px]" style={{ color: "var(--accent)" }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
