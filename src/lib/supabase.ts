// src/lib/supabase.ts
// Supabase client configured for React Native / Expo
// Supports mock data mode for local development (EXPO_PUBLIC_USE_MOCK_DATA=true)

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/integrations/supabase/types';
import { DEV_MODE_CONFIG } from '@/config/devMode';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check if we're in mock data mode
const USE_MOCK_DATA = DEV_MODE_CONFIG.useMockData;

// Validate required environment variables (skip in mock mode)
if (!USE_MOCK_DATA && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    '[Supabase] Missing required environment variables. ' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env file. ' +
    'Or set EXPO_PUBLIC_USE_MOCK_DATA=true to use mock data.'
  );
}

// Log mode on startup
if (__DEV__) {
  if (USE_MOCK_DATA) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔶 [Supabase] MOCK DATA MODE');
    console.log('🔶 No database connection - using in-memory data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    // Detect environment from URL
    const isProd = SUPABASE_URL?.includes('vpqglbaedcpeprnlnfxd');
    const envName = isProd ? 'PRODUCTION' : 'DEV/STAGE';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [Supabase] CONNECTED TO REAL DATABASE');
    console.log(`✅ Project: ${SUPABASE_URL}`);
    console.log(`✅ Environment: ${envName}`);
    console.log(`✅ All queries will hit ${envName} Supabase`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// Custom storage adapter that uses SecureStore for sensitive auth data
// and AsyncStorage for general storage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // SecureStore has a 2KB limit, so we use it only for auth tokens
      if (Platform.OS === 'web') {
        // Use localStorage on web
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore getItem error, falling back to AsyncStorage:', error);
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      // SecureStore has a 2KB limit
      if (value.length > 2000) {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.warn('SecureStore setItem error, falling back to AsyncStorage:', error);
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
      await AsyncStorage.removeItem(key); // Clean up both storages
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
      await AsyncStorage.removeItem(key);
    }
  },
};

// Initialize real Supabase client for React Native with Database types
// Only create if we have valid credentials (not in mock mode with placeholders)
const realSupabase = (!USE_MOCK_DATA && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important: disable for mobile
      },
      global: {
        headers: {
          'X-Client-Info': 'doughy-app',
        },
      },
    })
  : null;

// Import mock client lazily to avoid circular dependencies
let mockClientInstance: ReturnType<typeof import('./mockData').createMockClient> | null = null;

function getMockClient() {
  if (!mockClientInstance) {
    // Dynamic import to avoid circular dependency
    const { createMockClient } = require('./mockData');
    mockClientInstance = createMockClient();
  }
  return mockClientInstance;
}

/**
 * Main Supabase client export
 *
 * In mock mode: Uses in-memory mock data (fast, no network)
 * In normal mode: Uses real Supabase connection
 *
 * Usage is identical - call supabase.from('table').select() etc.
 */
// Type assertion to maintain compatibility - mock client implements same interface
export const supabase = (USE_MOCK_DATA
  ? getMockClient()
  : realSupabase!) as ReturnType<typeof createClient<Database>>;

// ============================================================================
// Schema-specific query builders
// ============================================================================
// These helpers provide typed access to tables in domain-specific schemas.
// Usage: db.investor.dealsPipeline().select('*')
// ============================================================================

/**
 * Database helper for schema-qualified table access.
 * Provides typed query builders for each domain schema.
 */
export const db = {
  // ---------------------------------------------------------------------------
  // Investor schema (26 tables) - Real estate investment
  // ---------------------------------------------------------------------------
  investor: {
    dealsPipeline: () => supabase.schema('investor').from('deals_pipeline'),
    dealEvents: () => supabase.schema('investor').from('deal_events'),
    campaigns: () => supabase.schema('investor').from('campaigns'),
    dripCampaignSteps: () => supabase.schema('investor').from('drip_campaign_steps'),
    dripEnrollments: () => supabase.schema('investor').from('drip_enrollments'),
    dripTouchLogs: () => supabase.schema('investor').from('drip_touch_logs'),
    agents: () => supabase.schema('investor').from('agents'),
    followUps: () => supabase.schema('investor').from('follow_ups'),
    outreachTemplates: () => supabase.schema('investor').from('outreach_templates'),
    conversations: () => supabase.schema('investor').from('conversations'),
    messages: () => supabase.schema('investor').from('messages'),
    properties: () => supabase.schema('investor').from('properties'),
    propertyAnalyses: () => supabase.schema('investor').from('property_analyses'),
    propertyDocuments: () => supabase.schema('investor').from('property_documents'),
    propertyImages: () => supabase.schema('investor').from('property_images'),
    propertyMortgages: () => supabase.schema('investor').from('property_mortgages'),
    propertyDebts: () => supabase.schema('investor').from('property_debts'),
    comps: () => supabase.schema('investor').from('comps'),
    repairEstimates: () => supabase.schema('investor').from('repair_estimates'),
    financingScenarios: () => supabase.schema('investor').from('financing_scenarios'),
    buyingCriteria: () => supabase.schema('investor').from('buying_criteria'),
    portfolioEntries: () => supabase.schema('investor').from('portfolio_entries'),
    portfolioGroups: () => supabase.schema('investor').from('portfolio_groups'),
    portfolioMonthlyRecords: () => supabase.schema('investor').from('portfolio_monthly_records'),
    portfolioMortgages: () => supabase.schema('investor').from('portfolio_mortgages'),
    portfolioValuations: () => supabase.schema('investor').from('portfolio_valuations'),
  },

  // ---------------------------------------------------------------------------
  // Landlord schema (19 tables) - Rental property management
  // ---------------------------------------------------------------------------
  landlord: {
    properties: () => supabase.schema('landlord').from('properties'),
    rooms: () => supabase.schema('landlord').from('rooms'),
    bookings: () => supabase.schema('landlord').from('bookings'),
    bookingCharges: () => supabase.schema('landlord').from('booking_charges'),
    depositSettlements: () => supabase.schema('landlord').from('deposit_settlements'),
    conversations: () => supabase.schema('landlord').from('conversations'),
    messages: () => supabase.schema('landlord').from('messages'),
    aiQueueItems: () => supabase.schema('landlord').from('ai_queue_items'),
    templates: () => supabase.schema('landlord').from('templates'),
    guestMessages: () => supabase.schema('landlord').from('guest_messages'),
    guestTemplates: () => supabase.schema('landlord').from('guest_templates'),
    inventoryItems: () => supabase.schema('landlord').from('inventory_items'),
    maintenanceRecords: () => supabase.schema('landlord').from('maintenance_records'),
    turnovers: () => supabase.schema('landlord').from('turnovers'),
    turnoverTemplates: () => supabase.schema('landlord').from('turnover_templates'),
    vendors: () => supabase.schema('landlord').from('vendors'),
    vendorMessages: () => supabase.schema('landlord').from('vendor_messages'),
    integrations: () => supabase.schema('landlord').from('integrations'),
    emailConnections: () => supabase.schema('landlord').from('email_connections'),
  },

  // ---------------------------------------------------------------------------
  // AI schema (23 tables) - AI/ML related
  // ---------------------------------------------------------------------------
  ai: {
    jobs: () => supabase.schema('ai').from('jobs'),
    sessions: () => supabase.schema('ai').from('sessions'),
    responseOutcomes: () => supabase.schema('ai').from('response_outcomes'),
    autoSendRules: () => supabase.schema('ai').from('auto_send_rules'),
    captureItems: () => supabase.schema('ai').from('capture_items'),
    confidenceAdjustments: () => supabase.schema('ai').from('confidence_adjustments'),
    moltbotSecurityLogs: () => supabase.schema('ai').from('moltbot_security_logs'),
    moltbotRateLimits: () => supabase.schema('ai').from('moltbot_rate_limits'),
    moltbotBlockedPatterns: () => supabase.schema('ai').from('moltbot_blocked_patterns'),
    moltbotBlockedIps: () => supabase.schema('ai').from('moltbot_blocked_ips'),
    moltbotUserThreatScores: () => supabase.schema('ai').from('moltbot_user_threat_scores'),
    moltbotUserMemories: () => supabase.schema('ai').from('moltbot_user_memories'),
    moltbotEpisodicMemories: () => supabase.schema('ai').from('moltbot_episodic_memories'),
    moltbotKnowledgeSources: () => supabase.schema('ai').from('moltbot_knowledge_sources'),
    moltbotKnowledgeChunks: () => supabase.schema('ai').from('moltbot_knowledge_chunks'),
    moltbotKnowledgeTags: () => supabase.schema('ai').from('moltbot_knowledge_tags'),
    moltbotKnowledgeChunkTags: () => supabase.schema('ai').from('moltbot_knowledge_chunk_tags'),
    moltbotGlobalKnowledge: () => supabase.schema('ai').from('moltbot_global_knowledge'),
    moltbotLearningQueueItems: () => supabase.schema('ai').from('moltbot_learning_queue_items'),
    moltbotSyncRecords: () => supabase.schema('ai').from('moltbot_sync_records'),
    moltbotResponseExamples: () => supabase.schema('ai').from('moltbot_response_examples'),
    moltbotEmailAnalyses: () => supabase.schema('ai').from('moltbot_email_analyses'),
    moltbotCircuitBreakers: () => supabase.schema('ai').from('moltbot_circuit_breakers'),
  },

  // ---------------------------------------------------------------------------
  // CRM schema (5 tables) - Customer relationship management
  // ---------------------------------------------------------------------------
  crm: {
    contacts: () => supabase.schema('crm').from('contacts'),
    leads: () => supabase.schema('crm').from('leads'),
    skipTraceResults: () => supabase.schema('crm').from('skip_trace_results'),
    optOuts: () => supabase.schema('crm').from('opt_outs'),
    touches: () => supabase.schema('crm').from('touches'),
  },

  // ---------------------------------------------------------------------------
  // Integrations schema (9 tables) - Third-party integrations
  // ---------------------------------------------------------------------------
  integrations: {
    seamConnectedDevices: () => supabase.schema('integrations').from('seam_connected_devices'),
    seamAccessCodes: () => supabase.schema('integrations').from('seam_access_codes'),
    seamLockEvents: () => supabase.schema('integrations').from('seam_lock_events'),
    seamWorkspaces: () => supabase.schema('integrations').from('seam_workspaces'),
    userIntegrations: () => supabase.schema('integrations').from('user_integrations'),
    gmailTokens: () => supabase.schema('integrations').from('gmail_tokens'),
    metaDmCredentials: () => supabase.schema('integrations').from('meta_dm_credentials'),
    postgridCredentials: () => supabase.schema('integrations').from('postgrid_credentials'),
    mailCreditTransactions: () => supabase.schema('integrations').from('mail_credit_transactions'),
  },

  // ---------------------------------------------------------------------------
  // Public schema - Shared infrastructure (no .schema() needed)
  // ---------------------------------------------------------------------------
  public: {
    userProfiles: () => supabase.from('user_profiles'),
    workspaces: () => supabase.from('workspaces'),
    workspaceMembers: () => supabase.from('workspace_members'),
    userPlatformSettings: () => supabase.from('user_platform_settings'),
    userMailCredits: () => supabase.from('user_mail_credits'),
    calls: () => supabase.from('calls'),
    callSummaries: () => supabase.from('call_summaries'),
    callTranscriptSegments: () => supabase.from('call_transcript_segments'),
    callAiSuggestions: () => supabase.from('call_ai_suggestions'),
    systemLogs: () => supabase.from('system_logs'),
    billingStripeCustomers: () => supabase.from('billing_stripe_customers'),
    billingSubscriptionEvents: () => supabase.from('billing_subscription_events'),
  },
};

// Legacy alias for backward compatibility - will be removed in future version
/** @deprecated Use db.investor instead */
export const realEstateDB = {
  properties: () => supabase.schema('investor').from('properties'),
  comps: () => supabase.schema('investor').from('comps'),
};

// Export URL for deep linking configuration
export { SUPABASE_URL };

// Export mock mode status for conditional logic elsewhere
export { USE_MOCK_DATA };
