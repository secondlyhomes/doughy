// src/features/portfolio/components/tabs/MonthlyHistoryCard.tsx
// Monthly history list card for the financials tab

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DollarSign, Plus } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MonthlyHistoryRow } from './MonthlyHistoryRow';
import type { MonthlyHistoryCardProps } from './financials-types';

export function MonthlyHistoryCard({
  records,
  onAddRecord,
  onEditRecord,
  colors,
}: MonthlyHistoryCardProps) {
  return (
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
            onPress={onAddRecord}
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
                onPress={() => onEditRecord(record)}
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
  );
}
