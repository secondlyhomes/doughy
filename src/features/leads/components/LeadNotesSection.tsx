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
    <View className="bg-card p-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <FileText size={18} color={colors.mutedForeground} />
          <Text className="text-lg font-semibold text-foreground ml-2">Notes</Text>
        </View>
        <TouchableOpacity onPress={onAddNote} accessibilityLabel="Add note" accessibilityRole="button">
          <Text className="text-primary text-sm">Add Note</Text>
        </TouchableOpacity>
      </View>

      {notes && notes.length > 0 ? (
        notes.map((note, index) => (
          <View key={index} className="bg-muted rounded-lg p-3 mb-2">
            <Text className="text-foreground">{note.content}</Text>
            <Text className="text-xs text-muted-foreground mt-2">
              {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-muted-foreground text-center py-4">No notes yet</Text>
      )}
    </View>
  );
}
