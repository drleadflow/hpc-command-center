// ─── DLF Command Center Data Layer ───────────────────────────────────
// Backed by Supabase. All functions re-exported from db-supabase.ts.
// GitHub markdown storage (via github.ts) is no longer used for core data.
// ─────────────────────────────────────────────────────────────────────

export {
  // Projects
  getProjects,
  getActiveProjects,
  createProject,
  updateProject,

  // Tasks
  getTasks,
  getTasksByStatus,
  createTask,
  updateTask,
  deleteTask,

  // Team Members
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,

  // Messages (now persisted in Supabase)
  getMessages,
  createMessage,

  // Notifications (now persisted in Supabase)
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,

  // Daily Logs
  getDailyLog,
  getRecentLogs,

  // Metrics
  getMetrics,

  // Stats
  getDepartmentStats,
  getAllStats,

  // Scorecard
  getScorecardData,
  saveScorecardData,

  // Revenue
  getRevenueData,
  saveRevenueData,

  // Portal Links
  getPortalLink,
  createPortalLink,
  listPortalLinks,

  // Sync stubs (backwards compat)
  getProjectsSync,
  getTasksSync,
} from "./db-supabase";

export type { NotificationType, Notification, PortalLink } from "./db-supabase";
