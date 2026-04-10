import { DEPARTMENTS } from "@/lib/types";
import { getTasksByStatus, getActiveProjects, getDailyLog, getMetrics, getDepartmentStats } from "@/lib/db";
import { DepartmentHeader } from "../[department]/DepartmentHeader";
import { MetricCard } from "../[department]/MetricCard";
import { DailyLogComponent } from "../[department]/DailyLog";
import { ClientKanban } from "./ClientKanban";

export const dynamic = "force-dynamic";

export default async function ClientSuccessPage() {
  const department = DEPARTMENTS.find(d => d.id === "client-success")!;

  const tasks = await getTasksByStatus("client-success");
  const projects = await getActiveProjects("client-success");
  const log = await getDailyLog("client-success");
  const metrics = await getMetrics("client-success");
  const stats = await getDepartmentStats("client-success");

  return (
    <div className="space-y-6">
      <DepartmentHeader department={department} stats={stats} />

      {metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.slice(0, 4).map(metric => (
            <MetricCard key={metric.id} metric={metric} color={department.color} />
          ))}
        </div>
      )}

      {/* Client-aware Kanban with filter bar */}
      <ClientKanban initialTasks={tasks} color={department.color} />

      {/* Projects & Daily Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border p-5 card">
          <h3 className="text-base font-serif themed-text mb-4 flex items-center gap-2" style={{ fontWeight: 400 }}>
            <span style={{ color: department.color }}>{department.icon}</span> Active Projects
          </h3>
          {projects.length === 0 ? (
            <p className="text-sm themed-muted">No active projects in Client Success</p>
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
