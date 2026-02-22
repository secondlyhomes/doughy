// src/features/contacts/screens/contact-detail/QuickActions.tsx
// Quick action buttons for contact communication

import React from 'react';
import { View, Text } from 'react-native';
import { Phone, Mail, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';

export interface QuickActionsProps {
  phone: string | null;
  email: string | null;
  onCall: () => void;
  onEmail: () => void;
  onSMS: () => void;
}

export function QuickActions({ phone, email, onCall, onEmail, onSMS }: QuickActionsProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.quickActions}>
      {phone && (
        <>
          <Button variant="outline" size="lg" onPress={onCall} className="flex-1">
            <Phone size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>Call</Text>
          </Button>
          <Button variant="outline" size="lg" onPress={onSMS} className="flex-1">
            <MessageSquare size={18} color={colors.foreground} />
            <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>Text</Text>
          </Button>
        </>
      )}
      {email && (
        <Button variant="outline" size="lg" onPress={onEmail} className="flex-1">
          <Mail size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>Email</Text>
        </Button>
      )}
    </View>
  );
}

const styles = {
  quickActions: {
    flexDirection: 'row' as const,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
};
