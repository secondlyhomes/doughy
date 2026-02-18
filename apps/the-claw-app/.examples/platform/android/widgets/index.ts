/**
 * Android Widgets Module
 *
 * Home Screen Widgets for displaying today's tasks.
 *
 * Features:
 * - Multiple widget sizes (1x1, 2x2, 4x2, 4x4)
 * - Real-time task updates
 * - Quick task creation
 * - Material You dynamic colors
 *
 * Dependencies:
 * - react-native-android-widget
 * - @react-native-async-storage/async-storage
 *
 * Setup:
 * 1. npm install react-native-android-widget
 * 2. Configure AndroidManifest.xml (see README.md)
 * 3. Create widget layouts in android/app/src/main/res/xml/
 * 4. Register widget provider
 */

import { AppRegistry } from 'react-native';

// Widget Components
export { SmallTaskWidget } from './SmallTaskWidget';
export { MediumTaskWidget } from './MediumTaskWidget';
export { LargeTaskWidget } from './LargeTaskWidget';
export { ExtraLargeTaskWidget } from './ExtraLargeTaskWidget';

// Sub-components
export { TaskItemWidget } from './components/TaskItemWidget';
export { StatCard } from './components/StatCard';

// Types
export {
  Task,
  WidgetData,
  WidgetSize,
  WidgetTheme,
  WidgetComponentProps,
} from './types';

// Utilities
export {
  getWidgetData,
  handleWidgetClick,
  toggleTask,
} from './utils/widget-utils';

// Import for registration
import { SmallTaskWidget } from './SmallTaskWidget';
import { MediumTaskWidget } from './MediumTaskWidget';
import { LargeTaskWidget } from './LargeTaskWidget';
import { ExtraLargeTaskWidget } from './ExtraLargeTaskWidget';

// Register widgets with React Native
AppRegistry.registerComponent('TaskWidgetSmall', () => SmallTaskWidget);
AppRegistry.registerComponent('TaskWidgetMedium', () => MediumTaskWidget);
AppRegistry.registerComponent('TaskWidgetLarge', () => LargeTaskWidget);
AppRegistry.registerComponent('TaskWidgetExtraLarge', () => ExtraLargeTaskWidget);
