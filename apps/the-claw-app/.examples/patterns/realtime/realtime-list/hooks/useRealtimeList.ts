/**
 * useRealtimeList Hook
 *
 * Manages real-time task list with Supabase subscriptions.
 * Handles CRUD operations with optimistic updates.
 */

import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import type { Task, UseRealtimeListResult } from '../types';

export function useRealtimeList(): UseRealtimeListResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const handleInsert = useCallback((newTask: Task) => {
    setTasks((prev) => {
      if (prev.some((task) => task.id === newTask.id)) return prev;
      return [newTask, ...prev];
    });
  }, []);

  const handleUpdate = useCallback((updatedTask: Task) => {
    setPendingUpdates((prev) => {
      const next = new Set(prev);
      next.delete(updatedTask.id);
      return next;
    });
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  }, []);

  const handleDelete = useCallback((deletedId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== deletedId));
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            handleInsert(payload.new as Task);
          } else if (payload.eventType === 'UPDATE') {
            handleUpdate(payload.new as Task);
          } else if (payload.eventType === 'DELETE') {
            handleDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, handleInsert, handleUpdate, handleDelete]);

  const createTask = useCallback(async (title: string) => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      setIsCreating(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        Alert.alert('Error', 'You must be logged in to create tasks');
        return;
      }

      const { error } = await supabase.from('tasks').insert({
        user_id: user.data.user.id,
        title,
        completed: false,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  }, []);

  const toggleTask = useCallback(async (task: Task) => {
    setPendingUpdates((prev) => new Set(prev).add(task.id));
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task:', error);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setPendingUpdates((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      Alert.alert('Error', 'Failed to update task');
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  }, []);

  return {
    tasks,
    isLoading,
    isConnected,
    pendingUpdates,
    createTask,
    toggleTask,
    deleteTask,
    isCreating,
  };
}
