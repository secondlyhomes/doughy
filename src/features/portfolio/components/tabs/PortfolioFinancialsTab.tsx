// src/features/portfolio/components/tabs/PortfolioFinancialsTab.tsx
// Financials tab showing monthly history, actuals vs projections

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DollarSign, Plus, TrendingUp, Home, PieChart, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePortfolioMonthlyRecords, getMonthFirstDay } from '../../hooks/usePortfolioMonthlyRecords';
import type { PortfolioMonthlyRecord } from '../../types';
import { MonthlyRecordSheet } from '../MonthlyRecordSheet';
import type { PortfolioFinancialsTabProps } from './financials-types';
import { formatCurrency } from './financials-helpers';
import { ExpenseRow } from './ExpenseRow';
import { MonthlyHistoryRow } from './MonthlyHistoryRow';
import { ComparisonRow } from './ComparisonRow';

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

export default PortfolioFinancialsTab;
