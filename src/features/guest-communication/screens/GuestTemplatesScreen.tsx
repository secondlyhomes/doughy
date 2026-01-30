// src/features/guest-communication/screens/GuestTemplatesScreen.tsx
// Screen for managing guest message templates

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileText,
  Plus,
  Mail,
  MessageSquare,
  Trash2,
  Edit2,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
  Card,
  Button,
  BottomSheet,
  BottomSheetSection,
  Input,
  FormField,
  Select,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  useGuestTemplates,
  useTemplateMutations,
} from '../hooks/useGuestCommunication';
import {
  GuestMessageTemplate,
  GuestTemplateType,
  MessageChannel,
  TEMPLATE_TYPE_CONFIG,
  CreateTemplateInput,
} from '../types';
import { DEFAULT_TEMPLATES, getTemplatePreview } from '../services/templateService';

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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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

  const renderItem = ({ item }: { item: GuestMessageTemplate }) => {
    const config = TEMPLATE_TYPE_CONFIG[item.type];

    return (
      <Card className="mb-3 mx-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.muted }}
            >
              <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                    fontWeight: '600',
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Badge
                  variant={item.channel === 'sms' ? 'default' : 'secondary'}
                  size="sm"
                >
                  {item.channel.toUpperCase()}
                </Badge>
              </View>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.xs,
                  marginTop: 2,
                }}
              >
                {config.label}
              </Text>
            </View>
          </View>

          <Switch
            value={item.is_active}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>

        {/* Preview */}
        <View
          className="mt-3 p-3 rounded-lg"
          style={{ backgroundColor: colors.muted }}
        >
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
            }}
            numberOfLines={3}
          >
            {item.body.substring(0, 150)}
            {item.body.length > 150 ? '...' : ''}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 mt-3">
          <Button
            variant="outline"
            onPress={() => handleEditTemplate(item)}
            className="flex-1 flex-row items-center justify-center gap-2"
          >
            <Edit2 size={14} color={colors.foreground} />
            <Text style={{ color: colors.foreground }}>Edit</Text>
          </Button>
          <Button
            variant="destructive"
            onPress={() => handleDeleteTemplate(item)}
            className="px-4"
          >
            <Trash2 size={14} color="white" />
          </Button>
        </View>
      </Card>
    );
  };

  if (isLoading && templates.length === 0) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading templates..." />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Guest Templates"
        backButton
        onBack={handleBack}
        rightAction={<Badge variant="default">{templates.length}</Badge>}
      />

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
  );
}

// Template Editor Sheet Component
interface TemplateEditorSheetProps {
  visible: boolean;
  onClose: () => void;
  template: GuestMessageTemplate | null;
  onSave: (input: CreateTemplateInput) => Promise<void>;
  isSaving: boolean;
}

function TemplateEditorSheet({
  visible,
  onClose,
  template,
  onSave,
  isSaving,
}: TemplateEditorSheetProps) {
  const colors = useThemeColors();

  const [type, setType] = useState<GuestTemplateType>(template?.type || 'check_in_instructions');
  const [name, setName] = useState(template?.name || '');
  const [channel, setChannel] = useState<MessageChannel>(template?.channel || 'sms');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');

  // Reset form when template changes
  React.useEffect(() => {
    if (visible) {
      if (template) {
        setType(template.type);
        setName(template.name);
        setChannel(template.channel);
        setSubject(template.subject || '');
        setBody(template.body);
      } else {
        setType('check_in_instructions');
        setName('');
        setChannel('sms');
        setSubject('');
        setBody('');
      }
    }
  }, [visible, template]);

  // Load default template when type changes (for new templates only)
  const handleTypeChange = useCallback(
    (newType: GuestTemplateType) => {
      setType(newType);
      if (!template && newType !== 'custom') {
        const defaults = DEFAULT_TEMPLATES[newType as keyof typeof DEFAULT_TEMPLATES];
        if (defaults) {
          setName(TEMPLATE_TYPE_CONFIG[newType].label);
          setSubject(defaults.subject);
          setBody(defaults.body);
        }
      }
    },
    [template]
  );

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a template name');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Required', 'Please enter the message body');
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      Alert.alert('Required', 'Email templates require a subject');
      return;
    }

    await onSave({
      type,
      name: name.trim(),
      channel,
      subject: channel === 'email' ? subject.trim() : undefined,
      body: body.trim(),
    });
  }, [type, name, channel, subject, body, onSave]);

  const typeOptions = Object.entries(TEMPLATE_TYPE_CONFIG).map(([key, config]) => ({
    value: key,
    label: `${config.emoji} ${config.label}`,
  }));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={template ? 'Edit Template' : 'New Template'}
      snapPoints={['95%']}
    >
      <View className="flex-1 px-4">
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <FormField label="Type">
              <Select
                value={type}
                onValueChange={(v) => handleTypeChange(v as GuestTemplateType)}
                options={typeOptions}
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Channel">
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as MessageChannel)}
                options={[
                  { value: 'sms', label: 'SMS' },
                  { value: 'email', label: 'Email' },
                ]}
              />
            </FormField>
          </View>
        </View>

        <FormField label="Template Name" required className="mb-4">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g., Check-in Instructions"
          />
        </FormField>

        {channel === 'email' && (
          <FormField label="Subject" required className="mb-4">
            <Input
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject line..."
            />
          </FormField>
        )}

        <FormField label="Message Body" required className="mb-4">
          <Input
            value={body}
            onChangeText={setBody}
            placeholder="Type your message..."
            multiline
            numberOfLines={12}
            style={{ minHeight: 200 }}
          />
        </FormField>

        <View
          className="p-3 rounded-lg mb-4"
          style={{ backgroundColor: colors.muted }}
        >
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
              marginBottom: 4,
            }}
          >
            Available Variables
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.xs,
            }}
          >
            {TEMPLATE_TYPE_CONFIG[type].suggestedVariables
              .map((v) => `{{${v}}}`)
              .join(', ')}
          </Text>
        </View>
      </View>

      <View
        className="flex-row gap-3 pt-4 pb-6 px-4"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <Button
          variant="outline"
          onPress={onClose}
          className="flex-1"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSave}
          className="flex-1"
          disabled={isSaving || !name.trim() || !body.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </Button>
      </View>
    </BottomSheet>
  );
}

export default GuestTemplatesScreen;
