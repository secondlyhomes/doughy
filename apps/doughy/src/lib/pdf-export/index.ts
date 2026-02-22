// src/lib/pdf-export/index.ts
// PDF generation and export functionality using expo-print and expo-sharing

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { AmortizationEntry, DealAnalysisResult, LoanSummary } from '../financial-calculations';
import type { DealInfo, ExportResult, LoanInfo } from './types';
import { generateAmortizationHTML, generateDealAnalysisHTML } from './templates';

export type { DealInfo, LoanInfo, ExportResult } from './types';

/**
 * Export amortization schedule to PDF and share
 *
 * @example
 * ```typescript
 * const schedule = generateAmortizationSchedule(300000, 7.5, 30);
 * const summary = getLoanSummary(300000, 7.5, 30);
 *
 * await exportAmortizationToPDF(schedule, summary, {
 *   deal: { address: '123 Main St', purchasePrice: 350000 },
 *   loan: { loanAmount: 300000, interestRate: 7.5, termYears: 30 }
 * });
 * ```
 */
export async function exportAmortizationToPDF(
  schedule: AmortizationEntry[],
  summary: LoanSummary,
  options: {
    deal: DealInfo;
    loan: LoanInfo;
  }
): Promise<ExportResult> {
  try {
    const html = generateAmortizationHTML(
      schedule,
      options.deal,
      options.loan,
      summary
    );

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Check if sharing is available on this device
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Amortization Schedule',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, uri };
  } catch (error) {
    console.error('[PDF Export] Failed to export amortization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PDF',
    };
  }
}

/**
 * Export deal analysis to PDF and share
 *
 * @example
 * ```typescript
 * const analysis = analyzeDeal({
 *   purchasePrice: 200000,
 *   afterRepairValue: 300000,
 *   repairCosts: 30000,
 * });
 *
 * await exportDealAnalysisToPDF(analysis, {
 *   address: '123 Main St',
 *   purchasePrice: 200000,
 *   afterRepairValue: 300000,
 *   repairCosts: 30000,
 * });
 * ```
 */
export async function exportDealAnalysisToPDF(
  analysis: DealAnalysisResult,
  dealInfo: DealInfo
): Promise<ExportResult> {
  try {
    const html = generateDealAnalysisHTML(analysis, dealInfo);

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Deal Analysis',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, uri };
  } catch (error) {
    console.error('[PDF Export] Failed to export deal analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PDF',
    };
  }
}

/**
 * Generate and share a generic HTML document as PDF
 *
 * @example
 * ```typescript
 * await exportHTMLToPDF('<html><body><h1>Custom Report</h1></body></html>');
 * ```
 */
export async function exportHTMLToPDF(
  html: string,
  filename?: string
): Promise<ExportResult> {
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: filename || 'Share Document',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true, uri };
  } catch (error) {
    console.error('[PDF Export] Failed to export HTML:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PDF',
    };
  }
}
