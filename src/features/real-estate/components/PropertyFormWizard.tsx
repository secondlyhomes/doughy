// src/features/real-estate/components/PropertyFormWizard.tsx
// Multi-step form wizard for creating/editing properties

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, ArrowRight, Check, X, Mic, Camera } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/context/ThemeContext';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { Button } from '@/components/ui';
import { FormStepProgress, PROPERTY_FORM_STEPS } from './FormStepProgress';
import { PropertyFormStep1, Step1Data } from './PropertyFormStep1';
import { PropertyFormStep2, Step2Data } from './PropertyFormStep2';
import { PropertyFormStep3, Step3Data } from './PropertyFormStep3';
import { PropertyFormStep4, Step4Data } from './PropertyFormStep4';
import { PropertyFormStep5, Step5Data } from './PropertyFormStep5';
import { Property } from '../types';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { usePhotoExtract } from '../hooks/usePhotoExtract';

interface PropertyFormWizardProps {
  initialData?: Partial<Property>;
  onSubmit: (data: Partial<Property>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

// Initial data for each step
const initialStep1Data: Step1Data = {
  address: '',
  address_line_2: '',
  city: '',
  state: '',
  zip: '',
  county: '',
  propertyType: 'single_family',
};

const initialStep2Data: Step2Data = {
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  lot_size: '',
  year_built: '',
};

const initialStep3Data: Step3Data = {
  arv: '',
  purchase_price: '',
  repair_cost: '',
};

const initialStep4Data: Step4Data = {
  images: [],
};

const initialStep5Data: Step5Data = {
  notes: '',
};

export function PropertyFormWizard({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Property',
}: PropertyFormWizardProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  // AI extraction hooks
  const voiceCapture = useVoiceCapture();
  const photoExtract = usePhotoExtract();
  const [step1Data, setStep1Data] = useState<Step1Data>(() => ({
    ...initialStep1Data,
    address: initialData?.address || initialData?.address_line_1 || '',
    address_line_2: initialData?.address_line_2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    county: initialData?.county || '',
    propertyType: initialData?.propertyType || initialData?.property_type || 'single_family',
  }));
  const [step2Data, setStep2Data] = useState<Step2Data>(() => ({
    ...initialStep2Data,
    bedrooms: initialData?.bedrooms?.toString() || '',
    bathrooms: initialData?.bathrooms?.toString() || '',
    square_feet: (initialData?.square_feet || initialData?.sqft)?.toString() || '',
    lot_size: (initialData?.lot_size || initialData?.lotSize)?.toString() || '',
    year_built: (initialData?.year_built || initialData?.yearBuilt)?.toString() || '',
  }));
  const [step3Data, setStep3Data] = useState<Step3Data>(() => ({
    ...initialStep3Data,
    arv: initialData?.arv?.toString() || '',
    purchase_price: initialData?.purchase_price?.toString() || '',
    repair_cost: initialData?.repair_cost?.toString() || '',
  }));
  const [step4Data, setStep4Data] = useState<Step4Data>(() => ({
    images: initialData?.images?.map(img => img.url) || [],
  }));
  const [step5Data, setStep5Data] = useState<Step5Data>(() => ({
    notes: initialData?.notes || '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation for each step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Step 1: Address validation
      if (!step1Data.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!step1Data.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!step1Data.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!step1Data.zip.trim()) {
        newErrors.zip = 'ZIP code is required';
      }
    } else if (step === 1) {
      // Step 2: Details validation (optional fields, but validate format)
      if (step2Data.bedrooms && isNaN(Number(step2Data.bedrooms))) {
        newErrors.bedrooms = 'Must be a number';
      }
      if (step2Data.bathrooms && isNaN(Number(step2Data.bathrooms))) {
        newErrors.bathrooms = 'Must be a number';
      }
      if (step2Data.year_built) {
        const year = Number(step2Data.year_built);
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
          newErrors.year_built = 'Invalid year';
        }
      }
    }
    // Steps 3, 4, 5 have optional fields

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step1Data, step2Data]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) {
      return;
    }
    if (currentStep < PROPERTY_FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Combine all data
    const propertyData: Partial<Property> = {
      // Step 1
      address: step1Data.address.trim(),
      address_line_2: step1Data.address_line_2.trim() || undefined,
      city: step1Data.city.trim(),
      state: step1Data.state.trim(),
      zip: step1Data.zip.trim(),
      county: step1Data.county.trim() || undefined,
      propertyType: step1Data.propertyType,
      // Step 2
      bedrooms: step2Data.bedrooms ? Number(step2Data.bedrooms) : undefined,
      bathrooms: step2Data.bathrooms ? Number(step2Data.bathrooms) : undefined,
      square_feet: step2Data.square_feet ? Number(step2Data.square_feet) : undefined,
      lot_size: step2Data.lot_size ? Number(step2Data.lot_size) : undefined,
      year_built: step2Data.year_built ? Number(step2Data.year_built) : undefined,
      // Step 3
      arv: step3Data.arv ? Number(step3Data.arv) : undefined,
      purchase_price: step3Data.purchase_price ? Number(step3Data.purchase_price) : undefined,
      repair_cost: step3Data.repair_cost ? Number(step3Data.repair_cost) : undefined,
      // Step 5
      notes: step5Data.notes.trim() || undefined,
    };

    await onSubmit(propertyData);
  }, [currentStep, validateStep, step1Data, step2Data, step3Data, step5Data, onSubmit]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onCancel },
      ]
    );
  }, [onCancel]);

  // Voice capture handler
  const handleVoiceCapture = useCallback(async () => {
    if (voiceCapture.state.isRecording) {
      const result = await voiceCapture.stopCapture();
      if (result?.extractedData) {
        const data = result.extractedData;
        // Update Step 1 (address)
        if (data.address) {
          setStep1Data(prev => ({ ...prev, address: data.address || '' }));
        }
        // Update Step 2 (property details)
        if (data.bedrooms) setStep2Data(prev => ({ ...prev, bedrooms: data.bedrooms?.toString() || '' }));
        if (data.bathrooms) setStep2Data(prev => ({ ...prev, bathrooms: data.bathrooms?.toString() || '' }));
        if (data.sqft) setStep2Data(prev => ({ ...prev, square_feet: data.sqft?.toString() || '' }));
        if (data.yearBuilt) setStep2Data(prev => ({ ...prev, year_built: data.yearBuilt?.toString() || '' }));
        if (data.lotSize) setStep2Data(prev => ({ ...prev, lot_size: data.lotSize?.toString() || '' }));
        // Update Step 3 (financial)
        if (data.askingPrice) setStep3Data(prev => ({ ...prev, purchase_price: data.askingPrice?.toString() || '' }));
        // Update notes
        if (data.notes) setStep5Data(prev => ({ ...prev, notes: data.notes || '' }));
        Alert.alert('Success', 'Property data extracted from voice!');
      }
    } else {
      await voiceCapture.startCapture();
    }
  }, [voiceCapture]);

  // Photo capture handler
  const handlePhotoCapture = useCallback(async () => {
    const result = await photoExtract.captureAndExtract();
    if (result && result.extractedData) {
      const data = result.extractedData as Record<string, unknown>;
      // Handle MLS sheets or tax records
      if (result.type === 'mls_sheet' || result.type === 'tax_record') {
        if (data.address && typeof data.address === 'string') {
          setStep1Data(prev => ({ ...prev, address: data.address as string }));
        }
        if (data.bedrooms && typeof data.bedrooms === 'number') {
          setStep2Data(prev => ({ ...prev, bedrooms: data.bedrooms?.toString() || '' }));
        }
        if (data.bathrooms && typeof data.bathrooms === 'number') {
          setStep2Data(prev => ({ ...prev, bathrooms: data.bathrooms?.toString() || '' }));
        }
        if (data.sqft && typeof data.sqft === 'number') {
          setStep2Data(prev => ({ ...prev, square_feet: data.sqft?.toString() || '' }));
        }
        Alert.alert('Success', `${result.type === 'mls_sheet' ? 'MLS sheet' : 'Tax record'} scanned and form filled!`);
      } else {
        Alert.alert('Info', 'Photo captured. Please scan an MLS sheet or tax record for best results.');
      }
    }
  }, [photoExtract]);

  const isLastStep = currentStep === PROPERTY_FORM_STEPS.length - 1;

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PropertyFormStep1
            data={step1Data}
            onChange={(data) => setStep1Data(prev => ({ ...prev, ...data }))}
            errors={errors}
          />
        );
      case 1:
        return (
          <PropertyFormStep2
            data={step2Data}
            onChange={(data) => setStep2Data(prev => ({ ...prev, ...data }))}
            errors={errors}
          />
        );
      case 2:
        return (
          <PropertyFormStep3
            data={step3Data}
            onChange={(data) => setStep3Data(prev => ({ ...prev, ...data }))}
            errors={errors}
          />
        );
      case 3:
        return (
          <PropertyFormStep4
            data={step4Data}
            onChange={(data) => setStep4Data(prev => ({ ...prev, ...data }))}
          />
        );
      case 4:
        return (
          <PropertyFormStep5
            data={step5Data}
            step1Data={step1Data}
            step2Data={step2Data}
            step3Data={step3Data}
            step4Data={step4Data}
            onChange={(data) => setStep5Data(prev => ({ ...prev, ...data }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Progress Indicator */}
      <FormStepProgress
        steps={PROPERTY_FORM_STEPS}
        currentStepIndex={currentStep}
      />

      {/* AI Quick Capture - Only show on first step */}
      {currentStep === 0 && (
        <View className="mx-4 mt-4 mb-2 p-4 rounded-xl" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
          <Text className="text-base font-semibold mb-2" style={{ color: colors.foreground }}>
            Quick Capture
          </Text>
          <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
            Use voice or scan MLS/tax documents to auto-fill property details
          </Text>
          <View className="flex-row gap-3">
            {/* Voice Capture Button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg"
              style={{ backgroundColor: voiceCapture.state.isRecording ? colors.destructive : colors.primary }}
              onPress={handleVoiceCapture}
              disabled={voiceCapture.state.isTranscribing || voiceCapture.state.isExtracting}
            >
              {voiceCapture.state.isTranscribing || voiceCapture.state.isExtracting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Mic size={18} color={colors.primaryForeground} />
                  <Text className="ml-2 font-medium" style={{ color: colors.primaryForeground }}>
                    {voiceCapture.state.isRecording ? 'Stop' : 'Voice'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Photo Capture Button */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={handlePhotoCapture}
              disabled={photoExtract.state.isCapturing || photoExtract.state.isExtracting}
            >
              {photoExtract.state.isCapturing || photoExtract.state.isExtracting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Camera size={18} color={colors.primaryForeground} />
                  <Text className="ml-2 font-medium" style={{ color: colors.primaryForeground }}>
                    Scan
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {voiceCapture.state.isRecording && (
            <Text className="text-xs mt-2 text-center" style={{ color: colors.mutedForeground }}>
              Recording: {voiceCapture.formatDuration(voiceCapture.state.duration)}
            </Text>
          )}
        </View>
      )}

      {/* Step Content */}
      <View className="flex-1 px-4 pb-4">
        {renderStepContent()}
      </View>

      {/* Navigation Buttons */}
      <View
        className="flex-row gap-3 p-4"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderColor: colors.border,
          paddingBottom: TAB_BAR_SAFE_PADDING, // Just breathing room - iOS auto-handles tab bar with NativeTabs
        }}
      >
        {currentStep === 0 ? (
          <Button
            variant="secondary"
            onPress={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X size={20} color={colors.foreground} />
            Cancel
          </Button>
        ) : (
          <Button
            variant="secondary"
            onPress={handleBack}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowLeft size={20} color={colors.foreground} />
            Back
          </Button>
        )}

        {isLastStep ? (
          <Button
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            className="flex-1"
          >
            {!isLoading && <Check size={20} color={colors.primaryForeground} />}
            {submitLabel}
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            disabled={isLoading}
            className="flex-1"
          >
            Next
            <ArrowRight size={20} color={colors.primaryForeground} />
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
