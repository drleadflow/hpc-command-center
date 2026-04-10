import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Server-side client (uses service role key for full access)
// Gracefully handles missing config — returns a stub that won't crash on import
export const supabase: SupabaseClient = SUPABASE_URL && SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder')

// Client-side client (uses anon key with RLS)
export const supabaseClient: SupabaseClient = SUPABASE_URL && ANON_KEY
  ? createClient(SUPABASE_URL, ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder')
