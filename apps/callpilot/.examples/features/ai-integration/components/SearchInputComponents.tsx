/**
 * Search Input Sub-Components
 *
 * Helper components for the SmartSearch main component.
 */

import React from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { styles } from './smart-search.styles'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  onSubmit: () => void
  loading: boolean
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  loading,
}: SearchInputProps) {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.searchButton, loading && styles.searchButtonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.searchButtonText}>Search</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

interface SearchOptionsProps {
  chatMode: boolean
  enableChat: boolean
  loading: boolean
  onSearch: () => void
  onChat: () => void
}

export function SearchOptions({
  chatMode,
  enableChat,
  loading,
  onSearch,
  onChat,
}: SearchOptionsProps) {
  return (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.optionButton, !chatMode && styles.optionButtonActive]}
        onPress={onSearch}
        disabled={loading}
      >
        <Text
          style={[styles.optionButtonText, !chatMode && styles.optionButtonTextActive]}
        >
          Search
        </Text>
      </TouchableOpacity>
      {enableChat && (
        <TouchableOpacity
          style={[styles.optionButton, chatMode && styles.optionButtonActive]}
          onPress={onChat}
          disabled={loading}
        >
          <Text
            style={[styles.optionButtonText, chatMode && styles.optionButtonTextActive]}
          >
            Ask AI
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export function CostDisplay({ cost }: { cost: number }) {
  return (
    <View style={styles.costContainer}>
      <Text style={styles.costLabel}>Query cost: ${cost.toFixed(6)}</Text>
    </View>
  )
}

export function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No results found</Text>
    </View>
  )
}
