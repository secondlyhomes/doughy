/**
 * Error Fallback UI Component
 *
 * Displays error information with retry and feedback options.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

import { ErrorFallbackProps } from './types';
import { styles } from './styles';

/**
 * Default fallback UI for ErrorBoundary
 */
export function ErrorFallback({
  error,
  errorInfo,
  eventId,
  feedbackSubmitted,
  showDetails,
  errorMessage,
  enableFeedback,
  onReset,
  onSubmitFeedback,
}: ErrorFallbackProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.subtitle}>
            {errorMessage || 'We encountered an unexpected error. Please try again.'}
          </Text>
        </View>

        {showDetails && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorName}>{error.name}</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
              {error.stack && (
                <Text style={styles.errorStack} numberOfLines={10}>
                  {error.stack}
                </Text>
              )}
            </View>

            {errorInfo && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Component Stack:</Text>
                <Text style={styles.errorStack} numberOfLines={10}>
                  {errorInfo.componentStack}
                </Text>
              </View>
            )}

            {eventId && (
              <View style={styles.eventIdBox}>
                <Text style={styles.eventIdLabel}>Error ID:</Text>
                <Text style={styles.eventIdValue}>{eventId}</Text>
                <Text style={styles.eventIdHint}>
                  Use this ID when contacting support
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onReset}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          {enableFeedback && eventId && !feedbackSubmitted && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSubmitFeedback}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Report Problem</Text>
            </TouchableOpacity>
          )}

          {feedbackSubmitted && (
            <View style={styles.feedbackSuccess}>
              <Text style={styles.feedbackSuccessText}>
                Thank you for reporting this issue!
              </Text>
            </View>
          )}
        </View>

        {!showDetails && eventId && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Error ID: {eventId}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
