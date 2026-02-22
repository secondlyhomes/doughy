// src/features/rental-properties/screens/rental-property-detail/FinancialsTab.tsx
// Financials tab content for rental property detail screen

import React from 'react';
import { Card, Separator } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FinancialRow } from './FinancialRow';
import { formatCurrency, formatRateType } from './utils';
import type { RentalProperty } from '../../types';

export interface FinancialsTabProps {
  property: RentalProperty;
}

export function FinancialsTab({ property }: FinancialsTabProps) {
  const colors = useThemeColors();

  return (
    <Card variant="glass" className="p-4">
      <FinancialRow
        label="Base Rate"
        value={`${formatCurrency(property.base_rate)}${formatRateType(property.rate_type)}`}
        valueColor={colors.success}
      />
      <Separator className="my-1" />
      <FinancialRow
        label="Cleaning Fee"
        value={formatCurrency(property.cleaning_fee)}
      />
      <Separator className="my-1" />
      <FinancialRow
        label="Security Deposit"
        value={formatCurrency(property.security_deposit)}
      />
    </Card>
  );
}
