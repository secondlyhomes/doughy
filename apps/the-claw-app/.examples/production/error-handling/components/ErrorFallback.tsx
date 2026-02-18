/**
 * Error Fallback UI Component
 *
 * Displays user-friendly error message with recovery options.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorFallbackProps } from '../types/error-types';
import { styles } from './error-fallback.styles';

export function ErrorFallback({
  error,
  errorInfo,
  errorCount,
  onReset,
  onReload,
  onReport,
}: ErrorFallbackProps): JSX.Element {
  const [showDetails, setShowDetails] = useState(__DEV__);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
        </View>

        <Text style={styles.title}>
          {errorCount > 1 ? 'Multiple Errors Occurred' : 'Oops! Something Went Wrong'}
        </Text>

        <Text style={styles.subtitle}>
          We're sorry for the inconvenience. The app encountered an unexpected error.
        </Text>

        {errorCount > 1 && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              {errorCount} errors in quick succession.
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={onReload}
            accessibilityRole="button"
            accessibilityLabel="Reload app"
          >
            <Ionicons name="reload" size={20} color="#3b82f6" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Reload App
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={onReport}
            accessibilityRole="button"
            accessibilityLabel="Report error"
          >
            <Ionicons name="bug" size={20} color="#3b82f6" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Report Error
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.detailsToggle}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#6b7280"
          />
        </Pressable>

        {showDetails && (
          <ErrorDetails error={error} errorInfo={errorInfo} />
        )}
      </ScrollView>
    </View>
  );
}

function ErrorDetails({
  error,
  errorInfo,
}: {
  error: Error;
  errorInfo: React.ErrorInfo | null;
}) {
  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>Error Details:</Text>
      <View style={styles.codeBlock}>
        <Text style={styles.codeText}>{error.toString()}</Text>
      </View>

      {error.stack && (
        <>
          <Text style={styles.detailsTitle}>Stack Trace:</Text>
          <ScrollView horizontal style={styles.codeBlock}>
            <Text style={styles.codeText}>{error.stack}</Text>
          </ScrollView>
        </>
      )}

      {errorInfo?.componentStack && (
        <>
          <Text style={styles.detailsTitle}>Component Stack:</Text>
          <ScrollView horizontal style={styles.codeBlock}>
            <Text style={styles.codeText}>{errorInfo.componentStack}</Text>
          </ScrollView>
        </>
      )}

      <Text style={styles.debugInfo}>
        Platform: {Platform.OS} {Platform.Version}
      </Text>
      <Text style={styles.debugInfo}>
        Time: {new Date().toISOString()}
      </Text>
    </View>
  );
}
