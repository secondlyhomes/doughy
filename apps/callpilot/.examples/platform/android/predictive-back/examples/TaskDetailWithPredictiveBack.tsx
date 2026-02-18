/**
 * TaskDetailWithPredictiveBack Example
 *
 * Example task detail screen with predictive back gesture
 */

import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { usePredictiveBack } from '../hooks/usePredictiveBack';

interface Task {
  title: string;
  description: string;
}

interface TaskDetailWithPredictiveBackProps {
  task: Task;
  onClose: () => void;
}

/**
 * Example: Task detail screen with predictive back
 *
 * Demonstrates full back gesture lifecycle with logging
 */
export function TaskDetailWithPredictiveBack({
  task,
  onClose,
}: TaskDetailWithPredictiveBackProps) {
  const { animationValue } = usePredictiveBack({
    onBackStarted: (event) => {
      console.log('Back gesture started:', event);
    },
    onBackProgressed: (event) => {
      console.log('Back gesture progress:', event.progress);
    },
    onBackCancelled: () => {
      console.log('Back gesture cancelled');
    },
    onBackInvoked: onClose,
  });

  // Scale and fade animation
  const containerStyle = {
    transform: [
      {
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.9],
        }),
      },
    ],
    opacity: animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.description}>{task.description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 16,
  },
});
