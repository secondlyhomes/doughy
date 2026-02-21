// src/features/real-estate/components/PropertyFormWizard.tsx
// Multi-step form wizard for creating/editing properties

import React, { useState, useCallback } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { haptic } from '@/lib/haptics';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { FormStepProgress, PROPERTY_FORM_STEPS } from './FormStepProgress';
import { PropertyFormStep1, Step1Data } from './PropertyFormStep1';
import { PropertyFormStep2, Step2Data } from './PropertyFormStep2';
import { PropertyFormStep3, Step3Data } from './PropertyFormStep3';
import { PropertyFormStep4, Step4Data } from './PropertyFormStep4';
import { PropertyFormStep5, Step5Data } from './PropertyFormStep5';
import { Property } from '../types';
import { useVoiceCapture } from '../hooks/useVoiceCapture';
import { usePhotoExtract } from '../hooks/usePhotoExtract';
import { validateForm, isFormValid } from '@/lib/validation';
import {
  propertyStep1Schema,
  propertyStep2Schema,
  propertyStep3Schema,
} from '@/lib/validation/schemas/propertySchema';
import { PropertyFormWizardProps } from './wizard-form-types';
import {
  initialStep1Data,
  initialStep2Data,
  initialStep3Data,
  initialStep4Data,
  initialStep5Data,
} from './wizard-form-constants';
import { WizardNavigation } from './WizardNavigation';
import { WizardQuickCapture } from './WizardQuickCapture';

export function PropertyFormWizard({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Property',
}: PropertyFormWizardProps) {
  const { contentPadding } = useTabBarPadding();
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

  // Validation for each step using validation schemas
  const validateStep = useCallback((step: number): boolean => {
    let newErrors: Record<string, string> = {};

    if (step === 0) {
      // Step 1: Address validation using schema
      newErrors = validateForm(step1Data, propertyStep1Schema) as Record<string, string>;
    } else if (step === 1) {
      // Step 2: Details validation using schema
      newErrors = validateForm(step2Data, propertyStep2Schema) as Record<string, string>;
    } else if (step === 2) {
      // Step 3: Financial validation using schema
      newErrors = validateForm(step3Data, propertyStep3Schema) as Record<string, string>;
    }
    // Steps 4, 5 have optional fields - no validation needed

    setErrors(newErrors);
    return isFormValid(newErrors);
  }, [step1Data, step2Data, step3Data]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) {
      return;
    }
    if (currentStep < PROPERTY_FORM_STEPS.length - 1) {
      haptic.light();
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      haptic.light();
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

  // Handle step indicator press for direct navigation
  const handleStepPress = useCallback((index: number) => {
    if (index === currentStep) return;

    // If navigating away from current step, validate but allow anyway (warn for required fields)
    if (currentStep === 0 && index > 0) {
      // Only warn if step 1 has missing required fields
      const missingFields: string[] = [];
      if (!step1Data.address.trim()) missingFields.push('Address');
      if (!step1Data.city.trim()) missingFields.push('City');
      if (!step1Data.state.trim()) missingFields.push('State');
      if (!step1Data.zip.trim()) missingFields.push('ZIP');

      if (missingFields.length > 0) {
        Alert.alert(
          'Missing Required Fields',
          `You'll need to complete these before submitting: ${missingFields.join(', ')}`,
          [
            { text: 'Stay Here', style: 'cancel' },
            { text: 'Continue Anyway', onPress: () => { haptic.light(); setCurrentStep(index); } },
          ]
        );
        return;
      }
    }

    haptic.light();
    setCurrentStep(index);
  }, [currentStep, step1Data]);

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
    <View className="flex-1">
      {/* Progress Indicator */}
      <FormStepProgress
        steps={PROPERTY_FORM_STEPS}
        currentStepIndex={currentStep}
        onStepPress={handleStepPress}
      />

      {/* AI Quick Capture - Only show on first step */}
      {currentStep === 0 && (
        <WizardQuickCapture
          voiceState={voiceCapture.state}
          photoState={photoExtract.state}
          onVoiceCapture={handleVoiceCapture}
          onPhotoCapture={handlePhotoCapture}
          formatDuration={voiceCapture.formatDuration}
        />
      )}

      {/* Scrollable Step Content with Navigation Buttons */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: contentPadding }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Content */}
        <View className="px-4 pb-4">
          {renderStepContent()}
        </View>

        {/* Navigation Buttons - scroll with content */}
        <WizardNavigation
          currentStep={currentStep}
          isLastStep={isLastStep}
          isLoading={isLoading}
          submitLabel={submitLabel}
          onCancel={handleCancel}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </View>
  );
}
