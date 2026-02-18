// Tests for sanitize utilities
import { sanitizePhone, sanitizeEmail } from '../sanitize';

describe('sanitize utilities', () => {
  describe('sanitizePhone', () => {
    it('should allow valid phone number characters', () => {
      expect(sanitizePhone('555-123-4567')).toBe('555-123-4567');
      expect(sanitizePhone('(555) 123-4567')).toBe('(555) 123-4567');
      expect(sanitizePhone('+1 555 123 4567')).toBe('+1 555 123 4567');
    });

    it('should remove invalid characters', () => {
      // Parentheses are allowed in phone numbers, so (1) is preserved
      expect(sanitizePhone('555<script>alert(1)</script>1234')).toBe('555(1)1234');
      expect(sanitizePhone('555;rm -rf /;1234')).toBe('555 - 1234');
      expect(sanitizePhone('555&echo hello&1234')).toBe('555 1234');
    });

    it('should handle empty string', () => {
      expect(sanitizePhone('')).toBe('');
    });

    it('should handle special injection attempts', () => {
      expect(sanitizePhone('tel:555-1234;echo hacked')).toBe('555-1234 ');
      expect(sanitizePhone('555-1234\n555-5678')).toBe('555-1234555-5678');
    });
  });

  describe('sanitizeEmail', () => {
    it('should encode email for URL usage', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test%40example.com');
    });

    it('should encode special characters', () => {
      expect(sanitizeEmail('user+tag@example.com')).toBe('user%2Btag%40example.com');
      expect(sanitizeEmail('user name@example.com')).toBe('user%20name%40example.com');
    });

    it('should handle empty string', () => {
      expect(sanitizeEmail('')).toBe('');
    });
  });
});
