// The Claw — Supabase Edge Function caller with timeout
// Prevents hung connections when calling edge functions

import { config } from '../config.js';

/**
 * Call a Supabase Edge Function with a timeout.
 * Returns the parsed JSON response, or null on failure.
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs = 15_000
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { ok: false, error: `${functionName} returned ${response.status}: ${text}` };
    }

    const data = await response.json() as T;
    return { ok: true, data };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: `${functionName} timed out after ${timeoutMs}ms` };
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
