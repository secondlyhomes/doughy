/**
 * VoiceMemoRecorder Component
 *
 * Fake voice memo recorder with animated waveform and timer.
 * POC only - will be replaced with real expo-av recording in Phase 1.
 */

import { useState, useEffect, useRef } from 'react'
import { View, TouchableOpacity, Animated, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface VoiceMemoRecorderProps {
  onRecordingComplete: (durationSeconds: number) => void
  onSkip?: () => void
  style?: ViewStyle
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const WAVEFORM_BARS = 30

export function VoiceMemoRecorder({ onRecordingComplete, onSkip, style }: VoiceMemoRecorderProps) {
  const { theme } = useTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const barAnims = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(0.3))
  ).current

  // Timer
  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isRecording])

  // Pulse + waveform animations
  useEffect(() => {
    if (!isRecording) { pulseAnim.setValue(1); barAnims.forEach((a) => a.setValue(0.3)); return }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]))
    const waves = barAnims.map((anim) => Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.3 + Math.random() * 0.7, duration: 200 + Math.random() * 400, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.2 + Math.random() * 0.3, duration: 200 + Math.random() * 400, useNativeDriver: true }),
    ])))
    pulse.start(); waves.forEach((w) => w.start())
    return () => { pulse.stop(); waves.forEach((w) => w.stop()) }
  }, [isRecording, pulseAnim, barAnims])

  function handleRecordPress() {
    if (isRecording) {
      // Stop recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      setIsRecording(false)
      setIsProcessing(true)
      // Simulate processing delay
      setTimeout(() => {
        setIsProcessing(false)
        onRecordingComplete(duration)
      }, 2500)
    } else {
      // Start recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      setIsRecording(true)
      setDuration(0)
    }
  }

  if (isProcessing) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text variant="h4" align="center">
          Processing your memo...
        </Text>
        <Text
          variant="body"
          color={theme.colors.text.secondary}
          align="center"
          style={{ marginTop: theme.tokens.spacing[2] }}
        >
          Analyzing call insights
        </Text>
      </View>
    )
  }

  return (
    <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]}>
      {/* Prompt */}
      <Text
        variant="h4"
        align="center"
        style={{ marginBottom: theme.tokens.spacing[8] }}
      >
        {isRecording ? 'Recording...' : 'What happened on this call?'}
      </Text>

      {/* Waveform */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          gap: 3,
          marginBottom: theme.tokens.spacing[6],
        }}
      >
        {barAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              width: 4,
              height: 48,
              borderRadius: 2,
              backgroundColor: isRecording ? theme.colors.error[400] : theme.colors.neutral[300],
              transform: [{ scaleY: anim }],
            }}
          />
        ))}
      </View>

      {/* Timer */}
      <Text
        variant="h2"
        style={{ marginBottom: theme.tokens.spacing[8], fontVariant: ['tabular-nums'] }}
      >
        {formatTimer(duration)}
      </Text>

      {/* Record button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleRecordPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.error[500],
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.tokens.shadows.lg,
          }}
        >
          {isRecording ? (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: theme.tokens.borderRadius.sm,
                backgroundColor: theme.tokens.colors.white,
              }}
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.tokens.colors.white,
              }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Skip option */}
      {!isRecording && onSkip && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onSkip()
          }}
          style={{ marginTop: theme.tokens.spacing[8] }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text variant="body" color={theme.colors.text.tertiary}>
            I'll do this later
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
