interface DepartmentHeaderProps {
  department: { id: string; label: string; icon: string; color: string };
  stats: {
    today: number;
    inProgress: number;
    waiting: number;
    completedToday: number;
    activeProjects: number;
  };
}

export function DepartmentHeader({ department, stats }: DepartmentHeaderProps) {
  return (
    <div className="rounded-3xl border p-6 card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: `${department.color}18`, color: department.color }}
          >
            {department.icon}
          </div>
          <div>
            <h1 className="text-2xl font-serif themed-text" style={{ fontWeight: 400 }}>
              {department.label}
            </h1>
            <p className="text-sm themed-muted mt-0.5">Department overview</p>
          </div>
        </div>

        <div className="flex gap-3">
          {[
            { label: "Today", value: stats.today, color: "#d97706" },
            { label: "In Progress", value: stats.inProgress, color: "#2d5a4e" },
            { label: "Blocked", value: stats.waiting, color: "#b91c1c" },
            { label: "Projects", value: stats.activeProjects, color: "#6b7280" },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-3 rounded-2xl border themed-border"
              style={{ backgroundColor: "var(--bg)" }}>
              <div className="text-2xl font-serif" style={{ color: s.color, fontWeight: 300 }}>
                {s.value}
              </div>
              <div className="text-xs themed-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
