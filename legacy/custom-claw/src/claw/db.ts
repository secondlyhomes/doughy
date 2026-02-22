// The Claw — Shared Supabase REST helpers
// Single source for all cross-schema queries and claw schema operations

import { config } from '../config.js';

/**
 * Query any schema's table via Supabase REST.
 * Throws on error so callers can distinguish "no results" from "query failed".
 */
export async function schemaQuery<T>(schema: string, table: string, params: string): Promise<T[]> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${table}?${params}`,
    {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': schema,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Query ${schema}.${table} failed: ${response.status} - ${text}`);
    throw new Error(`Query ${schema}.${table} failed: ${response.status}`);
  }

  return (await response.json()) as T[];
}

/**
 * Insert into any schema's table
 */
export async function schemaInsert<T>(schema: string, table: string, data: Record<string, unknown>): Promise<T> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${table}`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
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
    // Log full details internally, throw sanitized error for callers
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
 * Throws on error (consistent with schemaInsert).
 */
export async function schemaUpdate(schema: string, table: string, id: string, data: Record<string, unknown>): Promise<void> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${table}?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': schema,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Update ${schema}.${table} id=${id} failed: ${response.status} - ${text}`);
    throw new Error(`Update ${schema}.${table} id=${id} failed: ${response.status}`);
  }
}

/**
 * Insert into public schema (no Content-Profile needed)
 */
export async function publicInsert(table: string, data: Record<string, unknown>): Promise<boolean> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${table}`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Insert public.${table} failed: ${response.status} - ${text}`);
  }
  return response.ok;
}

/**
 * Delete rows from any schema's table by ID list.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function schemaDelete(schema: string, table: string, ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const invalid = ids.filter(id => !UUID_RE.test(id));
  if (invalid.length > 0) {
    console.error(`[DB] schemaDelete called with non-UUID ids:`, invalid);
    throw new Error('Invalid ID format in schemaDelete');
  }
  const inList = ids.join(',');
  const url = `${config.supabaseUrl}/rest/v1/${table}?id=in.(${inList})`;
  const headers: Record<string, string> = {
    apikey: config.supabaseServiceKey,
    Authorization: `Bearer ${config.supabaseServiceKey}`,
    'Content-Type': 'application/json',
  };
  if (schema !== 'public') {
    headers['Content-Profile'] = schema;
  }
  const response = await fetch(url, { method: 'DELETE', headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] Delete ${schema}.${table} failed: ${response.status} - ${text}`);
  }
  return response.ok;
}

/**
 * Call a Supabase RPC function.
 */
export async function rpcCall(functionName: string, params: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/${functionName}`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] RPC ${functionName} failed: ${response.status} - ${text}`);
    throw new Error(`RPC ${functionName} failed: ${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Convenience wrappers for the claw schema (most common)
export const clawQuery = <T>(table: string, params: string) => schemaQuery<T>('claw', table, params);
export const clawInsert = <T>(table: string, data: Record<string, unknown>) => schemaInsert<T>('claw', table, data);
export const clawUpdate = (table: string, id: string, data: Record<string, unknown>) => schemaUpdate('claw', table, id, data);

/**
 * Atomically claim an approval by transitioning status from 'pending' to 'approved'.
 * Uses PostgREST filtering on PATCH so only the first caller succeeds.
 * Returns the claimed row, or null if already claimed/decided by another path.
 */
export async function claimApproval<T>(approvalId: string, userId: string, data: Record<string, unknown>): Promise<T | null> {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/approvals?id=eq.${approvalId}&user_id=eq.${userId}&status=eq.pending`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'claw',
        'Accept-Profile': 'claw',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...data, status: 'approved' }),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[DB] claimApproval ${approvalId} failed: ${response.status} - ${text}`);
    return null;
  }
  const rows = await response.json() as T[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Look up a user_id and channel_config by their channel identifier.
 * Queries claw.channel_preferences where channel_config contains the identifier.
 */
export async function lookupUserByChannel(
  channel: string,
  identifierKey: string,
  identifierValue: string
): Promise<{ user_id: string; channel_config: Record<string, unknown> } | null> {
  const params = `channel=eq.${encodeURIComponent(channel)}&is_enabled=eq.true&channel_config->>${encodeURIComponent(identifierKey)}=eq.${encodeURIComponent(identifierValue)}&select=user_id,channel_config&limit=1`;
  const rows = await clawQuery<{ user_id: string; channel_config: Record<string, unknown> }>('channel_preferences', params);
  return rows.length > 0 ? rows[0] : null;
}
