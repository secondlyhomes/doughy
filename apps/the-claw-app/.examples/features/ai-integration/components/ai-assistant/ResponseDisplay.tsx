/**
 * Response Display Component
 *
 * Displays the AI response in a scrollable container.
 */

import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { styles } from './ai-assistant.styles'
import type { ResponseDisplayProps } from './types'

/**
 * Displays AI response with scroll support
 *
 * @example
 * ```tsx
 * {response && <ResponseDisplay response={response} />}
 * ```
 */
export function ResponseDisplay({ response }: ResponseDisplayProps) {
  if (!response) return null

  return (
    <View style={styles.responseContainer}>
      <Text style={styles.responseLabel}>Response:</Text>
      <ScrollView style={styles.responseScroll}>
        <Text style={styles.responseText}>{response}</Text>
      </ScrollView>
    </View>
  )
}
