// src/features/portfolio/components/ValuationSheet.tsx
// Bottom sheet for adding/editing property valuations

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, BottomSheetSection } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { DatePicker } from '@/components/ui/DatePicker';
import { SPACING } from '@/constants/design-tokens';
import { VALUATION_SOURCES, VALUATION_SOURCE_LABELS, type ValuationSource } from '../hooks/usePortfolioValuations';
import type { PortfolioValuation } from '../types';

interface ValuationSheetProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  existingValuation?: PortfolioValuation | null;
  onSubmit: (data: {
    property_id: string;
    estimated_value: number;
    valuation_date: string;
    source?: string;
    notes?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

export function ValuationSheet({
  visible,
  onClose,
  propertyId,
  existingValuation,
  onSubmit,
  onDelete,
  isLoading,
}: ValuationSheetProps) {
  const colors = useThemeColors();

  const [estimatedValue, setEstimatedValue] = useState('');
  const [valuationDate, setValuationDate] = useState<Date | undefined>(new Date());
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');

  // Convert VALUATION_SOURCES to Select options format with display labels
  const sourceOptions = useMemo(() =>
    VALUATION_SOURCES.map((src) => ({ value: src, label: VALUATION_SOURCE_LABELS[src as ValuationSource] })),
  []);

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      if (existingValuation) {
        setEstimatedValue(existingValuation.estimated_value.toString());
        setValuationDate(new Date(existingValuation.valuation_date));
        setSource(existingValuation.source || '');
        setNotes(existingValuation.notes || '');
      } else {
        setEstimatedValue('');
        setValuationDate(new Date());
        setSource('');
        setNotes('');
      }
    }
  }, [visible, existingValuation]);

  const handleSubmit = useCallback(async () => {
    await onSubmit({
      property_id: propertyId,
      estimated_value: parseFloat(estimatedValue) || 0,
      valuation_date: valuationDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      source: source || undefined,
      notes: notes || undefined,
    });
  }, [propertyId, estimatedValue, valuationDate, source, notes, onSubmit]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={existingValuation ? 'Edit Valuation' : 'Add Valuation'}
      snapPoints={['60%']}
    >
      <View className="flex-1">
          <BottomSheetSection title="Valuation Details">
            <View className="gap-4">
              <View>
                <Input
                  label="Estimated Value ($)"
                  value={estimatedValue}
                  onChangeText={setEstimatedValue}
                  placeholder="285000"
                  keyboardType="decimal-pad"
                />
              </View>

              <DatePicker
                label="Valuation Date"
                value={valuationDate}
                onChange={setValuationDate}
                mode="native"
              />

              <View>
                <Label>Source</Label>
                <Select
                  value={source}
                  onValueChange={setSource}
                  options={sourceOptions}
                  placeholder="Select source"
                />
              </View>

              <View>
                <Input
                  label="Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </BottomSheetSection>

          <View className="px-4 pb-6 gap-3">
            <Button
              onPress={handleSubmit}
              disabled={isLoading || !estimatedValue}
              className="w-full"
            >
              {isLoading ? 'Saving...' : existingValuation ? 'Update Valuation' : 'Add Valuation'}
            </Button>

            {existingValuation && onDelete && (
              <Button
                variant="destructive"
                onPress={onDelete}
                disabled={isLoading}
                className="w-full"
              >
                Delete Valuation
              </Button>
            )}
          </View>
        </View>
    </BottomSheet>
  );
}

export default ValuationSheet;
