// src/features/real-estate/components/PropertyFormStep4.tsx
// Step 4: Property Photos
// Uses useThemeColors() for reliable dark mode support

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Camera, Image as ImageIcon, Info } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { PropertyImagePicker } from './PropertyImagePicker';

export interface Step4Data {
  images: string[];
}

interface PropertyFormStep4Props {
  data: Step4Data;
  onChange: (data: Partial<Step4Data>) => void;
}

export function PropertyFormStep4({ data, onChange }: PropertyFormStep4Props) {
  const colors = useThemeColors();

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* Main Photo Section */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <Camera size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Property Photos</Text>
          </View>

          <PropertyImagePicker
            images={data.images}
            onChange={(images) => onChange({ images })}
            maxImages={10}
          />

          <Text className="text-xs mt-3" style={{ color: colors.mutedForeground }}>
            Tap to add photos from your camera roll or take new photos.
          </Text>
        </View>

        {/* Photo Tips */}
        <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
          <View className="flex-row items-center mb-3">
            <Info size={16} color={colors.mutedForeground} />
            <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Photo Tips</Text>
          </View>

          <View className="gap-2">
            <View className="flex-row">
              <Text className="mr-2" style={{ color: colors.mutedForeground }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                Include exterior shots from multiple angles
              </Text>
            </View>
            <View className="flex-row">
              <Text className="mr-2" style={{ color: colors.mutedForeground }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                Capture all major rooms (kitchen, bathrooms, bedrooms)
              </Text>
            </View>
            <View className="flex-row">
              <Text className="mr-2" style={{ color: colors.mutedForeground }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                Document any repairs needed
              </Text>
            </View>
            <View className="flex-row">
              <Text className="mr-2" style={{ color: colors.mutedForeground }}>•</Text>
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                Take photos of the yard and surrounding area
              </Text>
            </View>
          </View>
        </View>

        {/* Photo count info */}
        <View className="flex-row items-center justify-center py-2">
          <ImageIcon size={16} color={colors.mutedForeground} />
          <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
            {data.images.length} / 10 photos added
          </Text>
        </View>

        {/* Skip note */}
        <View
          className="rounded-xl p-4"
          style={{
            backgroundColor: withOpacity(colors.primary, 'subtle'),
            borderWidth: 1,
            borderColor: withOpacity(colors.primary, 'muted'),
          }}
        >
          <Text className="text-sm" style={{ color: colors.foreground }}>
            Photos are optional. You can always add them later from the property detail screen.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
