// src/features/portfolio/components/tabs/financials-types.ts
// Shared types for PortfolioFinancialsTab sub-components

import type { useThemeColors } from '@/contexts/ThemeContext';
import type { PortfolioEntry, PortfolioMonthlyRecord } from '../../types';
import type { usePortfolioMonthlyRecords } from '../../hooks/usePortfolioMonthlyRecords';

export type ThemeColors = ReturnType<typeof useThemeColors>;

export type PortfolioMonthlySummary = ReturnType<typeof usePortfolioMonthlyRecords>['summary'];

export interface PortfolioFinancialsTabProps {
  portfolioEntryId?: string;
  entry?: PortfolioEntry;
}

export interface ThisMonthCardProps {
  currentMonth: PortfolioMonthlyRecord | undefined;
  onAddRecord: () => void;
  onEditRecord: (record: PortfolioMonthlyRecord) => void;
  colors: ThemeColors;
}

export interface ExpenseBreakdownCardProps {
  currentMonth: PortfolioMonthlyRecord;
  colors: ThemeColors;
}

export interface MonthlyHistoryCardProps {
  records: PortfolioMonthlyRecord[];
  onAddRecord: () => void;
  onEditRecord: (record: PortfolioMonthlyRecord) => void;
  colors: ThemeColors;
}

export interface ActualsVsProjectedCardProps {
  entry: PortfolioEntry;
  summary: PortfolioMonthlySummary;
  colors: ThemeColors;
}
