// src/features/real-estate/components/RepairCategorySection.tsx
// Expandable category section for repair items

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Wrench,
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { RepairEstimate, RepairCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CategorySummary {
  category: RepairCategory;
  label: string;
  items: RepairEstimate[];
  totalEstimate: number;
  completedCount: number;
}

interface RepairCategorySectionProps {
  summary: CategorySummary;
  isExpanded: boolean;
  onToggle: () => void;
  onAddToCategory: () => void;
  onEditRepair: (repair: RepairEstimate) => void;
  onDeleteRepair: (repair: RepairEstimate) => void;
  onToggleCompleted: (repair: RepairEstimate) => void;
}

export function RepairCategorySection({
  summary,
  isExpanded,
  onToggle,
  onAddToCategory,
  onEditRepair,
  onDeleteRepair,
  onToggleCompleted,
}: RepairCategorySectionProps) {
  const colors = useThemeColors();

  return (
    <View className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      {/* Category Header */}
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center flex-1">
          <View className="p-2 rounded-lg" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
            <Wrench size={16} color={colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-semibold" style={{ color: colors.foreground }}>{summary.label}</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {summary.items.length} item{summary.items.length !== 1 ? 's' : ''} •{' '}
              {summary.completedCount} completed
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="font-semibold mr-2" style={{ color: colors.foreground }}>
            {formatCurrency(summary.totalEstimate)}
          </Text>
          {isExpanded ? (
            <ChevronDown size={20} color={colors.mutedForeground} />
          ) : (
            <ChevronRight size={20} color={colors.mutedForeground} />
          )}
        </View>
      </TouchableOpacity>

      {/* Category Items */}
      {isExpanded && (
        <View className="border-t" style={{ borderColor: colors.border }}>
          {summary.items.map((repair, index) => (
            <View
              key={repair.id}
              className="p-4"
              style={index > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}
            >
              <View className="flex-row items-start">
                {/* Completed checkbox */}
                <TouchableOpacity
                  onPress={() => onToggleCompleted(repair)}
                  className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
                  style={{
                    backgroundColor: repair.completed ? colors.success : 'transparent',
                    borderColor: repair.completed ? colors.success : colors.mutedForeground,
                  }}
                >
                  {repair.completed && <Check size={14} color="white" />}
                </TouchableOpacity>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`font-medium flex-1 ${
                        repair.completed ? 'line-through opacity-60' : ''
                      }`}
                      style={{ color: colors.foreground }}
                    >
                      {repair.description}
                    </Text>
                    <Text className="font-semibold ml-2" style={{ color: colors.foreground }}>
                      {formatCurrency(repair.estimate)}
                    </Text>
                  </View>

                  {/* Priority badge */}
                  <View className="flex-row items-center mt-1">
                    <View
                      className="px-2 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          repair.priority === 'low'
                            ? withOpacity(colors.success, 'medium')
                            : repair.priority === 'medium'
                              ? withOpacity(colors.warning, 'medium')
                              : withOpacity(colors.destructive, 'medium'),
                      }}
                    >
                      <Text
                        className="text-xs capitalize"
                        style={{
                          color:
                            repair.priority === 'low'
                              ? colors.success
                              : repair.priority === 'medium'
                                ? colors.warning
                                : colors.destructive,
                        }}
                      >
                        {repair.priority}
                      </Text>
                    </View>
                  </View>

                  {/* Notes */}
                  {repair.notes && (
                    <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
                      {repair.notes}
                    </Text>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-1 ml-2">
                  <TouchableOpacity
                    onPress={() => onEditRepair(repair)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Edit2 size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDeleteRepair(repair)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
                  >
                    <Trash2 size={14} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Add to category */}
          <TouchableOpacity
            onPress={onAddToCategory}
            className="flex-row items-center justify-center py-3 border-t"
            style={{ backgroundColor: withOpacity(colors.muted, 'opaque'), borderColor: colors.border }}
          >
            <Plus size={14} color={colors.primary} />
            <Text className="font-medium ml-1" style={{ color: colors.primary }}>Add to {summary.label}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
