// src/features/turnovers/screens/turnover-detail/NextActionPanel.tsx
// Next action panel showing status-based buttons

import React from 'react';
import { View, Text } from 'react-native';
import { Clock, CheckCircle2, Home } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button, Card, Input, FormField } from '@/components/ui';
import { FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import type { TurnoverStatus } from '../../types';

interface NextActionPanelProps {
  status: TurnoverStatus;
  isSaving: boolean;
  inspectionNotes: string;
  onInspectionNotesChange: (notes: string) => void;
  onScheduleCleaning: () => void;
  onMarkCleaningDone: () => void;
  onMarkInspected: () => void;
  onMarkReady: () => void;
}

export function NextActionPanel({
  status,
  isSaving,
  inspectionNotes,
  onInspectionNotesChange,
  onScheduleCleaning,
  onMarkCleaningDone,
  onMarkInspected,
  onMarkReady,
}: NextActionPanelProps) {
  const colors = useThemeColors();

  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <Button
            onPress={onScheduleCleaning}
            className="flex-row items-center justify-center gap-2"
          >
            <Clock size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Schedule Cleaning
            </Text>
          </Button>
        );

      case 'cleaning_scheduled':
        return (
          <Button
            onPress={onMarkCleaningDone}
            disabled={isSaving}
            className="flex-row items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSaving ? 'Saving...' : 'Mark Cleaning Done'}
            </Text>
          </Button>
        );

      case 'cleaning_done':
        return (
          <View>
            <FormField label="Inspection Notes (optional)" className="mb-3">
              <Input
                value={inspectionNotes}
                onChangeText={onInspectionNotesChange}
                placeholder="Any issues found during inspection..."
                multiline
                numberOfLines={3}
              />
            </FormField>
            <Button
              onPress={onMarkInspected}
              disabled={isSaving}
              className="flex-row items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {isSaving ? 'Saving...' : 'Mark Inspected'}
              </Text>
            </Button>
          </View>
        );

      case 'inspected':
        return (
          <Button
            onPress={onMarkReady}
            disabled={isSaving}
            className="flex-row items-center justify-center gap-2"
            style={{ backgroundColor: colors.success }}
          >
            <Home size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSaving ? 'Saving...' : 'Mark Ready for Guest'}
            </Text>
          </Button>
        );

      case 'ready':
        return (
          <View
            className="py-4 px-4 rounded-xl items-center"
            style={{ backgroundColor: colors.success + '20' }}
          >
            <CheckCircle2 size={ICON_SIZES['2xl']} color={colors.success} />
            <Text
              style={{
                color: colors.success,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginTop: 8,
              }}
            >
              Ready for Next Guest!
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return <Card className="mb-4">{renderContent()}</Card>;
}
