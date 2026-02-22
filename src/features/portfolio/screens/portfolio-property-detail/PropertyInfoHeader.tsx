// src/features/portfolio/screens/portfolio-property-detail/PropertyInfoHeader.tsx

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Calendar, Briefcase } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import type {
  PortfolioEntry,
  PortfolioGroup,
  PortfolioPropertyPerformance,
} from '../../types';
import { ThemeColors, formatCurrency } from './portfolio-property-detail-types';
import { QuickStat } from './QuickStat';

interface PropertyInfoHeaderProps {
  address: string;
  cityStateZip: string;
  entry: PortfolioEntry | undefined;
  group: PortfolioGroup | undefined;
  performance: PortfolioPropertyPerformance | null | undefined;
  colors: ThemeColors;
}

export function PropertyInfoHeader({
  address,
  cityStateZip,
  entry,
  group,
  performance,
  colors,
}: PropertyInfoHeaderProps) {
  // Calculate ownership duration
  const ownershipDuration = useMemo(() => {
    if (!entry?.acquisition_date) return null;

    const start = new Date(entry.acquisition_date);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} owned`;
    }
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''} owned`;
    }
    return `${years}y ${remainingMonths}m owned`;
  }, [entry?.acquisition_date]);

  return (
    <View className="px-4 py-3">
      {/* Address */}
      <Text
        style={{ color: colors.foreground, fontSize: 24, fontWeight: '700' }}
        numberOfLines={2}
      >
        {address}
      </Text>
      <Text
        style={{ color: colors.mutedForeground, fontSize: 15, marginTop: 2 }}
        numberOfLines={1}
      >
        {cityStateZip}
      </Text>

      {/* Meta row: Acquisition date + Group */}
      <View className="flex-row items-center mt-3 gap-3">
        {entry?.acquisition_date && (
          <View className="flex-row items-center">
            <Calendar size={14} color={colors.mutedForeground} />
            <Text
              style={{ color: colors.mutedForeground, fontSize: 13, marginLeft: 4 }}
            >
              {new Date(entry.acquisition_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {ownershipDuration && (
          <Badge variant="secondary" size="sm">
            {ownershipDuration}
          </Badge>
        )}

        {group && (
          <Badge
            variant="outline"
            size="sm"
            style={group.color ? { borderColor: group.color } : undefined}
          >
            <Briefcase size={10} color={group.color || colors.mutedForeground} />
            <Text style={{ marginLeft: 4, color: group.color || colors.mutedForeground }}>
              {group.name}
            </Text>
          </Badge>
        )}
      </View>

      {/* Quick Stats Row */}
      {performance && (
        <View
          className="flex-row justify-between mt-4 p-3 rounded-xl"
          style={{ backgroundColor: colors.card }}
        >
          <QuickStat
            label="Equity"
            value={formatCurrency(performance.current_equity)}
            trend={performance.current_equity > 0 ? 'up' : undefined}
            colors={colors}
          />
          <QuickStat
            label="Cash Flow"
            value={`${performance.average_monthly_cash_flow >= 0 ? '+' : ''}${formatCurrency(performance.average_monthly_cash_flow)}/mo`}
            trend={performance.average_monthly_cash_flow > 0 ? 'up' : performance.average_monthly_cash_flow < 0 ? 'down' : undefined}
            colors={colors}
          />
          <QuickStat
            label="CoC Return"
            value={`${performance.cash_on_cash_return.toFixed(1)}%`}
            trend={performance.cash_on_cash_return > 8 ? 'up' : undefined}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}
