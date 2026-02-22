// src/features/portfolio/components/tabs/ThisMonthCard.tsx
// "This Month" summary card for the financials tab

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, Plus, Home } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from './financials-helpers';
import type { ThisMonthCardProps } from './financials-types';

export function ThisMonthCard({
  currentMonth,
  onAddRecord,
  onEditRecord,
  colors,
}: ThisMonthCardProps) {
  return (
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
              onPress={onAddRecord}
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
          <TouchableOpacity onPress={() => onEditRecord(currentMonth)}>
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
              onPress={onAddRecord}
              className="mt-3"
            >
              <Plus size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, marginLeft: 4 }}>Add Monthly Record</Text>
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
