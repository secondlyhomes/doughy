// src/config/devMode.ts
// Development mode configuration for local-first development

/**
 * Development mode configuration
 *
 * When EXPO_PUBLIC_USE_MOCK_DATA=true:
 * - App uses in-memory mock data instead of Supabase
 * - No network calls to database
 * - Fast iteration for UI development
 *
 * Usage:
 *   cp .env.dev .env.local && npx expo start
 */
export const DEV_MODE_CONFIG = {
  /**
   * Whether to use mock data instead of real Supabase
   * Enabled via EXPO_PUBLIC_USE_MOCK_DATA=true AND __DEV__ mode
   */
  useMockData:
    process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true' && __DEV__,

  /**
   * Simulated network delay in milliseconds
   * Makes mock data feel more realistic
   */
  mockNetworkDelay: 200,

  /**
   * Whether to log mock data operations to console
   */
  logMockOperations: __DEV__,

  /**
   * Seed for deterministic mock data generation
   * Same seed = same mock data every time
   */
  mockDataSeed: 'doughy-dev-2024',
} as const;

/**
 * Check if we're in mock data mode
 * Use this for conditional logic throughout the app
 */
export const isMockMode = () => DEV_MODE_CONFIG.useMockData;

/**
 * Helper to simulate network delay
 * Use in mock data implementations
 */
export const simulateNetworkDelay = async () => {
  if (DEV_MODE_CONFIG.mockNetworkDelay > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, DEV_MODE_CONFIG.mockNetworkDelay)
    );
  }
};

/**
 * Log mock operations if enabled
 */
export const logMockOperation = (operation: string, details?: unknown) => {
  if (DEV_MODE_CONFIG.logMockOperations) {
    console.log(`[MOCK] ${operation}`, details ?? '');
  }
};
