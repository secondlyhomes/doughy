/**
 * TaskListWithFocusFilter.tsx
 *
 * Example component showing a task list with Focus Filter integration
 * Filters tasks based on current Focus mode and shows hidden count
 */

import React from 'react';
import { View, Text } from 'react-native';
import { TaskListWithFocusFilterProps, FilterableTask } from '../types';
import { useFocusFilter } from '../hooks/useFocusFilter';
import { focusFilterStyles } from '../styles';

interface TaskWithId extends FilterableTask {
  id: string | number;
}

interface TaskListWithFocusFilterPropsExtended {
  tasks: TaskWithId[];
  renderTask?: (task: TaskWithId) => React.ReactNode;
}

/**
 * Task List with Focus Filter
 *
 * Displays a filtered list of tasks based on current Focus mode.
 * Shows a message indicating how many tasks are hidden.
 */
export function TaskListWithFocusFilter({
  tasks,
  renderTask,
}: TaskListWithFocusFilterPropsExtended): React.ReactElement {
  const { filterTasks, isFiltering, getFocusDisplayName } = useFocusFilter();

  const filteredTasks = filterTasks(tasks);
  const hiddenCount = tasks.length - filteredTasks.length;

  return (
    <View>
      {isFiltering && hiddenCount > 0 && (
        <View style={focusFilterStyles.hiddenTasksContainer}>
          <Text style={focusFilterStyles.hiddenTasksText}>
            {hiddenCount} task{hiddenCount !== 1 ? 's' : ''} hidden due to{' '}
            {getFocusDisplayName()} Focus
          </Text>
        </View>
      )}

      {filteredTasks.map((task) => (
        <View key={task.id} style={focusFilterStyles.taskItemContainer}>
          {renderTask ? renderTask(task) : null}
        </View>
      ))}
    </View>
  );
}
