/**
 * Contacts Service
 *
 * Barrel re-export — split into:
 *   - contactMappers.ts  — CRM row interfaces, mapping constants, transformation functions
 *   - contactQueries.ts  — read/fetch functions (getContacts, getContact, searchContacts, getOverdueFollowUps)
 *   - contactMutations.ts — create/update/delete functions
 */

export { mapCrmToContact, mapLeadToContact, computeTemperature, buildAddress, SOURCE_MAP, STATUS_MAP } from './contactMappers'
export type { CrmContact, CrmLead } from './contactMappers'
export { getContacts, getContact, searchContacts, getOverdueFollowUps } from './contactQueries'
export { createContact, updateContact, deleteContact } from './contactMutations'
