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
import { RepairEstimate, RepairCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

const PRIORITY_COLORS = {
  low: 'bg-success/20 text-success',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-destructive/20 text-destructive',
};

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
  return (
    <View className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Category Header */}
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center flex-1">
          <View className="bg-primary/10 p-2 rounded-lg">
            <Wrench size={16} className="text-primary" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-foreground font-semibold">{summary.label}</Text>
            <Text className="text-xs text-muted-foreground">
              {summary.items.length} item{summary.items.length !== 1 ? 's' : ''} •{' '}
              {summary.completedCount} completed
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-foreground font-semibold mr-2">
            {formatCurrency(summary.totalEstimate)}
          </Text>
          {isExpanded ? (
            <ChevronDown size={20} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={20} className="text-muted-foreground" />
          )}
        </View>
      </TouchableOpacity>

      {/* Category Items */}
      {isExpanded && (
        <View className="border-t border-border">
          {summary.items.map((repair, index) => (
            <View
              key={repair.id}
              className={`p-4 ${index > 0 ? 'border-t border-border' : ''}`}
            >
              <View className="flex-row items-start">
                {/* Completed checkbox */}
                <TouchableOpacity
                  onPress={() => onToggleCompleted(repair)}
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                    repair.completed
                      ? 'bg-success border-success'
                      : 'border-muted-foreground'
                  }`}
                >
                  {repair.completed && <Check size={14} color="white" />}
                </TouchableOpacity>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-foreground font-medium flex-1 ${
                        repair.completed ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {repair.description}
                    </Text>
                    <Text className="text-foreground font-semibold ml-2">
                      {formatCurrency(repair.estimate)}
                    </Text>
                  </View>

                  {/* Priority badge */}
                  <View className="flex-row items-center mt-1">
                    <View
                      className={`px-2 py-0.5 rounded ${PRIORITY_COLORS[repair.priority]}`}
                    >
                      <Text className="text-xs capitalize">{repair.priority}</Text>
                    </View>
                  </View>

                  {/* Notes */}
                  {repair.notes && (
                    <Text className="text-xs text-muted-foreground mt-2">
                      {repair.notes}
                    </Text>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-1 ml-2">
                  <TouchableOpacity
                    onPress={() => onEditRepair(repair)}
                    className="p-1.5 bg-muted rounded-lg"
                  >
                    <Edit2 size={14} className="text-muted-foreground" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDeleteRepair(repair)}
                    className="p-1.5 bg-destructive/10 rounded-lg"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Add to category */}
          <TouchableOpacity
            onPress={onAddToCategory}
            className="flex-row items-center justify-center py-3 bg-muted/50 border-t border-border"
          >
            <Plus size={14} className="text-primary" />
            <Text className="text-primary font-medium ml-1">Add to {summary.label}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
