/**
 * UploadProgress Component
 *
 * Displays upload progress bar with percentage and activity indicator
 */

import { View, Text, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import type { UploadProgressProps } from '../types';

export function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <View style={styles.uploadProgress}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
      <ActivityIndicator
        color={colors.primary[500]}
        style={styles.activityIndicator}
      />
    </View>
  );
}
