/**
 * Analytics Events Definitions
 *
 * Centralized, type-safe event definitions for analytics tracking.
 * This ensures consistency across the app and makes it easier to
 * audit what events are being tracked.
 *
 * @example
 * ```typescript
 * import { Events, trackEvent } from './events';
 *
 * // Track event
 * trackEvent(Events.USER_SIGNED_UP, {
 *   method: 'email',
 *   referrer: 'google',
 * });
 * ```
 */

import { trackEvent as _trackEvent } from './posthogConfig';

/**
 * Event categories for organization
 */
export enum EventCategory {
  USER = 'user',
  NAVIGATION = 'navigation',
  CONTENT = 'content',
  COMMERCE = 'commerce',
  SOCIAL = 'social',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

/**
 * Standard event names
 */
export const Events = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_DELETED_ACCOUNT: 'user_deleted_account',
  USER_CHANGED_PASSWORD: 'user_changed_password',
  USER_ENABLED_2FA: 'user_enabled_2fa',
  USER_DISABLED_2FA: 'user_disabled_2fa',

  // Navigation events
  SCREEN_VIEWED: 'screen_viewed',
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  TAB_CHANGED: 'tab_changed',
  LINK_CLICKED: 'link_clicked',

  // Content events
  CONTENT_CREATED: 'content_created',
  CONTENT_UPDATED: 'content_updated',
  CONTENT_DELETED: 'content_deleted',
  CONTENT_SHARED: 'content_shared',
  CONTENT_LIKED: 'content_liked',
  CONTENT_COMMENTED: 'content_commented',
  CONTENT_VIEWED: 'content_viewed',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  FILTER_APPLIED: 'filter_applied',
  SORT_CHANGED: 'sort_changed',

  // Commerce events
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_ADDED_TO_CART: 'product_added_to_cart',
  PRODUCT_REMOVED_FROM_CART: 'product_removed_from_cart',
  CART_VIEWED: 'cart_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  PAYMENT_INFO_ENTERED: 'payment_info_entered',
  PURCHASE_COMPLETED: 'purchase_completed',
  REFUND_REQUESTED: 'refund_requested',

  // Subscription events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',

  // Feature usage events
  FEATURE_USED: 'feature_used',
  FEATURE_ENABLED: 'feature_enabled',
  FEATURE_DISABLED: 'feature_disabled',
  BUTTON_CLICKED: 'button_clicked',
  FORM_STARTED: 'form_started',
  FORM_SUBMITTED: 'form_submitted',
  FORM_ABANDONED: 'form_abandoned',
  FORM_ERROR: 'form_error',

  // Social events
  INVITE_SENT: 'invite_sent',
  INVITE_ACCEPTED: 'invite_accepted',
  FRIEND_ADDED: 'friend_added',
  FRIEND_REMOVED: 'friend_removed',
  MESSAGE_SENT: 'message_sent',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',

  // Performance events
  APP_LAUNCHED: 'app_launched',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_FOREGROUNDED: 'app_foregrounded',
  SLOW_OPERATION: 'slow_operation',
  PERFORMANCE_ISSUE: 'performance_issue',

  // Onboarding events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Settings events
  SETTINGS_CHANGED: 'settings_changed',
  THEME_CHANGED: 'theme_changed',
  LANGUAGE_CHANGED: 'language_changed',
  NOTIFICATION_SETTINGS_CHANGED: 'notification_settings_changed',

  // Help & Support events
  HELP_VIEWED: 'help_viewed',
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  FAQ_VIEWED: 'faq_viewed',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
} as const;

/**
 * Type for event names
 */
export type EventName = typeof Events[keyof typeof Events];

/**
 * Event property types for type safety
 */
export interface EventProperties {
  // User events
  [Events.USER_SIGNED_UP]: {
    method: 'email' | 'google' | 'apple' | 'facebook';
    referrer?: string;
  };
  [Events.USER_LOGGED_IN]: {
    method: 'email' | 'google' | 'apple' | 'facebook';
  };

  // Navigation events
  [Events.SCREEN_VIEWED]: {
    screen_name: string;
    previous_screen?: string;
  };
  [Events.MODAL_OPENED]: {
    modal_name: string;
    trigger?: string;
  };
  [Events.TAB_CHANGED]: {
    tab_name: string;
    previous_tab?: string;
  };

  // Content events
  [Events.CONTENT_CREATED]: {
    content_type: string;
    content_id?: string;
  };
  [Events.CONTENT_VIEWED]: {
    content_type: string;
    content_id: string;
    duration_ms?: number;
  };
  [Events.CONTENT_SHARED]: {
    content_type: string;
    content_id: string;
    share_method: string;
  };

  // Search events
  [Events.SEARCH_PERFORMED]: {
    query: string;
    results_count: number;
    category?: string;
  };
  [Events.SEARCH_RESULT_CLICKED]: {
    query: string;
    result_id: string;
    result_position: number;
  };

  // Commerce events
  [Events.PRODUCT_VIEWED]: {
    product_id: string;
    product_name: string;
    product_category?: string;
    price: number;
    currency: string;
  };
  [Events.PRODUCT_ADDED_TO_CART]: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    currency: string;
  };
  [Events.PURCHASE_COMPLETED]: {
    transaction_id: string;
    total: number;
    currency: string;
    items_count: number;
    payment_method: string;
  };

  // Subscription events
  [Events.SUBSCRIPTION_STARTED]: {
    plan_id: string;
    plan_name: string;
    price: number;
    currency: string;
    billing_period: 'monthly' | 'yearly';
  };

  // Feature events
  [Events.FEATURE_USED]: {
    feature_name: string;
    feature_params?: Record<string, any>;
  };
  [Events.BUTTON_CLICKED]: {
    button_id: string;
    button_text?: string;
    screen?: string;
  };
  [Events.FORM_SUBMITTED]: {
    form_name: string;
    duration_ms?: number;
  };

  // Error events
  [Events.ERROR_OCCURRED]: {
    error_message: string;
    error_code?: string;
    screen?: string;
  };
  [Events.API_ERROR]: {
    endpoint: string;
    status_code: number;
    error_message: string;
  };

  // Performance events
  [Events.SLOW_OPERATION]: {
    operation: string;
    duration_ms: number;
    threshold_ms: number;
  };

  // Generic fallback
  [key: string]: Record<string, any> | undefined;
}

/**
 * Type-safe event tracking function
 *
 * @example
 * ```typescript
 * trackEvent(Events.USER_SIGNED_UP, {
 *   method: 'email',
 *   referrer: 'google',
 * });
 * ```
 */
export function trackEvent<K extends EventName>(
  eventName: K,
  properties?: EventProperties[K]
): void {
  _trackEvent(eventName, properties as Record<string, any>);
}

/**
 * Validate event properties
 */
export function validateEventProperties<K extends EventName>(
  eventName: K,
  properties?: EventProperties[K]
): boolean {
  // Required properties for specific events
  const requiredProperties: Partial<Record<EventName, string[]>> = {
    [Events.USER_SIGNED_UP]: ['method'],
    [Events.SCREEN_VIEWED]: ['screen_name'],
    [Events.PRODUCT_VIEWED]: ['product_id', 'product_name', 'price', 'currency'],
    [Events.PURCHASE_COMPLETED]: ['transaction_id', 'total', 'currency'],
  };

  const required = requiredProperties[eventName];

  if (!required) {
    return true; // No validation for this event
  }

  if (!properties) {
    console.warn(`[Analytics] Missing required properties for ${eventName}:`, required);
    return false;
  }

  const missing = required.filter(key => !(key in properties));

  if (missing.length > 0) {
    console.warn(
      `[Analytics] Missing required properties for ${eventName}:`,
      missing
    );
    return false;
  }

  return true;
}

/**
 * Validated event tracking (only tracks if properties are valid)
 *
 * @example
 * ```typescript
 * trackValidatedEvent(Events.USER_SIGNED_UP, {
 *   method: 'email',
 * });
 * ```
 */
export function trackValidatedEvent<K extends EventName>(
  eventName: K,
  properties?: EventProperties[K]
): void {
  if (validateEventProperties(eventName, properties)) {
    trackEvent(eventName, properties);
  }
}

/**
 * Get event category
 */
export function getEventCategory(eventName: EventName): EventCategory | undefined {
  if (eventName.startsWith('user_')) return EventCategory.USER;
  if (eventName.startsWith('screen_') || eventName.startsWith('modal_'))
    return EventCategory.NAVIGATION;
  if (eventName.startsWith('content_')) return EventCategory.CONTENT;
  if (eventName.startsWith('product_') || eventName.startsWith('purchase_'))
    return EventCategory.COMMERCE;
  if (eventName.startsWith('invite_') || eventName.startsWith('friend_'))
    return EventCategory.SOCIAL;
  if (eventName.startsWith('error_') || eventName.startsWith('api_'))
    return EventCategory.ERROR;
  if (eventName.startsWith('app_') || eventName.startsWith('slow_'))
    return EventCategory.PERFORMANCE;

  return undefined;
}
