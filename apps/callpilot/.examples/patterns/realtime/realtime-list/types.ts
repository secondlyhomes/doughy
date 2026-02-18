/**
 * Types for Real-Time List Example
 */

export interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseRealtimeListResult {
  tasks: Task[];
  isLoading: boolean;
  isConnected: boolean;
  pendingUpdates: Set<string>;
  createTask: (title: string) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  isCreating: boolean;
}

export interface TaskItemProps {
  task: Task;
  isPending: boolean;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export interface TaskInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
}

export interface ConnectionStatusProps {
  isConnected: boolean;
}

export interface EmptyStateProps {
  message?: string;
  submessage?: string;
}
