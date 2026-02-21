// Add Lead Screen - React Native
// Zone D: Create new lead form
// Uses useFormValidation for real-time validation + scroll-to-error

import React from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { User, Mail, Phone, Building2, FileText } from 'lucide-react-native';
import { FormField } from '@/components/ui';

import {
  LeadQuickCaptureSection,
  LeadStatusPicker,
  LeadTagsInput,
  LeadFormActions,
  useAddLeadForm,
} from './add-lead';

export function AddLeadScreen() {
  const {
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
  } = useAddLeadForm();

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
      >
        <ScrollView
          ref={fieldRefs.scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps={keyboardProps.keyboardShouldPersistTaps}
        >
        {/* AI Quick Capture Section */}
        <LeadQuickCaptureSection
          voiceState={voiceCapture.state}
          photoState={photoExtract.state}
          formatDuration={voiceCapture.formatDuration}
          onVoiceCapture={handleVoiceCapture}
          onPhotoCapture={handlePhotoCapture}
        />

        {/* Name */}
        <FormField
          ref={(ref) => fieldRefs.registerInputRef('name', ref)}
          onLayoutContainer={fieldRefs.createLayoutHandler('name')}
          label="Name"
          value={form.values.name}
          onChangeText={(text) => form.updateField('name', text)}
          onBlur={() => form.setFieldTouched('name')}
          error={form.getFieldError('name')}
          placeholder="Enter lead name"
          required
          icon={User}
          autoCapitalize="words"
        />

        {/* Email */}
        <FormField
          ref={(ref) => fieldRefs.registerInputRef('email', ref)}
          onLayoutContainer={fieldRefs.createLayoutHandler('email')}
          label="Email"
          value={form.values.email || ''}
          onChangeText={(text) => form.updateField('email', text)}
          onBlur={() => form.setFieldTouched('email')}
          error={form.getFieldError('email')}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          icon={Mail}
        />

        {/* Phone */}
        <FormField
          ref={(ref) => fieldRefs.registerInputRef('phone', ref)}
          onLayoutContainer={fieldRefs.createLayoutHandler('phone')}
          label="Phone"
          value={form.values.phone || ''}
          onChangeText={(text) => form.updateField('phone', text)}
          onBlur={() => form.setFieldTouched('phone')}
          error={form.getFieldError('phone')}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
          icon={Phone}
        />

        {/* Company */}
        <FormField
          ref={(ref) => fieldRefs.registerInputRef('company', ref)}
          onLayoutContainer={fieldRefs.createLayoutHandler('company')}
          label="Company"
          value={form.values.company || ''}
          onChangeText={(text) => form.updateField('company', text)}
          onBlur={() => form.setFieldTouched('company')}
          error={form.getFieldError('company')}
          placeholder="Company name"
          autoCapitalize="words"
          icon={Building2}
        />

        {/* Status */}
        <LeadStatusPicker
          value={form.values.status}
          showPicker={showStatusPicker}
          onTogglePicker={() => setShowStatusPicker(!showStatusPicker)}
          onSelect={handleStatusSelect}
          getStatusLabel={getStatusLabel}
        />

        {/* Tags */}
        <LeadTagsInput
          tags={form.values.tags}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />

        {/* Notes */}
        <FormField
          ref={(ref) => fieldRefs.registerInputRef('notes', ref)}
          onLayoutContainer={fieldRefs.createLayoutHandler('notes')}
          label="Notes"
          value={form.values.notes || ''}
          onChangeText={(text) => form.updateField('notes', text)}
          onBlur={() => form.setFieldTouched('notes')}
          error={form.getFieldError('notes')}
          placeholder="Add notes about this lead..."
          multiline
          numberOfLines={4}
          icon={FileText}
        />

        {/* Submit & Cancel */}
        <LeadFormActions
          isPending={createLead.isPending}
          onSubmit={form.handleSubmit}
          onCancel={() => router.back()}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default AddLeadScreen;
