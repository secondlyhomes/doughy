// The Claw — Shared Supabase REST helpers
// Single source for all cross-schema queries and claw schema operations

import { config } from '../config.js';

/**
 * Query any schema's table via Supabase REST
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
    return [];
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
    throw new Error(`Insert ${schema}.${table} failed: ${response.status} - ${text}`);
  }

  const result = await response.json();
  return (Array.isArray(result) ? result[0] : result) as T;
}

/**
 * Update a row in any schema's table by id
 */
export async function schemaUpdate(schema: string, table: string, id: string, data: Record<string, unknown>): Promise<boolean> {
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
  return response.ok;
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
  return response.ok;
}

// Convenience wrappers for the claw schema (most common)
export const clawQuery = <T>(table: string, params: string) => schemaQuery<T>('claw', table, params);
export const clawInsert = <T>(table: string, data: Record<string, unknown>) => schemaInsert<T>('claw', table, data);
export const clawUpdate = (table: string, id: string, data: Record<string, unknown>) => schemaUpdate('claw', table, id, data);
