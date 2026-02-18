/**
 * Services
 *
 * Business logic and API calls.
 * All services return Promises and can be swapped from mock to real backends.
 */

export { supabase, isMockMode } from './supabaseClient'
export { callsFetch } from './callpilotApi'
export * as authService from './authService'
export * as contactsService from './contactsService'
export * as callsService from './callsService'
export * as communicationsService from './communicationsService'
export * as briefsService from './briefsService'
export * as memosService from './memosService'
export * as analyticsService from './analyticsService'
export * as aiProfileService from './aiProfileService'
export * as coachingService from './coachingService'
