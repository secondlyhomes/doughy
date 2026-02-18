/**
 * FormWithUnsavedChanges Example
 *
 * Example form with unsaved changes confirmation
 */

import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useConditionalBack } from '../hooks/useConditionalBack';
import { PredictiveBackModal } from '../components/PredictiveBackModal';

interface FormWithUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  onDiscard?: () => void;
}

/**
 * Example: Form with unsaved changes confirmation
 *
 * Shows a confirmation modal when user tries to navigate back
 * with unsaved changes
 */
export function FormWithUnsavedChanges({
  hasUnsavedChanges,
  onDiscard,
}: FormWithUnsavedChangesProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  useConditionalBack(hasUnsavedChanges, async () => {
    setShowConfirmation(true);
  });

  const handleDiscard = () => {
    setShowConfirmation(false);
    onDiscard?.();
  };

  const handleKeepEditing = () => {
    setShowConfirmation(false);
  };

  return (
    <View style={styles.container}>
      {/* Form content placeholder */}
      <Text style={styles.placeholder}>Form content goes here</Text>

      <PredictiveBackModal
        visible={showConfirmation}
        onClose={handleKeepEditing}
      >
        <Text style={styles.confirmationText}>
          You have unsaved changes. Discard them?
        </Text>
        <View style={styles.buttonContainer}>
          <Button title="Discard" onPress={handleDiscard} />
          <Button title="Keep Editing" onPress={handleKeepEditing} />
        </View>
      </PredictiveBackModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
});
