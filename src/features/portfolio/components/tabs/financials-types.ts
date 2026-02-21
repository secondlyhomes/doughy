// src/features/portfolio/components/tabs/financials-types.ts
// Shared types for PortfolioFinancialsTab sub-components

import type { useThemeColors } from '@/contexts/ThemeContext';
import type { PortfolioEntry } from '../../types';

export type ThemeColors = ReturnType<typeof useThemeColors>;

export interface PortfolioFinancialsTabProps {
  portfolioEntryId?: string;
  entry?: PortfolioEntry;
}
