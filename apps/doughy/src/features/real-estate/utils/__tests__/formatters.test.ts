// Tests for formatters utility functions
import {
  formatFileSize,
  formatCurrency,
  formatNumber,
  formatSquareFeet,
  formatDate,
  formatRelativeTime,
  formatPercentage,
  formatPropertyType,
  formatAddress,
} from '../formatters';

describe('formatFileSize', () => {
  it('should return "0 B" for undefined', () => {
    expect(formatFileSize(undefined)).toBe('0 B');
  });

  it('should return "0 B" for null', () => {
    expect(formatFileSize(null)).toBe('0 B');
  });

  it('should return "0 B" for zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should return "0 B" for negative values', () => {
    expect(formatFileSize(-100)).toBe('0 B');
    expect(formatFileSize(-1)).toBe('0 B');
  });

  it('should format bytes correctly', () => {
    expect(formatFileSize(1)).toBe('1 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10240)).toBe('10.0 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(5242880)).toBe('5.0 MB');
    expect(formatFileSize(10485760)).toBe('10.0 MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
    expect(formatFileSize(2147483648)).toBe('2.0 GB');
  });

  it('should handle fractional sizes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2621440)).toBe('2.5 MB');
  });
});

describe('formatCurrency', () => {
  it('should return "N/A" for undefined', () => {
    expect(formatCurrency(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('should format currency correctly', () => {
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(250000)).toBe('$250,000');
    expect(formatCurrency(1500000)).toBe('$1,500,000');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-1000)).toBe('-$1,000');
  });
});

describe('formatNumber', () => {
  it('should return "N/A" for undefined', () => {
    expect(formatNumber(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null', () => {
    expect(formatNumber(null)).toBe('N/A');
  });

  it('should format numbers with commas', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });
});

describe('formatSquareFeet', () => {
  it('should return "N/A" for undefined', () => {
    expect(formatSquareFeet(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null', () => {
    expect(formatSquareFeet(null)).toBe('N/A');
  });

  it('should format with sqft suffix', () => {
    expect(formatSquareFeet(1500)).toBe('1,500 sqft');
    expect(formatSquareFeet(2500)).toBe('2,500 sqft');
  });
});

describe('formatDate', () => {
  it('should return "N/A" for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('should return "N/A" for empty string', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('should format valid date strings', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should return "N/A" for invalid date strings', () => {
    expect(formatDate('invalid-date')).toBe('N/A');
  });
});

describe('formatRelativeTime', () => {
  it('should return "N/A" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null', () => {
    expect(formatRelativeTime(null)).toBe('N/A');
  });

  it('should return "Today" for today', () => {
    const today = new Date().toISOString();
    expect(formatRelativeTime(today)).toBe('Today');
  });

  it('should return "Yesterday" for yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('should return days ago for recent dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  it('should return weeks ago for older dates', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });
});

describe('formatPercentage', () => {
  it('should return "N/A" for undefined', () => {
    expect(formatPercentage(undefined)).toBe('N/A');
  });

  it('should return "N/A" for null', () => {
    expect(formatPercentage(null)).toBe('N/A');
  });

  it('should format percentage with default decimals', () => {
    expect(formatPercentage(50)).toBe('50.0%');
    expect(formatPercentage(12.5)).toBe('12.5%');
  });

  it('should respect custom decimal places', () => {
    expect(formatPercentage(50, 0)).toBe('50%');
    expect(formatPercentage(12.567, 2)).toBe('12.57%');
  });
});

describe('formatPropertyType', () => {
  it('should return "Other" for undefined', () => {
    expect(formatPropertyType(undefined)).toBe('Other');
  });

  it('should format known property types', () => {
    expect(formatPropertyType('single_family')).toBe('Single Family');
    expect(formatPropertyType('multi_family')).toBe('Multi Family');
    expect(formatPropertyType('condo')).toBe('Condo');
    expect(formatPropertyType('townhouse')).toBe('Townhouse');
  });

  it('should handle case insensitivity', () => {
    expect(formatPropertyType('SINGLE_FAMILY')).toBe('Single Family');
    expect(formatPropertyType('Single_Family')).toBe('Single Family');
  });

  it('should return original value for unknown types', () => {
    expect(formatPropertyType('custom_type')).toBe('custom_type');
  });
});

describe('formatAddress', () => {
  it('should format complete address', () => {
    const result = formatAddress({
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    });
    expect(result).toContain('123 Main St');
    expect(result).toContain('Austin');
    expect(result).toContain('TX');
    expect(result).toContain('78701');
  });

  it('should handle address_line_1 fallback', () => {
    const result = formatAddress({
      address_line_1: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
    });
    expect(result).toContain('456 Oak Ave');
  });

  it('should include address_line_2 when present', () => {
    const result = formatAddress({
      address: '123 Main St',
      address_line_2: 'Apt 4B',
      city: 'Austin',
      state: 'TX',
    });
    expect(result).toContain('Apt 4B');
  });

  it('should return default message for empty address', () => {
    expect(formatAddress({})).toBe('Address not specified');
  });
});
