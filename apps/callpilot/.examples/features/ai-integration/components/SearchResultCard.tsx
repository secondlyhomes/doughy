/**
 * SearchResultCard Component
 *
 * Displays a single search result with similarity score,
 * category badge, content preview, and metadata.
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { styles } from './smart-search.styles'
import type { SearchResultCardProps } from './types'

/**
 * Card component for displaying a search result
 *
 * @example
 * ```tsx
 * <SearchResultCard
 *   result={searchResult}
 *   onPress={(result) => handleSelect(result)}
 * />
 * ```
 */
export function SearchResultCard({ result, onPress }: SearchResultCardProps) {
  const handlePress = () => {
    onPress(result)
  }

  return (
    <TouchableOpacity style={styles.resultCard} onPress={handlePress}>
      <View style={styles.resultHeader}>
        <View style={styles.similarityBadge}>
          <Text style={styles.similarityText}>
            {(result.similarity * 100).toFixed(0)}%
          </Text>
        </View>
        {result.metadata?.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{result.metadata.category}</Text>
          </View>
        )}
      </View>
      <Text style={styles.resultContent} numberOfLines={3}>
        {result.content}
      </Text>
      <ResultMetadata metadata={result.metadata} />
    </TouchableOpacity>
  )
}

/**
 * Displays metadata tags for a search result
 */
function ResultMetadata({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null
  }

  const filteredEntries = Object.entries(metadata)
    .filter(([key]) => key !== 'category')
    .slice(0, 3)

  if (filteredEntries.length === 0) {
    return null
  }

  return (
    <View style={styles.metadataContainer}>
      {filteredEntries.map(([key, value]) => (
        <Text key={key} style={styles.metadataText}>
          {key}: {String(value)}
        </Text>
      ))}
    </View>
  )
}
