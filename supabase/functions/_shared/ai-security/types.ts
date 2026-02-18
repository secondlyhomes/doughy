/**
 * AI Security Firewall Types
 *
 * Shared type definitions for the AI security middleware.
 */

import type {
  SecurityScanResult,
  ThreatSeverity,
  SecurityAction,
} from "../security.ts";

// =============================================================================
// Configuration Types
// =============================================================================

export interface AIFirewallConfig {
  /** Name of the function being protected */
  functionName: string;

  /** Whether to enable circuit breaker checks (default: true) */
  enableCircuitBreaker?: boolean;

  /** Whether to enable rate limiting (default: true) */
  enableRateLimiting?: boolean;

  /** Whether to enable threat scoring (default: true) */
  enableThreatTracking?: boolean;

  /** Whether to load patterns from database (default: true) */
  enableDatabasePatterns?: boolean;

  /** Whether to scan input (default: true) */
  enableInputScanning?: boolean;

  /** Whether to filter output (default: true) */
  enableOutputFiltering?: boolean;

  /** Custom hourly rate limit for this function (default: 100) */
  functionHourlyLimit?: number;

  /** Global hourly rate limit across all functions (default: 200) */
  globalHourlyLimit?: number;

  /** Burst limit per minute (default: 20) */
  burstLimit?: number;

  /** Field name in request body containing text to scan (default: 'message') */
  inputField?: string | string[];

  /** Whether this is a high-throughput function (reduces logging) */
  highThroughput?: boolean;
}

// =============================================================================
// Context Types
// =============================================================================

export interface AISecurityContext {
  /** Unique audit ID for this request */
  auditId: string;

  /** Authenticated user ID */
  userId: string | null;

  /** Function being called */
  functionName: string;

  /** Sanitized input (after security scanning) */
  sanitizedInput: string;

  /** Original request body */
  originalBody: Record<string, unknown>;

  /** Parsed request body with sanitized fields */
  body: Record<string, unknown>;

  /** Security scan result */
  securityScan: SecurityScanResult;

  /** Rate limit information */
  rateLimit: RateLimitResult;

  /** Channel (if provided in request) */
  channel?: string;

  /** Supabase client with service role */
  supabase: unknown;

  /** Start time for request timing */
  startTime: number;

  /** Log a security event asynchronously */
  logSecurityEvent: (details: SecurityEventDetails) => void;
}

// =============================================================================
// Rate Limiting Types
// =============================================================================

export interface RateLimitResult {
  allowed: boolean;
  limitType: 'allowed' | 'burst' | 'function_hourly' | 'global_hourly';
  currentCount: number;
  remaining: number;
}

export interface RateLimitConfig {
  globalHourlyLimit: number;
  functionHourlyLimit: number;
  burstLimit: number;
}

// =============================================================================
// Circuit Breaker Types
// =============================================================================

export interface CircuitBreakerState {
  isOpen: boolean;
  scope: string | null;
  reason: string | null;
  openedAt: Date | null;
}

// =============================================================================
// Threat Tracking Types
// =============================================================================

export interface ThreatScoreResult {
  newScore: number;
  isFlagged: boolean;
  isBlocked: boolean;
}

export interface ThreatScoreUpdate {
  userId: string;
  scoreDelta: number;
  eventType: string;
}

// =============================================================================
// Pattern Types
// =============================================================================

export interface SecurityPattern {
  id: string;
  pattern: string;
  patternType: string;
  severity: ThreatSeverity;
  description: string | null;
  appliesToChannels: string[] | null;
  hitCount: number;
}

export interface PatternCache {
  patterns: SecurityPattern[];
  loadedAt: Date;
  expiresAt: Date;
}

// =============================================================================
// Security Event Types
// =============================================================================

export interface SecurityEventDetails {
  eventType: 'injection_attempt' | 'exfil_attempt' | 'rate_limit' | 'output_filtered' | 'jailbreak_attempt' | 'suspicious_pattern' | 'circuit_breaker_blocked' | 'threat_score_blocked';
  severity: ThreatSeverity;
  action: SecurityAction;
  channel?: string;
  rawInput?: string;
  detectedPatterns?: string[];
  riskScore?: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Response Types
// =============================================================================

export interface FirewallBlockedResponse {
  error: string;
  code: 'CIRCUIT_BREAKER_OPEN' | 'RATE_LIMITED' | 'THREAT_BLOCKED' | 'USER_BLOCKED';
  retryAfter?: number;
}

// =============================================================================
// Handler Types
// =============================================================================

export type AIFirewallHandler = (
  req: Request,
  context: AISecurityContext
) => Promise<Response>;
