/**
 * OpenClaw Security Service
 *
 * Provides security scanning and rate limiting for the OpenClaw gateway server.
 * Mirror of the edge function security module for consistent protection across
 * both the gateway server and edge functions.
 *
 * @see /supabase/functions/_shared/security.ts for the full implementation
 */

import { config } from '../config.js';

// =============================================================================
// Types
// =============================================================================

export interface SecurityScanResult {
  safe: boolean;
  threats: ThreatType[];
  threatDetails: ThreatDetail[];
  sanitized: string;
  riskScore: number;
  severity: ThreatSeverity;
  action: SecurityAction;
}

export interface ThreatDetail {
  type: ThreatType;
  pattern: string;
  match: string;
  position: number;
  severity: ThreatSeverity;
}

export interface OutputFilterResult {
  safe: boolean;
  filtered: string;
  redactions: RedactionInfo[];
  containsSuspiciousContent: boolean;
}

export interface RedactionInfo {
  type: RedactionType;
  original: string;
  replacement: string;
  position: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limitType: 'user' | 'channel' | 'burst';
}

export type ThreatType =
  | 'prompt_injection'
  | 'instruction_override'
  | 'jailbreak_attempt'
  | 'data_exfiltration'
  | 'system_prompt_leak'
  | 'impersonation'
  | 'malformed_markup'
  | 'command_injection';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SecurityAction = 'allowed' | 'sanitized' | 'flagged' | 'blocked';
export type RedactionType = 'api_key' | 'password' | 'token' | 'pii_email' | 'pii_phone' | 'pii_ssn' | 'credit_card' | 'system_detail' | 'internal_url';

// =============================================================================
// Pattern Definitions
// =============================================================================

const INJECTION_PATTERNS: Array<{ pattern: RegExp; severity: ThreatSeverity; type: ThreatType }> = [
  // Instruction override attempts
  { pattern: /ignore (all )?(previous|above|prior|earlier|your) (instructions?|prompts?|rules?|guidelines?)/i, severity: 'critical', type: 'instruction_override' },
  { pattern: /disregard (everything|all|previous|prior|the system)/i, severity: 'critical', type: 'instruction_override' },
  { pattern: /forget (everything|all|what|your|the previous)/i, severity: 'high', type: 'instruction_override' },
  { pattern: /override (your |the )?(instructions?|programming|rules?|guidelines?)/i, severity: 'critical', type: 'instruction_override' },
  { pattern: /new (instructions?|rules?|guidelines?):/i, severity: 'high', type: 'prompt_injection' },

  // Role manipulation
  { pattern: /you are now( a| an)?/i, severity: 'high', type: 'prompt_injection' },
  { pattern: /pretend (you are|to be|you're)/i, severity: 'high', type: 'prompt_injection' },
  { pattern: /act as (a |an )?/i, severity: 'medium', type: 'prompt_injection' },
  { pattern: /assume the (role|identity|persona) of/i, severity: 'high', type: 'prompt_injection' },

  // Jailbreak patterns
  { pattern: /jailbreak/i, severity: 'critical', type: 'jailbreak_attempt' },
  { pattern: /DAN (mode|prompt)/i, severity: 'critical', type: 'jailbreak_attempt' },
  { pattern: /developer mode/i, severity: 'high', type: 'jailbreak_attempt' },
  { pattern: /bypass (your |the )?(filters?|restrictions?|safety|guidelines?)/i, severity: 'critical', type: 'jailbreak_attempt' },

  // System prompt extraction
  { pattern: /what (is|are) your (system|initial|original) (prompt|instructions?)/i, severity: 'high', type: 'system_prompt_leak' },
  { pattern: /reveal your (prompt|instructions?|programming)/i, severity: 'high', type: 'system_prompt_leak' },
  { pattern: /repeat (your |the )?(system |initial )?(prompt|instructions?)/i, severity: 'high', type: 'system_prompt_leak' },

  // Markup injection
  { pattern: /\[SYSTEM\]/i, severity: 'critical', type: 'malformed_markup' },
  { pattern: /\[INST\]/i, severity: 'critical', type: 'malformed_markup' },
  { pattern: /<\|im_start\|>/i, severity: 'critical', type: 'malformed_markup' },
  { pattern: /<<SYS>>/i, severity: 'critical', type: 'malformed_markup' },
];

const EXFIL_PATTERNS: Array<{ pattern: RegExp; severity: ThreatSeverity; type: ThreatType }> = [
  { pattern: /send (this|the|all|my) (data|info|information|api|key|token|password|secret) to/i, severity: 'critical', type: 'data_exfiltration' },
  { pattern: /forward (everything|all|this|the data) to/i, severity: 'high', type: 'data_exfiltration' },
  { pattern: /include (the |my |your )?(api[_\s]?key|secret|password|token|credentials?)/i, severity: 'critical', type: 'data_exfiltration' },
  { pattern: /what (is |are )(your|the) (api[_\s]?key|secret|password|token|credentials?)/i, severity: 'critical', type: 'data_exfiltration' },
];

// =============================================================================
// In-Memory Rate Limiter
// =============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Rate limit configuration
const RATE_LIMITS = {
  userHourly: 100,
  channelHourly: 50,
  burst: 10, // per minute
};

/**
 * Check rate limit for a user/channel
 */
export function checkRateLimit(
  userId: string,
  channel: string,
  limitType: 'user' | 'channel' | 'burst' = 'user'
): RateLimitResult {
  const now = Date.now();
  const key = limitType === 'burst'
    ? `burst:${userId}:${channel}`
    : limitType === 'user'
    ? `user:${userId}`
    : `channel:${userId}:${channel}`;

  const windowMs = limitType === 'burst' ? 60000 : 3600000; // 1 minute or 1 hour
  const limit = limitType === 'burst'
    ? RATE_LIMITS.burst
    : limitType === 'user'
    ? RATE_LIMITS.userHourly
    : RATE_LIMITS.channelHourly;

  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
      limitType,
    };
  }

  // Existing window
  entry.count++;
  const allowed = entry.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: new Date(entry.windowStart + windowMs),
    limitType,
  };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupRateLimits, 600000);

// =============================================================================
// Security Scanning Functions
// =============================================================================

/**
 * Scan input text for security threats
 */
export function scanForThreats(text: string): SecurityScanResult {
  const threats: ThreatType[] = [];
  const threatDetails: ThreatDetail[] = [];
  let sanitized = text;
  let riskScore = 0;
  let highestSeverity: ThreatSeverity = 'low';

  const severityWeights: Record<ThreatSeverity, number> = {
    low: 10,
    medium: 25,
    high: 50,
    critical: 100,
  };

  // Check injection patterns
  for (const { pattern, severity, type } of INJECTION_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match && match[0]) {
        threats.push(type);
        threatDetails.push({
          type,
          pattern: pattern.source,
          match: match[0],
          position: match.index || 0,
          severity,
        });

        riskScore += severityWeights[severity];

        if (severityWeights[severity] > severityWeights[highestSeverity]) {
          highestSeverity = severity;
        }

        sanitized = sanitized.replace(match[0], '[FILTERED]');
      }
    }
  }

  // Check exfiltration patterns
  for (const { pattern, severity, type } of EXFIL_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      if (match && match[0]) {
        threats.push(type);
        threatDetails.push({
          type,
          pattern: pattern.source,
          match: match[0],
          position: match.index || 0,
          severity,
        });

        riskScore += severityWeights[severity];

        if (severityWeights[severity] > severityWeights[highestSeverity]) {
          highestSeverity = severity;
        }

        sanitized = sanitized.replace(match[0], '[FILTERED]');
      }
    }
  }

  const uniqueThreats = [...new Set(threats)];
  riskScore = Math.min(100, riskScore);

  let action: SecurityAction;
  if (riskScore >= 75 || highestSeverity === 'critical') {
    action = 'blocked';
  } else if (riskScore >= 50 || highestSeverity === 'high') {
    action = 'flagged';
  } else if (uniqueThreats.length > 0) {
    action = 'sanitized';
  } else {
    action = 'allowed';
  }

  return {
    safe: action === 'allowed' || action === 'sanitized',
    threats: uniqueThreats,
    threatDetails,
    sanitized,
    riskScore,
    severity: highestSeverity,
    action,
  };
}

/**
 * Quick threat check for fast pre-filtering
 */
export function quickThreatCheck(text: string): boolean {
  const quickPatterns = [
    /ignore.*instructions/i,
    /\[SYSTEM\]/i,
    /\[INST\]/i,
    /jailbreak/i,
    /system prompt/i,
    /reveal.*instructions/i,
  ];

  return quickPatterns.some(p => p.test(text));
}

/**
 * Log a security event (sends to Supabase)
 */
export async function logSecurityEvent(
  userId: string | null,
  scanResult: SecurityScanResult,
  channel?: string,
  rawInput?: string
): Promise<void> {
  // Only log significant events
  if (scanResult.riskScore < 25 && scanResult.action === 'allowed') {
    return;
  }

  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/log_security_event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseServiceKey}`,
        'apikey': config.supabaseServiceKey,
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_event_type: scanResult.threats[0] === 'prompt_injection' ? 'injection_attempt'
          : scanResult.threats[0] === 'data_exfiltration' ? 'exfil_attempt'
          : scanResult.threats[0] === 'jailbreak_attempt' ? 'jailbreak_attempt'
          : 'suspicious_pattern',
        p_severity: scanResult.severity,
        p_action_taken: scanResult.action,
        p_channel: channel || null,
        p_raw_input: rawInput?.substring(0, 1000) || null,
        p_detected_patterns: scanResult.threatDetails.map(t => t.pattern),
        p_risk_score: scanResult.riskScore,
        p_metadata: JSON.stringify({ threats: scanResult.threats }),
      }),
    });

    if (!response.ok) {
      console.error('[Security] Failed to log event:', response.status);
    }
  } catch (error) {
    console.error('[Security] Error logging event:', error);
  }
}
