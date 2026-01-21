// src/features/portfolio/components/CreateGroupSheet.tsx
// Bottom sheet for creating/editing portfolio property groups

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet, BottomSheetSection } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { SPACING } from '@/constants/design-tokens';
import type { PortfolioGroup, CreateGroupInput } from '../types';

interface CreateGroupSheetProps {
  visible: boolean;
  onClose: () => void;
  existingGroup?: PortfolioGroup | null;
  onSubmit: (data: CreateGroupInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
}

// Predefined colors for groups
const GROUP_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

export function CreateGroupSheet({
  visible,
  onClose,
  existingGroup,
  onSubmit,
  onDelete,
  isLoading,
}: CreateGroupSheetProps) {
  const colors = useThemeColors();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [nameError, setNameError] = useState('');

  // Reset form when sheet opens
  useEffect(() => {
    if (visible) {
      if (existingGroup) {
        setName(existingGroup.name);
        setSelectedColor(existingGroup.color || GROUP_COLORS[0]);
      } else {
        setName('');
        setSelectedColor(GROUP_COLORS[0]);
      }
      setNameError('');
    }
  }, [visible, existingGroup]);

  const validateName = useCallback(() => {
    if (!name.trim()) {
      setNameError('Group name is required');
      return false;
    }
    if (name.trim().length > 50) {
      setNameError('Group name must be 50 characters or less');
      return false;
    }
    setNameError('');
    return true;
  }, [name]);

  const handleSubmit = useCallback(async () => {
    if (!validateName()) return;

    await onSubmit({
      name: name.trim(),
      color: selectedColor,
    });
  }, [name, selectedColor, validateName, onSubmit]);

  const isValid = useMemo(() => {
    return name.trim().length > 0 && name.trim().length <= 50;
  }, [name]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={existingGroup ? 'Edit Group' : 'Create Group'}
      snapPoints={['50%']}
    >
      <View className="flex-1">
          <BottomSheetSection title="Group Details">
            <View className="gap-4">
              {/* Group Name */}
              <View>
                <Input
                  label="Group Name"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g., Phoenix Properties"
                  autoFocus
                  maxLength={50}
                  error={nameError || undefined}
                />
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                  {name.length}/50 characters
                </Text>
              </View>

              {/* Color Picker */}
              <View>
                <Label>Color (Optional)</Label>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: SPACING.sm }}>
                  Choose a color to help visually identify this group
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GROUP_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      className="w-10 h-10 rounded-lg items-center justify-center"
                      style={{
                        backgroundColor: color,
                        borderWidth: selectedColor === color ? 3 : 0,
                        borderColor: colors.background,
                      }}
                    >
                      {selectedColor === color && (
                        <Check size={20} color="white" strokeWidth={3} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View>
                <Label>Preview</Label>
                <View
                  className="flex-row items-center gap-3 p-3 rounded-lg mt-1"
                  style={{ backgroundColor: colors.muted }}
                >
                  <View
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '500' }}>
                    {name.trim() || 'Group Name'}
                  </Text>
                </View>
              </View>
            </View>
          </BottomSheetSection>

          <View className="px-4 pb-6 gap-3">
            <Button
              onPress={handleSubmit}
              disabled={isLoading || !isValid}
              className="w-full"
            >
              {isLoading ? 'Saving...' : existingGroup ? 'Update Group' : 'Create Group'}
            </Button>

            {existingGroup && onDelete && (
              <Button
                variant="destructive"
                onPress={onDelete}
                disabled={isLoading}
                className="w-full"
              >
                Delete Group
              </Button>
            )}
          </View>
        </View>
    </BottomSheet>
  );
}

export default CreateGroupSheet;
