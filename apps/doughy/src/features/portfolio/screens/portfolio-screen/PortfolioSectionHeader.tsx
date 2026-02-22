// src/features/portfolio/screens/portfolio-screen/PortfolioSectionHeader.tsx
// Collapsible section header for portfolio property groups

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { SectionHeaderProps } from './portfolio-screen-types';

export const SectionHeader = React.memo(function SectionHeader({
  section,
  isCollapsed,
  propertyCount,
  onToggleCollapse,
  onEditGroup,
}: SectionHeaderProps) {
  const colors = useThemeColors();

  // Don't show header for ungrouped when no groups exist
  if (section.id === 'all' || !section.title) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <TouchableOpacity
      onPress={() => onToggleCollapse(section.id)}
      className="flex-row items-center justify-between px-4 py-3 mb-2 rounded-lg"
      style={{ backgroundColor: colors.muted }}
    >
      <View className="flex-row items-center gap-3">
        {/* Group color indicator */}
        {section.group?.color && (
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: section.group.color }}
          />
        )}
        <View>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
            {section.title}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
            {section.group && section.group.monthlyCashFlow !== 0 && (
              <Text style={{ color: section.group.monthlyCashFlow >= 0 ? colors.success : colors.destructive }}>
                {' '}• {section.group.monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(section.group.monthlyCashFlow)}/mo
              </Text>
            )}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {section.group && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEditGroup(section.group!);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ color: colors.primary, fontSize: 13 }}>Edit</Text>
          </TouchableOpacity>
        )}
        {isCollapsed ? (
          <ChevronRight size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </View>
    </TouchableOpacity>
  );
});
