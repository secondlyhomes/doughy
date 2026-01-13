// src/features/real-estate/utils/propertyValues.ts
// Utility functions for calculating property values

import { IProperty, KeyPropertyValues } from '../types';

const DEFAULT_VALUES: KeyPropertyValues = {
  propertyValue: 0,
  purchasePrice: 0,
  repairsTotal: 0,
  monthlyRent: 0,
  expenses: {
    propertyTax: 0,
    insurance: 0,
    maintenance: 0,
    utilities: 0,
    management: 8,
    vacancy: 5,
    capex: 0,
    hoa: 0
  },
  debt: {
    loanAmount: 0,
    interestRate: 6.5,
    termYears: 30,
    monthlyPayment: 0
  }
};

export function calculateKeyPropertyValues(propertyData: IProperty | null): KeyPropertyValues {
  if (!propertyData) {
    return DEFAULT_VALUES;
  }

  const repairsTotal = propertyData.repairs?.reduce(
    (sum, item) => sum + (item.cost || 0),
    0
  ) || 0;

  const primaryDebt = Array.isArray(propertyData.debt)
    ? propertyData.debt.find(d => d.is_primary) || propertyData.debt[0]
    : propertyData.debt;

  return {
    propertyValue: propertyData.arv || 0,
    purchasePrice: propertyData.purchase_price || 0,
    repairsTotal,
    monthlyRent: propertyData.financials?.monthly_rent || 0,
    expenses: {
      propertyTax: propertyData.financials?.property_tax || 0,
      insurance: propertyData.financials?.insurance || 0,
      maintenance: propertyData.financials?.maintenance || 0,
      utilities: propertyData.financials?.utilities || 0,
      management: propertyData.financials?.property_management || 8,
      vacancy: propertyData.financials?.vacancy_rate || 5,
      capex: propertyData.financials?.capex_reserve || 0,
      hoa: propertyData.financials?.hoa || 0
    },
    debt: {
      loanAmount: primaryDebt?.current_balance || 0,
      interestRate: primaryDebt?.interest_rate || 6.5,
      termYears: primaryDebt ? Math.ceil((primaryDebt.term_months || 360) / 12) : 30,
      monthlyPayment: primaryDebt?.monthly_payment || 0
    }
  };
}
