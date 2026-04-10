export type Department = "ceo" | "marketing" | "tech" | "client-success" | "media" | "sales" | "fulfillment" | "finance";

// ── HPC Role System ─────────────────────────────────────────────────
export type HpcRole =
  | "ceo"
  | "ops_manager"
  | "marketing_lead"
  | "content_editor"
  | "appointment_setter"
  | "sales_closer"
  | "ai_tech_specialist"
  | "csm_lead_coach"
  | "bookkeeper";

export const ADMIN_ROLES: readonly HpcRole[] = ["ceo", "ops_manager"] as const;

export type TeamStatus = "active" | "meeting" | "blocked" | "offline";

export type OfferPath = "A" | "B" | "C";

export type PracticeType =
  | "medspa"
  | "dental"
  | "chiropractic"
  | "psychiatry"
  | "wellness"
  | "physical_therapy"
  | "weight_loss"
  | "other";

// Growth Engine stages each role owns
export const ROLE_STAGES: Record<HpcRole, readonly string[]> = {
  ceo: ["all"],
  ops_manager: ["all"],
  marketing_lead: ["awareness", "capture", "webinar", "nurture"],
  content_editor: ["awareness"],
  appointment_setter: ["setter"],
  sales_closer: ["close"],
  ai_tech_specialist: ["handoff", "crm"],
  csm_lead_coach: ["handoff"],
  bookkeeper: [],
} as const;

// Map HPC roles to departments
export const ROLE_DEPARTMENT: Record<HpcRole, Department> = {
  ceo: "ceo",
  ops_manager: "ceo",
  marketing_lead: "marketing",
  content_editor: "marketing",
  appointment_setter: "sales",
  sales_closer: "sales",
  ai_tech_specialist: "fulfillment",
  csm_lead_coach: "fulfillment",
  bookkeeper: "finance",
} as const;

export function isAdminRole(role: HpcRole | string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

// ── Core Models ─────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  department: Department;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "today" | "in-progress" | "waiting" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  project_id: string | null;
  department: Department;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  client?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: Department;
  avatarColor: string;
  slackId?: string | null;
  hpc_role?: HpcRole | null;
  status?: TeamStatus;
  reports_to?: string | null;
  rate_type?: string | null;
  created_at: string;
  updated_at: string;
}

export const AVATAR_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#ef4444", "#06b6d4", "#f97316",
] as const;

export const CLIENTS = [
  "Vitality & Aesthetics",
  "IV Wellness",
  "HealthProceo",
  "Corrective Skin Care",
  "Bleutech",
  "Cowgirl Courtney",
  "TopeOps",
] as const;

export type Client = typeof CLIENTS[number];

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface DailyLog {
  id: string;
  department: Department;
  date: string;
  wins: string[];
  blockers: string[];
  notes: string;
  created_at: string;
}

export interface Metric {
  id: string;
  department: Department;
  name: string;
  value: string;
  target?: string;
  trend?: "up" | "down" | "flat";
  updated_at: string;
}

export const DEPARTMENTS: { id: Department; label: string; icon: string; color: string }[] = [
  { id: "ceo", label: "CEO", icon: "◈", color: "#f59e0b" },
  { id: "marketing", label: "Marketing", icon: "◉", color: "#3b82f6" },
  { id: "tech", label: "Tech", icon: "◆", color: "#10b981" },
  { id: "client-success", label: "Client Success", icon: "◊", color: "#8b5cf6" },
  { id: "media", label: "Media", icon: "▣", color: "#ec4899" },
];
