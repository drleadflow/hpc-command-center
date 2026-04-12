import { supabase } from "./supabase";
import type {
  Project,
  Task,
  TaskStatus,
  Message,
  DailyLog,
  Metric,
  Department,
  TeamMember,
} from "./types";

// ── Projects ─────────────────────────────────────────────────────────

export async function getProjects(department?: Department): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (department) {
    query = query.eq("department", department);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase getProjects error:", error.message);
    return [];
  }
  return (data ?? []).map(mapProject);
}

export async function getActiveProjects(department?: Department): Promise<Project[]> {
  const projects = await getProjects(department);
  return projects.filter((p) => p.status === "active");
}

export async function createProject(
  project: Omit<Project, "created_at" | "updated_at">
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status,
      department: project.department,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createProject error:", error.message);
    // Return a fallback so callers don't crash
    const now = new Date().toISOString();
    return { ...project, created_at: now, updated_at: now };
  }

  return mapProject(data);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.department !== undefined) payload.department = updates.department;

  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) {
    console.error("Supabase updateProject error:", error.message);
  }
}

// ── Tasks ────────────────────────────────────────────────────────────

export async function getTasks(opts?: {
  department?: Department;
  status?: TaskStatus;
  project_id?: string;
  assigned_to?: string;
}): Promise<Task[]> {
  let query = supabase.from("tasks").select("*");

  if (opts?.department) query = query.eq("department", opts.department);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.project_id) query = query.eq("project_id", opts.project_id);
  if (opts?.assigned_to) query = query.eq("assigned_to", opts.assigned_to);

  const { data, error } = await query;
  if (error) {
    console.error("Supabase getTasks error:", error.message);
    return [];
  }

  const tasks = (data ?? []).map(mapTask);

  // Sort: high priority first, then by updated_at desc
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return tasks.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export async function getTasksByStatus(
  department: Department
): Promise<Record<TaskStatus, Task[]>> {
  const tasks = await getTasks({ department });
  const result: Record<TaskStatus, Task[]> = {
    today: [],
    "in-progress": [],
    waiting: [],
    completed: [],
  };
  for (const t of tasks) {
    if (result[t.status]) {
      result[t.status].push(t);
    }
  }
  return result;
}

export async function createTask(
  task: Omit<Task, "created_at" | "updated_at">
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      department: task.department,
      project_id: task.project_id || null,
      client: task.client || null,
      assigned_to: task.assigned_to || null,
      due_date: task.due_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createTask error:", error.message);
    const now = new Date().toISOString();
    return { ...task, created_at: now, updated_at: now };
  }

  return mapTask(data);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.project_id !== undefined) payload.project_id = updates.project_id;
  if (updates.client !== undefined) payload.client = updates.client;
  if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to;
  if (updates.due_date !== undefined) payload.due_date = updates.due_date;

  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) {
    console.error("Supabase updateTask error:", error.message);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("Supabase deleteTask error:", error.message);
  }
}

// ── Team Members ─────────────────────────────────────────────────────

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Supabase getTeamMembers error:", error.message);
    return [];
  }
  return (data ?? []).map(mapTeamMember);
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapTeamMember(data);
}

export async function createTeamMember(
  member: Omit<TeamMember, "created_at" | "updated_at">
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      avatar_color: member.avatarColor,
      slack_id: member.slackId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createTeamMember error:", error.message);
    const now = new Date().toISOString();
    return { ...member, created_at: now, updated_at: now };
  }

  return mapTeamMember(data);
}

export async function updateTeamMember(
  id: string,
  updates: Partial<TeamMember>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.avatarColor !== undefined) payload.avatar_color = updates.avatarColor;
  if (updates.slackId !== undefined) payload.slack_id = updates.slackId;

  const { error } = await supabase.from("team_members").update(payload).eq("id", id);
  if (error) {
    console.error("Supabase updateTeamMember error:", error.message);
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) {
    console.error("Supabase deleteTeamMember error:", error.message);
  }
}

// ── Messages (moved from in-memory to Supabase) ─────────────────────

export async function getMessages(limit = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Supabase getMessages error:", error.message);
    return [];
  }
  return (data ?? []).map(mapMessage);
}

export async function createMessage(
  message: Omit<Message, "created_at">
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      id: message.id,
      role: message.role,
      content: message.content,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createMessage error:", error.message);
    return { ...message, created_at: new Date().toISOString() };
  }

  return mapMessage(data);
}

// ── Notifications (moved from in-memory to Supabase) ────────────────

export type NotificationType =
  | "lead_move"
  | "task_overdue"
  | "spend_alert"
  | "deploy"
  | "general";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase getNotifications error:", error.message);
    return [];
  }
  return (data ?? []).map(mapNotification);
}

export async function createNotification(
  n: Omit<Notification, "id" | "createdAt" | "read">
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createNotification error:", error.message);
    return {
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
      ...n,
    };
  }

  return mapNotification(data);
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) {
    console.error("Supabase markNotificationRead error:", error.message);
    return false;
  }
  return true;
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);

  if (error) {
    console.error("Supabase markAllNotificationsRead error:", error.message);
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (error) {
    console.error("Supabase getUnreadNotificationCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

// ── Daily Logs ───────────────────────────────────────────────────────

export async function getDailyLog(
  department: Department,
  date?: string
): Promise<DailyLog | null> {
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("department", department)
    .eq("date", targetDate)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    department: data.department as Department,
    date: data.date,
    wins: data.wins || [],
    blockers: data.blockers || [],
    notes: data.notes || "",
    created_at: data.created_at,
  };
}

export async function getRecentLogs(
  department: Department,
  days = 7
): Promise<DailyLog[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("department", department)
    .gte("date", since)
    .order("date", { ascending: false });

  if (error) {
    console.error("Supabase getRecentLogs error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    department: row.department as Department,
    date: row.date,
    wins: row.wins || [],
    blockers: row.blockers || [],
    notes: row.notes || "",
    created_at: row.created_at,
  }));
}

// ── Metrics ──────────────────────────────────────────────────────────

export async function getMetrics(department: Department): Promise<Metric[]> {
  const { data, error } = await supabase
    .from("metrics")
    .select("*")
    .eq("department", department);

  if (error) {
    console.error("Supabase getMetrics error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    department: row.department as Department,
    name: row.name,
    value: row.value,
    target: row.target || undefined,
    trend: row.trend as Metric["trend"],
    updated_at: row.updated_at,
  }));
}

// ── Stats ────────────────────────────────────────────────────────────

export async function getDepartmentStats(department: Department) {
  const tasks = await getTasks({ department });

  return {
    today: tasks.filter((t) => t.status === "today").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    waiting: tasks.filter((t) => t.status === "waiting").length,
    completedToday: tasks.filter((t) => t.status === "completed").length,
    activeProjects: (await getActiveProjects(department)).length,
  };
}

export async function getAllStats() {
  const departments: Department[] = [
    "ceo",
    "marketing",
    "tech",
    "client-success",
    "media",
  ];
  const stats: Record<
    Department,
    Awaited<ReturnType<typeof getDepartmentStats>>
  > = {} as any;

  for (const dept of departments) {
    stats[dept] = await getDepartmentStats(dept);
  }

  return stats;
}

// ── Scorecard ────────────────────────────────────────────────────────

export async function getScorecardData(weekKey: string): Promise<any> {
  const { data, error } = await supabase
    .from("scorecard")
    .select("data")
    .eq("week_key", weekKey)
    .single();

  if (error || !data) return null;
  return data.data;
}

export async function saveScorecardData(weekKey: string, scoreData: any): Promise<void> {
  const { error } = await supabase.from("scorecard").upsert(
    {
      week_key: weekKey,
      data: scoreData,
    },
    { onConflict: "week_key" }
  );

  if (error) {
    console.error("Supabase saveScorecardData error:", error.message);
  }
}

// ── Revenue ──────────────────────────────────────────────────────────

export async function getRevenueData(): Promise<any> {
  const { data, error } = await supabase
    .from("revenue")
    .select("data")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.data;
}

export async function saveRevenueData(revenueData: any): Promise<void> {
  // Check if a row exists
  const { data: existing } = await supabase
    .from("revenue")
    .select("id")
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("revenue")
      .update({ data: revenueData })
      .eq("id", existing.id);
    if (error) {
      console.error("Supabase saveRevenueData update error:", error.message);
    }
  } else {
    const { error } = await supabase
      .from("revenue")
      .insert({ data: revenueData });
    if (error) {
      console.error("Supabase saveRevenueData insert error:", error.message);
    }
  }
}

// ── Portal Links ─────────────────────────────────────────────────────

export interface PortalLink {
  token: string;
  clientSlug: string;
  clientName: string;
  createdAt: string;
  expiresAt: string;
}

export async function getPortalLink(token: string): Promise<PortalLink | null> {
  const { data, error } = await supabase
    .from("portal_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) return null;

  const link = mapPortalLink(data);
  if (new Date(link.expiresAt) < new Date()) return null;
  return link;
}

export async function createPortalLink(
  clientSlug: string,
  clientName: string,
  expiresInDays = 30
): Promise<PortalLink> {
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("portal_links")
    .insert({
      token,
      client_slug: clientSlug,
      client_name: clientName,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createPortalLink error:", error.message);
    return {
      token,
      clientSlug,
      clientName,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  return mapPortalLink(data);
}

export async function listPortalLinks(): Promise<PortalLink[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("portal_links")
    .select("*")
    .gte("expires_at", now);

  if (error) {
    console.error("Supabase listPortalLinks error:", error.message);
    return [];
  }
  return (data ?? []).map(mapPortalLink);
}

// ── Workbook Progress ────────────────────────────────────────────────

export type WorkbookModuleStatus = "completed" | "in_progress" | "not_started";

export interface WorkbookModule {
  id: string;
  moduleId: string;
  moduleName: string;
  status: WorkbookModuleStatus;
  progress: number;
  lastActivity?: string;
}

const DEFAULT_MODULES: { id: string; name: string }[] = [
  { id: "clinic-foundation", name: "Clinic Foundation Setup" },
  { id: "lead-gen-machine", name: "Lead Generation Machine" },
  { id: "patient-conversion", name: "Patient Conversion System" },
  { id: "retention-reactivation", name: "Retention & Reactivation" },
  { id: "growth-scaling", name: "Growth Scaling Playbook" },
  { id: "ad-campaign-mastery", name: "Ad Campaign Mastery" },
  { id: "review-reputation", name: "Review & Reputation Engine" },
  { id: "team-training-sops", name: "Team Training & SOPs" },
];

const WORKBOOK_URLS: Record<string, { workbookUrl: string; clinicAppUrl: string }> = {
  healthproceo: {
    workbookUrl: "https://workbook.healthproceo.com",
    clinicAppUrl: "https://clinic-legwtkzpa-dlfs-projects-2e99dbe5.vercel.app",
  },
};

function defaultWorkbookUrls() {
  return {
    workbookUrl: "https://workbook.healthproceo.com",
    clinicAppUrl: "https://clinic-legwtkzpa-dlfs-projects-2e99dbe5.vercel.app",
  };
}

export async function getWorkbookProgress(
  portalToken: string,
  clientSlug: string
): Promise<{
  workbookUrl: string;
  clinicAppUrl: string;
  modules: WorkbookModule[];
  overallProgress: number;
  lastLogin?: string;
}> {
  const urls = WORKBOOK_URLS[clientSlug] || defaultWorkbookUrls();

  const { data, error } = await supabase
    .from("workbook_progress")
    .select("*")
    .eq("portal_token", portalToken);

  let modules: WorkbookModule[];

  if (error || !data || data.length === 0) {
    // Return default modules with not_started status
    modules = DEFAULT_MODULES.map((m) => ({
      id: m.id,
      moduleId: m.id,
      moduleName: m.name,
      status: "not_started" as WorkbookModuleStatus,
      progress: 0,
      lastActivity: undefined,
    }));
  } else {
    // Merge DB rows with default module list
    const dbMap = new Map(data.map((row: any) => [row.module_id, row]));
    modules = DEFAULT_MODULES.map((m) => {
      const row = dbMap.get(m.id) as any;
      if (row) {
        return {
          id: row.id,
          moduleId: row.module_id,
          moduleName: row.module_name || m.name,
          status: row.status as WorkbookModuleStatus,
          progress: row.progress ?? 0,
          lastActivity: row.last_activity || undefined,
        };
      }
      return {
        id: m.id,
        moduleId: m.id,
        moduleName: m.name,
        status: "not_started" as WorkbookModuleStatus,
        progress: 0,
        lastActivity: undefined,
      };
    });
  }

  const totalProgress = modules.reduce((sum, m) => sum + m.progress, 0);
  const overallProgress = Math.round(totalProgress / modules.length);

  return {
    ...urls,
    modules,
    overallProgress,
  };
}

export async function updateWorkbookModule(
  portalToken: string,
  clientSlug: string,
  moduleId: string,
  updates: { status?: WorkbookModuleStatus; progress?: number; lastActivity?: string }
): Promise<WorkbookModule | null> {
  const moduleDef = DEFAULT_MODULES.find((m) => m.id === moduleId);
  const moduleName = moduleDef?.name || moduleId;

  const { data, error } = await supabase
    .from("workbook_progress")
    .upsert(
      {
        portal_token: portalToken,
        client_slug: clientSlug,
        module_id: moduleId,
        module_name: moduleName,
        status: updates.status ?? "not_started",
        progress: updates.progress ?? 0,
        last_activity: updates.lastActivity || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "portal_token,module_id" }
    )
    .select()
    .single();

  if (error || !data) {
    console.error("Supabase updateWorkbookModule error:", error?.message);
    return null;
  }

  return {
    id: data.id,
    moduleId: data.module_id,
    moduleName: data.module_name,
    status: data.status as WorkbookModuleStatus,
    progress: data.progress,
    lastActivity: data.last_activity || undefined,
  };
}

// ── Sync stubs (no-op for backwards compat) ─────────────────────────

export function getProjectsSync(_department?: Department): Project[] {
  return [];
}

export function getTasksSync(_opts?: {
  department?: Department;
  status?: TaskStatus;
  project_id?: string;
}): Task[] {
  return [];
}

// ── Row mappers (snake_case DB -> camelCase app types) ───────────────

function mapProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    status: row.status as Project["status"],
    department: row.department as Department,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    status: row.status as TaskStatus,
    priority: row.priority as Task["priority"],
    department: row.department as Department,
    project_id: row.project_id || null,
    client: row.client || null,
    assigned_to: row.assigned_to || null,
    due_date: row.due_date || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapTeamMember(row: any): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department as Department,
    avatarColor: row.avatar_color,
    slackId: row.slack_id || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapMessage(row: any): Message {
  return {
    id: row.id,
    role: row.role as Message["role"],
    content: row.content,
    created_at: row.created_at,
  };
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
    link: row.link || undefined,
  };
}

function mapPortalLink(row: any): PortalLink {
  return {
    token: row.token,
    clientSlug: row.client_slug,
    clientName: row.client_name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}
