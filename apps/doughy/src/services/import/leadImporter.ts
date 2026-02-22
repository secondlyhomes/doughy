// src/services/import/leadImporter.ts
// Lead import service

import { supabase } from '@/lib/supabase';
import type { LeadFormData } from '@/types';
import { ImportResult, ImportOptions, MAX_IMPORT_SIZE, BATCH_SIZE } from './types';
import { validateEmail, validatePhone, normalizeEmail } from './validation';
import { normalizeLeadData } from './leadNormalizer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leadsTable = () => supabase.schema('crm').from('leads' as any);

export async function importLeads(
  data: Record<string, unknown>[],
  userId: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  if (!data || data.length === 0) return result;

  if (data.length > MAX_IMPORT_SIZE) {
    result.failed = data.length;
    result.errors.push({
      row: 1,
      message: `Import exceeds maximum size of ${MAX_IMPORT_SIZE} records. Please split into smaller files.`
    });
    return result;
  }

  const leadsToInsert: Array<LeadFormData & { user_id: string; _originalRow: number }> = [];
  const seenEmails = new Map<string, number>();

  for (let i = 0; i < data.length; i++) {
    const originalRow = i + 1;
    const row = data[i];
    const normalized = normalizeLeadData(row);

    if (!normalized) {
      result.failed++;
      result.errors.push({ row: originalRow, message: 'Missing required field: first_name' });
      continue;
    }

    if (normalized.email && !validateEmail(normalized.email)) {
      result.failed++;
      result.errors.push({ row: originalRow, message: `Invalid email: ${normalized.email}` });
      continue;
    }

    if (normalized.phone && !validatePhone(normalized.phone)) {
      result.failed++;
      result.errors.push({ row: originalRow, message: `Invalid phone: ${normalized.phone}` });
      continue;
    }

    if (normalized.email) {
      const firstSeenRow = seenEmails.get(normalized.email);
      if (firstSeenRow !== undefined) {
        result.failed++;
        result.errors.push({
          row: originalRow,
          message: `Duplicate email within import: ${normalized.email} (first seen on row ${firstSeenRow})`
        });
        continue;
      }
      seenEmails.set(normalized.email, originalRow);
    }

    leadsToInsert.push({ ...normalized, user_id: userId, _originalRow: originalRow });
  }

  if (options.validateOnly) {
    result.success = leadsToInsert.length;
    return result;
  }

  if (options.skipDuplicates && leadsToInsert.length > 0) {
    const emails = leadsToInsert.filter(l => l.email).map(l => l.email);

    if (emails.length > 0) {
      const { data: existingLeads } = await leadsTable()
        .select('email')
        .eq('user_id', userId)
        .in('email', emails as string[]);

      const existingEmails = new Set(
        (existingLeads as Array<{ email: string }> | null)?.map(l => normalizeEmail(l.email)) || []
      );

      const filteredLeads = leadsToInsert.filter(l => {
        if (!l.email || !existingEmails.has(l.email)) return true;
        result.failed++;
        result.errors.push({ row: l._originalRow, message: `Duplicate email already exists: ${l.email}` });
        return false;
      });

      leadsToInsert.length = 0;
      leadsToInsert.push(...filteredLeads);
    }
  }

  for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
    const batch = leadsToInsert.slice(i, i + BATCH_SIZE);
    const cleanBatch = batch.map(({ _originalRow, ...lead }) => lead);

    const { error, count } = await leadsTable().insert(cleanBatch);

    if (error) {
      result.failed += batch.length;
      const rowRange = batch.length === 1
        ? `row ${batch[0]._originalRow}`
        : `rows ${batch[0]._originalRow}-${batch[batch.length - 1]._originalRow}`;
      result.errors.push({ row: batch[0]._originalRow, message: `Batch insert failed (${rowRange}): ${error.message}` });
    } else {
      result.success += count ?? batch.length;
    }
  }

  return result;
}

export async function validateLeadsImport(
  data: Record<string, unknown>[],
  userId: string
): Promise<ImportResult> {
  return importLeads(data, userId, { validateOnly: true });
}
