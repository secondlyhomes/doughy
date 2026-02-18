/**
 * TaskInput Component
 *
 * Input field with add button for creating new tasks.
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import type { TaskInputProps } from '../types';
import { styles } from '../styles';

export function TaskInput({ value, onChangeText, onSubmit, isCreating }: TaskInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter task title..."
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!isCreating}
      />
      <TouchableOpacity
        style={[styles.addButton, isCreating && styles.addButtonDisabled]}
        onPress={onSubmit}
        disabled={isCreating}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
