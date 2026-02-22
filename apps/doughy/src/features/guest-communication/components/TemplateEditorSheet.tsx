// src/features/guest-communication/components/TemplateEditorSheet.tsx
// Bottom sheet for creating/editing guest message templates

import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  Input,
  FormField,
  Select,
  Button,
} from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import {
  GuestMessageTemplate,
  GuestTemplateType,
  MessageChannel,
  TEMPLATE_TYPE_CONFIG,
  CreateTemplateInput,
} from '../types';
import { DEFAULT_TEMPLATES } from '../services/templateService';

export interface TemplateEditorSheetProps {
  visible: boolean;
  onClose: () => void;
  template: GuestMessageTemplate | null;
  onSave: (input: CreateTemplateInput) => Promise<void>;
  isSaving: boolean;
}

export function TemplateEditorSheet({
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
