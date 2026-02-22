// src/features/campaigns/screens/CampaignSettingsScreen.tsx
// Campaign Settings - PostGrid, Meta OAuth, opt-out management

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { MailCreditsSection } from '../components/MailCreditsSection';
import { PostGridSettingsSection } from '../components/PostGridSettingsSection';
import { MetaOAuthSection } from '../components/MetaOAuthSection';

export function CampaignSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
          Campaign Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
      >
        <MailCreditsSection />
        <PostGridSettingsSection />
        <MetaOAuthSection />
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default CampaignSettingsScreen;
