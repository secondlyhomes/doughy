/**
 * AI Security Firewall
 *
 * Unified middleware wrapper that applies all security checks
 * to AI edge functions.
 *
 * Performance Design:
 * - Fast path checks first (circuit breaker, blocked users)
 * - In-memory caching reduces DB calls
 * - Async logging doesn't block responses
 * - Optional features can be disabled per-function
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  scanForThreats,
  filterOutput,
  shouldLogSecurityEvent,
  type SecurityScanResult,
} from "../security.ts";
import { isCircuitBreakerOpen } from "./circuit-breaker.ts";
import { checkRateLimit, calculateRetryAfter, formatRateLimitHeaders } from "./rate-limiter.ts";
import { isUserBlocked, updateThreatScore, calculateScoreDelta } from "./threat-tracker.ts";
import { getCompiledPatterns, recordPatternHit } from "./pattern-loader.ts";
import type {
  AIFirewallConfig,
  AISecurityContext,
  AIFirewallHandler,
  RateLimitResult,
  SecurityEventDetails,
  FirewallBlockedResponse,
} from "./types.ts";

// Default configuration
const DEFAULT_CONFIG: Required<AIFirewallConfig> = {
  functionName: 'unknown',
  enableCircuitBreaker: true,
  enableRateLimiting: true,
  enableThreatTracking: true,
  enableDatabasePatterns: true,
  enableInputScanning: true,
  enableOutputFiltering: true,
  functionHourlyLimit: 100,
  globalHourlyLimit: 200,
  burstLimit: 20,
  inputField: 'message',
  highThroughput: false,
};

/**
 * Create a blocked response
 */
function createBlockedResponse(
  block: FirewallBlockedResponse,
  corsHeaders: Record<string, string>
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  if (block.retryAfter) {
    headers['Retry-After'] = block.retryAfter.toString();
  }

  return new Response(JSON.stringify(block), {
    status: block.code === 'RATE_LIMITED' ? 429 : 403,
    headers,
  });
}

/**
 * Extract input text from request body based on config
 */
function extractInputText(
  body: Record<string, unknown>,
  inputField: string | string[]
): string {
  const fields = Array.isArray(inputField) ? inputField : [inputField];

  for (const field of fields) {
    const value = body[field];
    if (typeof value === 'string') {
      return value;
    }
    // Support nested messages array (for OpenAI-style requests)
    if (field === 'messages' && Array.isArray(value)) {
      const userMessages = value
        .filter((m: any) => m.role === 'user' && typeof m.content === 'string')
        .map((m: any) => m.content);
      if (userMessages.length > 0) {
        return userMessages.join('\n');
      }
    }
  }

  return '';
}

/**
 * Apply database patterns to scan result
 */
async function enhanceScanWithDbPatterns(
  supabase: SupabaseClient,
  text: string,
  baseScan: SecurityScanResult
): Promise<SecurityScanResult> {
  try {
    const compiledPatterns = await getCompiledPatterns(supabase);

    for (const { regex, pattern } of compiledPatterns) {
      const match = text.match(regex);
      if (match) {
        baseScan.threats.push(pattern.patternType as any);
        baseScan.threatDetails.push({
          type: pattern.patternType as any,
          pattern: pattern.pattern,
          match: match[0],
          position: match.index || 0,
          severity: pattern.severity,
        });

        // Update risk score based on severity
        const severityWeights = { low: 10, medium: 25, high: 50, critical: 100 };
        baseScan.riskScore = Math.min(100, baseScan.riskScore + severityWeights[pattern.severity]);

        // Update action if more severe
        if (pattern.severity === 'critical') {
          baseScan.action = 'blocked';
        } else if (pattern.severity === 'high' && baseScan.action !== 'blocked') {
          baseScan.action = 'flagged';
        }

        // Record hit asynchronously
        recordPatternHit(supabase, pattern.id);
      }
    }
  } catch (err) {
    console.error('[Firewall] Error applying DB patterns:', err);
  }

  return baseScan;
}

/**
 * Create the AI Firewall middleware wrapper
 *
 * @param config - Firewall configuration
 * @param handler - The actual request handler
 * @returns Wrapped handler with security checks
 */
export function withAIFirewall(
  config: Partial<AIFirewallConfig> | string,
  handler: AIFirewallHandler
): (req: Request) => Promise<Response> {
  // Allow passing just function name as string
  const fullConfig: Required<AIFirewallConfig> = {
    ...DEFAULT_CONFIG,
    ...(typeof config === 'string' ? { functionName: config } : config),
  };

  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();
    const auditId = crypto.randomUUID();

    // Get CORS headers from request
    const origin = req.headers.get('origin') || '*';
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Extract user ID from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch {
        // Continue without user ID
      }
    }

    // =========================================================================
    // FAST PATH CHECKS (in-memory, minimal latency)
    // =========================================================================

    // 1. Circuit Breaker Check
    if (fullConfig.enableCircuitBreaker) {
      const circuitState = await isCircuitBreakerOpen(supabase, fullConfig.functionName, userId);
      if (circuitState.isOpen) {
        return createBlockedResponse({
          error: `AI service temporarily unavailable: ${circuitState.reason || 'Circuit breaker open'}`,
          code: 'CIRCUIT_BREAKER_OPEN',
        }, corsHeaders);
      }
    }

    // 2. Blocked User Check (if user authenticated)
    if (fullConfig.enableThreatTracking && userId) {
      const isBlocked = await isUserBlocked(supabase, userId);
      if (isBlocked) {
        return createBlockedResponse({
          error: 'Access denied due to security policy',
          code: 'USER_BLOCKED',
        }, corsHeaders);
      }
    }

    // 3. Rate Limit Check (if user authenticated)
    let rateLimitResult: RateLimitResult = {
      allowed: true,
      limitType: 'allowed',
      currentCount: 0,
      remaining: fullConfig.functionHourlyLimit,
    };

    if (fullConfig.enableRateLimiting && userId) {
      rateLimitResult = await checkRateLimit(
        supabase,
        userId,
        fullConfig.functionName,
        'api',
        {
          globalHourlyLimit: fullConfig.globalHourlyLimit,
          functionHourlyLimit: fullConfig.functionHourlyLimit,
          burstLimit: fullConfig.burstLimit,
        }
      );

      if (!rateLimitResult.allowed) {
        const retryAfter = calculateRetryAfter(rateLimitResult.limitType);
        return createBlockedResponse({
          error: `Rate limit exceeded: ${rateLimitResult.limitType}`,
          code: 'RATE_LIMITED',
          retryAfter,
        }, { ...corsHeaders, ...formatRateLimitHeaders(rateLimitResult) });
      }
    }

    // =========================================================================
    // INPUT PROCESSING
    // =========================================================================

    // Parse request body
    let body: Record<string, unknown> = {};
    let inputText = '';

    try {
      body = await req.json();
      inputText = extractInputText(body, fullConfig.inputField);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 4. Security Scan (static patterns)
    let securityScan: SecurityScanResult = {
      safe: true,
      threats: [],
      threatDetails: [],
      sanitized: inputText,
      riskScore: 0,
      severity: 'low',
      action: 'allowed',
    };

    if (fullConfig.enableInputScanning && inputText) {
      securityScan = scanForThreats(inputText);

      // Enhance with database patterns if enabled
      if (fullConfig.enableDatabasePatterns) {
        securityScan = await enhanceScanWithDbPatterns(supabase, inputText, securityScan);
      }
    }

    // Handle blocked content
    if (securityScan.action === 'blocked') {
      // Update threat score asynchronously
      if (fullConfig.enableThreatTracking && userId) {
        updateThreatScore(supabase, {
          userId,
          scoreDelta: calculateScoreDelta(securityScan.severity),
          eventType: securityScan.threats[0] || 'unknown',
        });
      }

      return createBlockedResponse({
        error: 'Request blocked due to security policy',
        code: 'THREAT_BLOCKED',
      }, corsHeaders);
    }

    // =========================================================================
    // CREATE CONTEXT AND CALL HANDLER
    // =========================================================================

    // Update body with sanitized input
    const sanitizedBody = { ...body };
    if (typeof fullConfig.inputField === 'string' && sanitizedBody[fullConfig.inputField]) {
      sanitizedBody[fullConfig.inputField] = securityScan.sanitized;
    }

    // Async logging function
    const logSecurityEvent = (details: SecurityEventDetails): void => {
      if (fullConfig.highThroughput && details.severity === 'low') {
        return; // Skip low-severity logging in high-throughput mode
      }

      // Fire and forget
      supabase.rpc('log_security_event', {
        p_user_id: userId,
        p_event_type: details.eventType,
        p_severity: details.severity,
        p_action_taken: details.action,
        p_channel: details.channel,
        p_raw_input: details.rawInput?.substring(0, 1000),
        p_detected_patterns: details.detectedPatterns,
        p_risk_score: details.riskScore,
        p_metadata: details.metadata || {},
      }).then(() => {}).catch((err: Error) => {
        if (!fullConfig.highThroughput) {
          console.error('[Firewall] Error logging security event:', err.message);
        }
      });
    };

    // Log security events if warranted
    if (shouldLogSecurityEvent(securityScan)) {
      logSecurityEvent({
        eventType: securityScan.threats[0] === 'prompt_injection' ? 'injection_attempt'
          : securityScan.threats[0] === 'data_exfiltration' ? 'exfil_attempt'
          : securityScan.threats[0] === 'jailbreak_attempt' ? 'jailbreak_attempt'
          : 'suspicious_pattern',
        severity: securityScan.severity,
        action: securityScan.action,
        rawInput: inputText,
        detectedPatterns: securityScan.threatDetails.map(t => t.pattern),
        riskScore: securityScan.riskScore,
      });

      // Update threat score for flagged content
      if (fullConfig.enableThreatTracking && userId && securityScan.action === 'flagged') {
        updateThreatScore(supabase, {
          userId,
          scoreDelta: Math.floor(calculateScoreDelta(securityScan.severity) / 2),
          eventType: securityScan.threats[0] || 'unknown',
        });
      }
    }

    // Create context
    const context: AISecurityContext = {
      auditId,
      userId,
      functionName: fullConfig.functionName,
      sanitizedInput: securityScan.sanitized,
      originalBody: body,
      body: sanitizedBody,
      securityScan,
      rateLimit: rateLimitResult,
      supabase,
      startTime,
      logSecurityEvent,
    };

    // Call the actual handler
    try {
      const response = await handler(req, context);

      // Add rate limit headers if applicable
      if (fullConfig.enableRateLimiting && userId) {
        const newHeaders = new Headers(response.headers);
        for (const [key, value] of Object.entries(formatRateLimitHeaders(rateLimitResult))) {
          newHeaders.set(key, value);
        }
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      return response;
    } catch (err) {
      console.error(`[Firewall] Handler error in ${fullConfig.functionName}:`, err);
      return new Response(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  };
}

/**
 * Create a minimal firewall for high-throughput functions
 * Only does essential checks, skips logging
 */
export function withLightFirewall(
  functionName: string,
  handler: AIFirewallHandler
): (req: Request) => Promise<Response> {
  return withAIFirewall({
    functionName,
    enableCircuitBreaker: true,
    enableRateLimiting: true,
    enableThreatTracking: false,
    enableDatabasePatterns: false,
    enableInputScanning: true,
    enableOutputFiltering: false,
    highThroughput: true,
  }, handler);
}
