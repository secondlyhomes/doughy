// src/services/import/propertyImporter.ts
// Property import service

import { supabase } from '@/lib/supabase';
import type { PropertyFormData } from '@/types';
import { ImportResult, ImportOptions, MAX_IMPORT_SIZE, BATCH_SIZE } from './types';
import { normalizeAddress } from './validation';
import { normalizePropertyData } from './propertyNormalizer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const propertiesTable = () => supabase.from('properties' as any);

export async function importProperties(
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

  const propertiesToInsert: Array<PropertyFormData & { user_id: string; _originalRow: number }> = [];
  const seenAddresses = new Map<string, number>();

  for (let i = 0; i < data.length; i++) {
    const originalRow = i + 1;
    const row = data[i];
    const normalized = normalizePropertyData(row);

    if (!normalized) {
      result.failed++;
      result.errors.push({ row: originalRow, message: 'Missing required field: address' });
      continue;
    }

    if (normalized.price !== undefined && (isNaN(normalized.price) || normalized.price < 0)) {
      result.failed++;
      result.errors.push({ row: originalRow, message: 'Invalid price value' });
      continue;
    }

    if (normalized.bedrooms !== undefined && (isNaN(normalized.bedrooms) || normalized.bedrooms < 0)) {
      result.failed++;
      result.errors.push({ row: originalRow, message: 'Invalid bedrooms value' });
      continue;
    }

    if (normalized.bathrooms !== undefined && (isNaN(normalized.bathrooms) || normalized.bathrooms < 0)) {
      result.failed++;
      result.errors.push({ row: originalRow, message: 'Invalid bathrooms value' });
      continue;
    }

    const normalizedAddr = normalizeAddress(normalized.address);
    const firstSeenRow = seenAddresses.get(normalizedAddr);
    if (firstSeenRow !== undefined) {
      result.failed++;
      result.errors.push({
        row: originalRow,
        message: `Duplicate address within import: ${normalized.address} (first seen on row ${firstSeenRow})`
      });
      continue;
    }
    seenAddresses.set(normalizedAddr, originalRow);

    propertiesToInsert.push({ ...normalized, user_id: userId, _originalRow: originalRow });
  }

  if (options.validateOnly) {
    result.success = propertiesToInsert.length;
    return result;
  }

  if (options.skipDuplicates && propertiesToInsert.length > 0) {
    const addresses = propertiesToInsert.map(p => p.address);

    const { data: existingProperties } = await propertiesTable()
      .select('address')
      .eq('user_id', userId)
      .in('address', addresses);

    const existingAddresses = new Set(
      (existingProperties as Array<{ address: string }> | null)
        ?.map(p => normalizeAddress(p.address)) || []
    );

    const filteredProperties = propertiesToInsert.filter(p => {
      const normalizedAddr = normalizeAddress(p.address);
      if (!existingAddresses.has(normalizedAddr)) return true;
      result.failed++;
      result.errors.push({ row: p._originalRow, message: `Duplicate address already exists: ${p.address}` });
      return false;
    });

    propertiesToInsert.length = 0;
    propertiesToInsert.push(...filteredProperties);
  }

  for (let i = 0; i < propertiesToInsert.length; i += BATCH_SIZE) {
    const batch = propertiesToInsert.slice(i, i + BATCH_SIZE);
    const cleanBatch = batch.map(({ _originalRow, ...property }) => property);

    const { error, count } = await propertiesTable().insert(cleanBatch);

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

export async function validatePropertiesImport(
  data: Record<string, unknown>[],
  userId: string
): Promise<ImportResult> {
  return importProperties(data, userId, { validateOnly: true });
}
