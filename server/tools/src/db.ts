// Supabase MCP Server — Database helpers
// Raw fetch() with service role key + Accept-Profile/Content-Profile headers
// Decision #3: no @supabase/supabase-js

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate a UUID — prevents PostgREST query injection */
export function assertUuid(value: string, label: string): string {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid ${label}: must be a valid UUID`);
  }
  return value;
}

/** Clamp AI-supplied limit to a safe range */
export function clampLimit(value: number | undefined, defaultVal: number, max: number = 50): number {
  if (!value || value < 1) return defaultVal;
  return Math.min(value, max);
}

const VALID_MODULES = new Set(['investor', 'landlord']);

/** Validate module from AI tool input */
export function assertModule(value: string | undefined): string {
  if (typeof value === 'string' && VALID_MODULES.has(value)) return value;
  return 'investor';
}

/**
 * Query any schema's table via Supabase REST.
 * Throws on error so callers can distinguish "no results" from "query failed".
 */
export async function schemaQuery<T>(schema: string, table: string, params: string): Promise<T[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${params}`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Accept-Profile': schema,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Query ${schema}.${table} failed: ${response.status} - ${text}`);
    throw new Error(`Query failed: ${response.status}`);
  }

  return (await response.json()) as T[];
}

/**
 * Insert into any schema's table. Returns the created row.
 */
export async function schemaInsert<T>(schema: string, table: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Profile': schema,
        'Accept-Profile': schema,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Insert ${schema}.${table} failed: ${response.status} - ${text}`);
    throw new Error(
      response.status === 409 ? 'Duplicate entry' :
      response.status === 422 ? 'Invalid data' :
      'Database operation failed'
    );
  }

  const result = await response.json();
  return (Array.isArray(result) ? result[0] : result) as T;
}

/**
 * Update a row in any schema's table by id.
 */
export async function schemaUpdate(schema: string, table: string, id: string, data: Record<string, unknown>): Promise<void> {
  assertUuid(id, 'id');
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Profile': schema,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Update ${schema}.${table} id=${id} failed: ${response.status} - ${text}`);
    throw new Error(`Update failed: ${response.status}`);
  }
}

// Convenience wrappers for the claw schema
export const clawQuery = <T>(table: string, params: string) => schemaQuery<T>('claw', table, params);
export const clawInsert = <T>(table: string, data: Record<string, unknown>) => schemaInsert<T>('claw', table, data);
export const clawUpdate = (table: string, id: string, data: Record<string, unknown>) => schemaUpdate('claw', table, id, data);

/**
 * Atomically claim an approval by transitioning status from 'pending' to 'approved'.
 * Uses PostgREST filtering on PATCH so only the first caller succeeds.
 */
export async function claimApproval<T>(approvalId: string, userId: string, data: Record<string, unknown>): Promise<T | null> {
  assertUuid(approvalId, 'approvalId');
  assertUuid(userId, 'userId');
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/approvals?id=eq.${approvalId}&user_id=eq.${userId}&status=eq.pending`,
    {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'claw',
        'Accept-Profile': 'claw',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...data, status: 'approved' }),
    }
  );
  if (!response.ok) {
    console.error(`[DB] claimApproval ${approvalId} failed: ${response.status}`);
    return null;
  }
  const rows = await response.json() as T[];
  return rows.length > 0 ? rows[0] : null;
}
