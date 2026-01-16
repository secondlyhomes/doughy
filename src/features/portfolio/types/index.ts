// src/features/portfolio/types/index.ts
// Portfolio-related types

import { Property } from '@/features/real-estate/types';

export interface PortfolioProperty extends Property {
  purchase_price?: number;
  acquisition_date?: string;
  current_value?: number;
  equity?: number;
  monthly_rent?: number;
  monthly_expenses?: number;
  monthly_cash_flow?: number;
  cap_rate?: number;
  deal_id?: string;
}

export interface PortfolioSummary {
  totalProperties: number;
  totalValue: number;
  totalEquity: number;
  monthlyCashFlow: number;
  averageCapRate?: number;
}

export interface PortfolioValuation {
  id: string;
  property_id: string;
  estimated_value: number;
  valuation_date: string;
  source?: string;
  notes?: string;
}
