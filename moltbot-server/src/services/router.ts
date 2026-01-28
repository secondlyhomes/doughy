/**
 * Platform Router Service
 *
 * Routes incoming messages to appropriate platform handlers and loads
 * the correct skills based on the platform and message context.
 *
 * MoltBot evolves from "AI Property Manager" to "Universal AI Assistant"
 * that can handle:
 * - Landlord: Guest/tenant communications, lead qualification
 * - Investor: Seller outreach, agent relationships, deal management
 * - Personal: Contact management, relationship nurturing
 *
 * @see /docs/moltbot-ecosystem-expansion.md for platform architecture
 */

import { config } from '../config.js';

// =============================================================================
// Types
// =============================================================================

export type Platform = 'landlord' | 'investor' | 'personal';

export type Channel = 'email' | 'whatsapp' | 'telegram' | 'sms' | 'discord' | 'imessage';

export type ContactContext = 'lead' | 'guest' | 'tenant' | 'seller' | 'agent' | 'personal' | 'room';

export interface IncomingMessage {
  channel: Channel;
  from: string;
  fromName?: string;
  to: string;
  subject?: string;
  body: string;
  timestamp: Date;
  channelMessageId?: string;
  channelThreadId?: string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface RoutingResult {
  platform: Platform;
  context: ContactContext;
  skills: string[];
  handler: PlatformHandler;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface PlatformHandler {
  name: string;
  process(message: IncomingMessage, userId: string): Promise<ProcessingResult>;
}

export interface ProcessingResult {
  success: boolean;
  action: 'auto_sent' | 'queued' | 'ignored' | 'error';
  response?: string;
  confidence?: number;
  suggestedActions?: string[];
  error?: string;
}

export interface UserPlatformSettings {
  activePlatforms: Platform[];
  landlordEnabled: boolean;
  investorEnabled: boolean;
  personalEnabled: boolean;
  routingRules: RoutingRule[];
}

export interface RoutingRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  platform: Platform;
  context: ContactContext;
  priority: number;
}

export interface RuleCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'channel' | 'domain';
  operator: 'contains' | 'equals' | 'matches' | 'not_contains';
  value: string;
}

// =============================================================================
// Skill Registry
// =============================================================================

/**
 * Skills available for each platform and context
 */
const SKILL_REGISTRY: Record<Platform, Record<string, string[]>> = {
  landlord: {
    default: ['doughy-core', 'doughy-lead'],
    lead: ['doughy-core', 'doughy-lead', 'doughy-platform'],
    guest: ['doughy-core', 'doughy-guest', 'doughy-booking'],
    tenant: ['doughy-core', 'doughy-guest', 'doughy-booking'],
    room: ['doughy-core', 'doughy-room', 'doughy-booking'],
  },
  investor: {
    default: ['doughy-core', 'doughy-investor-core'],
    seller: ['doughy-core', 'doughy-investor-core', 'doughy-investor-outreach'],
    agent: ['doughy-core', 'doughy-investor-core', 'doughy-investor-outreach'],
  },
  personal: {
    default: ['doughy-core', 'doughy-personal-crm'],
    personal: ['doughy-core', 'doughy-personal-crm'],
  },
};

/**
 * Get skills for a platform and context
 */
export function getSkillsForContext(platform: Platform, context: ContactContext): string[] {
  const platformSkills = SKILL_REGISTRY[platform];
  if (!platformSkills) {
    return SKILL_REGISTRY.landlord.default;
  }

  return platformSkills[context] || platformSkills.default;
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Rental platform domains for landlord routing
 */
const RENTAL_PLATFORM_DOMAINS = [
  'airbnb.com',
  'furnishedfinder.com',
  'turbotenant.com',
  'zillow.com',
  'apartments.com',
  'hotpads.com',
  'rent.com',
  'booking.com',
  'vrbo.com',
  'facebook.com', // Marketplace
  'craigslist.org',
];

/**
 * RE Investor platform domains
 */
const INVESTOR_PLATFORM_DOMAINS = [
  'propstream.com',
  'batchleads.io',
  'realeflow.com',
  'podio.com',
  'followupboss.com',
  'freedomsoft.com',
];

/**
 * Email patterns for context detection
 */
const CONTEXT_PATTERNS: Record<ContactContext, RegExp[]> = {
  lead: [
    /inquir/i,
    /looking for/i,
    /interested in/i,
    /available/i,
    /move.?in/i,
    /rental/i,
  ],
  guest: [
    /check.?in/i,
    /reservation/i,
    /booking.*confirm/i,
    /staying/i,
    /arrival/i,
  ],
  tenant: [
    /rent.*(due|payment)/i,
    /lease/i,
    /maintenance/i,
    /repair/i,
    /landlord/i,
  ],
  seller: [
    /sell.*property/i,
    /selling.*house/i,
    /motivated seller/i,
    /cash offer/i,
    /as.?is/i,
  ],
  agent: [
    /listing/i,
    /commission/i,
    /under contract/i,
    /mls/i,
    /showing/i,
  ],
  personal: [
    /catch up/i,
    /how are you/i,
    /long time/i,
    /birthday/i,
    /congrat/i,
  ],
  room: [
    /room/i,
    /roommate/i,
    /shared/i,
    /private bath/i,
    /furnished room/i,
  ],
};

/**
 * Detect the sender's domain
 */
function extractDomain(email: string): string | null {
  const match = email.match(/@([a-zA-Z0-9.-]+)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Check if a domain matches a list of known domains
 */
function isDomainMatch(domain: string | null, knownDomains: string[]): boolean {
  if (!domain) return false;
  return knownDomains.some(known =>
    domain === known || domain.endsWith('.' + known)
  );
}

/**
 * Detect context from message content
 */
function detectContext(message: IncomingMessage): { context: ContactContext; confidence: number } {
  const searchText = `${message.subject || ''} ${message.body}`.toLowerCase();

  const scores: Partial<Record<ContactContext, number>> = {};

  for (const [context, patterns] of Object.entries(CONTEXT_PATTERNS)) {
    const matchCount = patterns.filter(p => p.test(searchText)).length;
    if (matchCount > 0) {
      scores[context as ContactContext] = matchCount / patterns.length;
    }
  }

  // Find highest scoring context
  let bestContext: ContactContext = 'lead'; // default
  let bestScore = 0;

  for (const [context, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestContext = context as ContactContext;
      bestScore = score;
    }
  }

  return {
    context: bestContext,
    confidence: Math.min(1, bestScore * 2), // Scale up for confidence
  };
}

// =============================================================================
// Platform Router Class
// =============================================================================

export class PlatformRouter {
  private handlers: Map<Platform, PlatformHandler>;

  constructor() {
    this.handlers = new Map();

    // Register default handlers
    this.registerHandler('landlord', {
      name: 'landlord-handler',
      process: this.processLandlord.bind(this),
    });

    this.registerHandler('investor', {
      name: 'investor-handler',
      process: this.processInvestor.bind(this),
    });

    this.registerHandler('personal', {
      name: 'personal-handler',
      process: this.processPersonal.bind(this),
    });
  }

  /**
   * Register a platform handler
   */
  registerHandler(platform: Platform, handler: PlatformHandler): void {
    this.handlers.set(platform, handler);
  }

  /**
   * Route a message to the appropriate platform
   */
  async route(message: IncomingMessage, userId: string): Promise<RoutingResult> {
    // Get user's platform settings
    const settings = await this.getUserPlatformSettings(userId);

    // Check custom routing rules first
    for (const rule of settings.routingRules.sort((a, b) => b.priority - a.priority)) {
      if (this.matchesRule(message, rule)) {
        return {
          platform: rule.platform,
          context: rule.context,
          skills: getSkillsForContext(rule.platform, rule.context),
          handler: this.handlers.get(rule.platform)!,
          confidence: 1.0,
          metadata: { matchedRule: rule.id },
        };
      }
    }

    // Detect platform from domain
    const senderDomain = extractDomain(message.from);

    if (isDomainMatch(senderDomain, RENTAL_PLATFORM_DOMAINS) && settings.landlordEnabled) {
      const { context, confidence } = detectContext(message);
      return {
        platform: 'landlord',
        context,
        skills: getSkillsForContext('landlord', context),
        handler: this.handlers.get('landlord')!,
        confidence,
        metadata: { detectedDomain: senderDomain },
      };
    }

    if (isDomainMatch(senderDomain, INVESTOR_PLATFORM_DOMAINS) && settings.investorEnabled) {
      const { context, confidence } = detectContext(message);
      const investorContext = context === 'seller' || context === 'agent' ? context : 'seller';
      return {
        platform: 'investor',
        context: investorContext,
        skills: getSkillsForContext('investor', investorContext),
        handler: this.handlers.get('investor')!,
        confidence,
        metadata: { detectedDomain: senderDomain },
      };
    }

    // Content-based detection
    const { context, confidence } = detectContext(message);

    // Map detected context to platform
    let platform: Platform = 'landlord';
    if (['seller', 'agent'].includes(context) && settings.investorEnabled) {
      platform = 'investor';
    } else if (context === 'personal' && settings.personalEnabled) {
      platform = 'personal';
    } else if (settings.landlordEnabled) {
      platform = 'landlord';
    }

    return {
      platform,
      context,
      skills: getSkillsForContext(platform, context),
      handler: this.handlers.get(platform)!,
      confidence: confidence * 0.8, // Reduce confidence for content-based detection
      metadata: { detectionMethod: 'content' },
    };
  }

  /**
   * Check if a message matches a routing rule
   */
  private matchesRule(message: IncomingMessage, rule: RoutingRule): boolean {
    return rule.conditions.every(condition => {
      let value: string;

      switch (condition.field) {
        case 'from':
          value = message.from;
          break;
        case 'to':
          value = message.to;
          break;
        case 'subject':
          value = message.subject || '';
          break;
        case 'body':
          value = message.body;
          break;
        case 'channel':
          value = message.channel;
          break;
        case 'domain':
          value = extractDomain(message.from) || '';
          break;
        default:
          return false;
      }

      switch (condition.operator) {
        case 'contains':
          return value.toLowerCase().includes(condition.value.toLowerCase());
        case 'equals':
          return value.toLowerCase() === condition.value.toLowerCase();
        case 'matches':
          return new RegExp(condition.value, 'i').test(value);
        case 'not_contains':
          return !value.toLowerCase().includes(condition.value.toLowerCase());
        default:
          return false;
      }
    });
  }

  /**
   * Get user's platform settings
   */
  private async getUserPlatformSettings(userId: string): Promise<UserPlatformSettings> {
    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/user_platform_settings?user_id=eq.${userId}&select=landlord_settings,investor_settings,routing_rules`,
        {
          headers: {
            'Authorization': `Bearer ${config.supabaseServiceKey}`,
            'apikey': config.supabaseServiceKey,
          },
        }
      );

      if (!response.ok) {
        return this.getDefaultSettings();
      }

      const data = await response.json();
      const settings = data[0];

      if (!settings) {
        return this.getDefaultSettings();
      }

      return {
        activePlatforms: ['landlord'], // TODO: Expand based on settings
        landlordEnabled: settings.landlord_settings?.enabled !== false,
        investorEnabled: settings.investor_settings?.enabled === true,
        personalEnabled: false, // Not yet implemented
        routingRules: settings.routing_rules || [],
      };
    } catch (error) {
      console.error('[Router] Error fetching platform settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default platform settings
   */
  private getDefaultSettings(): UserPlatformSettings {
    return {
      activePlatforms: ['landlord'],
      landlordEnabled: true,
      investorEnabled: false,
      personalEnabled: false,
      routingRules: [],
    };
  }

  // ==========================================================================
  // Platform-Specific Handlers
  // ==========================================================================

  /**
   * Process message for landlord platform
   */
  private async processLandlord(message: IncomingMessage, userId: string): Promise<ProcessingResult> {
    // This delegates to the existing handler in handler.ts
    // For now, return a stub that indicates routing succeeded
    console.log(`[Router] Processing landlord message for user ${userId}`);
    return {
      success: true,
      action: 'queued',
      suggestedActions: ['use_existing_handler'],
    };
  }

  /**
   * Process message for investor platform
   */
  private async processInvestor(message: IncomingMessage, userId: string): Promise<ProcessingResult> {
    console.log(`[Router] Processing investor message for user ${userId}`);

    // TODO: Implement investor-specific processing
    // For now, queue for review
    return {
      success: true,
      action: 'queued',
      suggestedActions: ['implement_investor_handler'],
    };
  }

  /**
   * Process message for personal CRM platform
   */
  private async processPersonal(message: IncomingMessage, userId: string): Promise<ProcessingResult> {
    console.log(`[Router] Processing personal message for user ${userId}`);

    // TODO: Implement personal CRM processing
    // For now, queue for review
    return {
      success: true,
      action: 'queued',
      suggestedActions: ['implement_personal_handler'],
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let routerInstance: PlatformRouter | null = null;

/**
 * Get the platform router instance
 */
export function getRouter(): PlatformRouter {
  if (!routerInstance) {
    routerInstance = new PlatformRouter();
  }
  return routerInstance;
}

/**
 * Route a message through the platform router
 */
export async function routeMessage(
  message: IncomingMessage,
  userId: string
): Promise<RoutingResult> {
  const router = getRouter();
  return router.route(message, userId);
}
