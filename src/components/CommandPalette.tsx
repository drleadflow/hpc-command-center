"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type NavItem = { href: string; label: string; icon: string; category: "Pages" };
type TeamItem = { href: string; label: string; icon: string; category: "Team" };
type TaskItem = { href: string; label: string; icon: string; category: "Tasks" };
type Result = NavItem | TeamItem | TaskItem;

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "⌘", category: "Pages" },
  { href: "/scorecard", label: "Scorecard", icon: "📊", category: "Pages" },
  { href: "/advisor", label: "Advisor", icon: "🧠", category: "Pages" },
  { href: "/os", label: "Growth Engine", icon: "🧬", category: "Pages" },
  { href: "/content", label: "Content OS", icon: "✍️", category: "Pages" },
  { href: "/outreach", label: "Outreach OS", icon: "📬", category: "Pages" },
  { href: "/ads", label: "Ad Performance", icon: "📈", category: "Pages" },
  { href: "/leads", label: "Leads & Funnel", icon: "🎯", category: "Pages" },
  { href: "/calendar", label: "Content Calendar", icon: "📅", category: "Pages" },
  { href: "/media", label: "Content Pipeline", icon: "🎬", category: "Pages" },
  { href: "/clients", label: "Client War Room", icon: "🏢", category: "Pages" },
  { href: "/projects", label: "Projects", icon: "📁", category: "Pages" },
  { href: "/tasks", label: "Tasks", icon: "✅", category: "Pages" },
  { href: "/team", label: "Team", icon: "👥", category: "Pages" },
  { href: "/revenue", label: "Revenue & Cash", icon: "💰", category: "Pages" },
  { href: "/playbooks", label: "Playbooks", icon: "📋", category: "Pages" },
  { href: "/compass", label: "Clarity Compass", icon: "🧭", category: "Pages" },
  { href: "/delegation", label: "Delegation Matrix", icon: "📋", category: "Pages" },
  { href: "/focus", label: "Focus Mode", icon: "🎯", category: "Pages" },
  { href: "/meetings", label: "Meeting Rhythm", icon: "📆", category: "Pages" },
  { href: "/competitors", label: "Competitor Intel", icon: "🔭", category: "Pages" },
  { href: "/settings", label: "Settings", icon: "⚙️", category: "Pages" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dynamicItems, setDynamicItems] = useState<(TeamItem | TaskItem)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  // Focus input when opened; fetch dynamic data
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);

    // Fetch team + tasks in parallel, best-effort
    Promise.allSettled([
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ]).then(([teamRes, tasksRes]) => {
      const items: (TeamItem | TaskItem)[] = [];

      if (teamRes.status === "fulfilled") {
        const members: { name?: string; id?: string }[] = Array.isArray(teamRes.value)
          ? teamRes.value
          : teamRes.value?.members ?? [];
        members.forEach((m) => {
          if (m.name) {
            items.push({ href: "/team", label: m.name, icon: "👤", category: "Team" });
          }
        });
      }

      if (tasksRes.status === "fulfilled") {
        const tasks: { title?: string; name?: string; department?: string }[] = Array.isArray(tasksRes.value)
          ? tasksRes.value
          : tasksRes.value?.tasks ?? [];
        tasks.slice(0, 30).forEach((t) => {
          const label = t.title ?? t.name ?? "";
          if (label) {
            const dept = t.department ?? "marketing";
            items.push({ href: `/departments/${dept}`, label, icon: "✅", category: "Tasks" });
          }
        });
      }

      setDynamicItems(items);
    });
  }, [open]);

  // Filter results whenever query or dynamic items change
  useEffect(() => {
    const all: Result[] = [...NAV_ITEMS, ...dynamicItems];
    if (!query.trim()) {
      setResults(NAV_ITEMS.slice(0, 8));
      setActiveIndex(0);
      return;
    }
    const q = query.toLowerCase();
    const filtered = all.filter((r) => r.label.toLowerCase().includes(q));
    setResults(filtered.slice(0, 12));
    setActiveIndex(0);
  }, [query, dynamicItems]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close]
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      navigate(results[activeIndex].href);
    }
  };

  if (!open) return null;

  // Group results by category
  const grouped: Record<string, Result[]> = {};
  for (const r of results) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }
  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center px-4 py-3 gap-3">
          <span className="text-lg" style={{ color: "var(--muted)" }}>⌘</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm rounded-xl"
            style={{ color: "var(--text)" }}
            placeholder="Search pages, team, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <kbd
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="text-sm px-4 py-6 text-center" style={{ color: "var(--muted)" }}>
              No results found
            </p>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p
                className="text-xs font-semibold uppercase px-4 pt-3 pb-1 themed-muted"
                style={{ color: "var(--muted)" }}
              >
                {category}
              </p>
              {items.map((item) => {
                const idx = flatIndex++;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={`${item.category}-${item.href}-${item.label}`}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors"
                    style={{
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "#fff" : "var(--text)",
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={() => navigate(item.href)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-xs"
          style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
        >
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
