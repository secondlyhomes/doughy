// src/features/settings/components/DevSeederSection.tsx
// Developer tools for seeding test data in Landlord platform

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Database, Trash2, Play, FlaskConical } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { seedScenarios, runSeedScenario, clearAllLandlordData } from '../services/landlordSeeder';

export function DevSeederSection() {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSeed = async (scenarioId: string) => {
    setIsLoading(scenarioId);
    try {
      await runSeedScenario(scenarioId);
      Alert.alert('Success', 'Test data created successfully!');
    } catch (error) {
      console.error('Seed error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create test data');
    } finally {
      setIsLoading(null);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear All Landlord Data',
      'This will delete all your rental properties, bookings, conversations, and related contacts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading('clear');
            try {
              await clearAllLandlordData();
              Alert.alert('Success', 'All landlord data cleared!');
            } catch (error) {
              console.error('Clear error:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to clear data');
            } finally {
              setIsLoading(null);
            }
          },
        },
      ]
    );
  };

  if (!__DEV__) return null;

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        DEV TOOLS - TEST DATA
      </Text>

      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        {/* Header */}
        <View className="flex-row items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <FlaskConical size={20} color={colors.warning} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }}>Landlord Data Seeder</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Populate database with test scenarios
            </Text>
          </View>
        </View>

        {/* Seed Scenarios */}
        {seedScenarios.map((scenario, index) => (
          <TouchableOpacity
            key={scenario.id}
            className="flex-row items-center p-4"
            style={index < seedScenarios.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
            onPress={() => handleSeed(scenario.id)}
            disabled={isLoading !== null}
          >
            <Database size={18} color={colors.primary} />
            <View className="flex-1 ml-3">
              <Text style={{ color: colors.foreground }}>{scenario.name}</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {scenario.description}
              </Text>
            </View>
            {isLoading === scenario.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Play size={18} color={colors.success} />
            )}
          </TouchableOpacity>
        ))}

        {/* Clear All Button */}
        <TouchableOpacity
          className="flex-row items-center p-4 border-t"
          style={{ borderTopColor: colors.border }}
          onPress={handleClear}
          disabled={isLoading !== null}
        >
          <Trash2 size={18} color={colors.destructive} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.destructive }}>Clear All Landlord Data</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Delete all properties, bookings, conversations
            </Text>
          </View>
          {isLoading === 'clear' && (
            <ActivityIndicator size="small" color={colors.destructive} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default DevSeederSection;
