// src/features/real-estate/components/PropertyFormStep5.tsx
// Step 5: Notes & Review
// Uses useThemeColors() for reliable dark mode support

import React from 'react';
import { View, Text, TextInput, ScrollView, Image } from 'react-native';
import {
  FileText,
  MapPin,
  Home,
  Bed,
  Bath,
  Square,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { formatCurrency, formatNumber, formatPropertyType } from '../utils/formatters';
import { Step1Data } from './PropertyFormStep1';
import { Step2Data } from './PropertyFormStep2';
import { Step3Data } from './PropertyFormStep3';
import { Step4Data } from './PropertyFormStep4';

export interface Step5Data {
  notes: string;
}

interface PropertyFormStep5Props {
  data: Step5Data;
  step1Data: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  step4Data: Step4Data;
  onChange: (data: Partial<Step5Data>) => void;
}

export function PropertyFormStep5({
  data,
  step1Data,
  step2Data,
  step3Data,
  step4Data,
  onChange,
}: PropertyFormStep5Props) {
  const colors = useThemeColors();

  // Calculate completeness
  const sections = [
    { name: 'Address', complete: !!(step1Data.address && step1Data.city && step1Data.state && step1Data.zip) },
    { name: 'Property Type', complete: !!step1Data.propertyType },
    { name: 'Details', complete: !!(step2Data.bedrooms || step2Data.bathrooms || step2Data.square_feet) },
    { name: 'Pricing', complete: !!(step3Data.arv || step3Data.purchase_price) },
    { name: 'Photos', complete: step4Data.images.length > 0 },
  ];

  const completedCount = sections.filter(s => s.complete).length;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* Notes Section */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <FileText size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Notes</Text>
          </View>

          <TextInput
            value={data.notes}
            onChangeText={(value) => onChange({ notes: value })}
            placeholder="Add any notes about this property...

Examples:
- Owner motivated to sell
- Needs new roof
- Good school district
- Cash only deal"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="rounded-lg px-4 py-3 min-h-[150]"
            style={{ backgroundColor: colors.muted, color: colors.foreground }}
          />
        </View>

        {/* Review Summary */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Review Summary</Text>

          {/* Completeness indicator */}
          <View className="rounded-lg p-3 mb-4" style={{ backgroundColor: colors.muted }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Property Completeness</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>{completedCount}/{sections.length}</Text>
            </View>
            <View className="flex-row gap-1">
              {sections.map((section, index) => (
                <View
                  key={section.name}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ backgroundColor: section.complete ? colors.primary : colors.border }}
                />
              ))}
            </View>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {sections.map(section => (
                <View key={section.name} className="flex-row items-center">
                  <CheckCircle
                    size={12}
                    color={section.complete ? colors.primary : colors.mutedForeground}
                    fill={section.complete ? colors.primary : 'transparent'}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{ color: section.complete ? colors.foreground : colors.mutedForeground }}
                  >
                    {section.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Address */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <MapPin size={16} color={colors.mutedForeground} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.mutedForeground }}>Address</Text>
            </View>
            {step1Data.address ? (
              <View>
                <Text className="font-medium" style={{ color: colors.foreground }}>{step1Data.address}</Text>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  {step1Data.city}, {step1Data.state} {step1Data.zip}
                </Text>
              </View>
            ) : (
              <Text className="italic" style={{ color: colors.mutedForeground }}>No address entered</Text>
            )}
          </View>

          {/* Property Type */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Home size={16} color={colors.mutedForeground} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.mutedForeground }}>Property Type</Text>
            </View>
            <Text style={{ color: colors.foreground }}>{formatPropertyType(step1Data.propertyType)}</Text>
          </View>

          {/* Details */}
          {(step2Data.bedrooms || step2Data.bathrooms || step2Data.square_feet) && (
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>Details</Text>
              <View className="flex-row gap-4">
                {step2Data.bedrooms && (
                  <View className="flex-row items-center">
                    <Bed size={14} color={colors.mutedForeground} />
                    <Text className="ml-1" style={{ color: colors.foreground }}>{step2Data.bedrooms} beds</Text>
                  </View>
                )}
                {step2Data.bathrooms && (
                  <View className="flex-row items-center">
                    <Bath size={14} color={colors.mutedForeground} />
                    <Text className="ml-1" style={{ color: colors.foreground }}>{step2Data.bathrooms} baths</Text>
                  </View>
                )}
                {step2Data.square_feet && (
                  <View className="flex-row items-center">
                    <Square size={14} color={colors.mutedForeground} />
                    <Text className="ml-1" style={{ color: colors.foreground }}>{formatNumber(parseInt(step2Data.square_feet))} sqft</Text>
                  </View>
                )}
              </View>
              {step2Data.year_built && (
                <View className="flex-row items-center mt-2">
                  <Calendar size={14} color={colors.mutedForeground} />
                  <Text className="ml-1" style={{ color: colors.foreground }}>Built {step2Data.year_built}</Text>
                </View>
              )}
            </View>
          )}

          {/* Pricing */}
          {(step3Data.arv || step3Data.purchase_price) && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <DollarSign size={16} color={colors.mutedForeground} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.mutedForeground }}>Pricing</Text>
              </View>
              <View className="gap-1">
                {step3Data.arv && (
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.mutedForeground }}>ARV:</Text>
                    <Text className="font-medium" style={{ color: colors.foreground }}>{formatCurrency(parseInt(step3Data.arv))}</Text>
                  </View>
                )}
                {step3Data.purchase_price && (
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.mutedForeground }}>Purchase Price:</Text>
                    <Text className="font-medium" style={{ color: colors.foreground }}>{formatCurrency(parseInt(step3Data.purchase_price))}</Text>
                  </View>
                )}
                {step3Data.repair_cost && (
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.mutedForeground }}>Repair Cost:</Text>
                    <Text className="font-medium" style={{ color: colors.foreground }}>{formatCurrency(parseInt(step3Data.repair_cost))}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Photos */}
          <View>
            <View className="flex-row items-center mb-2">
              <ImageIcon size={16} color={colors.mutedForeground} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.mutedForeground }}>
                Photos ({step4Data.images.length})
              </Text>
            </View>
            {step4Data.images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {step4Data.images.slice(0, 5).map((uri, index) => (
                    <Image
                      key={index}
                      source={{ uri }}
                      className="w-16 h-16 rounded-lg"
                      resizeMode="cover"
                    />
                  ))}
                  {step4Data.images.length > 5 && (
                    <View
                      className="w-16 h-16 rounded-lg items-center justify-center"
                      style={{ backgroundColor: colors.muted }}
                    >
                      <Text className="font-medium" style={{ color: colors.foreground }}>+{step4Data.images.length - 5}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : (
              <Text className="italic" style={{ color: colors.mutedForeground }}>No photos added</Text>
            )}
          </View>
        </View>

        {/* Submit info */}
        <View
          className="rounded-xl p-4"
          style={{
            backgroundColor: `${colors.primary}08`,
            borderWidth: 1,
            borderColor: `${colors.primary}15`,
          }}
        >
          <Text className="text-sm" style={{ color: colors.foreground }}>
            Click "Create Property" below to save this property. You can always edit the details later.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
