// src/features/deals/components/OfferTermsForm.tsx
// Form component for entering offer terms by strategy
// Uses progressive disclosure for advanced fields to reduce cognitive load

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { FormField } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES, SPACING } from '@/constants/design-tokens';
import { DealStrategy, OfferTerms } from '../types';

interface OfferTermsFormProps {
  strategy: DealStrategy;
  terms: OfferTerms;
  onChange: (terms: OfferTerms) => void;
  disabled?: boolean;
}

export function OfferTermsForm({
  strategy,
  terms,
  onChange,
  disabled = false,
}: OfferTermsFormProps) {
  const colors = useThemeColors();
  const [showAdvancedFinancing, setShowAdvancedFinancing] = useState(
    // Auto-expand if balloon values exist
    !!(terms.balloon_payment || terms.balloon_due_years)
  );

  // Update a single field
  const updateField = (field: keyof OfferTerms, value: string | number | boolean) => {
    onChange({
      ...terms,
      [field]: value,
    });
  };

  // Parse currency input
  const parseCurrency = (text: string): number => {
    return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
  };

  // Parse percentage input
  const parsePercent = (text: string): number => {
    return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
  };

  return (
    <View>
      {/* Common fields */}
      <Card className="mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic Terms</CardTitle>
        </CardHeader>
        <CardContent className="gap-1">
          <FormField
            label="Purchase Price"
            value={terms.purchase_price?.toString() || ''}
            onChangeText={(text) => updateField('purchase_price', parseCurrency(text))}
            prefix="$"
            placeholder="0"
            keyboardType="numeric"
            editable={!disabled}
          />
          <FormField
            label="Earnest Money"
            value={terms.earnest_money?.toString() || ''}
            onChangeText={(text) => updateField('earnest_money', parseCurrency(text))}
            prefix="$"
            placeholder="0"
            keyboardType="numeric"
            editable={!disabled}
          />
          <FormField
            label="Closing Date"
            value={terms.closing_date || ''}
            onChangeText={(text) => updateField('closing_date', text)}
            placeholder="YYYY-MM-DD"
            editable={!disabled}
          />
        </CardContent>
      </Card>

      {/* Seller Finance specific fields */}
      {strategy === 'seller_finance' && (
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seller Financing Terms</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <FormField
              label="Down Payment"
              value={terms.down_payment?.toString() || ''}
              onChangeText={(text) => updateField('down_payment', parseCurrency(text))}
              prefix="$"
              placeholder="0"
              keyboardType="numeric"
              editable={!disabled}
            />
            <FormField
              label="Interest Rate"
              value={terms.interest_rate?.toString() || ''}
              onChangeText={(text) => updateField('interest_rate', parsePercent(text))}
              suffix="%"
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!disabled}
            />
            <FormField
              label="Term (Years)"
              value={terms.term_years?.toString() || ''}
              onChangeText={(text) => updateField('term_years', parseInt(text, 10) || 0)}
              placeholder="0"
              keyboardType="numeric"
              editable={!disabled}
            />
            <FormField
              label="Monthly Payment"
              value={terms.monthly_payment?.toString() || ''}
              onChangeText={(text) => updateField('monthly_payment', parseCurrency(text))}
              prefix="$"
              placeholder="0"
              keyboardType="numeric"
              editable={!disabled}
            />

            {/* Advanced: Balloon Payment (progressive disclosure) */}
            <TouchableOpacity
              onPress={() => setShowAdvancedFinancing(!showAdvancedFinancing)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: SPACING.sm,
                marginTop: SPACING.xs,
              }}
              disabled={disabled}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>
                Balloon Payment Options
              </Text>
              {showAdvancedFinancing ? (
                <ChevronUp size={ICON_SIZES.md} color={colors.primary} />
              ) : (
                <ChevronDown size={ICON_SIZES.md} color={colors.primary} />
              )}
            </TouchableOpacity>

            {showAdvancedFinancing && (
              <View style={{ gap: 4 }}>
                <FormField
                  label="Balloon Payment"
                  value={terms.balloon_payment?.toString() || ''}
                  onChangeText={(text) => updateField('balloon_payment', parseCurrency(text))}
                  prefix="$"
                  placeholder="0 (optional)"
                  keyboardType="numeric"
                  editable={!disabled}
                />
                <FormField
                  label="Balloon Due (Years)"
                  value={terms.balloon_due_years?.toString() || ''}
                  onChangeText={(text) => updateField('balloon_due_years', parseInt(text, 10) || 0)}
                  placeholder="0"
                  keyboardType="numeric"
                  editable={!disabled}
                />
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subject-To specific fields */}
      {strategy === 'subject_to' && (
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Existing Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <FormField
              label="Existing Loan Balance"
              value={terms.existing_loan_balance?.toString() || ''}
              onChangeText={(text) => updateField('existing_loan_balance', parseCurrency(text))}
              prefix="$"
              placeholder="0"
              keyboardType="numeric"
              editable={!disabled}
            />
            <FormField
              label="Current Monthly Payment"
              value={terms.existing_monthly_payment?.toString() || ''}
              onChangeText={(text) => updateField('existing_monthly_payment', parseCurrency(text))}
              prefix="$"
              placeholder="0"
              keyboardType="numeric"
              editable={!disabled}
            />
            <FormField
              label="Existing Interest Rate"
              value={terms.existing_interest_rate?.toString() || ''}
              onChangeText={(text) => updateField('existing_interest_rate', parsePercent(text))}
              suffix="%"
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!disabled}
            />
            <FormField
              label="Arrears to Catch Up"
              value={terms.catch_up_amount?.toString() || ''}
              onChangeText={(text) => updateField('catch_up_amount', parseCurrency(text))}
              prefix="$"
              placeholder="0 (if any)"
              keyboardType="numeric"
              editable={!disabled}
            />
          </CardContent>
        </Card>
      )}
    </View>
  );
}
