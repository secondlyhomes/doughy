/**
 * ChatResponse Component
 *
 * Displays AI chat response with sources and cost information.
 * Used when in "Ask AI" mode of SmartSearch.
 */

import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { styles } from './smart-search.styles'
import type { ChatResponseProps, SimilarityResult } from './types'

/**
 * Displays the AI chat response with sources
 *
 * @example
 * ```tsx
 * <ChatResponse
 *   response="Based on the documentation..."
 *   sources={searchResults}
 *   queryCost={0.001234}
 *   showCost={true}
 *   onSourcePress={handleSourceSelect}
 * />
 * ```
 */
export function ChatResponse({
  response,
  sources,
  queryCost,
  showCost,
  onSourcePress,
}: ChatResponseProps) {
  return (
    <View style={styles.chatContainer}>
      <ChatHeader queryCost={queryCost} showCost={showCost} />
      <ScrollView style={styles.chatContent}>
        <Text style={styles.chatText}>{response}</Text>
      </ScrollView>
      {sources.length > 0 && (
        <SourcesList sources={sources} onSourcePress={onSourcePress} />
      )}
    </View>
  )
}

/**
 * Header for the chat response section
 */
function ChatHeader({
  queryCost,
  showCost,
}: {
  queryCost: number
  showCost: boolean
}) {
  return (
    <View style={styles.chatHeader}>
      <Text style={styles.chatHeaderText}>AI Response</Text>
      {showCost && (
        <Text style={styles.costText}>Cost: ${queryCost.toFixed(6)}</Text>
      )}
    </View>
  )
}

/**
 * List of sources used to generate the response
 */
function SourcesList({
  sources,
  onSourcePress,
}: {
  sources: SimilarityResult[]
  onSourcePress: (source: SimilarityResult) => void
}) {
  return (
    <View style={styles.sourcesContainer}>
      <Text style={styles.sourcesTitle}>Sources ({sources.length})</Text>
      {sources.map((source, index) => (
        <SourceCard
          key={source.id}
          source={source}
          index={index}
          onPress={onSourcePress}
        />
      ))}
    </View>
  )
}

/**
 * Individual source card component
 */
function SourceCard({
  source,
  index,
  onPress,
}: {
  source: SimilarityResult
  index: number
  onPress: (source: SimilarityResult) => void
}) {
  const handlePress = () => {
    onPress(source)
  }

  return (
    <TouchableOpacity style={styles.sourceCard} onPress={handlePress}>
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceNumber}>[{index + 1}]</Text>
        <Text style={styles.sourceSimilarity}>
          {(source.similarity * 100).toFixed(0)}%
        </Text>
      </View>
      <Text style={styles.sourceContent} numberOfLines={2}>
        {source.content}
      </Text>
    </TouchableOpacity>
  )
}
