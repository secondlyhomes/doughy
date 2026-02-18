/**
 * Smart Search Component
 *
 * Semantic search interface with RAG capabilities.
 * Features: search input, semantic/hybrid search, chat with context
 */

import React from 'react'
import { View, FlatList } from 'react-native'
import { useSmartSearch } from './hooks/useSmartSearch'
import { SearchResultCard } from './SearchResultCard'
import { ChatResponse } from './ChatResponse'
import { SearchInput, SearchOptions, CostDisplay, EmptyState } from './SearchInputComponents'
import { styles } from './smart-search.styles'
import type { SmartSearchProps, SimilarityResult } from './types'

/**
 * Smart Search Component
 *
 * @example
 * ```tsx
 * <SmartSearch
 *   placeholder="Search documentation..."
 *   enableHybrid={true}
 *   enableChat={true}
 *   metadataFilter={{ category: 'docs' }}
 * />
 * ```
 */
export function SmartSearch({
  placeholder = 'Search...',
  enableHybrid = true,
  resultsLimit = 10,
  similarityThreshold = 0.5,
  showCost = true,
  metadataFilter,
  onResultSelect,
  enableChat = true,
}: SmartSearchProps) {
  const {
    searchQuery, setSearchQuery, results, queryCost,
    chatMode, chatResponse, chatSources, loading,
    handleSearch, handleChatWithContext, handleResultPress,
  } = useSmartSearch({
    resultsLimit, similarityThreshold, metadataFilter, enableHybrid, onResultSelect,
  })

  const renderSearchResult = ({ item }: { item: SimilarityResult }) => (
    <SearchResultCard result={item} onPress={handleResultPress} />
  )

  return (
    <View style={styles.container}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={placeholder}
        onSubmit={handleSearch}
        loading={loading}
      />
      <SearchOptions
        chatMode={chatMode}
        enableChat={enableChat}
        loading={loading}
        onSearch={handleSearch}
        onChat={handleChatWithContext}
      />
      {showCost && queryCost > 0 && !chatMode && <CostDisplay cost={queryCost} />}
      {chatMode ? (
        chatResponse ? (
          <ChatResponse
            response={chatResponse}
            sources={chatSources}
            queryCost={queryCost}
            showCost={showCost}
            onSourcePress={handleResultPress}
          />
        ) : null
      ) : (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={!loading && searchQuery ? <EmptyState /> : null}
        />
      )}
    </View>
  )
}
