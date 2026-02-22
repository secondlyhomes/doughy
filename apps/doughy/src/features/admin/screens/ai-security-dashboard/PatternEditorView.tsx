// src/features/admin/screens/ai-security-dashboard/PatternEditorView.tsx
// Focused editor view for adding or editing a security pattern

import React from 'react';

import {
  FocusedSheet,
  StepUpVerificationSheet,
} from '@/components/ui';

import { PatternFormSection } from './PatternFormSection';
import { PatternTestSection } from './PatternTestSection';
import type { usePatternEditor } from './usePatternEditor';

interface PatternEditorViewProps {
  visible: boolean;
  editor: ReturnType<typeof usePatternEditor>;
}

export function PatternEditorView({ visible, editor }: PatternEditorViewProps) {
  return (
    <>
      <FocusedSheet
        visible={visible}
        onClose={() => {
          editor.setMode('list');
          editor.resetForm();
        }}
        title={editor.mode === 'add' ? 'Add Pattern' : 'Edit Pattern'}
        subtitle="Define regex pattern for threat detection"
        doneLabel={editor.mode === 'add' ? 'Add Pattern' : 'Save Changes'}
        onDone={editor.handleSave}
        doneDisabled={!editor.pattern.trim()}
        isSubmitting={editor.isSubmitting}
      >
        <PatternFormSection
          pattern={editor.pattern}
          onPatternChange={editor.setPattern}
          severity={editor.severity}
          onSeverityChange={editor.setSeverity}
          threatType={editor.threatType}
          onThreatTypeChange={editor.setThreatType}
          description={editor.description}
          onDescriptionChange={editor.setDescription}
        />

        <PatternTestSection
          testInput={editor.testInput}
          onTestInputChange={editor.setTestInput}
          testResult={editor.testResult}
        />
      </FocusedSheet>

      {/* Step-up verification sheet for MFA on destructive actions */}
      <StepUpVerificationSheet
        visible={editor.showStepUpSheet}
        onClose={editor.handleStepUpCancel}
        onVerify={editor.handleStepUpVerify}
        state={editor.stepUpState}
      />
    </>
  );
}
