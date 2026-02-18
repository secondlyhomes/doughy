/**
 * Error Storage Utility
 *
 * Stores error reports for offline submission and retrieval.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorReport } from '../types/error-types';

const ERROR_STORAGE_KEY = '@app/error_reports';
const MAX_STORED_ERRORS = 10;

export class ErrorStorage {
  /**
   * Store error report for offline submission
   */
  static async saveErrorReport(report: ErrorReport): Promise<void> {
    try {
      const existingReports = await this.getErrorReports();
      const updatedReports = [report, ...existingReports].slice(0, MAX_STORED_ERRORS);
      await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(updatedReports));
    } catch (e) {
      console.error('Failed to save error report:', e);
    }
  }

  /**
   * Retrieve stored error reports
   */
  static async getErrorReports(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to retrieve error reports:', e);
      return [];
    }
  }

  /**
   * Clear all stored error reports
   */
  static async clearErrorReports(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear error reports:', e);
    }
  }

  /**
   * Submit stored errors to reporting service
   */
  static async submitStoredErrors(): Promise<void> {
    try {
      const reports = await this.getErrorReports();

      for (const report of reports) {
        await this.submitErrorReport(report);
      }

      await this.clearErrorReports();
    } catch (e) {
      console.error('Failed to submit stored errors:', e);
    }
  }

  /**
   * Submit single error report to backend
   */
  static async submitErrorReport(report: ErrorReport): Promise<void> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error('Failed to submit error report');
      }
    } catch (e) {
      console.error('Error report submission failed:', e);
      throw e;
    }
  }
}
