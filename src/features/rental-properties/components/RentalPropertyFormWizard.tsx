// src/features/rental-properties/components/RentalPropertyFormWizard.tsx
// Multi-step form wizard for creating/editing rental properties
// Follows ADHD-friendly design: max 5 fields per step, progress indicator

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Home,
  MapPin,
  Building2,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { haptic } from '@/lib/haptics';
import { Button, FormField, Progress } from '@/components/ui';
import { useFormValidation, useFieldRef } from '@/hooks';
import { rentalPropertyFormSchema, rentalPropertyFieldOrder } from '@/lib/validation';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  RentalPropertyFormData,
  defaultRentalPropertyFormValues,
  COMMON_AMENITIES,
} from '../types/form';
import type { PropertyType, RentalType, RateType, PropertyStatus } from '../types';

// Property type options
const PROPERTY_TYPE_OPTIONS: { label: string; value: PropertyType }[] = [
  { label: 'Single Family', value: 'single_family' },
  { label: 'Multi-Family', value: 'multi_family' },
  { label: 'Condo', value: 'condo' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Room', value: 'room' },
];

// Rental type options
const RENTAL_TYPE_OPTIONS: { label: string; value: RentalType }[] = [
  { label: 'Short-Term (STR)', value: 'str' },
  { label: 'Mid-Term (MTR)', value: 'mtr' },
  { label: 'Long-Term (LTR)', value: 'ltr' },
];

// Rate type options
const RATE_TYPE_OPTIONS: { label: string; value: RateType }[] = [
  { label: 'Nightly', value: 'nightly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

// Status options
const STATUS_OPTIONS: { label: string; value: PropertyStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

// Wizard steps definition
const WIZARD_STEPS = [
  { id: 'location', title: 'Location', shortTitle: 'Location' },
  { id: 'details', title: 'Property Details', shortTitle: 'Details' },
  { id: 'rental', title: 'Rental Settings', shortTitle: 'Rental' },
  { id: 'amenities', title: 'Amenities & Status', shortTitle: 'Finish' },
];

type FieldName = keyof RentalPropertyFormData;

interface RentalPropertyFormWizardProps {
  initialValues?: Partial<RentalPropertyFormData>;
  onSubmit: (data: RentalPropertyFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function RentalPropertyFormWizard({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Create Property',
}: RentalPropertyFormWizardProps) {
  const colors = useThemeColors();
  const [currentStep, setCurrentStep] = useState(0);

  // Field refs for scroll-to-error
  const fieldRefs = useFieldRef<FieldName>();

  // Form validation hook
  const form = useFormValidation<RentalPropertyFormData>({
    initialValues: {
      ...defaultRentalPropertyFormValues,
      ...initialValues,
    },
    schema: rentalPropertyFormSchema,
    validationMode: 'onChange',
    debounceMs: 300,
    fieldOrder: rentalPropertyFieldOrder,
    onScrollToError: (fieldName) => {
      fieldRefs.scrollToField(fieldName as FieldName);
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  // Dropdown states
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);
  const [showRentalTypePicker, setShowRentalTypePicker] = useState(false);
  const [showRateTypePicker, setShowRateTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Amenity toggle handler
  const handleAmenityToggle = useCallback((amenity: string) => {
    const currentAmenities = form.values.amenities || [];
    if (currentAmenities.includes(amenity)) {
      form.updateField('amenities', currentAmenities.filter(a => a !== amenity));
    } else {
      form.updateField('amenities', [...currentAmenities, amenity]);
    }
  }, [form]);

  // Validate current step fields synchronously
  // This runs synchronous validation to avoid race condition with debounced onChange validation
  const validateCurrentStep = useCallback((): boolean => {
    // Run synchronous validation on the current step's fields
    const validateFields = (fields: (keyof RentalPropertyFormData)[]) => {
      let isValid = true;
      for (const field of fields) {
        form.setFieldTouched(field);
        // Trigger synchronous validation for this field
        const error = form.validateSingleField?.(field) ?? form.getFieldError(field);
        if (error) {
          isValid = false;
        }
      }
      return isValid;
    };

    switch (currentStep) {
      case 0: // Location - required fields
        const locationFields: (keyof RentalPropertyFormData)[] = ['name', 'address', 'city', 'state'];
        const locationValid = validateFields(locationFields);
        // Also check that required values are present (not just error-free)
        const hasRequiredValues = !!form.values.name?.trim() &&
          !!form.values.address?.trim() &&
          !!form.values.city?.trim() &&
          !!form.values.state?.trim();
        return locationValid && hasRequiredValues;
      case 1: // Details - optional fields
        return true;
      case 2: // Rental Settings - base_rate required
        const rentalFields: (keyof RentalPropertyFormData)[] = ['base_rate'];
        const rentalValid = validateFields(rentalFields);
        const hasBaseRate = !!form.values.base_rate && Number(form.values.base_rate) > 0;
        return rentalValid && hasBaseRate;
      case 3: // Amenities & Status - optional
        return true;
      default:
        return true;
    }
  }, [currentStep, form]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }
    if (currentStep < WIZARD_STEPS.length - 1) {
      haptic.light();
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      haptic.light();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Handle form submission
  const handleSubmitForm = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }
    haptic.medium();
    try {
      await form.handleSubmit();
    } catch (err) {
      // Error is already handled by form's onError or the parent component
      // This catch prevents unhandled promise rejection
      console.error('[RentalPropertyFormWizard] Submit error:', err);
    }
  }, [validateCurrentStep, form]);

  // Handle cancel with confirmation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    }
  }, [onCancel]);

  // Handle direct step navigation
  const handleStepPress = useCallback((index: number) => {
    if (index === currentStep) return;

    // Allow navigating back without validation
    if (index < currentStep) {
      haptic.light();
      setCurrentStep(index);
      return;
    }

    // Forward navigation requires validation
    if (validateCurrentStep()) {
      haptic.light();
      setCurrentStep(index);
    }
  }, [currentStep, validateCurrentStep]);

  // Get label for picker value
  const getPickerLabel = <T extends string>(
    value: T | undefined,
    options: { label: string; value: T }[],
    placeholder: string
  ) => {
    const option = options.find(o => o.value === value);
    return option?.label || placeholder;
  };

  // Render inline picker
  const renderPicker = <T extends string>(
    label: string,
    value: T | undefined,
    options: { label: string; value: T }[],
    placeholder: string,
    showPicker: boolean,
    setShowPicker: (show: boolean) => void,
    onChange: (value: T) => void
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>{label}</Text>
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-lg px-3 py-3"
        style={{ backgroundColor: colors.muted }}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text className="text-base" style={{ color: colors.foreground }}>
          {getPickerLabel(value, options, placeholder)}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {showPicker && (
        <View
          className="rounded-lg mt-2 overflow-hidden"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              className="px-4 py-3"
              style={{
                borderBottomWidth: index < options.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor: value === option.value ? withOpacity(colors.primary, 'muted') : 'transparent',
              }}
              onPress={() => {
                onChange(option.value);
                setShowPicker(false);
              }}
            >
              <Text
                className="text-base"
                style={{
                  color: value === option.value ? colors.primary : colors.foreground,
                  fontWeight: value === option.value ? '500' : 'normal',
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Step 1: Location
        return (
          <>
            <FormField
              ref={(ref) => fieldRefs.registerInputRef('name', ref)}
              onLayoutContainer={fieldRefs.createLayoutHandler('name')}
              label="Property Name"
              value={form.values.name}
              onChangeText={(text) => form.updateField('name', text)}
              onBlur={() => form.setFieldTouched('name')}
              error={form.getFieldError('name')}
              placeholder="e.g., Beach House, Downtown Condo"
              required
              icon={Home}
              autoCapitalize="words"
            />

            <FormField
              ref={(ref) => fieldRefs.registerInputRef('address', ref)}
              onLayoutContainer={fieldRefs.createLayoutHandler('address')}
              label="Street Address"
              value={form.values.address}
              onChangeText={(text) => form.updateField('address', text)}
              onBlur={() => form.setFieldTouched('address')}
              error={form.getFieldError('address')}
              placeholder="123 Main Street"
              required
              icon={MapPin}
              autoCapitalize="words"
            />

            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('city', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('city')}
                  label="City"
                  value={form.values.city}
                  onChangeText={(text) => form.updateField('city', text)}
                  onBlur={() => form.setFieldTouched('city')}
                  error={form.getFieldError('city')}
                  placeholder="City"
                  required
                  autoCapitalize="words"
                />
              </View>
              <View style={{ width: 80 }}>
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('state', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('state')}
                  label="State"
                  value={form.values.state}
                  onChangeText={(text) => form.updateField('state', text.toUpperCase())}
                  onBlur={() => form.setFieldTouched('state')}
                  error={form.getFieldError('state')}
                  placeholder="ST"
                  required
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ width: 100 }}>
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('zip', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('zip')}
                  label="ZIP"
                  value={form.values.zip}
                  onChangeText={(text) => form.updateField('zip', text)}
                  onBlur={() => form.setFieldTouched('zip')}
                  error={form.getFieldError('zip')}
                  placeholder="12345"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </>
        );

      case 1: // Step 2: Property Details
        return (
          <>
            {renderPicker(
              'Property Type',
              form.values.property_type,
              PROPERTY_TYPE_OPTIONS,
              'Select property type',
              showPropertyTypePicker,
              setShowPropertyTypePicker,
              (value) => form.updateField('property_type', value)
            )}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('bedrooms', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('bedrooms')}
                  label="Bedrooms"
                  value={String(form.values.bedrooms || '')}
                  onChangeText={(text) => form.updateField('bedrooms', text)}
                  onBlur={() => form.setFieldTouched('bedrooms')}
                  error={form.getFieldError('bedrooms')}
                  placeholder="0"
                  keyboardType="number-pad"
                  icon={Bed}
                />
              </View>
              <View className="flex-1">
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('bathrooms', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('bathrooms')}
                  label="Bathrooms"
                  value={String(form.values.bathrooms || '')}
                  onChangeText={(text) => form.updateField('bathrooms', text)}
                  onBlur={() => form.setFieldTouched('bathrooms')}
                  error={form.getFieldError('bathrooms')}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  icon={Bath}
                />
              </View>
            </View>

            <FormField
              ref={(ref) => fieldRefs.registerInputRef('square_feet', ref)}
              onLayoutContainer={fieldRefs.createLayoutHandler('square_feet')}
              label="Square Feet"
              value={String(form.values.square_feet || '')}
              onChangeText={(text) => form.updateField('square_feet', text)}
              onBlur={() => form.setFieldTouched('square_feet')}
              error={form.getFieldError('square_feet')}
              placeholder="e.g., 1500"
              keyboardType="number-pad"
              icon={Maximize2}
            />
          </>
        );

      case 2: // Step 3: Rental Settings
        return (
          <>
            {renderPicker(
              'Rental Type',
              form.values.rental_type,
              RENTAL_TYPE_OPTIONS,
              'Select rental type',
              showRentalTypePicker,
              setShowRentalTypePicker,
              (value) => form.updateField('rental_type', value)
            )}

            <FormField
              ref={(ref) => fieldRefs.registerInputRef('base_rate', ref)}
              onLayoutContainer={fieldRefs.createLayoutHandler('base_rate')}
              label="Base Rate"
              value={String(form.values.base_rate || '')}
              onChangeText={(text) => form.updateField('base_rate', text)}
              onBlur={() => form.setFieldTouched('base_rate')}
              error={form.getFieldError('base_rate')}
              placeholder="0.00"
              keyboardType="decimal-pad"
              icon={DollarSign}
              required
              prefix="$"
            />

            {renderPicker(
              'Rate Type',
              form.values.rate_type,
              RATE_TYPE_OPTIONS,
              'Select rate type',
              showRateTypePicker,
              setShowRateTypePicker,
              (value) => form.updateField('rate_type', value)
            )}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('cleaning_fee', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('cleaning_fee')}
                  label="Cleaning Fee"
                  value={String(form.values.cleaning_fee || '')}
                  onChangeText={(text) => form.updateField('cleaning_fee', text)}
                  onBlur={() => form.setFieldTouched('cleaning_fee')}
                  error={form.getFieldError('cleaning_fee')}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  prefix="$"
                />
              </View>
              <View className="flex-1">
                <FormField
                  ref={(ref) => fieldRefs.registerInputRef('security_deposit', ref)}
                  onLayoutContainer={fieldRefs.createLayoutHandler('security_deposit')}
                  label="Security Deposit"
                  value={String(form.values.security_deposit || '')}
                  onChangeText={(text) => form.updateField('security_deposit', text)}
                  onBlur={() => form.setFieldTouched('security_deposit')}
                  error={form.getFieldError('security_deposit')}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  prefix="$"
                />
              </View>
            </View>
          </>
        );

      case 3: // Step 4: Amenities & Status
        return (
          <>
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
              Amenities
            </Text>
            <Text className="text-xs mb-3" style={{ color: colors.mutedForeground }}>
              Select all that apply
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-6">
              {COMMON_AMENITIES.map((amenity) => {
                const isSelected = form.values.amenities?.includes(amenity);
                return (
                  <TouchableOpacity
                    key={amenity}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: isSelected
                        ? withOpacity(colors.primary, 'muted')
                        : colors.muted,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => handleAmenityToggle(amenity)}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isSelected ? colors.primary : colors.foreground,
                        fontWeight: isSelected ? '500' : 'normal',
                      }}
                    >
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {renderPicker(
              'Property Status',
              form.values.status,
              STATUS_OPTIONS,
              'Select status',
              showStatusPicker,
              setShowStatusPicker,
              (value) => form.updateField('status', value)
            )}
          </>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const progress = (currentStep + 1) / WIZARD_STEPS.length;

  return (
    <View className="flex-1">
      {/* Progress Header */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md }}>
        {/* Progress Bar */}
        <View className="flex-row items-center justify-between mb-2">
          <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <Progress value={progress * 100} />

        {/* Step Title */}
        <Text
          style={{
            color: colors.foreground,
            fontSize: FONT_SIZES.lg,
            fontWeight: '600',
            marginTop: SPACING.md,
          }}
        >
          {WIZARD_STEPS[currentStep].title}
        </Text>
      </View>

      {/* Step Content */}
      <ScrollView
        ref={fieldRefs.scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        className="flex-row gap-3"
        style={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: SPACING.xl,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {currentStep === 0 ? (
          onCancel ? (
            <Button
              variant="secondary"
              onPress={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X size={20} color={colors.foreground} />
              Cancel
            </Button>
          ) : (
            <View className="flex-1" />
          )
        ) : (
          <Button
            variant="secondary"
            onPress={handleBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            <ArrowLeft size={20} color={colors.foreground} />
            Back
          </Button>
        )}

        {isLastStep ? (
          <Button
            onPress={handleSubmitForm}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            {!isSubmitting && <Check size={20} color={colors.primaryForeground} />}
            {submitLabel}
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            disabled={isSubmitting}
            className="flex-1"
          >
            Next
            <ArrowRight size={20} color={colors.primaryForeground} />
          </Button>
        )}
      </View>
    </View>
  );
}

export default RentalPropertyFormWizard;
