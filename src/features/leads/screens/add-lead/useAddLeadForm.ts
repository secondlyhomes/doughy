// Add Lead Screen - Form hook
// Encapsulates form state, validation, voice/photo capture handlers

import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFormValidation, useFieldRef, useKeyboardAvoidance } from '@/hooks';
import { useVoiceCapture } from '@/features/real-estate/hooks/useVoiceCapture';
import { usePhotoExtract } from '@/features/real-estate/hooks/usePhotoExtract';
import { useErrorHandler } from '@/contexts/ErrorContext';
import { leadFormSchema, leadFormFieldOrder } from '@/lib/validation';

import { useCreateLead } from '../../hooks/useLeads';
import { LeadFormData, LeadStatus } from '../../types';
import { LeadFieldName, STATUS_OPTIONS } from './add-lead-constants';

export function useAddLeadForm() {
  const router = useRouter();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: true });
  const createLead = useCreateLead();
  const { showError, showSuccess } = useErrorHandler();

  // AI extraction hooks
  const voiceCapture = useVoiceCapture();
  const photoExtract = usePhotoExtract();

  // Field refs for scroll-to-error
  const fieldRefs = useFieldRef<LeadFieldName>();

  // Use the new useFormValidation hook for state management and validation
  const form = useFormValidation<LeadFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'new',
      tags: [],
      notes: '',
    },
    schema: leadFormSchema,
    validationMode: 'onChange',
    debounceMs: 300,
    fieldOrder: leadFormFieldOrder,
    onScrollToError: (fieldName) => {
      fieldRefs.scrollToField(fieldName as LeadFieldName);
    },
    onSubmit: async (vals) => {
      try {
        await createLead.mutateAsync(vals);
        router.back();
      } catch (error) {
        showError('Failed to create lead. Please try again.', { retryable: true });
        throw error; // Re-throw to prevent form reset
      }
    },
    onSuccess: () => {
      // Could show success toast, but we're navigating back
    },
  });

  const [tagInput, setTagInput] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !form.values.tags?.includes(tagInput.trim())) {
      form.updateField('tags', [...(form.values.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    form.updateField('tags', form.values.tags?.filter(t => t !== tag) || []);
  };

  const handleStatusSelect = (status: LeadStatus) => {
    form.updateField('status', status);
    setShowStatusPicker(false);
  };

  const getStatusLabel = (status: LeadStatus | undefined) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.label || 'Select Status';
  };

  // Voice capture handlers
  const handleVoiceCapture = useCallback(async () => {
    if (voiceCapture.state.isRecording) {
      const result = await voiceCapture.stopCapture();
      if (result?.extractedData) {
        // Extract lead info from voice data
        const data = result.extractedData;
        if (data.sellerName) form.updateField('name', data.sellerName);
        if (data.sellerPhone) form.updateField('phone', data.sellerPhone);
        if (data.address) form.updateField('notes', (form.values.notes || '') + `\nProperty: ${data.address}`);
        showSuccess('Voice data extracted and form filled!');
      }
    } else {
      await voiceCapture.startCapture();
    }
  }, [voiceCapture, form, showSuccess]);

  // Photo capture handlers
  const handlePhotoCapture = useCallback(async () => {
    const result = await photoExtract.captureAndExtract();
    if (result?.type === 'business_card' && result.extractedData) {
      // Extract contact info from business card
      const data = result.extractedData as Record<string, unknown>;
      if (data.name && typeof data.name === 'string') form.updateField('name', data.name);
      if (data.email && typeof data.email === 'string') form.updateField('email', data.email);
      if (data.phone && typeof data.phone === 'string') form.updateField('phone', data.phone);
      if (data.company && typeof data.company === 'string') form.updateField('company', data.company);
      showSuccess('Business card scanned and form filled!');
    } else if (result) {
      showError('Photo captured but no business card detected. Try scanning a business card.');
    }
  }, [photoExtract, form, showSuccess, showError]);

  return {
    form,
    fieldRefs,
    keyboardProps,
    createLead,
    voiceCapture,
    photoExtract,
    tagInput,
    setTagInput,
    showStatusPicker,
    setShowStatusPicker,
    handleAddTag,
    handleRemoveTag,
    handleStatusSelect,
    getStatusLabel,
    handleVoiceCapture,
    handlePhotoCapture,
    router,
  };
}
