// src/features/leads/components/LeadNotesSection.tsx
// Notes section for lead detail

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface LeadNote {
  content: string;
  created_at?: string;
}

interface LeadNotesSectionProps {
  notes?: LeadNote[] | null;
  onAddNote: () => void;
}

export function LeadNotesSection({ notes, onAddNote }: LeadNotesSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4 mb-4" style={{ backgroundColor: colors.card }}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <FileText size={18} color={colors.mutedForeground} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Notes</Text>
        </View>
        <TouchableOpacity onPress={onAddNote} accessibilityLabel="Add note" accessibilityRole="button">
          <Text className="text-sm" style={{ color: colors.primary }}>Add Note</Text>
        </TouchableOpacity>
      </View>

      {notes && notes.length > 0 ? (
        notes.map((note, index) => (
          <View key={index} className="rounded-lg p-3 mb-2" style={{ backgroundColor: colors.muted }}>
            <Text style={{ color: colors.foreground }}>{note.content}</Text>
            <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
              {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-center py-4" style={{ color: colors.mutedForeground }}>No notes yet</Text>
      )}
    </View>
  );
}
