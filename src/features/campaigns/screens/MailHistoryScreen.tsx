// src/features/campaigns/screens/MailHistoryScreen.tsx
// Mail History Screen - View sent mail pieces and their status
// Follows DirectMailCreditsScreen + ConversationsListScreen patterns

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { Stack } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';
import { useNativeHeader } from '@/hooks';

import { useMailHistory, type MailHistoryEntry } from '../hooks/useMailHistory';
import { MailHistoryCard } from './mail-history/MailHistoryCard';
import { MailHistoryStatsSection } from './mail-history/MailHistoryStatsSection';

// =============================================================================
// Main Screen
// =============================================================================

export function MailHistoryScreen() {
  const colors = useThemeColors();
  const { data: entries, isLoading, refetch, isFetching } = useMailHistory({ limit: 50 });

  const { headerOptions } = useNativeHeader({
    title: 'Mail History',
    fallbackRoute: '/(tabs)/campaigns',
  });

  const renderItem = useCallback(
    ({ item }: { item: MailHistoryEntry }) => <MailHistoryCard entry={item} />,
    []
  );

  const keyExtractor = useCallback((item: MailHistoryEntry) => item.id, []);

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>

      {/* Stats Section */}
      <View className="pt-4">
        <MailHistoryStatsSection />
      </View>

      {/* Mail History List */}
      {isLoading ? (
        <LoadingSpinner fullScreen color={colors.info} />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.info}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
              >
                <Mail size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
              </View>
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
                No mail sent yet
              </Text>
              <Text
                className="text-center px-8"
                style={{ color: colors.mutedForeground }}
              >
                Your direct mail history will appear here once you send mail pieces through campaigns
              </Text>
            </View>
          }
        />
      )}
      </ThemedSafeAreaView>
    </>
  );
}

export default MailHistoryScreen;
