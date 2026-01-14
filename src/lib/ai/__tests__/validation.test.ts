// src/lib/ai/__tests__/validation.test.ts
// Tests for input validation

import {
  validateMessage,
  sanitizeInput,
  validateConversationHistory,
  INPUT_VALIDATION,
} from '../validation';

describe('Input Validation', () => {
  describe('validateMessage', () => {
    it('should validate valid messages', () => {
      const result = validateMessage('Hello, how are you?');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello, how are you?');
      expect(result.error).toBeUndefined();
    });

    it('should reject empty messages', () => {
      const result = validateMessage('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject whitespace-only messages', () => {
      const result = validateMessage('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject messages over length limit', () => {
      const longMessage = 'a'.repeat(1001);
      const result = validateMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
      expect(result.error).toContain('1000');
    });

    it('should accept messages at exactly the limit', () => {
      const maxMessage = 'a'.repeat(1000);
      const result = validateMessage(maxMessage);
      expect(result.isValid).toBe(true);
    });

    it('should sanitize valid messages', () => {
      const dirty = 'Hello\x00\x01  world\n\nthere';
      const result = validateMessage(dirty);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello world there');
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00\x01\x02World';
      expect(sanitizeInput(input)).toBe('HelloWorld');
    });

    it('should handle mixed whitespace', () => {
      const input = '  Hello  \n\n  World  \t  ';
      expect(sanitizeInput(input)).toBe('Hello World');
    });

    it('should preserve normal text', () => {
      const input = 'This is a normal message.';
      expect(sanitizeInput(input)).toBe('This is a normal message.');
    });

    it('should handle special characters correctly', () => {
      const input = 'Price: $100,000 (10%)';
      expect(sanitizeInput(input)).toBe('Price: $100,000 (10%)');
    });

    it('should handle emojis', () => {
      const input = 'Great deal! 🏠💰';
      expect(sanitizeInput(input)).toBe('Great deal! 🏠💰');
    });
  });

  describe('validateConversationHistory', () => {
    it('should validate short history', () => {
      const history = [{ role: 'user', content: 'Hello' }];
      expect(validateConversationHistory(history)).toBe(true);
    });

    it('should validate history at limit', () => {
      const history = Array(10).fill({ role: 'user', content: 'test' });
      expect(validateConversationHistory(history)).toBe(true);
    });

    it('should reject history over limit', () => {
      const history = Array(11).fill({ role: 'user', content: 'test' });
      expect(validateConversationHistory(history)).toBe(false);
    });

    it('should handle empty history', () => {
      expect(validateConversationHistory([])).toBe(true);
    });
  });

  describe('INPUT_VALIDATION constants', () => {
    it('should have sensible limits', () => {
      expect(INPUT_VALIDATION.MAX_MESSAGE_LENGTH).toBe(1000);
      expect(INPUT_VALIDATION.MIN_MESSAGE_LENGTH).toBe(1);
      expect(INPUT_VALIDATION.MAX_CONVERSATION_HISTORY).toBe(10);
    });
  });
});
