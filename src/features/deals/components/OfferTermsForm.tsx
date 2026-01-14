// src/features/deals/components/OfferTermsForm.tsx
// Form component for entering offer terms by strategy

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
        <CardContent className="gap-3">
          <View>
            <Text className="text-sm font-medium text-foreground mb-1">
              Purchase Price
            </Text>
            <Input
              value={terms.purchase_price?.toString() || ''}
              onChangeText={(text) => updateField('purchase_price', parseCurrency(text))}
              placeholder="$0"
              keyboardType="numeric"
              editable={!disabled}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-1">
              Earnest Money
            </Text>
            <Input
              value={terms.earnest_money?.toString() || ''}
              onChangeText={(text) => updateField('earnest_money', parseCurrency(text))}
              placeholder="$0"
              keyboardType="numeric"
              editable={!disabled}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-1">
              Closing Date
            </Text>
            <Input
              value={terms.closing_date || ''}
              onChangeText={(text) => updateField('closing_date', text)}
              placeholder="YYYY-MM-DD"
              editable={!disabled}
            />
          </View>
        </CardContent>
      </Card>

      {/* Seller Finance specific fields */}
      {strategy === 'seller_finance' && (
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seller Financing Terms</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Down Payment
              </Text>
              <Input
                value={terms.down_payment?.toString() || ''}
                onChangeText={(text) => updateField('down_payment', parseCurrency(text))}
                placeholder="$0"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Interest Rate (%)
              </Text>
              <Input
                value={terms.interest_rate?.toString() || ''}
                onChangeText={(text) => updateField('interest_rate', parsePercent(text))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Term (Years)
              </Text>
              <Input
                value={terms.term_years?.toString() || ''}
                onChangeText={(text) => updateField('term_years', parseInt(text, 10) || 0)}
                placeholder="0"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Monthly Payment
              </Text>
              <Input
                value={terms.monthly_payment?.toString() || ''}
                onChangeText={(text) => updateField('monthly_payment', parseCurrency(text))}
                placeholder="$0"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Balloon Payment
              </Text>
              <Input
                value={terms.balloon_payment?.toString() || ''}
                onChangeText={(text) => updateField('balloon_payment', parseCurrency(text))}
                placeholder="$0 (optional)"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Balloon Due (Years)
              </Text>
              <Input
                value={terms.balloon_due_years?.toString() || ''}
                onChangeText={(text) => updateField('balloon_due_years', parseInt(text, 10) || 0)}
                placeholder="0"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>
          </CardContent>
        </Card>
      )}

      {/* Subject-To specific fields */}
      {strategy === 'subject_to' && (
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Existing Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Existing Loan Balance
              </Text>
              <Input
                value={terms.existing_loan_balance?.toString() || ''}
                onChangeText={(text) => updateField('existing_loan_balance', parseCurrency(text))}
                placeholder="$0"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Current Monthly Payment
              </Text>
              <Input
                value={terms.existing_monthly_payment?.toString() || ''}
                onChangeText={(text) => updateField('existing_monthly_payment', parseCurrency(text))}
                placeholder="$0"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Existing Interest Rate (%)
              </Text>
              <Input
                value={terms.existing_interest_rate?.toString() || ''}
                onChangeText={(text) => updateField('existing_interest_rate', parsePercent(text))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!disabled}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">
                Arrears to Catch Up
              </Text>
              <Input
                value={terms.catch_up_amount?.toString() || ''}
                onChangeText={(text) => updateField('catch_up_amount', parseCurrency(text))}
                placeholder="$0 (if any)"
                keyboardType="numeric"
                editable={!disabled}
              />
            </View>
          </CardContent>
        </Card>
      )}
    </View>
  );
}
