// src/services/importService.ts
// Re-exports from modular import services for backwards compatibility

export type { ImportResult, ImportOptions } from './import/types';
export { importService } from './import';
export { importLeads, validateLeadsImport } from './import/leadImporter';
export { importProperties, validatePropertiesImport } from './import/propertyImporter';
export { parseCSV } from './import/csvParser';

// Re-export for default
import { importService as service } from './import';
export default service;
