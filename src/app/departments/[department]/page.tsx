import { notFound } from "next/navigation";
import { DEPARTMENTS } from "@/lib/types";
import { getTasksByStatus, getActiveProjects, getDailyLog, getMetrics, getDepartmentStats } from "@/lib/db";
import { DepartmentHeader } from "./DepartmentHeader";
import { KanbanBoard } from "./KanbanBoard";
import { MetricCard } from "./MetricCard";
import { DailyLogComponent } from "./DailyLog";

export const dynamic = "force-dynamic";

interface Props {
  params: { department: string };
}

export default async function DepartmentPage({ params }: Props) {
  const department = DEPARTMENTS.find(d => d.id === params.department) as (typeof DEPARTMENTS)[0] | undefined;
  if (!department) return notFound();

  const tasks = await getTasksByStatus(department.id);
  const projects = await getActiveProjects(department.id);
  const log = await getDailyLog(department.id);
  const metrics = await getMetrics(department.id);
  const stats = await getDepartmentStats(department.id);

  return (
    <div className="space-y-6">
      <DepartmentHeader department={department} stats={stats} />

      {/* Metrics Row */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.slice(0, 4).map(metric => (
            <MetricCard key={metric.id} metric={metric} color={department.color} />
          ))}
        </div>
      )}

      {/* Kanban Board with drag-and-drop */}
      <KanbanBoard initialTasks={tasks} color={department.color} department={department.id} />

      {/* Projects & Daily Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border p-5 card">
          <h3 className="text-base font-serif themed-text mb-4 flex items-center gap-2" style={{ fontWeight: 400 }}>
            <span style={{ color: department.color }}>{department.icon}</span> Active Projects
          </h3>
          {projects.length === 0 ? (
            <p className="text-sm themed-muted">No active projects in {department.label}</p>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <div key={project.id} className="rounded-2xl p-4 border themed-border"
                  style={{ backgroundColor: "var(--bg)" }}>
                  <div className="font-medium text-sm themed-text">{project.name}</div>
                  <p className="text-sm themed-muted mt-1">{project.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DailyLogComponent log={log} department={department} />
      </div>
    </div>
  );
}
