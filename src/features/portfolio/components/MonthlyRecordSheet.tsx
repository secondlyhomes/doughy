// src/features/portfolio/components/MonthlyRecordSheet.tsx
// Bottom sheet for adding/editing monthly financial records

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, BottomSheetSection } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { SPACING } from '@/constants/design-tokens';
import { getMonthFirstDay } from '../hooks/usePortfolioMonthlyRecords';
import type { PortfolioMonthlyRecord, MonthlyRecordInput, PortfolioExpenseBreakdown } from '../types';

interface MonthlyRecordSheetProps {
  visible: boolean;
  onClose: () => void;
  portfolioEntryId: string;
  existingRecord?: PortfolioMonthlyRecord | null;
  onSubmit: (data: MonthlyRecordInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

export function MonthlyRecordSheet({
  visible,
  onClose,
  portfolioEntryId,
  existingRecord,
  onSubmit,
  onDelete,
  isLoading,
}: MonthlyRecordSheetProps) {
  const colors = useThemeColors();

  const [month, setMonth] = useState(getMonthFirstDay());
  const [rentCollected, setRentCollected] = useState('');
  const [occupancyStatus, setOccupancyStatus] = useState<'occupied' | 'vacant' | 'partial'>('occupied');
  const [notes, setNotes] = useState('');

  // Expense fields
  const [mortgagePiti, setMortgagePiti] = useState('');
  const [propertyTax, setPropertyTax] = useState('');
  const [insurance, setInsurance] = useState('');
  const [hoa, setHoa] = useState('');
  const [repairs, setRepairs] = useState('');
  const [utilities, setUtilities] = useState('');
  const [propertyManagement, setPropertyManagement] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = getMonthFirstDay(date);
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { value, label };
  }), []);

  const occupancyOptions = useMemo(() => [
    { value: 'occupied', label: 'Occupied' },
    { value: 'vacant', label: 'Vacant' },
    { value: 'partial', label: 'Partially Occupied' },
  ], []);

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      if (existingRecord) {
        setMonth(existingRecord.month);
        setRentCollected(existingRecord.rent_collected.toString());
        setOccupancyStatus(existingRecord.occupancy_status);
        setNotes(existingRecord.notes || '');
        setMortgagePiti(existingRecord.expenses.mortgage_piti?.toString() || '');
        setPropertyTax(existingRecord.expenses.property_tax?.toString() || '');
        setInsurance(existingRecord.expenses.insurance?.toString() || '');
        setHoa(existingRecord.expenses.hoa?.toString() || '');
        setRepairs(existingRecord.expenses.repairs?.toString() || '');
        setUtilities(existingRecord.expenses.utilities?.toString() || '');
        setPropertyManagement(existingRecord.expenses.property_management?.toString() || '');
        setOtherExpenses(existingRecord.expenses.other?.toString() || '');
      } else {
        setMonth(getMonthFirstDay());
        setRentCollected('');
        setOccupancyStatus('occupied');
        setNotes('');
        setMortgagePiti('');
        setPropertyTax('');
        setInsurance('');
        setHoa('');
        setRepairs('');
        setUtilities('');
        setPropertyManagement('');
        setOtherExpenses('');
      }
    }
  }, [visible, existingRecord]);

  const handleSubmit = useCallback(async () => {
    const expenses: Partial<PortfolioExpenseBreakdown> = {};
    if (mortgagePiti) expenses.mortgage_piti = parseFloat(mortgagePiti);
    if (propertyTax) expenses.property_tax = parseFloat(propertyTax);
    if (insurance) expenses.insurance = parseFloat(insurance);
    if (hoa) expenses.hoa = parseFloat(hoa);
    if (repairs) expenses.repairs = parseFloat(repairs);
    if (utilities) expenses.utilities = parseFloat(utilities);
    if (propertyManagement) expenses.property_management = parseFloat(propertyManagement);
    if (otherExpenses) expenses.other = parseFloat(otherExpenses);

    await onSubmit({
      portfolio_entry_id: portfolioEntryId,
      month,
      rent_collected: parseFloat(rentCollected) || 0,
      expenses,
      occupancy_status: occupancyStatus,
      notes: notes || undefined,
    });
  }, [
    portfolioEntryId, month, rentCollected, occupancyStatus, notes,
    mortgagePiti, propertyTax, insurance, hoa, repairs, utilities, propertyManagement, otherExpenses,
    onSubmit,
  ]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={existingRecord ? 'Edit Monthly Record' : 'Add Monthly Record'}
      snapPoints={['85%']}
    >
      <View className="flex-1">
          <BottomSheetSection title="Period">
            <View className="gap-4">
              <View>
                <Label>Month</Label>
                <Select
                  value={month}
                  onValueChange={setMonth}
                  options={monthOptions}
                  placeholder="Select month"
                />
              </View>

              <View>
                <Label>Occupancy Status</Label>
                <Select
                  value={occupancyStatus}
                  onValueChange={(v) => setOccupancyStatus(v as typeof occupancyStatus)}
                  options={occupancyOptions}
                  placeholder="Select status"
                />
              </View>
            </View>
          </BottomSheetSection>

          <BottomSheetSection title="Income">
            <View>
              <Input
                label="Rent Collected ($)"
                value={rentCollected}
                onChangeText={setRentCollected}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
          </BottomSheetSection>

          <BottomSheetSection title="Expenses">
            <View className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Mortgage PITI ($)"
                    value={mortgagePiti}
                    onChangeText={setMortgagePiti}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Property Tax ($)"
                    value={propertyTax}
                    onChangeText={setPropertyTax}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Insurance ($)"
                    value={insurance}
                    onChangeText={setInsurance}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="HOA ($)"
                    value={hoa}
                    onChangeText={setHoa}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Repairs ($)"
                    value={repairs}
                    onChangeText={setRepairs}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Utilities ($)"
                    value={utilities}
                    onChangeText={setUtilities}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Property Mgmt ($)"
                    value={propertyManagement}
                    onChangeText={setPropertyManagement}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Other ($)"
                    value={otherExpenses}
                    onChangeText={setOtherExpenses}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          </BottomSheetSection>

          <BottomSheetSection title="Notes">
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes..."
              multiline
              numberOfLines={3}
            />
          </BottomSheetSection>

          <View className="px-4 pb-6 gap-3">
            <Button
              onPress={handleSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Saving...' : existingRecord ? 'Update Record' : 'Add Record'}
            </Button>

            {existingRecord && onDelete && (
              <Button
                variant="destructive"
                onPress={onDelete}
                disabled={isLoading}
                className="w-full"
              >
                Delete Record
              </Button>
            )}
          </View>
        </View>
    </BottomSheet>
  );
}

export default MonthlyRecordSheet;
