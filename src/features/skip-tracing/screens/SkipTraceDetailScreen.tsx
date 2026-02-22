// src/features/skip-tracing/screens/SkipTraceDetailScreen.tsx
// Detail screen for viewing a single skip trace result

import React from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  Trash2,
  AlertCircle,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useNativeHeader } from '@/hooks';
import { useSkipTraceResult, useDeleteSkipTrace } from '../hooks/useSkipTracing';
import { SkipTraceHeaderCard } from '../components/SkipTraceHeaderCard';
import {
  SkipTraceErrorMessage,
  SkipTraceMatchedProperty,
  SkipTraceCompletedResults,
  SkipTracePendingState,
} from '../components/SkipTraceResultSections';
import { ICON_SIZES } from '@/constants/design-tokens';

export function SkipTraceDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { resultId } = useLocalSearchParams<{ resultId: string }>();

  const { data: result, isLoading, isRefetching, isError, error, refetch } = useSkipTraceResult(resultId);
  const deleteSkipTrace = useDeleteSkipTrace();

  const handleDelete = () => {
    if (!resultId) {
      Alert.alert('Error', 'Invalid result ID');
      return;
    }

    Alert.alert(
      'Delete Skip Trace',
      'Are you sure you want to delete this skip trace result? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSkipTrace.mutateAsync(resultId);
              router.back();
            } catch (deleteError) {
              const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
              console.error('Failed to delete skip trace:', deleteError);
              Alert.alert('Delete Failed', `Could not delete skip trace result: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  const { headerOptions } = useNativeHeader({
    title: 'Skip Trace Result',
    fallbackRoute: '/skip-tracing',
    rightAction: (
      <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
        <Trash2 size={ICON_SIZES.lg} color={colors.destructive} />
      </TouchableOpacity>
    ),
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView style={{ flex: 1 }} edges={[]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, color: colors.mutedForeground }}>
              Loading skip trace result...
            </Text>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  // Handle error state separately from "not found"
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load skip trace result';
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView style={{ flex: 1 }} edges={[]}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <AlertCircle size={ICON_SIZES['3xl']} color={colors.destructive} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
              Failed to Load
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }}>
              {errorMessage}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button variant="outline" onPress={() => router.back()}>
                <Text style={{ color: colors.foreground }}>Go Back</Text>
              </Button>
              <Button onPress={() => refetch()}>
                <Text style={{ color: colors.primaryForeground }}>Try Again</Text>
              </Button>
            </View>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  if (!result) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} edges={[]}>
          <AlertCircle size={ICON_SIZES['3xl']} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, color: colors.mutedForeground }}>Result not found</Text>
          <Button variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.foreground }}>Go Back</Text>
          </Button>
        </ThemedSafeAreaView>
      </>
    );
  }

  const displayName =
    result.contact?.first_name && result.contact?.last_name
      ? `${result.contact.first_name} ${result.contact.last_name}`
      : result.input_first_name && result.input_last_name
        ? `${result.input_first_name} ${result.input_last_name}`
        : 'Unknown Person';

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView style={{ flex: 1 }} edges={[]}>
        <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <SkipTraceHeaderCard result={result} displayName={displayName} />
        <SkipTraceErrorMessage result={result} />
        <SkipTraceMatchedProperty result={result} />
        <SkipTraceCompletedResults result={result} />
        <SkipTracePendingState result={result} />
        </ScrollView>
      </ThemedSafeAreaView>
    </>
  );
}
