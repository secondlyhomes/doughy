/**
 * Health Checks Module
 *
 * Re-exports all health check functions organized by service category.
 *
 * @module _shared/health-checks
 */

// Types
export type { HealthCheckResult, Logger } from "./types.ts";

// AI Services (OpenAI, Anthropic, Perplexity, Bland.ai)
export {
  checkOpenAI,
  checkAnthropic,
  checkPerplexity,
  checkBlandAI,
} from "./ai-services.ts";

// Payment Services (Stripe, Plaid)
export {
  checkStripeSecret,
  checkStripePublic,
  checkPlaid,
} from "./payment-services.ts";

// Google Services (Maps, Gmail, Calendar)
export {
  checkGoogleMaps,
  checkGmail,
  checkGoogleCalendar,
} from "./google-services.ts";

// Microsoft Services (Outlook Mail, Outlook Calendar)
export {
  checkOutlookMail,
  checkOutlookCalendar,
} from "./microsoft-services.ts";

// Communication Services (Twilio, MoltBot)
export {
  checkTwilio,
  checkMoltBot,
} from "./communication-services.ts";

// IoT Services (Seam)
export { checkSeam } from "./iot-services.ts";

// Data Services (Tracerfy)
export { checkTracerfy } from "./data-services.ts";

// Infrastructure Services (Supabase, Netlify)
export { checkSupabase, checkNetlify } from "./infrastructure-services.ts";
