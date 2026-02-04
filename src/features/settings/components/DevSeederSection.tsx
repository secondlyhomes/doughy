// src/features/settings/components/DevSeederSection.tsx
// Developer tools for seeding test data in both Landlord and Investor platforms

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Database, Trash2, Play, Home, TrendingUp, Sparkles, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { seedScenarios, runSeedScenario, clearAllLandlordData } from '../services/landlord-seeder';
import { investorSeeder } from '@/features/admin/services';
import { PORTFOLIO_DEALS_COUNT } from '@/features/admin/factories/testDataFactories';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Type-safe loading state - prevents typos and makes valid operations discoverable
type LoadingOperation =
  | 'investor-seed'
  | 'investor-clear'
  | 'landlord-clear'
  | `landlord-${string}`; // For dynamic scenario IDs

type LoadingState = LoadingOperation | null;

export function DevSeederSection() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<LoadingState>(null);

  // ============================================
  // Landlord Seeder Handlers
  // ============================================
  const handleLandlordSeed = async (scenarioId: string) => {
    setIsLoading(`landlord-${scenarioId}`);
    try {
      await runSeedScenario(scenarioId);
      Alert.alert('Success', 'Landlord test data created successfully!');
    } catch (error) {
      console.error('[DevSeederSection] Landlord seed error:', {
        scenarioId,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create landlord test data');
    } finally {
      setIsLoading(null);
    }
  };

  const handleLandlordClear = () => {
    Alert.alert(
      'Clear All Landlord Data',
      'This will delete all properties, inventory, vendors, maintenance, bookings, charges, turnovers, and conversations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading('landlord-clear');
            try {
              await clearAllLandlordData();
              Alert.alert('Success', 'All landlord data cleared!');
            } catch (error) {
              console.error('[DevSeederSection] Landlord clear error:', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined,
              });
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to clear landlord data');
            } finally {
              setIsLoading(null);
            }
          },
        },
      ]
    );
  };

  // ============================================
  // Investor Seeder Handlers
  // ============================================
  const handleInvestorSeed = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to seed data');
      return;
    }

    // Check if seeding is allowed
    const safetyCheck = investorSeeder.canSeedInvestorDatabase();
    if (!safetyCheck.allowed) {
      Alert.alert('Blocked', safetyCheck.reason || 'Seeding not allowed');
      return;
    }

    setIsLoading('investor-seed');
    try {
      const result = await investorSeeder.seedInvestorData(user.id);
      if (result.success) {
        // Build success message with optional warnings
        let message =
          `Investor data seeded!\n\n` +
          `• ${result.counts.leads} leads\n` +
          `• ${result.counts.properties} properties\n` +
          `• ${result.counts.deals} deals (${PORTFOLIO_DEALS_COUNT} in portfolio)\n` +
          `• ${result.counts.investorConversations} conversations\n` +
          `• ${result.counts.investorMessages} messages\n` +
          `• ${result.counts.captureItems} capture items`;

        // Surface warnings to user if any
        if (result.warnings && result.warnings.length > 0) {
          message += `\n\nWarnings:\n${result.warnings.map(w => `• ${w}`).join('\n')}`;
        }

        Alert.alert('Success', message);
      } else {
        // Clear failure - be explicit about what went wrong
        const errorCount = result.errors?.length || 0;
        const errorMessage = result.errors?.length
          ? result.errors.join('\n')
          : 'Seeding failed without specific error details. Check console for more information.';

        console.error('[DevSeederSection] Investor seed failed:', {
          result,
          errors: result.errors,
          counts: result.counts,
        });

        Alert.alert(
          'Seeding Failed',
          `${errorCount} error(s) occurred during seeding:\n\n${errorMessage}\n\nSome data may have been created. Consider clearing and trying again.`
        );
      }
    } catch (error) {
      console.error('[DevSeederSection] Investor seed exception:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to seed investor data');
    } finally {
      setIsLoading(null);
    }
  };

  const handleInvestorClear = () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to clear data');
      return;
    }

    Alert.alert(
      'Clear All Investor Data',
      'This will delete all your leads, properties, deals, conversations, and capture items. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading('investor-clear');
            try {
              const result = await investorSeeder.clearInvestorData(user.id);
              if (result.success) {
                // Build success message with optional warnings
                let message =
                  `Investor data cleared!\n\n` +
                  `• ${result.counts.leads} leads\n` +
                  `• ${result.counts.properties} properties\n` +
                  `• ${result.counts.deals} deals\n` +
                  `• ${result.counts.investorConversations} conversations\n` +
                  `• ${result.counts.investorMessages} messages\n` +
                  `• ${result.counts.captureItems} capture items`;

                // Surface warnings to user if any
                if (result.warnings && result.warnings.length > 0) {
                  message += `\n\nWarnings:\n${result.warnings.map(w => `• ${w}`).join('\n')}`;
                }

                Alert.alert('Success', message);
              } else {
                // Clear failure - provide actionable error message
                const errorMessage = result.errors?.length
                  ? result.errors.join('\n')
                  : 'Clear operation failed without specific error details. Check console for more information.';

                console.error('[DevSeederSection] Investor clear failed:', {
                  result,
                  errors: result.errors,
                  counts: result.counts,
                });

                Alert.alert('Clear Failed', errorMessage);
              }
            } catch (error) {
              console.error('[DevSeederSection] Investor clear exception:', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined,
              });
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to clear investor data');
            } finally {
              setIsLoading(null);
            }
          },
        },
      ]
    );
  };

  // Only show in dev mode
  if (!__DEV__) return null;

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        DEV TOOLS - TEST DATA SEEDERS
      </Text>

      {/* ============================================ */}
      {/* SIMULATE INQUIRY */}
      {/* ============================================ */}
      <TouchableOpacity
        className="flex-row items-center p-4 rounded-lg mb-4"
        style={{ backgroundColor: colors.card }}
        onPress={() => router.push('/(tabs)/dev/simulate-inquiry')}
      >
        <Sparkles size={20} color={colors.primary} />
        <View className="flex-1 ml-3">
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>Simulate Inquiry</Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Test email flow without Gmail setup
          </Text>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* ============================================ */}
      {/* INVESTOR DATA SEEDER */}
      {/* ============================================ */}
      <View className="rounded-lg mb-4" style={{ backgroundColor: colors.card }}>
        {/* Investor Header */}
        <View className="flex-row items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <TrendingUp size={20} color={colors.primary} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>Investor Data Seeder</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              60 leads, 100 properties, 50 deals ({PORTFOLIO_DEALS_COUNT} portfolio), 20 conversations
            </Text>
          </View>
        </View>

        {/* Investor Seed Button */}
        <TouchableOpacity
          className="flex-row items-center p-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          onPress={handleInvestorSeed}
          disabled={isLoading !== null}
        >
          <Database size={18} color={colors.primary} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground }}>Full Investor Dataset</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Leads, properties, deals, conversations, capture items
            </Text>
          </View>
          {isLoading === 'investor-seed' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Play size={18} color={colors.success} />
          )}
        </TouchableOpacity>

        {/* Investor Clear Button */}
        <TouchableOpacity
          className="flex-row items-center p-4"
          onPress={handleInvestorClear}
          disabled={isLoading !== null}
        >
          <Trash2 size={18} color={colors.destructive} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.destructive }}>Clear Investor Data</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Delete all leads, properties, deals, conversations
            </Text>
          </View>
          {isLoading === 'investor-clear' && (
            <ActivityIndicator size="small" color={colors.destructive} />
          )}
        </TouchableOpacity>
      </View>

      {/* ============================================ */}
      {/* LANDLORD DATA SEEDER */}
      {/* ============================================ */}
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        {/* Landlord Header */}
        <View className="flex-row items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <Home size={20} color={colors.info} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>Landlord Data Seeder</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Properties, bookings, inventory, vendors, maintenance, charges
            </Text>
          </View>
        </View>

        {/* Landlord Seed Scenarios */}
        {seedScenarios.map((scenario, index) => (
          <TouchableOpacity
            key={scenario.id}
            className="flex-row items-center p-4"
            style={index < seedScenarios.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
            onPress={() => handleLandlordSeed(scenario.id)}
            disabled={isLoading !== null}
          >
            <Database size={18} color={colors.info} />
            <View className="flex-1 ml-3">
              <Text style={{ color: colors.foreground }}>{scenario.name}</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                {scenario.description}
              </Text>
            </View>
            {isLoading === `landlord-${scenario.id}` ? (
              <ActivityIndicator size="small" color={colors.info} />
            ) : (
              <Play size={18} color={colors.success} />
            )}
          </TouchableOpacity>
        ))}

        {/* Landlord Clear Button */}
        <TouchableOpacity
          className="flex-row items-center p-4 border-t"
          style={{ borderTopColor: colors.border }}
          onPress={handleLandlordClear}
          disabled={isLoading !== null}
        >
          <Trash2 size={18} color={colors.destructive} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.destructive }}>Clear Landlord Data</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Delete all properties, inventory, vendors, maintenance, charges
            </Text>
          </View>
          {isLoading === 'landlord-clear' && (
            <ActivityIndicator size="small" color={colors.destructive} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default DevSeederSection;
