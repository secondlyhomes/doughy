// src/features/portfolio/components/tabs/MonthlyHistoryRow.tsx
// Monthly history row component

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { formatMonth } from '../../hooks/usePortfolioMonthlyRecords';
import type { PortfolioMonthlyRecord } from '../../types';
import type { ThemeColors } from './financials-types';

export function MonthlyHistoryRow({
  record,
  onPress,
  colors,
}: {
  record: PortfolioMonthlyRecord;
  onPress: () => void;
  colors: ThemeColors;
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
