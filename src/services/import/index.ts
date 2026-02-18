// src/services/import/index.ts
// Import service - re-exports all import functionality

export type { ImportResult, ImportOptions } from './types';
export { MAX_IMPORT_SIZE, BATCH_SIZE } from './types';

export { validateEmail, normalizeEmail, validatePhone, normalizeAddress } from './validation';

export { normalizeLeadData, normalizeSource, normalizeLeadStatus, normalizePriority } from './leadNormalizer';
export { normalizePropertyData, normalizePropertyType, normalizePropertyStatus } from './propertyNormalizer';

export { importLeads, validateLeadsImport } from './leadImporter';
export { importProperties, validatePropertiesImport } from './propertyImporter';

export { parseCSV } from './csvParser';

// Backwards-compatible service object
export const importService = {
  importLeads: async (
    data: Record<string, unknown>[],
    userId: string,
    options?: { skipDuplicates?: boolean; validateOnly?: boolean }
  ) => {
    const { importLeads } = await import('./leadImporter');
    return importLeads(data, userId, options);
  },
  importProperties: async (
    data: Record<string, unknown>[],
    userId: string,
    options?: { skipDuplicates?: boolean; validateOnly?: boolean }
  ) => {
    const { importProperties } = await import('./propertyImporter');
    return importProperties(data, userId, options);
  },
  parseCSV: (csvString: string) => {
    const { parseCSV } = require('./csvParser');
    return parseCSV(csvString);
  },
  validateLeadsImport: async (data: Record<string, unknown>[], userId: string) => {
    const { validateLeadsImport } = await import('./leadImporter');
    return validateLeadsImport(data, userId);
  },
  validatePropertiesImport: async (data: Record<string, unknown>[], userId: string) => {
    const { validatePropertiesImport } = await import('./propertyImporter');
    return validatePropertiesImport(data, userId);
  },
};

export default importService;
