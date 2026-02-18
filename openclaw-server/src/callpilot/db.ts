// CallPilot — Schema-aware DB helpers
// Wraps the shared schema query helpers for the callpilot schema

import { schemaQuery, schemaInsert, schemaUpdate } from '../claw/db.js';

export const cpQuery = <T>(table: string, params: string) =>
  schemaQuery<T>('callpilot', table, params);

export const cpInsert = <T>(table: string, data: Record<string, unknown>) =>
  schemaInsert<T>('callpilot', table, data);

export const cpUpdate = (table: string, id: string, data: Record<string, unknown>) =>
  schemaUpdate('callpilot', table, id, data);
