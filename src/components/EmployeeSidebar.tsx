"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRole } from "@/lib/role-context";
import { ROLE_STAGES } from "@/lib/types";
import { DarkModeToggle } from "./DarkModeToggle";

type NavItem = { href: string; label: string; icon: string };

const ROLE_LABELS: Record<string, string> = {
  marketing_lead: "Marketing Lead",
  content_editor: "Content Editor",
  appointment_setter: "Appointment Setter",
  sales_closer: "Sales Closer",
  ai_tech_specialist: "AI & Tech Specialist",
  csm_lead_coach: "CSM / Lead Coach",
  bookkeeper: "Bookkeeper",
};

const STAGE_LABELS: Record<string, string> = {
  awareness: "Awareness",
  capture: "Capture",
  webinar: "Webinar",
  crm: "CRM",
  nurture: "Nurture",
  setter: "Setter",
  close: "Close",
  handoff: "Handoff",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function EmployeeSidebar() {
  const pathname = usePathname();
  const { role, memberName } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Build playbook links based on role's Growth Engine stages
  const stages = ROLE_STAGES[role] ?? [];
  const playbookItems: NavItem[] = stages
    .filter((s) => s !== "all")
    .map((s) => ({
      href: `/growth/${s}`,
      label: STAGE_LABELS[s] ?? s,
      icon: "◦",
    }));

  const coreItems: NavItem[] = [
    { href: "/", label: "My Day", icon: "⌘" },
    { href: "/work", label: "My Work", icon: "◈" },
    { href: "/numbers", label: "My Numbers", icon: "◎" },
  ];

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {(memberName || ROLE_LABELS[role] || "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {memberName || "Team Member"}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {ROLE_LABELS[role] ?? role}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Core */}
        <div className="space-y-0.5">
          {coreItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 rounded-xl transition-all min-h-[44px]"
                style={{
                  backgroundColor: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--accent-text)" : "var(--text-secondary)",
                  fontWeight: active ? "500" : "500",
                  fontSize: "0.9rem",
                  paddingTop: "0.625rem",
                  paddingBottom: "0.625rem",
                }}
              >
                <span style={{ fontSize: "17px", opacity: 0.75 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Playbook — Growth Engine stages for this role */}
        {playbookItems.length > 0 && (
          <>
            <div className="my-3 border-t" style={{ borderColor: "var(--border-subtle)" }} />
            <div
              className="px-4 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Playbook
            </div>
            <div className="space-y-0.5 mt-0.5">
              {playbookItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 rounded-xl transition-all min-h-[40px]"
                    style={{
                      backgroundColor: active ? "var(--accent-bg)" : "transparent",
                      color: active ? "var(--accent-text)" : "var(--text-secondary)",
                      fontWeight: active ? "500" : "400",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ fontSize: "10px", opacity: 0.65 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Health Pro CEO
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Team View
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 border-r transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 flex-col z-10 border-r"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
