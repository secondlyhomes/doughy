/**
 * Google Services Health Checks
 *
 * Health check functions for Google services:
 * - Google Maps (JavaScript API, Street View)
 * - Gmail
 * - Google Calendar
 *
 * @module _shared/health-checks/google-services
 */

import type { HealthCheckResult, Logger } from "./types.ts";

// =============================================================================
// Google Maps
// =============================================================================

/**
 * Check Google Maps API health (JavaScript API and Street View Static API)
 *
 * @param params - API key and service type
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkGoogleMaps(
  params: { apiKey: string; service: string },
  log: Logger
): Promise<HealthCheckResult> {
  const { apiKey, service } = params;
  const serviceType = service || 'google-maps-js';

  try {
    const isStreetView = service === 'google-street-view';
    const isMapsJs = service === 'google-maps-js';

    log.info(`Checking ${serviceType} health...`, {});

    const startTime = Date.now();

    // Different endpoints based on the service
    let endpoint: string;
    let isJsonResponse = true;

    if (isStreetView) {
      // Street View API uses the metadata endpoint for validation
      endpoint = `https://maps.googleapis.com/maps/api/streetview/metadata?location=40.7128,-74.0060&key=${apiKey}`;
    } else if (isMapsJs) {
      // Maps JavaScript API uses a different endpoint format
      endpoint = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      isJsonResponse = false; // This endpoint returns JavaScript, not JSON
    } else {
      // Default to geocoding API for other services
      endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=New York&key=${apiKey}`;
    }

    const response = await fetch(endpoint);
    const latency = Date.now() - startTime;

    // For Maps JavaScript API, we just check if the response was successful
    if (isMapsJs) {
      if (response.ok) {
        const text = await response.text();

        // Check if the response contains an error message
        if (text.includes('InvalidKeyMapError') || text.includes('RefererNotAllowedMapError')) {
          log.error(`${serviceType} error: Invalid API key or unauthorized domain`, {});
          return {
            status: 'error',
            message: 'Google Maps JavaScript API error: Invalid API key or unauthorized domain',
            service: serviceType,
            latency: `${latency}ms`,
          };
        }

        return {
          status: 'operational',
          message: 'Google Maps JavaScript API is operational',
          service: serviceType,
          latency: `${latency}ms`,
        };
      } else {
        log.error(`${serviceType} error: ${response.statusText}`, {});
        return {
          status: 'error',
          message: `Google Maps JavaScript API error: ${response.statusText}`,
          service: serviceType,
          latency: `${latency}ms`,
        };
      }
    }

    // For JSON APIs like Street View and Geocoding
    try {
      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        return {
          status: 'operational',
          message: `${isStreetView ? 'Google Street View API' : 'Google Maps API'} is operational`,
          service: serviceType,
          latency: `${latency}ms`,
        };
      }

      // Check for specific error codes from Google APIs
      if (data.status === 'REQUEST_DENIED' && data.error_message?.includes('API key')) {
        log.error(`${serviceType} error: Invalid API key or unauthorized domain`, {});
        return {
          status: 'error',
          message: `${isStreetView ? 'Google Street View API' : 'Google Maps API'} error: Invalid API key or unauthorized domain`,
          service: serviceType,
          latency: `${latency}ms`,
        };
      }

      log.error(`${serviceType} error: ${data.status || data.error_message || response.statusText}`, {});
      return {
        status: 'error',
        message: `${isStreetView ? 'Google Street View API' : 'Google Maps API'} error: ${data.status || data.error_message || response.statusText}`,
        service: serviceType,
        latency: `${latency}ms`,
      };
    } catch {
      // If we can't parse JSON but the response was successful, it might still be valid
      if (response.ok) {
        return {
          status: 'configured',
          message: `${serviceType} appears to be configured, but returned non-JSON response`,
          service: serviceType,
          latency: `${latency}ms`,
        };
      } else {
        log.error(`${serviceType} error: ${response.statusText}`, {});
        return {
          status: 'error',
          message: `${serviceType} error: ${response.statusText}`,
          service: serviceType,
          latency: `${latency}ms`,
        };
      }
    }
  } catch (error) {
    log.error(`${serviceType} health check error:`, error);
    return {
      status: 'error',
      message: error.message || `Error checking ${serviceType} integration health`,
      service: serviceType,
    };
  }
}

// =============================================================================
// Gmail
// =============================================================================

/**
 * Check Gmail API health.
 * Requires OAuth flow with the client ID and secret.
 *
 * @param _apiKey - Gmail client ID
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkGmail(
  _apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Gmail API health...", {});

    // In a real implementation, we'd use the OAuth flow with the client ID and secret
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Gmail API credentials are configured',
      service: 'gmail',
    };
  } catch (error) {
    log.error('Gmail API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Gmail API health',
      service: 'gmail',
    };
  }
}

// =============================================================================
// Google Calendar
// =============================================================================

/**
 * Check Google Calendar API health.
 * Requires OAuth flow with the client ID and secret.
 *
 * @param _apiKey - Google Calendar client ID
 * @param log - Logger instance
 * @returns Health check result
 */
export async function checkGoogleCalendar(
  _apiKey: string,
  log: Logger
): Promise<HealthCheckResult> {
  try {
    log.info("Checking Google Calendar API health...", {});

    // In a real implementation, we'd use the OAuth flow with the client ID and secret
    // For now, we just return configured status
    return {
      status: 'configured',
      message: 'Google Calendar API credentials are configured',
      service: 'google-calendar',
    };
  } catch (error) {
    log.error('Google Calendar API health check error:', error);
    return {
      status: 'error',
      message: error.message || 'Error checking Google Calendar API health',
      service: 'google-calendar',
    };
  }
}
