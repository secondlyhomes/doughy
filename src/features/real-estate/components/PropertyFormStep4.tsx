// src/features/real-estate/components/PropertyFormStep4.tsx
// Step 4: Property Photos

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Camera, Image as ImageIcon, Info } from 'lucide-react-native';
import { PropertyImagePicker } from './PropertyImagePicker';

export interface Step4Data {
  images: string[];
}

interface PropertyFormStep4Props {
  data: Step4Data;
  onChange: (data: Partial<Step4Data>) => void;
}

export function PropertyFormStep4({ data, onChange }: PropertyFormStep4Props) {
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* Main Photo Section */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <Camera size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Property Photos</Text>
          </View>

          <PropertyImagePicker
            images={data.images}
            onChange={(images) => onChange({ images })}
            maxImages={10}
          />

          <Text className="text-xs text-muted-foreground mt-3">
            Tap to add photos from your camera roll or take new photos.
          </Text>
        </View>

        {/* Photo Tips */}
        <View className="bg-muted rounded-xl p-4">
          <View className="flex-row items-center mb-3">
            <Info size={16} className="text-muted-foreground" />
            <Text className="text-sm font-medium text-foreground ml-2">Photo Tips</Text>
          </View>

          <View className="gap-2">
            <View className="flex-row">
              <Text className="text-muted-foreground mr-2">•</Text>
              <Text className="text-sm text-muted-foreground flex-1">
                Include exterior shots from multiple angles
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-muted-foreground mr-2">•</Text>
              <Text className="text-sm text-muted-foreground flex-1">
                Capture all major rooms (kitchen, bathrooms, bedrooms)
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-muted-foreground mr-2">•</Text>
              <Text className="text-sm text-muted-foreground flex-1">
                Document any repairs needed
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-muted-foreground mr-2">•</Text>
              <Text className="text-sm text-muted-foreground flex-1">
                Take photos of the yard and surrounding area
              </Text>
            </View>
          </View>
        </View>

        {/* Photo count info */}
        <View className="flex-row items-center justify-center py-2">
          <ImageIcon size={16} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground ml-2">
            {data.images.length} / 10 photos added
          </Text>
        </View>

        {/* Skip note */}
        <View className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <Text className="text-sm text-foreground">
            Photos are optional. You can always add them later from the property detail screen.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
