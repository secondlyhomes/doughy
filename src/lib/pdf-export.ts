// src/lib/pdf-export.ts
// PDF generation and export functionality using expo-print and expo-sharing

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { AmortizationEntry, DealAnalysisResult, LoanSummary } from './financial-calculations';

/**
 * Deal information for PDF export
 */
export interface DealInfo {
  address: string;
  purchasePrice: number;
  afterRepairValue?: number;
  repairCosts?: number;
}

/**
 * Loan information for PDF export
 */
export interface LoanInfo {
  loanAmount: number;
  interestRate: number;
  termYears: number;
  downPayment?: number;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  uri?: string;
  error?: string;
}

/**
 * Generate HTML for amortization schedule PDF
 */
function generateAmortizationHTML(
  schedule: AmortizationEntry[],
  dealInfo: DealInfo,
  loanInfo: LoanInfo,
  summary: LoanSummary
): string {
  // Generate table rows for first year and yearly summaries
  const yearlyRows: string[] = [];
  let currentYear = 1;
  let yearInterest = 0;
  let yearPrincipal = 0;

  schedule.forEach((entry, index) => {
    yearInterest += entry.interest;
    yearPrincipal += entry.principal;

    // At end of year or end of schedule
    if ((index + 1) % 12 === 0 || index === schedule.length - 1) {
      yearlyRows.push(`
        <tr>
          <td>Year ${currentYear}</td>
          <td>$${(entry.payment * 12).toLocaleString()}</td>
          <td>$${Math.round(yearPrincipal).toLocaleString()}</td>
          <td>$${Math.round(yearInterest).toLocaleString()}</td>
          <td>$${entry.balance.toLocaleString()}</td>
        </tr>
      `);
      currentYear++;
      yearInterest = 0;
      yearPrincipal = 0;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .header .subtitle {
            color: #666;
            font-size: 14px;
          }
          .info-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-box {
            flex: 1;
            min-width: 200px;
            background: #f8fafc;
            border-radius: 8px;
            padding: 16px;
          }
          .info-box h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-box p {
            margin: 6px 0;
            font-size: 14px;
          }
          .info-box .value {
            font-weight: 600;
            color: #1a1a1a;
          }
          .summary-box {
            background: #2563eb;
            color: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item .label {
            font-size: 12px;
            opacity: 0.9;
          }
          .summary-item .value {
            font-size: 20px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #e5e5e5;
            padding: 10px 12px;
            text-align: right;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.3px;
          }
          th:first-child, td:first-child {
            text-align: left;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Amortization Schedule</h1>
          <p class="subtitle">${dealInfo.address}</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Property Details</h3>
            <p>Address: <span class="value">${dealInfo.address}</span></p>
            <p>Purchase Price: <span class="value">$${dealInfo.purchasePrice.toLocaleString()}</span></p>
            ${dealInfo.afterRepairValue ? `<p>After Repair Value: <span class="value">$${dealInfo.afterRepairValue.toLocaleString()}</span></p>` : ''}
          </div>
          <div class="info-box">
            <h3>Loan Details</h3>
            <p>Loan Amount: <span class="value">$${loanInfo.loanAmount.toLocaleString()}</span></p>
            <p>Interest Rate: <span class="value">${loanInfo.interestRate}%</span></p>
            <p>Term: <span class="value">${loanInfo.termYears} years</span></p>
            ${loanInfo.downPayment ? `<p>Down Payment: <span class="value">$${loanInfo.downPayment.toLocaleString()}</span></p>` : ''}
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-item">
            <div class="label">Monthly Payment</div>
            <div class="value">$${summary.monthlyPayment.toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Interest</div>
            <div class="value">$${Math.round(summary.totalInterest).toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Cost</div>
            <div class="value">$${Math.round(summary.totalCost).toLocaleString()}</div>
          </div>
        </div>

        <h2 style="font-size: 16px; margin-bottom: 10px;">Yearly Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Annual Payment</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${yearlyRows.join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by Doughy AI on ${new Date().toLocaleDateString()}</p>
          <p>This document is for informational purposes only. Consult a financial advisor for professional advice.</p>
        </div>
      </body>
    </html>
  `;
}

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
 * Generate HTML for deal analysis PDF
 */
function generateDealAnalysisHTML(
  analysis: DealAnalysisResult,
  dealInfo: DealInfo
): string {
  const isGoodDeal = analysis.returnOnInvestment >= 15;
  const statusColor = isGoodDeal ? '#16a34a' : analysis.returnOnInvestment >= 10 ? '#ca8a04' : '#dc2626';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1a1a1a;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            background: ${statusColor};
            color: white;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .metric-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          .metric-card.highlight {
            background: #2563eb;
            color: white;
          }
          .metric-card .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.8;
          }
          .metric-card .value {
            font-size: 28px;
            font-weight: 700;
            margin: 8px 0;
          }
          .metric-card .note {
            font-size: 11px;
            opacity: 0.7;
          }
          .info-section {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-section h3 {
            margin: 0 0 15px 0;
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Deal Analysis Report</h1>
          <p style="color: #666; margin: 10px 0;">${dealInfo.address}</p>
          <span class="status-badge">
            ${isGoodDeal ? 'Good Deal' : analysis.returnOnInvestment >= 10 ? 'Marginal Deal' : 'Not Recommended'}
          </span>
        </div>

        <div class="metrics-grid">
          <div class="metric-card highlight">
            <div class="label">Return on Investment</div>
            <div class="value">${analysis.returnOnInvestment}%</div>
            <div class="note">Target: 15%+</div>
          </div>
          <div class="metric-card">
            <div class="label">Projected Profit</div>
            <div class="value">$${analysis.projectedProfit.toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="label">Total Investment</div>
            <div class="value">$${analysis.totalInvestment.toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="label">Max Allowable Offer</div>
            <div class="value">$${analysis.maxAllowableOffer.toLocaleString()}</div>
            <div class="note">70% Rule</div>
          </div>
        </div>

        <div class="info-section">
          <h3>Property Details</h3>
          <div class="info-row">
            <span>Purchase Price</span>
            <strong>$${dealInfo.purchasePrice.toLocaleString()}</strong>
          </div>
          ${dealInfo.afterRepairValue ? `
          <div class="info-row">
            <span>After Repair Value (ARV)</span>
            <strong>$${dealInfo.afterRepairValue.toLocaleString()}</strong>
          </div>
          ` : ''}
          ${dealInfo.repairCosts ? `
          <div class="info-row">
            <span>Estimated Repairs</span>
            <strong>$${dealInfo.repairCosts.toLocaleString()}</strong>
          </div>
          ` : ''}
          <div class="info-row">
            <span>Equity After Repairs</span>
            <strong>$${analysis.equity.toLocaleString()}</strong>
          </div>
        </div>

        ${analysis.monthlyPayment ? `
        <div class="info-section">
          <h3>Financing Details</h3>
          <div class="info-row">
            <span>Monthly Payment</span>
            <strong>$${analysis.monthlyPayment.toLocaleString()}</strong>
          </div>
          <div class="info-row">
            <span>Cash-on-Cash Return</span>
            <strong>${analysis.cashOnCashReturn}%</strong>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by Doughy AI on ${new Date().toLocaleDateString()}</p>
          <p>This analysis is for informational purposes only. Consult a financial advisor before making investment decisions.</p>
        </div>
      </body>
    </html>
  `;
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
