// src/features/real-estate/components/PropertyFormStep5.tsx
// Step 5: Notes & Review

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
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <FileText size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Notes</Text>
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
            className="bg-muted rounded-lg px-4 py-3 text-foreground min-h-[150]"
          />
        </View>

        {/* Review Summary */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Review Summary</Text>

          {/* Completeness indicator */}
          <View className="bg-muted rounded-lg p-3 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-foreground font-medium">Property Completeness</Text>
              <Text className="text-sm text-primary font-semibold">{completedCount}/{sections.length}</Text>
            </View>
            <View className="flex-row gap-1">
              {sections.map((section, index) => (
                <View
                  key={section.name}
                  className={`flex-1 h-1.5 rounded-full ${
                    section.complete ? 'bg-primary' : 'bg-border'
                  }`}
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
                  <Text className={`text-xs ml-1 ${section.complete ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {section.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Address */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <MapPin size={16} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground ml-2">Address</Text>
            </View>
            {step1Data.address ? (
              <View>
                <Text className="text-foreground font-medium">{step1Data.address}</Text>
                <Text className="text-sm text-muted-foreground">
                  {step1Data.city}, {step1Data.state} {step1Data.zip}
                </Text>
              </View>
            ) : (
              <Text className="text-muted-foreground italic">No address entered</Text>
            )}
          </View>

          {/* Property Type */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Home size={16} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground ml-2">Property Type</Text>
            </View>
            <Text className="text-foreground">{formatPropertyType(step1Data.propertyType)}</Text>
          </View>

          {/* Details */}
          {(step2Data.bedrooms || step2Data.bathrooms || step2Data.square_feet) && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-muted-foreground mb-2">Details</Text>
              <View className="flex-row gap-4">
                {step2Data.bedrooms && (
                  <View className="flex-row items-center">
                    <Bed size={14} className="text-muted-foreground" />
                    <Text className="text-foreground ml-1">{step2Data.bedrooms} beds</Text>
                  </View>
                )}
                {step2Data.bathrooms && (
                  <View className="flex-row items-center">
                    <Bath size={14} className="text-muted-foreground" />
                    <Text className="text-foreground ml-1">{step2Data.bathrooms} baths</Text>
                  </View>
                )}
                {step2Data.square_feet && (
                  <View className="flex-row items-center">
                    <Square size={14} className="text-muted-foreground" />
                    <Text className="text-foreground ml-1">{formatNumber(parseInt(step2Data.square_feet))} sqft</Text>
                  </View>
                )}
              </View>
              {step2Data.year_built && (
                <View className="flex-row items-center mt-2">
                  <Calendar size={14} className="text-muted-foreground" />
                  <Text className="text-foreground ml-1">Built {step2Data.year_built}</Text>
                </View>
              )}
            </View>
          )}

          {/* Pricing */}
          {(step3Data.arv || step3Data.purchase_price) && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <DollarSign size={16} className="text-muted-foreground" />
                <Text className="text-sm font-medium text-muted-foreground ml-2">Pricing</Text>
              </View>
              <View className="gap-1">
                {step3Data.arv && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">ARV:</Text>
                    <Text className="text-foreground font-medium">{formatCurrency(parseInt(step3Data.arv))}</Text>
                  </View>
                )}
                {step3Data.purchase_price && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Purchase Price:</Text>
                    <Text className="text-foreground font-medium">{formatCurrency(parseInt(step3Data.purchase_price))}</Text>
                  </View>
                )}
                {step3Data.repair_cost && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Repair Cost:</Text>
                    <Text className="text-foreground font-medium">{formatCurrency(parseInt(step3Data.repair_cost))}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Photos */}
          <View>
            <View className="flex-row items-center mb-2">
              <ImageIcon size={16} className="text-muted-foreground" />
              <Text className="text-sm font-medium text-muted-foreground ml-2">
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
                    <View className="w-16 h-16 rounded-lg bg-muted items-center justify-center">
                      <Text className="text-foreground font-medium">+{step4Data.images.length - 5}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : (
              <Text className="text-muted-foreground italic">No photos added</Text>
            )}
          </View>
        </View>

        {/* Submit info */}
        <View className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <Text className="text-sm text-foreground">
            Click "Create Property" below to save this property. You can always edit the details later.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
