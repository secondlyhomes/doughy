/**
 * AI Security Firewall Module
 *
 * Comprehensive security middleware for AI edge functions.
 *
 * Usage:
 * ```typescript
 * import { withAIFirewall } from '../_shared/ai-security';
 *
 * serve(withAIFirewall('function-name', async (req, context) => {
 *   // context.sanitizedInput - cleaned input
 *   // context.userId - authenticated user
 *   // context.auditId - for logging
 *   // Original handler logic here
 * }));
 * ```
 */

// Main firewall wrapper
export { withAIFirewall, withLightFirewall } from "./firewall.ts";

// Types
export type {
  AIFirewallConfig,
  AISecurityContext,
  AIFirewallHandler,
  RateLimitResult,
  CircuitBreakerState,
  ThreatScoreResult,
  SecurityEventDetails,
  FirewallBlockedResponse,
} from "./types.ts";

// Circuit breaker controls (for admin endpoints)
export {
  isCircuitBreakerOpen,
  tripCircuitBreaker,
  resetCircuitBreaker,
  clearCircuitBreakerCache,
  getCircuitBreakerCacheStats,
} from "./circuit-breaker.ts";

// Rate limiter utilities
export {
  checkRateLimit,
  getRateLimitStatus,
  calculateRetryAfter,
  formatRateLimitHeaders,
} from "./rate-limiter.ts";

// Threat tracking utilities
export {
  isUserBlocked,
  updateThreatScore,
  getUserThreatScore,
  clearUserThreatScore,
  calculateScoreDelta,
  getThreatTrackerStats,
} from "./threat-tracker.ts";

// Pattern loader utilities
export {
  loadSecurityPatterns,
  getCompiledPatterns,
  recordPatternHit,
  invalidatePatternCache,
  getPatternCacheStats,
} from "./pattern-loader.ts";
