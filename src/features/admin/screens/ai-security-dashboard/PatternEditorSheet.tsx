// src/features/admin/screens/ai-security-dashboard/PatternEditorSheet.tsx
// Thin orchestrator for security pattern management sheets
// List view (BottomSheet) for browsing, focused sheet for add/edit

import React from 'react';

import type { SecurityPattern } from './types';
import { usePatternEditor } from './usePatternEditor';
import { PatternListView } from './PatternListView';
import { PatternEditorView } from './PatternEditorView';

interface PatternEditorSheetProps {
  visible: boolean;
  onClose: () => void;
  patterns: SecurityPattern[];
  onPatternsChanged: () => Promise<void>;
}

export function PatternEditorSheet({
  visible,
  onClose,
  patterns,
  onPatternsChanged,
}: PatternEditorSheetProps) {
  const editor = usePatternEditor({ visible, onPatternsChanged });

  if (editor.mode === 'list') {
    return (
      <PatternListView
        visible={visible}
        onClose={onClose}
        patterns={patterns}
        editor={editor}
      />
    );
  }

  return (
    <PatternEditorView
      visible={visible}
      editor={editor}
    />
  );
}
