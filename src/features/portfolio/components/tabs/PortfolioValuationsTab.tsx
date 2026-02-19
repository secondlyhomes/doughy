// src/features/portfolio/components/tabs/PortfolioValuationsTab.tsx
// Valuations tab showing value history and appreciation

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LineChart, Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SPACING } from '@/constants/design-tokens';
import { usePortfolioValuations, formatValuationSource, VALUATION_SOURCES } from '../../hooks/usePortfolioValuations';
import type { PortfolioValuation } from '../../types';
import { ValuationSheet } from '../ValuationSheet';
import { ValueHistoryChart } from '../charts/ValueHistoryChart';

interface PortfolioValuationsTabProps {
  propertyId?: string;
  acquisitionPrice?: number;
  acquisitionDate?: string;
}

export function PortfolioValuationsTab({
  propertyId,
  acquisitionPrice,
  acquisitionDate,
}: PortfolioValuationsTabProps) {
  const colors = useThemeColors();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingValuation, setEditingValuation] = useState<PortfolioValuation | null>(null);

  const {
    valuations,
    latestValuation,
    appreciationMetrics,
    isLoading,
    createValuation,
    updateValuation,
    deleteValuation,
    isCreating,
  } = usePortfolioValuations(propertyId);

  const handleAddValuation = useCallback(() => {
    setEditingValuation(null);
    setShowAddSheet(true);
  }, []);

  const handleEditValuation = useCallback((valuation: PortfolioValuation) => {
    setEditingValuation(valuation);
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

  if (!propertyId) {
    return (
      <View className="py-8 items-center">
        <Text style={{ color: colors.mutedForeground }}>
          No property found.
        </Text>
      </View>
    );
  }

  return (
    <View className="py-4 gap-4 pb-6">
      {/* Current Value Card */}
      <Card>
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <CardTitle className="flex-row items-center gap-2">
              <LineChart size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Current Value
              </Text>
            </CardTitle>
            {latestValuation && (
              <Badge variant="secondary" size="sm">
                {formatValuationSource(latestValuation.source)}
              </Badge>
            )}
          </View>
        </CardHeader>
        <CardContent>
          {latestValuation ? (
            <TouchableOpacity onPress={() => handleEditValuation(latestValuation)}>
              <Text style={{ color: colors.foreground, fontSize: 32, fontWeight: '700' }}>
                {formatCurrency(latestValuation.estimated_value)}
              </Text>

              {/* Appreciation from purchase */}
              {acquisitionPrice && (
                <View className="flex-row items-center gap-2 mt-2">
                  {appreciationMetrics.totalAppreciation >= 0 ? (
                    <TrendingUp size={16} color={colors.success} />
                  ) : (
                    <TrendingDown size={16} color={colors.destructive} />
                  )}
                  <Text
                    style={{
                      color: appreciationMetrics.totalAppreciation >= 0 ? colors.success : colors.destructive,
                      fontSize: 15,
                      fontWeight: '500',
                    }}
                  >
                    {appreciationMetrics.totalAppreciation >= 0 ? '+' : ''}
                    {formatCurrency(appreciationMetrics.totalAppreciation)}
                    {' '}({appreciationMetrics.percentAppreciation.toFixed(1)}%)
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                    since purchase
                  </Text>
                </View>
              )}

              {/* Last updated */}
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: SPACING.sm }}>
                Updated {new Date(latestValuation.valuation_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="items-center py-4">
              <Text style={{ color: colors.mutedForeground }}>
                No valuations recorded
              </Text>
              <Button
                variant="outline"
                size="sm"
                onPress={handleAddValuation}
                className="mt-3"
              >
                <Plus size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, marginLeft: 4 }}>Add First Valuation</Text>
              </Button>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Value History Chart */}
      {valuations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <TrendingUp size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Value History
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ValueHistoryChart
              valuations={valuations}
              acquisitionPrice={acquisitionPrice}
              acquisitionDate={acquisitionDate}
            />

            {/* Appreciation Stats */}
            <View className="flex-row justify-between mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
              <View className="items-center">
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Purchase</Text>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                  {formatCurrency(appreciationMetrics.purchaseValue || acquisitionPrice || 0)}
                </Text>
              </View>
              <View className="items-center">
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Total Gain</Text>
                <Text
                  style={{
                    color: appreciationMetrics.totalAppreciation >= 0 ? colors.success : colors.destructive,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {appreciationMetrics.totalAppreciation >= 0 ? '+' : ''}
                  {formatCurrency(appreciationMetrics.totalAppreciation)}
                </Text>
              </View>
              <View className="items-center">
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Annual Rate</Text>
                <Text
                  style={{
                    color: appreciationMetrics.annualizedAppreciation >= 0 ? colors.success : colors.destructive,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {appreciationMetrics.annualizedAppreciation >= 0 ? '+' : ''}
                  {appreciationMetrics.annualizedAppreciation.toFixed(1)}%
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Valuation Sources */}
      <Card>
        <CardHeader>
          <View className="flex-row justify-between items-center">
            <CardTitle className="flex-row items-center gap-2">
              <Calendar size={18} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Valuation History
              </Text>
            </CardTitle>
            <TouchableOpacity
              onPress={handleAddValuation}
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
          {valuations.length > 0 ? (
            <View className="gap-2">
              {valuations.map((valuation, index) => (
                <TouchableOpacity
                  key={valuation.id}
                  onPress={() => handleEditValuation(valuation)}
                  className="flex-row justify-between items-center py-3 px-3 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <View className="flex-row items-center gap-3">
                    <View>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                        {new Date(valuation.valuation_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {formatValuationSource(valuation.source)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                      {formatCurrency(valuation.estimated_value)}
                    </Text>
                    {index < valuations.length - 1 && (
                      <ChangeIndicator
                        current={valuation.estimated_value}
                        previous={valuations[index + 1].estimated_value}
                        colors={colors}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center py-4">
              <Text style={{ color: colors.mutedForeground }}>
                No valuations recorded yet.
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                Track your property{'\''} value over time.
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Add Valuation Sheet */}
      <ValuationSheet
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setEditingValuation(null);
        }}
        propertyId={propertyId}
        existingValuation={editingValuation}
        onSubmit={async (data) => {
          if (editingValuation) {
            await updateValuation({ id: editingValuation.id, updates: data });
          } else {
            await createValuation(data);
          }
          setShowAddSheet(false);
          setEditingValuation(null);
        }}
        onDelete={editingValuation ? async () => {
          await deleteValuation(editingValuation.id);
          setShowAddSheet(false);
          setEditingValuation(null);
        } : undefined}
        isLoading={isCreating}
      />
    </View>
  );
}

// Change indicator component
function ChangeIndicator({
  current,
  previous,
  colors,
}: {
  current: number;
  previous: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const change = current - previous;
  const percentChange = previous > 0 ? (change / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <View className="flex-row items-center">
      {isPositive ? (
        <TrendingUp size={12} color={colors.success} />
      ) : (
        <TrendingDown size={12} color={colors.destructive} />
      )}
      <Text
        style={{
          color: isPositive ? colors.success : colors.destructive,
          fontSize: 11,
          marginLeft: 2,
        }}
      >
        {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
      </Text>
    </View>
  );
}

export default PortfolioValuationsTab;
