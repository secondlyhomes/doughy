// src/features/admin/screens/ai-security-dashboard/PatternFormSection.tsx
// Form fields for pattern details (regex, severity, threat type, description)

import React from 'react';
import { View, Text } from 'react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheetSection, FormField, Select } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';

import { SEVERITY_OPTIONS, THREAT_TYPE_OPTIONS } from './pattern-editor-constants';

interface PatternFormSectionProps {
  pattern: string;
  onPatternChange: (value: string) => void;
  severity: string;
  onSeverityChange: (value: string) => void;
  threatType: string;
  onThreatTypeChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function PatternFormSection({
  pattern,
  onPatternChange,
  severity,
  onSeverityChange,
  threatType,
  onThreatTypeChange,
  description,
  onDescriptionChange,
}: PatternFormSectionProps) {
  const colors = useThemeColors();

  return (
    <FocusedSheetSection title="Pattern Details">
      <FormField
        label="Regex Pattern"
        required
        value={pattern}
        onChangeText={onPatternChange}
        placeholder="e\.g\. (ignore|forget).*instructions"
        autoCapitalize="none"
        autoCorrect={false}
        style={{ fontFamily: 'monospace' }}
      />

      <View style={{ flexDirection: 'row', gap: 12, marginTop: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.foreground,
              marginBottom: 6,
            }}
          >
            Severity *
          </Text>
          <Select value={severity} onValueChange={onSeverityChange} options={SEVERITY_OPTIONS} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.foreground,
              marginBottom: 6,
            }}
          >
            Threat Type *
          </Text>
          <Select
            value={threatType}
            onValueChange={onThreatTypeChange}
            options={THREAT_TYPE_OPTIONS}
          />
        </View>
      </View>

      <View style={{ marginTop: SPACING.md }}>
        <FormField
          label="Description"
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Brief description of what this pattern detects"
        />
      </View>
    </FocusedSheetSection>
  );
}
