/**
 * Priorities data layer — uses SQLite (Blade DB) locally, Supabase on Vercel.
 * Same pattern as content.ts and outreach.ts.
 */

import { supabase } from "../supabase";

export interface Priority {
  id: string
  title: string
  description: string | null
  emoji: string
  urgency: string
  completed: number
  date: string
  createdAt: string
}

type Provider = "sqlite" | "supabase"

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_API_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes("placeholder"))
}

let _provider: Provider | null = null

function getProvider(): Provider {
  if (_provider) return _provider

  // Try SQLite first (works locally with Blade engine)
  try {
    // Dynamic import check — ensureBlade throws if SQLite unavailable
    const blade = require('@/lib/blade')
    blade.ensureBlade()
    _provider = "sqlite"
  } catch {
    _provider = "supabase"
  }
  return _provider
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── SQLite operations ──

async function sqliteListToday(): Promise<Priority[]> {
  try {
    const { priorities } = await import("@blade/db")
    return priorities.listToday().map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      emoji: p.emoji,
      urgency: p.urgency,
      completed: p.completed,
      date: p.date,
      createdAt: p.createdAt,
    }))
  } catch {
    return []
  }
}

async function sqliteCreate(params: { title: string; description?: string; emoji?: string; urgency?: string }): Promise<{ id: string }> {
  const { priorities } = await import("@blade/db")
  return priorities.create(params)
}

async function sqliteComplete(id: string): Promise<void> {
  const { priorities } = await import("@blade/db")
  priorities.complete(id)
}

async function sqliteUncomplete(id: string): Promise<void> {
  const { priorities } = await import("@blade/db")
  priorities.uncomplete(id)
}

async function sqliteDelete(id: string): Promise<void> {
  const { priorities } = await import("@blade/db")
  priorities.delete(id)
}

// ── Supabase operations ──

async function supabaseListToday(): Promise<Priority[]> {
  const { data, error } = await supabase
    .from("daily_priorities")
    .select("*")
    .eq("date", today())
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Supabase priorities error:", error.message)
    return []
  }

  return (data ?? []).map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    emoji: p.emoji ?? "⚡",
    urgency: p.urgency ?? "normal",
    completed: p.completed ?? 0,
    date: p.date,
    createdAt: p.created_at,
  }))
}

async function supabaseCreate(params: { title: string; description?: string; emoji?: string; urgency?: string }): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from("daily_priorities")
    .insert({
      id,
      title: params.title,
      description: params.description ?? null,
      emoji: params.emoji ?? "⚡",
      urgency: params.urgency ?? "normal",
      date: today(),
    })

  if (error) {
    console.error("Supabase create priority error:", error.message)
  }
  return { id }
}

async function supabaseComplete(id: string): Promise<void> {
  const { error } = await supabase
    .from("daily_priorities")
    .update({ completed: 1 })
    .eq("id", id)
  if (error) console.error("Supabase complete priority error:", error.message)
}

async function supabaseUncomplete(id: string): Promise<void> {
  const { error } = await supabase
    .from("daily_priorities")
    .update({ completed: 0 })
    .eq("id", id)
  if (error) console.error("Supabase uncomplete priority error:", error.message)
}

async function supabaseDelete(id: string): Promise<void> {
  const { error } = await supabase
    .from("daily_priorities")
    .delete()
    .eq("id", id)
  if (error) console.error("Supabase delete priority error:", error.message)
}

// ── Public API (auto-selects provider) ──

export async function listTodayPriorities(): Promise<Priority[]> {
  if (getProvider() === "sqlite") return sqliteListToday()
  if (hasSupabaseConfig()) return supabaseListToday()
  return []
}

export async function createPriority(params: { title: string; description?: string; emoji?: string; urgency?: string }): Promise<{ id: string }> {
  if (getProvider() === "sqlite") return sqliteCreate(params)
  if (hasSupabaseConfig()) return supabaseCreate(params)
  return { id: "noop" }
}

export async function completePriority(id: string): Promise<void> {
  if (getProvider() === "sqlite") return sqliteComplete(id)
  if (hasSupabaseConfig()) return supabaseComplete(id)
}

export async function uncompletePriority(id: string): Promise<void> {
  if (getProvider() === "sqlite") return sqliteUncomplete(id)
  if (hasSupabaseConfig()) return supabaseUncomplete(id)
}

export async function deletePriority(id: string): Promise<void> {
  if (getProvider() === "sqlite") return sqliteDelete(id)
  if (hasSupabaseConfig()) return supabaseDelete(id)
}
