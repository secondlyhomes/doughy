// src/services/import/types.ts
// Shared types for import services

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  validateOnly?: boolean;
}

// Maximum import size to prevent DoS
export const MAX_IMPORT_SIZE = 10000;
export const BATCH_SIZE = 100;
