// src/utils/format.ts
// Formatting utility functions for React Native

// Format a number as currency
export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format currency with cents
export const formatCurrencyWithCents = (value: number | undefined): string => {
  if (value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format duration in seconds to mm:ss or hh:mm:ss
export const formatDuration = (seconds: number | undefined): string => {
  if (seconds === undefined || isNaN(seconds)) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format timestamp to readable date and time
export const formatTimestamp = (timestamp: string | number | Date | undefined): string => {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date only (no time)
export const formatDate = (
  dateString: string | number | Date | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Format as date with time separated by "at"
export const formatDatetime = (dateString: string | number | Date | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' at ' +
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: Date | string | number): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(then);
};

// Format number with commas
export const formatNumber = (value: number | undefined): string => {
  if (value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

// Format percentage
export const formatPercentage = (value: number | undefined, decimals = 1): string => {
  if (value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// Format phone number
export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
