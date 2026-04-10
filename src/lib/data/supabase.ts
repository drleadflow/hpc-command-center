type SupabaseFilterValue = string | number | boolean | null;

type SupabaseSelectOptions = {
  select?: string;
  limit?: number;
  order?: { column: string; ascending?: boolean };
  filters?: Record<string, SupabaseFilterValue>;
};

type SupabaseConfig = {
  url: string;
  key: string;
};

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_API_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return { url, key };
}

function buildFilter(filter: SupabaseFilterValue): string {
  if (filter === null) return "is.null";
  if (typeof filter === "boolean") return `eq.${filter}`;
  return `eq.${String(filter)}`;
}

function buildUrl(table: string, options: SupabaseSelectOptions = {}): string {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured");

  const params = new URLSearchParams();
  params.set("select", options.select || "*");

  if (options.limit) params.set("limit", String(options.limit));
  if (options.order) {
    params.set("order", `${options.order.column}.${options.order.ascending === false ? "desc" : "asc"}`);
  }

  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value === undefined) continue;
      params.set(key, buildFilter(value));
    }
  }

  return `${config.url.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`;
}

function headers(prefer?: string): HeadersInit {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured");

  return {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export function hasSupabaseConfig(): boolean {
  return Boolean(getSupabaseConfig());
}

export async function supabaseSelect<T>(table: string, options: SupabaseSelectOptions = {}): Promise<T[]> {
  const res = await fetch(buildUrl(table, options), {
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase select failed for ${table}: ${res.status} ${detail}`);
  }

  return res.json();
}

export async function supabaseInsert<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured");

  const res = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: headers("return=representation"),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase insert failed for ${table}: ${res.status} ${detail}`);
  }

  const rows = await res.json();
  return rows[0];
}

export async function supabaseUpdate<T>(
  table: string,
  payload: Record<string, unknown>,
  filters: Record<string, SupabaseFilterValue>,
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured");

  const url = buildUrl(table, { filters });
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers("return=representation"),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase update failed for ${table}: ${res.status} ${detail}`);
  }

  const rows = await res.json();
  return rows[0];
}
