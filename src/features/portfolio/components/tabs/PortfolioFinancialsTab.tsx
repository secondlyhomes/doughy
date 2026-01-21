// src/features/portfolio/components/tabs/PortfolioFinancialsTab.tsx
// Financials tab showing monthly history, actuals vs projections

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { DollarSign, Plus, TrendingUp, TrendingDown, Home, PieChart, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SPACING } from '@/constants/design-tokens';
import { usePortfolioMonthlyRecords, formatMonth, getMonthFirstDay } from '../../hooks/usePortfolioMonthlyRecords';
import type { PortfolioEntry, PortfolioMonthlyRecord } from '../../types';
import { MonthlyRecordSheet } from '../MonthlyRecordSheet';

interface PortfolioFinancialsTabProps {
  portfolioEntryId?: string;
  entry?: PortfolioEntry;
}

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      {/* This Month Card */}
      <Card>
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <CardTitle className="flex-row items-center gap-2">
              <Calendar size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                This Month
              </Text>
            </CardTitle>
            {!currentMonth && (
              <TouchableOpacity
                onPress={handleAddRecord}
                className="flex-row items-center gap-1 px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>
                  Add
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </CardHeader>
        <CardContent>
          {currentMonth ? (
            <TouchableOpacity onPress={() => handleEditRecord(currentMonth)}>
              <View className="flex-row justify-between mb-3">
                <View className="items-center flex-1">
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Income</Text>
                  <Text style={{ color: colors.success, fontSize: 18, fontWeight: '600' }}>
                    {formatCurrency(currentMonth.rent_collected)}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Expenses</Text>
                  <Text style={{ color: colors.destructive, fontSize: 18, fontWeight: '600' }}>
                    {formatCurrency(currentMonth.expenses.total || 0)}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Net</Text>
                  <Text
                    style={{
                      color: currentMonth.rent_collected - (currentMonth.expenses.total || 0) >= 0
                        ? colors.success
                        : colors.destructive,
                      fontSize: 18,
                      fontWeight: '600',
                    }}
                  >
                    {currentMonth.rent_collected - (currentMonth.expenses.total || 0) >= 0 ? '+' : ''}
                    {formatCurrency(currentMonth.rent_collected - (currentMonth.expenses.total || 0))}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-center">
                <Badge
                  variant={currentMonth.occupancy_status === 'occupied' ? 'default' : 'secondary'}
                  size="sm"
                >
                  <Home size={12} color={currentMonth.occupancy_status === 'occupied' ? colors.background : colors.mutedForeground} />
                  <Text style={{ marginLeft: 4 }}>
                    {currentMonth.occupancy_status === 'occupied' ? 'Occupied' : currentMonth.occupancy_status === 'vacant' ? 'Vacant' : 'Partial'}
                  </Text>
                </Badge>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="items-center py-4">
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                No record for this month yet
              </Text>
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddRecord}
                className="mt-3"
              >
                <Plus size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 4 }}>Add Monthly Record</Text>
              </Button>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      {currentMonth && currentMonth.expenses.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <PieChart size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Expense Breakdown
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-2">
              {currentMonth.expenses.mortgage_piti && currentMonth.expenses.mortgage_piti > 0 && (
                <ExpenseRow
                  label="Mortgage PITI"
                  amount={currentMonth.expenses.mortgage_piti}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.insurance && currentMonth.expenses.insurance > 0 && (
                <ExpenseRow
                  label="Insurance"
                  amount={currentMonth.expenses.insurance}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.property_tax && currentMonth.expenses.property_tax > 0 && (
                <ExpenseRow
                  label="Property Tax"
                  amount={currentMonth.expenses.property_tax}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.hoa && currentMonth.expenses.hoa > 0 && (
                <ExpenseRow
                  label="HOA"
                  amount={currentMonth.expenses.hoa}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.repairs && currentMonth.expenses.repairs > 0 && (
                <ExpenseRow
                  label="Repairs"
                  amount={currentMonth.expenses.repairs}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.property_management && currentMonth.expenses.property_management > 0 && (
                <ExpenseRow
                  label="Property Mgmt"
                  amount={currentMonth.expenses.property_management}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.utilities && currentMonth.expenses.utilities > 0 && (
                <ExpenseRow
                  label="Utilities"
                  amount={currentMonth.expenses.utilities}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
              {currentMonth.expenses.other && currentMonth.expenses.other > 0 && (
                <ExpenseRow
                  label="Other"
                  amount={currentMonth.expenses.other}
                  total={currentMonth.expenses.total}
                  colors={colors}
                />
              )}
            </View>
          </CardContent>
        </Card>
      )}

      {/* Monthly History */}
      <Card>
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <CardTitle className="flex-row items-center gap-2">
              <DollarSign size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Monthly History
              </Text>
            </CardTitle>
            <TouchableOpacity
              onPress={handleAddRecord}
              className="flex-row items-center gap-1 px-3 py-1 rounded-full"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <View className="gap-2">
              {records.slice(0, 12).map((record) => (
                <MonthlyHistoryRow
                  key={record.id}
                  record={record}
                  onPress={() => handleEditRecord(record)}
                  colors={colors}
                />
              ))}
            </View>
          ) : (
            <View className="items-center py-4">
              <Text style={{ color: colors.mutedForeground }}>
                No monthly records yet.
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                Track your actual income and expenses each month.
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Actuals vs Projected */}
      {entry && (entry.projected_monthly_rent || entry.monthly_rent) && records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <TrendingUp size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Actuals vs Projected
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              <ComparisonRow
                label="Monthly Income"
                projected={entry.projected_monthly_rent || entry.monthly_rent}
                actual={summary.averageMonthlyRent}
                colors={colors}
              />
              <ComparisonRow
                label="Monthly Expenses"
                projected={entry.projected_monthly_expenses || entry.monthly_expenses}
                actual={summary.averageMonthlyExpenses}
                invertColors
                colors={colors}
              />
              <View className="border-t pt-3" style={{ borderColor: colors.border }}>
                <ComparisonRow
                  label="Net Cash Flow"
                  projected={(entry.projected_monthly_rent || entry.monthly_rent) - (entry.projected_monthly_expenses || entry.monthly_expenses)}
                  actual={summary.averageMonthlyCashFlow}
                  colors={colors}
                />
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Sheet */}
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

// Expense row with percentage bar
function ExpenseRow({
  label,
  amount,
  total,
  colors,
}: {
  label: string;
  amount: number;
  total: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text style={{ color: colors.foreground, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '500' }}>
          ${amount.toFixed(0)} ({percentage.toFixed(0)}%)
        </Text>
      </View>
      <View
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: colors.muted }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.primary,
          }}
        />
      </View>
    </View>
  );
}

// Monthly history row
function MonthlyHistoryRow({
  record,
  onPress,
  colors,
}: {
  record: PortfolioMonthlyRecord;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const netCashFlow = record.rent_collected - (record.expenses.total || 0);
  const isPositive = netCashFlow >= 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-2 px-3 rounded-lg"
      style={{ backgroundColor: colors.muted }}
    >
      <View className="flex-row items-center gap-3">
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', minWidth: 70 }}>
          {formatMonth(record.month)}
        </Text>
        {record.occupancy_status !== 'occupied' && (
          <Badge variant="secondary" size="sm">
            {record.occupancy_status === 'vacant' ? 'Vacant' : 'Partial'}
          </Badge>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        <Text
          style={{
            color: isPositive ? colors.success : colors.destructive,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {isPositive ? '+' : ''}${netCashFlow.toFixed(0)}
        </Text>
        {isPositive ? (
          <TrendingUp size={14} color={colors.success} />
        ) : (
          <TrendingDown size={14} color={colors.destructive} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Comparison row for actuals vs projected
function ComparisonRow({
  label,
  projected,
  actual,
  invertColors,
  colors,
}: {
  label: string;
  projected: number;
  actual: number;
  invertColors?: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const diff = actual - projected;
  const percentDiff = projected > 0 ? ((diff / projected) * 100) : 0;
  const isPositive = invertColors ? diff <= 0 : diff >= 0;

  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          Projected: ${projected.toFixed(0)}/mo
        </Text>
      </View>
      <View className="items-end">
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
          ${actual.toFixed(0)}/mo
        </Text>
        <Text
          style={{
            color: isPositive ? colors.success : colors.destructive,
            fontSize: 12,
          }}
        >
          {diff >= 0 ? '+' : ''}${diff.toFixed(0)} ({percentDiff.toFixed(1)}%)
        </Text>
      </View>
    </View>
  );
}

export default PortfolioFinancialsTab;
