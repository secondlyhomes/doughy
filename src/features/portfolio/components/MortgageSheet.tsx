// src/features/portfolio/components/MortgageSheet.tsx
// Focused sheet for adding/editing mortgage records
// Uses FocusedSheet for reduced distraction on complex 10+ field form

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheet, FocusedSheetSection } from '@/components/ui/FocusedSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { DatePicker } from '@/components/ui/DatePicker';
import { calculateMonthlyPayment } from '@/lib/amortization';
import type { PortfolioMortgage, MortgageInput, LoanType } from '../types';

interface MortgageSheetProps {
  visible: boolean;
  onClose: () => void;
  portfolioEntryId: string;
  existingMortgage?: PortfolioMortgage | null;
  onSubmit: (data: MortgageInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

const LOAN_TYPES: { value: LoanType; label: string }[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'seller_finance', label: 'Seller Finance' },
  { value: 'hard_money', label: 'Hard Money' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'other', label: 'Other' },
];

const TERM_OPTIONS = [
  { value: '120', label: '10 years' },
  { value: '180', label: '15 years' },
  { value: '240', label: '20 years' },
  { value: '360', label: '30 years' },
];

export function MortgageSheet({
  visible,
  onClose,
  portfolioEntryId,
  existingMortgage,
  onSubmit,
  onDelete,
  isLoading,
}: MortgageSheetProps) {
  const colors = useThemeColors();

  const [lenderName, setLenderName] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('conventional');
  const [originalBalance, setOriginalBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [maturityDate, setMaturityDate] = useState<Date | undefined>();
  const [termMonths, setTermMonths] = useState('360'); // 30 years default
  const [isPrimary, setIsPrimary] = useState(true);
  const [escrowAmount, setEscrowAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [autoCalculatePayment, setAutoCalculatePayment] = useState(true);

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      if (existingMortgage) {
        setLenderName(existingMortgage.lender_name || '');
        setLoanType(existingMortgage.loan_type);
        setOriginalBalance(existingMortgage.original_balance.toString());
        setCurrentBalance(existingMortgage.current_balance.toString());
        setInterestRate(existingMortgage.interest_rate.toString());
        setMonthlyPayment(existingMortgage.monthly_payment.toString());
        setStartDate(new Date(existingMortgage.start_date));
        setMaturityDate(existingMortgage.maturity_date ? new Date(existingMortgage.maturity_date) : undefined);
        setTermMonths(existingMortgage.term_months?.toString() || '360');
        setIsPrimary(existingMortgage.is_primary);
        setEscrowAmount(existingMortgage.escrow_amount?.toString() || '');
        setNotes(existingMortgage.notes || '');
        setAutoCalculatePayment(false);
      } else {
        setLenderName('');
        setLoanType('conventional');
        setOriginalBalance('');
        setCurrentBalance('');
        setInterestRate('');
        setMonthlyPayment('');
        setStartDate(new Date());
        setMaturityDate(undefined);
        setTermMonths('360');
        setIsPrimary(true);
        setEscrowAmount('');
        setNotes('');
        setAutoCalculatePayment(true);
      }
    }
  }, [visible, existingMortgage]);

  // Auto-calculate payment when values change
  useEffect(() => {
    if (autoCalculatePayment && originalBalance && interestRate && termMonths) {
      const principal = parseFloat(originalBalance);
      const rate = parseFloat(interestRate);
      const term = parseInt(termMonths);

      if (principal > 0 && rate > 0 && term > 0) {
        const payment = calculateMonthlyPayment(principal, rate, term);
        setMonthlyPayment(payment.toFixed(2));
      }
    }
  }, [autoCalculatePayment, originalBalance, interestRate, termMonths]);

  // Sync current balance with original if not set
  useEffect(() => {
    if (!existingMortgage && originalBalance && !currentBalance) {
      setCurrentBalance(originalBalance);
    }
  }, [existingMortgage, originalBalance, currentBalance]);

  const handleSubmit = useCallback(async () => {
    await onSubmit({
      portfolio_entry_id: portfolioEntryId,
      lender_name: lenderName || undefined,
      loan_type: loanType,
      original_balance: parseFloat(originalBalance) || 0,
      current_balance: parseFloat(currentBalance) || parseFloat(originalBalance) || 0,
      interest_rate: parseFloat(interestRate) || 0,
      monthly_payment: parseFloat(monthlyPayment) || 0,
      start_date: startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      maturity_date: maturityDate?.toISOString().split('T')[0],
      term_months: parseInt(termMonths) || undefined,
      is_primary: isPrimary,
      escrow_amount: escrowAmount ? parseFloat(escrowAmount) : undefined,
      notes: notes || undefined,
    });
  }, [
    portfolioEntryId, lenderName, loanType, originalBalance, currentBalance,
    interestRate, monthlyPayment, startDate, maturityDate, termMonths,
    isPrimary, escrowAmount, notes, onSubmit,
  ]);

  const isFormValid = originalBalance && interestRate && monthlyPayment;

  return (
    <FocusedSheet
      visible={visible}
      onClose={onClose}
      title={existingMortgage ? 'Edit Mortgage' : 'Add Mortgage'}
      doneLabel={existingMortgage ? 'Update Mortgage' : 'Add Mortgage'}
      onDone={handleSubmit}
      doneDisabled={!isFormValid}
      isSubmitting={isLoading}
    >
      <FocusedSheetSection title="Lender">
        <View className="gap-4">
          <View>
            <Label>Lender Name</Label>
            <Input
              value={lenderName}
              onChangeText={setLenderName}
              placeholder="Wells Fargo, Chase, etc."
            />
          </View>

          <View>
            <Label>Loan Type</Label>
            <Select
              value={loanType}
              onValueChange={(v) => setLoanType(v as LoanType)}
              options={LOAN_TYPES}
              placeholder="Select loan type"
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Label>Primary Mortgage</Label>
            <Switch
              checked={isPrimary}
              onCheckedChange={setIsPrimary}
            />
          </View>
        </View>
      </FocusedSheetSection>

      <FocusedSheetSection title="Loan Details">
        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Original Balance ($)"
                value={originalBalance}
                onChangeText={setOriginalBalance}
                placeholder="200000"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Current Balance ($)"
                value={currentBalance}
                onChangeText={setCurrentBalance}
                placeholder="185000"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Interest Rate (%)"
                value={interestRate}
                onChangeText={setInterestRate}
                placeholder="6.875"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Label>Term</Label>
              <Select
                value={termMonths}
                onValueChange={setTermMonths}
                options={TERM_OPTIONS}
                placeholder="Select term"
              />
            </View>
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Label>Monthly Payment (P&I)</Label>
              <View className="flex-row items-center gap-2">
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  Auto-calculate
                </Text>
                <Switch
                  checked={autoCalculatePayment}
                  onCheckedChange={setAutoCalculatePayment}
                />
              </View>
            </View>
            <Input
              value={monthlyPayment}
              onChangeText={(v) => {
                setAutoCalculatePayment(false);
                setMonthlyPayment(v);
              }}
              placeholder="1050"
              keyboardType="decimal-pad"
            />
          </View>

          <View>
            <Input
              label="Escrow - Taxes & Insurance ($)"
              value={escrowAmount}
              onChangeText={setEscrowAmount}
              placeholder="Optional monthly escrow"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </FocusedSheetSection>

      <FocusedSheetSection title="Dates">
        <View className="gap-4">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            mode="native"
          />

          <DatePicker
            label="Maturity Date (Optional)"
            value={maturityDate}
            onChange={setMaturityDate}
            mode="native"
            placeholder="Select maturity date"
          />
        </View>
      </FocusedSheetSection>

      <FocusedSheetSection title="Notes">
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          multiline
          numberOfLines={3}
        />
      </FocusedSheetSection>

      {existingMortgage && onDelete && (
        <View className="pt-4">
          <Button
            variant="destructive"
            onPress={onDelete}
            disabled={isLoading}
            className="w-full"
          >
            Delete Mortgage
          </Button>
        </View>
      )}
    </FocusedSheet>
  );
}

export default MortgageSheet;
