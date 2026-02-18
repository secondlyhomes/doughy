/**
 * ExtraLargeTaskWidget (4x4)
 *
 * Comprehensive view with stats, progress, and full task lists.
 * This is the main thin component that composes sub-components.
 */

import React from 'react';
import { FlexWidget } from 'react-native-android-widget';
import { ExtraLargeTaskWidgetProps } from './types';
import { getContainerStyle, LAYOUT } from './styles';
import { WidgetHeader } from './components/WidgetHeader';
import { StatsRow } from './components/StatsRow';
import { ProgressSection } from './components/ProgressSection';
import { TaskSection } from './components/TaskSection';
import { ActionButtons } from './components/ActionButtons';
import { UpdateTimestamp } from './components/UpdateTimestamp';

const MAX_INCOMPLETE_TASKS = 6;
const MAX_COMPLETED_TASKS = 3;

export function ExtraLargeTaskWidget({ data, theme }: ExtraLargeTaskWidgetProps) {
  const incompleteTasks = data.tasks.filter((t) => !t.completed);
  const completedTasks = data.tasks.filter((t) => t.completed);

  return (
    <FlexWidget style={getContainerStyle(theme)}>
      {/* Header with stats */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: LAYOUT.sectionMarginBottom,
        }}
      >
        <WidgetHeader theme={theme} />
        <StatsRow
          totalCount={data.totalCount}
          completedCount={data.completedCount}
          theme={theme}
        />
      </FlexWidget>

      {/* Progress Section */}
      <ProgressSection
        completedCount={data.completedCount}
        totalCount={data.totalCount}
        theme={theme}
      />

      {/* Tasks Sections */}
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        {/* Incomplete Tasks */}
        <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
          <TaskSection
            title="TO DO"
            tasks={incompleteTasks}
            maxItems={MAX_INCOMPLETE_TASKS}
            theme={theme}
            showDetailed
          />
        </FlexWidget>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <FlexWidget style={{ marginTop: LAYOUT.gap.large, flexDirection: 'column' }}>
            <TaskSection
              title="COMPLETED"
              tasks={completedTasks}
              maxItems={MAX_COMPLETED_TASKS}
              theme={theme}
            />
          </FlexWidget>
        )}
      </FlexWidget>

      {/* Action Buttons */}
      <ActionButtons theme={theme} />

      {/* Last Update */}
      <UpdateTimestamp lastUpdate={data.lastUpdate} theme={theme} />
    </FlexWidget>
  );
}
