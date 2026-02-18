/**
 * ModelSelector Component
 *
 * Allows cycling through available AI models
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { AIModel } from '../../AIContext'
import { styles } from './styles'
import type { ModelSelectorProps } from './types'

const AVAILABLE_MODELS: AIModel[] = ['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'claude-3-haiku']

/**
 * Model selector component that cycles through available models
 */
export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const handlePress = () => {
    const currentIndex = AVAILABLE_MODELS.indexOf(model)
    const nextIndex = (currentIndex + 1) % AVAILABLE_MODELS.length
    onModelChange(AVAILABLE_MODELS[nextIndex])
  }

  return (
    <View style={styles.modelSelector}>
      <Text style={styles.modelLabel}>Model:</Text>
      <TouchableOpacity style={styles.modelButton} onPress={handlePress}>
        <Text style={styles.modelButtonText}>{model}</Text>
      </TouchableOpacity>
    </View>
  )
}
