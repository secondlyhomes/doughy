// src/features/portfolio/components/tabs/PortfolioFinancialsTab.tsx
// Financials tab showing monthly history, actuals vs projections

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { usePortfolioMonthlyRecords, getMonthFirstDay } from '../../hooks/usePortfolioMonthlyRecords';
import type { PortfolioMonthlyRecord } from '../../types';
import { MonthlyRecordSheet } from '../MonthlyRecordSheet';
import type { PortfolioFinancialsTabProps } from './financials-types';
import { ThisMonthCard } from './ThisMonthCard';
import { ExpenseBreakdownCard } from './ExpenseBreakdownCard';
import { MonthlyHistoryCard } from './MonthlyHistoryCard';
import { ActualsVsProjectedCard } from './ActualsVsProjectedCard';

export function PortfolioFinancialsTab({
  portfolioEntryId,
  entry,
}: PortfolioFinancialsTabProps) {
  const colors = useThemeColors();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PortfolioMonthlyRecord | null>(null);

  const {
    records,
    summary,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
  } = usePortfolioMonthlyRecords(portfolioEntryId);

  const currentMonth = useMemo(() => {
    const now = new Date();
    const firstDay = getMonthFirstDay(now);
    return records.find((r) => r.month === firstDay);
  }, [records]);

  const handleAddRecord = useCallback(() => {
    setEditingRecord(null);
    setShowAddSheet(true);
  }, []);

  const handleEditRecord = useCallback((record: PortfolioMonthlyRecord) => {
    setEditingRecord(record);
    setShowAddSheet(true);
  }, []);

  if (!portfolioEntryId) {
    return (
      <View className="py-8 items-center">
        <Text style={{ color: colors.mutedForeground }}>
          No portfolio entry found.
        </Text>
      </View>
    );
  }

  return (
    <View className="py-4 gap-4 pb-6">
      <ThisMonthCard
        currentMonth={currentMonth}
        onAddRecord={handleAddRecord}
        onEditRecord={handleEditRecord}
        colors={colors}
      />

      {currentMonth && currentMonth.expenses.total > 0 && (
        <ExpenseBreakdownCard currentMonth={currentMonth} colors={colors} />
      )}

      <MonthlyHistoryCard
        records={records}
        onAddRecord={handleAddRecord}
        onEditRecord={handleEditRecord}
        colors={colors}
      />

      {entry && (entry.projected_monthly_rent || entry.monthly_rent) && records.length > 0 && (
        <ActualsVsProjectedCard entry={entry} summary={summary} colors={colors} />
      )}

      <MonthlyRecordSheet
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setEditingRecord(null);
        }}
        portfolioEntryId={portfolioEntryId}
        existingRecord={editingRecord}
        onSubmit={async (data) => {
          if (editingRecord) {
            await updateRecord({ id: editingRecord.id, updates: data });
          } else {
            await createRecord(data);
          }
          setShowAddSheet(false);
          setEditingRecord(null);
        }}
        onDelete={editingRecord ? async () => {
          await deleteRecord(editingRecord.id);
          setShowAddSheet(false);
          setEditingRecord(null);
        } : undefined}
        isLoading={isCreating}
      />
    </View>
  );
}

export default PortfolioFinancialsTab;
