// src/features/settings/screens/NudgeSettingsScreen.tsx
// Settings screen for configuring smart nudge reminders

import React from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Bell, Clock, AlertCircle, TrendingDown, Minus, Plus } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useFocusMode, DEFAULT_NUDGE_SETTINGS, NudgeSettings } from '@/contexts/FocusModeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

interface DayStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  color: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

function DayStepper({
  value,
  onChange,
  min,
  max,
  color,
  label,
  description,
  icon,
}: DayStepperProps) {
  const colors = useThemeColors();

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <View className="p-4">
      <View className="flex-row items-center mb-3">
        {icon}
        <Text className="ml-2 font-medium flex-1" style={{ color: colors.foreground }}>
          {label}
        </Text>
      </View>

      {/* Stepper controls */}
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={value <= min}
          style={{
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: value <= min ? colors.muted : color + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Minus size={20} color={value <= min ? colors.mutedForeground : color} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color }}>
            {value}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            days
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          disabled={value >= max}
          style={{
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: value >= max ? colors.muted : color + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={20} color={value >= max ? colors.mutedForeground : color} />
        </TouchableOpacity>
      </View>

      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
        {description}
      </Text>
    </View>
  );
}

export function NudgeSettingsScreen() {
  const colors = useThemeColors();
  const { nudgeSettings, setNudgeSettings } = useFocusMode();

  const settings = nudgeSettings || DEFAULT_NUDGE_SETTINGS;

  const updateSetting = (key: keyof NudgeSettings, value: number | boolean) => {
    const newSettings = { ...settings, [key]: value };

    // Ensure critical days is always >= warning days
    if (key === 'staleLeadWarningDays' && typeof value === 'number') {
      if (value > newSettings.staleLeadCriticalDays) {
        newSettings.staleLeadCriticalDays = value;
      }
    }

    setNudgeSettings(newSettings);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nudge Settings',
          headerBackTitle: 'Settings',
        }}
      />
      <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
        >
          {/* Master Toggle */}
          <View className="p-4">
            <View
              className="rounded-lg"
              style={{ backgroundColor: colors.card }}
            >
              <View className="flex-row items-center p-4">
                <Bell size={20} color={colors.primary} />
                <View className="flex-1 ml-3">
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                    Enable Smart Nudges
                  </Text>
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Get reminders for follow-ups and stale leads
                  </Text>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={(value) => updateSetting('enabled', value)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>
            </View>
          </View>

          {settings.enabled && (
            <>
              {/* Lead Follow-up Settings */}
              <View className="p-4">
                <Text
                  className="text-sm font-medium mb-2 px-2"
                  style={{ color: colors.mutedForeground }}
                >
                  LEAD FOLLOW-UP
                </Text>

                <View
                  className="rounded-lg"
                  style={{ backgroundColor: colors.card }}
                >
                  {/* Warning threshold */}
                  <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <DayStepper
                      value={settings.staleLeadWarningDays}
                      onChange={(value) => updateSetting('staleLeadWarningDays', value)}
                      min={2}
                      max={14}
                      color={colors.warning}
                      label="Warning after"
                      description="Show a warning nudge when no contact with lead for this many days"
                      icon={<Clock size={18} color={colors.warning} />}
                    />
                  </View>

                  {/* Critical threshold */}
                  <DayStepper
                    value={settings.staleLeadCriticalDays}
                    onChange={(value) => updateSetting('staleLeadCriticalDays', value)}
                    min={settings.staleLeadWarningDays}
                    max={21}
                    color={colors.destructive}
                    label="Urgent after"
                    description="Mark as urgent when no contact for this many days"
                    icon={<AlertCircle size={18} color={colors.destructive} />}
                  />
                </View>
              </View>

              {/* Deal Stalled Settings */}
              <View className="p-4">
                <Text
                  className="text-sm font-medium mb-2 px-2"
                  style={{ color: colors.mutedForeground }}
                >
                  DEAL PROGRESS
                </Text>

                <View
                  className="rounded-lg"
                  style={{ backgroundColor: colors.card }}
                >
                  <DayStepper
                    value={settings.dealStalledDays}
                    onChange={(value) => updateSetting('dealStalledDays', value)}
                    min={3}
                    max={14}
                    color={colors.info}
                    label="Stalled deal after"
                    description="Nudge when a deal has no activity for this many days"
                    icon={<TrendingDown size={18} color={colors.info} />}
                  />
                </View>
              </View>

              {/* Info section */}
              <View className="p-4">
                <View
                  className="rounded-lg p-4"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Smart nudges help you stay on top of your leads and deals by
                    surfacing reminders in the Focus tab{'\''} Inbox mode. Nudges are
                    generated based on activity data and the thresholds you set above.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </ThemedSafeAreaView>
    </>
  );
}

export default NudgeSettingsScreen;
