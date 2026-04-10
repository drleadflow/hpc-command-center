"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { DEPARTMENTS } from "@/lib/types";
import { DarkModeToggle } from "./DarkModeToggle";

type NavItem = { href: string; label: string; icon: string };
type NavSection = { id: string; label: string; items: NavItem[]; command?: boolean };

const osSubLinks: NavItem[] = [
  { href: "/os#growth", label: "Growth Engine", icon: "📈" },
  { href: "/os#fulfillment", label: "Fulfillment", icon: "🔄" },
  { href: "/os#power", label: "Power Stages", icon: "⚡" },
  { href: "/os#ops", label: "Operation Hub", icon: "🗄️" },
  { href: "/os#support", label: "Support", icon: "📂" },
  { href: "/os#canvas", label: "Team Canvas", icon: "👥" },
  { href: "/os#exits", label: "Exits", icon: "🚪" },
];

const navSections: NavSection[] = [
  {
    id: "command",
    label: "Command",
    command: true,
    items: [
      { href: "/", label: "Dashboard", icon: "⌘" },
      { href: "/scorecard", label: "Scorecard", icon: "📊" },
      { href: "/advisor", label: "Advisor", icon: "🧠" },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      { href: "/content", label: "Content OS", icon: "✍️" },
      { href: "/outreach", label: "Outreach OS", icon: "📬" },
      { href: "/ads", label: "Ad Performance", icon: "📈" },
      { href: "/ads/creative-lab", label: "Creative Lab", icon: "🎨" },
      { href: "/leads", label: "Leads & Funnel", icon: "🎯" },
      { href: "/leads-os", label: "Leads OS", icon: "👤" },
      { href: "/analytics", label: "Analytics", icon: "📊" },
      { href: "/pipeline", label: "Pipeline", icon: "🔀" },
      { href: "/webinar", label: "Webinar", icon: "🎙️" },
      { href: "/landing-pages", label: "Landing Pages", icon: "📄" },
      { href: "/thumbnails", label: "Thumbnails", icon: "🖼️" },
      { href: "/thumbnails/gallery", label: "Gallery", icon: "🗂️" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { href: "/clients", label: "Clients", icon: "🏢" },
      { href: "/client/onboard", label: "Onboarding", icon: "🚀" },
      { href: "/projects", label: "Projects", icon: "📁" },
      { href: "/tasks", label: "Tasks", icon: "✅" },
      { href: "/team", label: "Team", icon: "👥" },
      { href: "/revenue", label: "Revenue & Cash", icon: "💰" },
      { href: "/agents", label: "Agent Fleet", icon: "🤖" },
      { href: "/sprint", label: "Sprint", icon: "🏃" },
    ],
  },
];

const bottomLinks: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const deptIcons: Record<string, string> = {
  ceo: "◈",
  marketing: "◉",
  tech: "◆",
  "client-success": "◊",
  media: "▣",
};

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [osExpanded, setOsExpanded] = useState(pathname === "/os");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
            D
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Dr. Lead Flow</div>
            <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--accent)" }} />
              Active workspace
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Strategic sections */}
        {navSections.map((section, sectionIdx) => (
          <div key={section.id}>
            {/* Divider above every section except the first */}
            {sectionIdx > 0 && (
              <div className="my-3 border-t" style={{ borderColor: "var(--border-subtle)" }} />
            )}

            {/* Section label */}
            <div
              className="px-4 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {section.label}
            </div>

            {/* Section items */}
            <div className="space-y-0.5 mt-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href.startsWith("/os#") && pathname === "/os");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 rounded-xl transition-all min-h-[44px]"
                    style={{
                      backgroundColor: active ? "var(--accent-bg)" : "transparent",
                      color: active ? "var(--accent-text)" : "var(--text-secondary)",
                      fontWeight: active ? "500" : section.command ? "500" : "400",
                      fontSize: section.command ? "0.9rem" : "0.875rem",
                      paddingTop: section.command ? "0.625rem" : "0.5rem",
                      paddingBottom: section.command ? "0.625rem" : "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: section.command ? "17px" : "15px", opacity: 0.75 }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Agency OS collapsible — rendered after Command section */}
            {section.id === "command" && (
              <div className="mt-1">
                <button
                  onClick={() => setOsExpanded(!osExpanded)}
                  className="w-full flex items-center gap-3 px-4 rounded-xl transition-all min-h-[44px]"
                  style={{
                    backgroundColor: pathname === "/os" ? "var(--accent-bg)" : "transparent",
                    color: pathname === "/os" ? "var(--accent-text)" : "var(--text-secondary)",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                    paddingTop: "0.625rem",
                    paddingBottom: "0.625rem",
                  }}
                >
                  <span style={{ fontSize: "17px", opacity: 0.75 }}>🏗️</span>
                  <Link href="/os" className="flex-1 text-left" onClick={(e) => e.stopPropagation()}>
                    Agency OS
                  </Link>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: "transform 0.2s",
                      transform: osExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {osExpanded && (
                  <div className="space-y-0.5 mt-0.5 ml-3">
                    {osSubLinks.map((sub) => {
                      const subActive = pathname === "/os" && typeof window !== "undefined" && window.location.hash === sub.href.replace("/os", "");
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="flex items-center gap-2.5 px-4 py-1.5 rounded-lg transition-all"
                          style={{
                            color: subActive ? "var(--accent-text)" : "var(--muted)",
                            fontSize: "0.8rem",
                            fontWeight: subActive ? "500" : "400",
                          }}
                        >
                          <span style={{ fontSize: "13px", opacity: 0.65 }}>{sub.icon}</span>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Divider before bottom links */}
        <div className="my-3 border-t" style={{ borderColor: "var(--border-subtle)" }} />

        {/* Bottom secondary links */}
        <div className="space-y-0.5">
          {bottomLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-1.5 rounded-xl transition-all"
                style={{
                  backgroundColor: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--accent-text)" : "var(--muted)",
                  fontWeight: active ? "500" : "400",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ fontSize: "13px", opacity: 0.65 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Divider before departments */}
        <div className="my-3 border-t" style={{ borderColor: "var(--border-subtle)" }} />

        {/* Departments label */}
        <div className="px-4 py-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Departments
        </div>

        <div className="space-y-0.5 mt-0.5">
          {DEPARTMENTS.map((dept) => {
            const href = `/departments/${dept.id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={dept.id}
                href={href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all min-h-[44px]"
                style={{
                  backgroundColor: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--accent-text)" : "var(--text-secondary)",
                  fontWeight: active ? "500" : "400",
                }}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                  style={{ backgroundColor: `${dept.color}18`, color: dept.color }}
                >
                  {deptIcons[dept.id] || dept.icon}
                </span>
                {dept.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Powered by DLF
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Command Center v2.0
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - only visible on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
        aria-label="Open menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--accent)" }}
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-72 flex flex-col z-50 border-r transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-11 h-11 rounded-xl flex items-center justify-center transition-all"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
          }}
          aria-label="Close menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--accent)" }}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar - hidden on mobile */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 flex-col z-10 border-r"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
