"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { DarkModeToggle } from "./DarkModeToggle";

type NavItem = { href: string; label: string; icon: string };
type NavSection = { id: string; label: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    id: "bridge",
    label: "Bridge",
    items: [
      { href: "/", label: "Dashboard", icon: "⌘" },
    ],
  },
  {
    id: "growth",
    label: "Growth Engine",
    items: [
      { href: "/growth", label: "Funnel Overview", icon: "◎" },
      { href: "/growth/awareness", label: "Awareness", icon: "◦" },
      { href: "/growth/capture", label: "Capture", icon: "◦" },
      { href: "/growth/webinar", label: "Webinar", icon: "◦" },
      { href: "/growth/crm", label: "CRM", icon: "◦" },
      { href: "/growth/nurture", label: "Nurture", icon: "◦" },
      { href: "/growth/setter", label: "Setter", icon: "◦" },
      { href: "/growth/close", label: "Close", icon: "◦" },
      { href: "/growth/handoff", label: "Handoff", icon: "◦" },
    ],
  },
  {
    id: "deliver",
    label: "Fulfillment Engine",
    items: [
      { href: "/deliver", label: "Clients", icon: "◈" },
      { href: "/deliver/launch", label: "Launch Board", icon: "◆" },
      { href: "/deliver/builds", label: "Builds", icon: "◆" },
      { href: "/deliver/coaching", label: "Coaching", icon: "◇" },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      { href: "/team", label: "Overview", icon: "◎" },
      { href: "/team/tracking", label: "Daily Tracking", icon: "◦" },
      { href: "/team/scorecard", label: "Scorecard", icon: "◦" },
      { href: "/team/reviews", label: "Reviews", icon: "◦" },
      { href: "/team/policies", label: "Policies", icon: "◦" },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      { href: "/money", label: "Revenue", icon: "◎" },
      { href: "/money/commission", label: "Commission", icon: "◦" },
      { href: "/money/invoices", label: "Invoices", icon: "◦" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    items: [
      { href: "/content", label: "Content OS", icon: "◦" },
      { href: "/ads", label: "Ad Performance", icon: "◦" },
      { href: "/analytics", label: "Analytics", icon: "◦" },
      { href: "/advisor", label: "AI Advisor", icon: "◦" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)" }}
          >
            H
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Health Pro CEO</div>
            <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--success)" }} />
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.id}>
            {idx > 0 && (
              <div className="my-3 border-t" style={{ borderColor: "var(--border-subtle)" }} />
            )}
            <div
              className="px-4 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {section.label}
            </div>
            <div className="space-y-0.5 mt-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const isStageItem = section.id === "growth" && item.href !== "/growth";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: active ? "var(--accent-bg)" : "transparent",
                      color: active ? "var(--accent-text)" : "var(--text-secondary)",
                      fontWeight: active ? "500" : "400",
                      fontSize: isStageItem ? "0.8rem" : "0.875rem",
                      paddingLeft: isStageItem ? "2rem" : undefined,
                      minHeight: isStageItem ? "36px" : "44px",
                      paddingTop: isStageItem ? "0.375rem" : "0.5rem",
                      paddingBottom: isStageItem ? "0.375rem" : "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: isStageItem ? "10px" : "15px", opacity: 0.65 }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Admin View
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Command Center v3.0
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
