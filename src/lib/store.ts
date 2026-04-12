// Persistent local store — localStorage-backed with typed accessors
// Swap for Supabase calls once connected via Settings page

type StoreKey =
  | "hpc_team"
  | "hpc_metrics"
  | "hpc_clients"
  | "hpc_builds"
  | "hpc_commissions"
  | "hpc_invoices"
  | "hpc_tracking"
  | "hpc_work_items"
  | "hpc_kpi_values"
  | "hpc_scorecard"
  | "hpc_settings"
  | "hpc_priorities"
  | "hpc_daily_tracking"
  | "hpc_scorecard_data"
  | "hpc_review_cycles"
  | "hpc_review_notes"
  | "hpc_policies"
  | "hpc_onboarding"
  | "hpc_touchpoints"
  | "hpc_role_functions"
  | "hpc_role_kpis"
  | "hpc_scale_phases"
  | "hpc_mrr_data"
  | "hpc_mrr_history"
  | "hpc_coaching_members"
  | "hpc_company_kpis"
  | "hpc_client_wins"
  | "hpc_onboarding_progress"
  | "hpc_career_progress"
  | "hpc_skills_matrix"
  | "hpc_one_on_one"
  | "hpc_milestones"
  | "hpc_streaks"
  | "hpc_badges"
  | "hpc_feed_posts"
  | "hpc_kudos_received"
  | "hpc_kudos_given"
  | "hpc_coffee_roulette"
  | "hpc_suggestions"
  | "hpc_earnings_ytd"
  | "hpc_bonus_tiers";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const next = JSON.stringify(data);
    const existing = localStorage.getItem(key);
    if (existing === next) return;
    localStorage.setItem(key, next);
  } catch {
    // storage full or unavailable
  }
}

function update<T>(key: string, fallback: T, updater: (current: T) => T): T {
  const current = read(key, fallback);
  const next = updater(current);
  write(key, next);
  return next;
}

export const store = { read, write, update };

// ── Typed helpers for common operations ─────────────────────────────

export interface StoredTeamMember {
  id: string;
  role: string;
  hpcRole: string;
  dept: string;
  status: "active" | "meeting" | "blocked" | "offline";
  tracking: boolean;
  focus: string;
  priorities: string[];
  kpis: { label: string; value: string; target: string; status: "ok" | "warn" | "bad" }[];
  blocker: string | null;
}

export interface StoredClient {
  id: string;
  name: string;
  slug: string;
  path: "A" | "B" | "C";
  practiceType: string;
  health: number;
  healthStatus: "ok" | "warn" | "bad";
  nextAction: string;
  onboardDate: string;
  renewalDate: string;
}

export interface StoredBuild {
  id: string;
  client: string;
  path: "B" | "C";
  practiceType: string;
  dayCount: number;
  progress: number;
  status: "on-track" | "blocked" | "complete";
  blocker?: string;
  techNote: string;
}

export interface StoredCommission {
  id: string;
  date: string;
  client: string;
  practiceType: string;
  path: "A" | "B" | "C";
  firstPayment: number;
  commission: number;
  onCallBonus: number;
  status: "paid" | "pending" | "processing";
}

export interface StoredInvoice {
  id: string;
  contractor: string;
  period: string;
  amount: string;
  submitted: string;
  dueBy: string;
  status: "paid" | "processing" | "overdue";
}

export interface StoredWorkItem {
  id: string;
  role: string;
  label: string;
  detail: string;
  status: "todo" | "in-progress" | "done";
  createdAt: string;
}

export interface StoredTracking {
  id: string;
  role: string;
  date: string;
  top3: string[];
  blocker: string;
  flagReview: boolean;
  roleFields: Record<string, string>;
  submittedAt: string;
}

export interface StoredSettings {
  ghlApiKey?: string;
  ghlLocationId?: string;
  metaToken?: string;
  metaAdAccounts?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  slackBotToken?: string;
  airtableApiKey?: string;
  airtableBaseId?: string;
  stripeSecretKey?: string;
}

export interface StoredMetric {
  label: string;
  value: string;
  sub: string;
  status: "ok" | "warn" | "bad" | "";
}
