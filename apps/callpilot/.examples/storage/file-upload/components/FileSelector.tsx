/**
 * FileSelector Component
 *
 * Displays a dashed-border button for selecting files
 */

import { View, Text, Pressable } from 'react-native';
import { styles } from '../styles';
import type { FileSelectorProps } from '../types';

export function FileSelector({
  onSelectFile,
  disabled,
  maxSizeMB,
}: FileSelectorProps) {
  return (
    <Pressable
      onPress={onSelectFile}
      style={styles.selectButton}
      disabled={disabled}
    >
      <View style={styles.selectButtonContent}>
        <Text style={styles.selectIcon}>📁</Text>
        <Text style={styles.selectText}>Choose File</Text>
        {maxSizeMB && (
          <Text style={styles.selectHint}>Max size: {maxSizeMB}MB</Text>
        )}
      </View>
    </Pressable>
  );
}
