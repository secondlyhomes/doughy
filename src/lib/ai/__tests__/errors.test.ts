// src/lib/ai/__tests__/errors.test.ts
// Tests for error handling

import { handleAIError, AIError, getErrorMessage } from '../errors';

describe('Error Handling', () => {
  describe('handleAIError', () => {
    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      const response = handleAIError(error);

      expect(response.content).toContain('took too long');
      expect(response.metadata?.errorCode).toBe('TIMEOUT');
      expect(response.metadata?.retryable).toBe(true);
    });

    it('should handle rate limit errors (429)', () => {
      const error = { status: 429 };
      const response = handleAIError(error);

      expect(response.content).toContain('too many requests');
      expect(response.metadata?.errorCode).toBe('RATE_LIMIT');
      expect(response.metadata?.retryAfter).toBe(60);
    });

    it('should handle authentication errors (401)', () => {
      const error = { status: 401 };
      const response = handleAIError(error);

      expect(response.content).toContain('configuration issue');
      expect(response.metadata?.errorCode).toBe('AUTH_ERROR');
      expect(response.metadata?.retryable).toBe(false);
    });

    it('should handle bad request errors (400)', () => {
      const error = { status: 400 };
      const response = handleAIError(error);

      expect(response.content).toContain('rephrasing');
      expect(response.metadata?.errorCode).toBe('BAD_REQUEST');
      expect(response.metadata?.retryable).toBe(true);
    });

    it('should handle server errors (500)', () => {
      const error = { status: 500 };
      const response = handleAIError(error);

      expect(response.content).toContain('temporarily unavailable');
      expect(response.metadata?.errorCode).toBe('SERVER_ERROR');
      expect(response.metadata?.statusCode).toBe(500);
    });

    it('should handle server errors (503)', () => {
      const error = { status: 503 };
      const response = handleAIError(error);

      expect(response.content).toContain('temporarily unavailable');
      expect(response.metadata?.errorCode).toBe('SERVER_ERROR');
      expect(response.metadata?.statusCode).toBe(503);
    });

    it('should handle network errors', () => {
      const error = new Error('Network connection failed');
      const response = handleAIError(error);

      expect(response.content).toContain('Network connection');
      expect(response.metadata?.errorCode).toBe('NETWORK_ERROR');
      expect(response.metadata?.retryable).toBe(true);
    });

    it('should handle fetch errors', () => {
      const error = new Error('fetch failed');
      const response = handleAIError(error);

      expect(response.content).toContain('Network connection');
      expect(response.metadata?.errorCode).toBe('NETWORK_ERROR');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Something unexpected happened');
      const response = handleAIError(error);

      expect(response.content).toContain('went wrong');
      expect(response.metadata?.errorCode).toBe('UNKNOWN');
      expect(response.metadata?.retryable).toBe(true);
    });

    it('should handle non-Error objects', () => {
      const error = 'string error';
      const response = handleAIError(error);

      expect(response.metadata?.errorCode).toBe('UNKNOWN');
    });

    it('should always return low confidence for errors', () => {
      const error = new Error('test');
      const response = handleAIError(error);

      expect(response.confidence).toBe('low');
    });

    it('should always return empty suggested actions for errors', () => {
      const error = new Error('test');
      const response = handleAIError(error);

      expect(response.suggestedActions).toEqual([]);
    });
  });

  describe('AIError class', () => {
    it('should create error with code and status', () => {
      const error = new AIError('Test error', 'TEST_CODE', 400, true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AIError');
    });

    it('should default retryable to false', () => {
      const error = new AIError('Test error', 'TEST_CODE');

      expect(error.retryable).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for known codes', () => {
      expect(getErrorMessage('TIMEOUT')).toContain('took too long');
      expect(getErrorMessage('RATE_LIMIT')).toContain('too quickly');
      expect(getErrorMessage('AUTH_ERROR')).toContain('Authentication');
      expect(getErrorMessage('BAD_REQUEST')).toContain('Invalid request');
      expect(getErrorMessage('SERVER_ERROR')).toContain('unavailable');
      expect(getErrorMessage('NETWORK_ERROR')).toContain('Network');
    });

    it('should return default message for unknown codes', () => {
      const message = getErrorMessage('UNKNOWN_CODE');
      expect(message).toContain('went wrong');
    });
  });
});
