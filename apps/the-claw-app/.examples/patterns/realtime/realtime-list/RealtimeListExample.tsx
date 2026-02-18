/**
 * Real-Time List Example
 *
 * Demonstrates a list that updates in real-time when data changes.
 * Shows INSERT, UPDATE, DELETE operations with optimistic updates.
 */

import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRealtimeList } from './hooks/useRealtimeList';
import {
  TaskItem,
  TaskInput,
  ConnectionStatus,
  EmptyState,
  LoadingState,
} from './components';
import { styles } from './styles';
import type { Task } from './types';

export function RealtimeListExample() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const {
    tasks,
    isLoading,
    isConnected,
    pendingUpdates,
    createTask,
    toggleTask,
    deleteTask,
    isCreating,
  } = useRealtimeList();

  const handleCreateTask = async () => {
    await createTask(newTaskTitle);
    setNewTaskTitle('');
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      isPending={pendingUpdates.has(item.id)}
      onToggle={toggleTask}
      onDelete={deleteTask}
    />
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Real-Time Tasks</Text>
        <ConnectionStatus isConnected={isConnected} />
      </View>

      <TaskInput
        value={newTaskTitle}
        onChangeText={setNewTaskTitle}
        onSubmit={handleCreateTask}
        isCreating={isCreating}
      />

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Text style={styles.footer}>
        Tasks update in real-time. Open this screen on multiple devices to see
        changes sync instantly.
      </Text>
    </View>
  );
}
