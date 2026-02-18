// src/features/settings/components/DevSeederSection.tsx
// Developer tools for seeding demo data via server API

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Database, Trash2, Play, RefreshCw, CheckCircle, Sparkles, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui';

const OPENCLAW_URL = process.env.EXPO_PUBLIC_OPENCLAW_URL || 'https://openclaw.doughy.app';

type LoadingState = 'create' | 'delete' | 'reset' | 'verify' | null;

async function callSeedApi(action: string): Promise<any> {
  const res = await fetch(`${OPENCLAW_URL}/api/demo/seed-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export function DevSeederSection() {
  const colors = useThemeColors();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<LoadingState>(null);

  const handleCreate = async () => {
    setIsLoading('create');
    try {
      const result = await callSeedApi('create');
      if (result.success) {
        const items = Object.entries(result.counts)
          .filter(([, v]) => (v as number) > 0)
          .map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`)
          .join('\n');
        Alert.alert('Demo Data Seeded', items);
      } else {
        Alert.alert('Partial Success', `Errors: ${result.errors?.join(', ') || 'Unknown'}`);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Seed failed');
    } finally {
      setIsLoading(null);
    }
  };

  const handleReset = async () => {
    setIsLoading('reset');
    try {
      const result = await callSeedApi('reset');
      if (result.success) {
        Alert.alert('Demo Data Reset', `Deleted ${result.deleted} old records.\nRe-seeded fresh data.`);
      } else {
        Alert.alert('Partial Success', `Errors: ${result.errors?.join(', ') || 'Unknown'}`);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Reset failed');
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Demo Data',
      'This will remove ALL demo-seeded records. Real data is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading('delete');
            try {
              const result = await callSeedApi('delete');
              Alert.alert('Demo Data Deleted', `Removed ${result.deleted} records.`);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Delete failed');
            } finally {
              setIsLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleVerify = async () => {
    setIsLoading('verify');
    try {
      const result = await callSeedApi('verify');
      const lines = Object.entries(result.checks)
        .map(([k, v]: [string, any]) => `${v.ok ? '+' : '-'} ${k}: ${v.count}/${v.expected}`)
        .join('\n');
      Alert.alert(result.ready ? 'Ready' : 'Not Ready', lines);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Verify failed');
    } finally {
      setIsLoading(null);
    }
  };

  if (!__DEV__) return null;

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
        DEV TOOLS
      </Text>

      {/* Simulate Inquiry */}
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

      {/* Demo Data Seeder */}
      <Card variant="glass">
        <View className="flex-row items-center p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <Database size={20} color={colors.primary} />
          <View className="flex-1 ml-3">
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>Demo Data</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Leads, deals, properties, call transcript, connections
            </Text>
          </View>
        </View>

        {/* Seed */}
        <SeedButton
          icon={<Play size={18} color={colors.success} />}
          label="Seed Demo Data"
          subtitle="Create leads, properties, deal, call transcript, connections"
          onPress={handleCreate}
          loading={isLoading === 'create'}
          disabled={isLoading !== null}
          colors={colors}
        />

        {/* Reset */}
        <SeedButton
          icon={<RefreshCw size={18} color={colors.info} />}
          label="Reset Demo Data"
          subtitle="Delete existing demo data and re-seed fresh"
          onPress={handleReset}
          loading={isLoading === 'reset'}
          disabled={isLoading !== null}
          colors={colors}
        />

        {/* Verify */}
        <SeedButton
          icon={<CheckCircle size={18} color={colors.primary} />}
          label="Verify Demo Data"
          subtitle="Check that all demo records exist"
          onPress={handleVerify}
          loading={isLoading === 'verify'}
          disabled={isLoading !== null}
          colors={colors}
        />

        {/* Delete */}
        <SeedButton
          icon={<Trash2 size={18} color={colors.destructive} />}
          label="Delete Demo Data"
          subtitle="Remove only demo-seeded records"
          onPress={handleDelete}
          loading={isLoading === 'delete'}
          disabled={isLoading !== null}
          colors={colors}
          labelColor={colors.destructive}
          hideBorder
        />
      </Card>
    </View>
  );
}

function SeedButton({
  icon, label, subtitle, onPress, loading, disabled, colors, labelColor, hideBorder,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  colors: any;
  labelColor?: string;
  hideBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center p-4"
      style={!hideBorder ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text style={{ color: labelColor || colors.foreground }}>{label}</Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>{subtitle}</Text>
      </View>
      {loading && <ActivityIndicator size="small" color={colors.primary} />}
    </TouchableOpacity>
  );
}

export default DevSeederSection;
