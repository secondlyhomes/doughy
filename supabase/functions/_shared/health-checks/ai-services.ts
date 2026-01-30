/**
 * AI Services Health Checks
 *
 * Health check functions for AI service providers:
 * - OpenAI
 * - Anthropic
 * - Perplexity
 *
 * @module _shared/health-checks/ai-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";

// =============================================================================
// OpenAI
// =============================================================================

/**
 * Check OpenAI API health by making a GET request to the models endpoint.
 * This method does not consume tokens as it only checks API connectivity.
 *
 * @param apiKey - OpenAI API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkOpenAI(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking OpenAI API health using GET request...", {});

    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    log.info(`OpenAI API response status: ${response.status}`, {});

    if (response.ok) {
      return {
        status: 'operational',
        message: 'OpenAI API is reachable',
        service: 'openai',
        latency: `${latency}ms`,
      };
    }

    // Read response body to get detailed error message
    let errorDetails = '';
    try {
      const responseBody = await response.json();
      errorDetails = responseBody?.error?.message || '';
      log.error(`OpenAI API error details:`, { httpStatus: response.status, body: responseBody });
    } catch {
      log.error(`OpenAI API error (no body):`, { httpStatus: response.status });
    }

    // Provide specific error messages based on HTTP status
    let errorMessage = '';
    if (response.status === 401) {
      errorMessage = errorDetails || 'Invalid or expired API key';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded';
    } else if (response.status >= 500) {
      errorMessage = 'OpenAI service temporarily unavailable';
    } else {
      errorMessage = errorDetails || `OpenAI API error: ${response.status} ${response.statusText}`;
    }

    log.error(errorMessage, { httpStatus: response.status });

    return {
      status: 'error',
      message: errorMessage,
      service: 'openai',
      latency: `${latency}ms`,
      http_status: response.status,
    };
  } catch (error) {
    log.error('OpenAI health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking OpenAI API health',
      service: 'openai',
    };
  }
}

// =============================================================================
// Anthropic
// =============================================================================

/**
 * Check Anthropic API health using GET request to models endpoint.
 * This method does not consume tokens as it only checks API connectivity.
 *
 * @param apiKey - Anthropic API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkAnthropic(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Anthropic API health...", {});

    const startTime = Date.now();

    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    log.info(`Anthropic API response status: ${response.status}`, {});

    if (response.ok) {
      return {
        status: 'operational',
        message: 'Anthropic API is reachable',
        service: 'anthropic',
        latency: `${latency}ms`,
      };
    }

    // Read response body to get detailed error message
    let errorDetails = '';
    try {
      const responseBody = await response.json();
      errorDetails = responseBody?.error?.message || '';
      log.error(`Anthropic API error details:`, { httpStatus: response.status, body: responseBody });
    } catch {
      log.error(`Anthropic API error (no body):`, { httpStatus: response.status });
    }

    // Provide specific error messages based on HTTP status
    let errorMessage = '';
    if (response.status === 401) {
      errorMessage = errorDetails || 'Invalid or expired API key';
    } else if (response.status === 403) {
      errorMessage = errorDetails || 'API key lacks required permissions';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded';
    } else if (response.status >= 500) {
      errorMessage = 'Anthropic service temporarily unavailable';
    } else {
      errorMessage = errorDetails || `Anthropic API error: ${response.status} ${response.statusText}`;
    }

    log.error(errorMessage, { httpStatus: response.status });

    return {
      status: 'error',
      message: errorMessage,
      service: 'anthropic',
      latency: `${latency}ms`,
      http_status: response.status,
    };
  } catch (error) {
    log.error('Anthropic health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Anthropic API health',
      service: 'anthropic',
    };
  }
}

// =============================================================================
// Perplexity
// =============================================================================

/**
 * Check Perplexity API health using intentionally invalid request.
 * This method does not consume tokens but confirms API connectivity and authentication.
 *
 * @see https://docs.perplexity.ai/reference/post_chat_completions
 *
 * @param apiKey - Perplexity API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkPerplexity(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info('Checking Perplexity API health...', {});

    const startTime = Date.now();

    // Make a POST request with intentionally invalid body that will trigger validation error.
    // This confirms API connectivity without generating completions.
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        // Empty messages array will cause validation error before token usage
        messages: [],
        max_tokens: 1,
      }),
    });

    const latency = Date.now() - startTime;

    log.info(`Perplexity API response status: ${response.status}`, {});

    // A 400 Bad Request is normal and indicates the API is operational.
    // It means the API received our request, validated auth, and rejected the invalid format.
    // This confirms connectivity without consuming tokens.
    const isOperational = response.ok || response.status === 400;

    if (isOperational) {
      log.info('Perplexity API health check successful', {});
      return {
        status: 'operational',
        message: 'Perplexity API is operational',
        service: 'perplexity',
        latency: `${latency}ms`,
      };
    }

    // If neither OK nor 400, there's an actual issue
    return {
      status: 'error',
      message: `Perplexity API error: ${response.status} ${response.statusText}`,
      service: 'perplexity',
      latency: `${latency}ms`,
    };
  } catch (error) {
    log.error('Perplexity health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Perplexity API health',
      service: 'perplexity',
    };
  }
}

// =============================================================================
// Bland.ai
// =============================================================================

/**
 * Check Bland.ai API health
 *
 * @param apiKey - Bland.ai API key
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkBlandAI(
  apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Bland.ai API health...", {});

    const startTime = Date.now();

    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'operational',
        message: 'Bland.ai API is operational',
        service: 'bland-ai',
        latency: `${latency}ms`,
      };
    }

    log.error("Bland.ai API error: " + response.statusText, {});

    return {
      status: 'error',
      message: `Bland.ai API error: ${response.statusText}`,
      service: 'bland-ai',
      latency: `${latency}ms`,
    };
  } catch (error) {
    log.error('Bland.ai API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Bland.ai API health',
      service: 'bland-ai',
    };
  }
}
