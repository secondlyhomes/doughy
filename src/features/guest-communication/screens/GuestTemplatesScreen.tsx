// src/features/guest-communication/screens/GuestTemplatesScreen.tsx
// Screen for managing guest message templates

import React, { useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { FileText, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
} from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING } from '@/constants/design-tokens';
import {
  useGuestTemplates,
  useTemplateMutations,
} from '../hooks/useGuestCommunication';
import { GuestMessageTemplate, CreateTemplateInput } from '../types';
import { TemplateCard } from '../components/TemplateCard';
import { TemplateEditorSheet } from '../components/TemplateEditorSheet';

export function GuestTemplatesScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GuestMessageTemplate | null>(null);

  const {
    data: templates = [],
    isLoading,
    isRefetching,
    refetch,
  } = useGuestTemplates();

  const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    isSaving,
  } = useTemplateMutations();

  const { headerOptions } = useNativeHeader({
    title: 'Guest Templates',
    fallbackRoute: '/(tabs)/rental-properties',
    rightAction: <Badge variant="default">{templates.length}</Badge>,
  });

  const handleAddTemplate = useCallback(() => {
    setEditingTemplate(null);
    setShowAddSheet(true);
  }, []);

  const handleEditTemplate = useCallback((template: GuestMessageTemplate) => {
    setEditingTemplate(template);
    setShowAddSheet(true);
  }, []);

  const handleDeleteTemplate = useCallback(
    (template: GuestMessageTemplate) => {
      Alert.alert(
        'Delete Template',
        `Are you sure you want to delete "${template.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTemplate(template.id);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete template');
              }
            },
          },
        ]
      );
    },
    [deleteTemplate]
  );

  const handleToggleActive = useCallback(
    async (template: GuestMessageTemplate) => {
      try {
        await toggleTemplateActive({
          id: template.id,
          isActive: !template.is_active,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to update template');
      }
    },
    [toggleTemplateActive]
  );

  const handleSaveTemplate = useCallback(
    async (input: CreateTemplateInput) => {
      try {
        if (editingTemplate) {
          await updateTemplate({ id: editingTemplate.id, input });
        } else {
          await createTemplate(input);
        }
        setShowAddSheet(false);
        setEditingTemplate(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to save template');
      }
    },
    [editingTemplate, createTemplate, updateTemplate]
  );

  const renderItem = ({ item }: { item: GuestMessageTemplate }) => (
    <TemplateCard
      template={item}
      onEdit={handleEditTemplate}
      onDelete={handleDeleteTemplate}
      onToggleActive={handleToggleActive}
    />
  );

  if (isLoading && templates.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading templates..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        {templates.length === 0 ? (
        <ListEmptyState
          icon={FileText}
          title="No Templates"
          description="Create message templates for check-in instructions, checkout reminders, and more."
          action={{
            label: 'Create Template',
            onPress: handleAddTemplate,
          }}
        />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: SPACING.sm,
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <SimpleFAB
        icon={<Plus size={24} color="white" />}
        onPress={handleAddTemplate}
        accessibilityLabel="Add template"
      />

        {/* Add/Edit Template Sheet */}
        <TemplateEditorSheet
          visible={showAddSheet}
          onClose={() => {
            setShowAddSheet(false);
            setEditingTemplate(null);
          }}
          template={editingTemplate}
          onSave={handleSaveTemplate}
          isSaving={isSaving}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default GuestTemplatesScreen;
