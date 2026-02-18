// src/utils/index.ts
// Export all utility functions

export {
  formatCurrency,
  formatCurrencyWithCents,
  formatDuration,
  formatTimestamp,
  formatDate,
  formatDatetime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatPhoneNumber,
  truncateText,
} from './format';

export { sanitizePhone, sanitizeEmail } from './sanitize';

export { SimpleEventEmitter } from './eventEmitter';
export { DebouncedFunctionsManager } from './debouncedFunctions';

export {
  getStatusColor,
  getTrendColor,
  getActivityColor,
  type StatusType,
  type ActivityType,
} from './colors';
