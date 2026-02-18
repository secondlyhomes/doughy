# Android Home Screen Widgets

Complete guide for implementing Android home screen widgets in React Native.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Widget Sizes](#widget-sizes)
- [Implementation](#implementation)
- [XML Layouts](#xml-layouts)
- [Widget Provider](#widget-provider)
- [Data Binding](#data-binding)
- [Widget Updates](#widget-updates)
- [Glance API (Jetpack Compose)](#glance-api-jetpack-compose)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Android home screen widgets are mini app views that can be embedded on the home screen. They provide quick access to app content and functionality without opening the app.

### Widget Types

- **Information widgets**: Display important information (weather, clock, news)
- **Collection widgets**: Display scrollable collections (emails, tasks, articles)
- **Control widgets**: Provide quick controls (music player, lights)
- **Hybrid widgets**: Combine multiple types

### Supported Sizes

| Size | Grid | Use Case |
|------|------|----------|
| Small | 1x1 | Minimal info, single metric |
| Medium | 2x2 | List of items, basic controls |
| Large | 4x2 | Detailed list, multiple sections |
| Extra Large | 4x4 | Dashboard, comprehensive view |

## Setup

### 1. Install Dependencies

```bash
npm install react-native-android-widget
npm install @react-native-async-storage/async-storage
```

### 2. Configure Android Manifest

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <!-- Your existing configuration -->

  <!-- Widget Receiver -->
  <receiver
    android:name=".widget.TaskWidgetProvider"
    android:exported="true">
    <intent-filter>
      <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
      <action android:name="com.yourapp.REFRESH_WIDGET" />
      <action android:name="com.yourapp.TOGGLE_TASK" />
    </intent-filter>
    <meta-data
      android:name="android.appwidget.provider"
      android:resource="@xml/task_widget_info" />
  </receiver>

  <!-- Widget Service (for collections) -->
  <service
    android:name=".widget.TaskWidgetService"
    android:permission="android.permission.BIND_REMOTEVIEWS"
    android:exported="false" />

  <!-- Widget Configuration Activity (optional) -->
  <activity
    android:name=".widget.WidgetConfigActivity"
    android:exported="true">
    <intent-filter>
      <action android:name="android.appwidget.action.APPWIDGET_CONFIGURE" />
    </intent-filter>
  </activity>
</application>
```

### 3. Create Widget Info XML

Create `android/app/src/main/res/xml/task_widget_info.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="110dp"
  android:minHeight="110dp"
  android:targetCellWidth="2"
  android:targetCellHeight="2"
  android:maxResizeWidth="320dp"
  android:maxResizeHeight="320dp"
  android:updatePeriodMillis="900000"
  android:initialLayout="@layout/task_widget"
  android:previewImage="@drawable/task_widget_preview"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:description="@string/task_widget_description">
</appwidget-provider>
```

### 4. Configure Gradle

Edit `android/app/build.gradle`:

```gradle
android {
  // ... existing configuration

  buildFeatures {
    compose true
  }

  composeOptions {
    kotlinCompilerExtensionVersion = "1.5.3"
  }
}

dependencies {
  // ... existing dependencies

  // Glance (Jetpack Compose for Widgets)
  implementation "androidx.glance:glance-appwidget:1.0.0"
  implementation "androidx.glance:glance-material3:1.0.0"

  // WorkManager (for background updates)
  implementation "androidx.work:work-runtime-ktx:2.9.0"
}
```

## Widget Sizes

### Size Specifications

Widgets snap to a grid where each cell is approximately 70dp.

```typescript
// Widget size calculator
export function calculateWidgetSize(cells: { width: number; height: number }) {
  const cellSize = 70; // dp
  const margin = 30; // dp

  return {
    width: cells.width * cellSize - margin,
    height: cells.height * cellSize - margin,
  };
}

// Common sizes
export const WIDGET_SIZES = {
  SMALL: calculateWidgetSize({ width: 1, height: 1 }),    // 40x40 dp
  MEDIUM: calculateWidgetSize({ width: 2, height: 2 }),   // 110x110 dp
  LARGE: calculateWidgetSize({ width: 4, height: 2 }),    // 250x110 dp
  EXTRA_LARGE: calculateWidgetSize({ width: 4, height: 4 }), // 250x250 dp
};
```

### Adaptive Sizing

```xml
<!-- Android 12+ supports target cells -->
<appwidget-provider
  android:targetCellWidth="2"
  android:targetCellHeight="2"
  android:minWidth="110dp"
  android:minHeight="110dp"
  android:maxResizeWidth="320dp"
  android:maxResizeHeight="320dp">
</appwidget-provider>
```

## Implementation

### React Native Widget Component

```typescript
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function TaskWidget({ data, theme }) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <TextWidget
        text="Tasks"
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.onSurface,
        }}
      />
      {/* Widget content */}
    </FlexWidget>
  );
}
```

### Widget Provider (Kotlin)

Create `android/app/src/main/java/com/yourapp/widget/TaskWidgetProvider.kt`:

```kotlin
package com.yourapp.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.yourapp.R

class TaskWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (appWidgetId in appWidgetIds) {
      updateAppWidget(context, appWidgetManager, appWidgetId)
    }
  }

  override fun onEnabled(context: Context) {
    // Widget added to home screen
  }

  override fun onDisabled(context: Context) {
    // Last widget removed from home screen
  }

  override fun onDeleted(context: Context, appWidgetIds: IntArray) {
    // Widgets deleted
  }

  private fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
  ) {
    val views = RemoteViews(context.packageName, R.layout.task_widget)

    // Load data and update views
    val taskData = loadTaskData(context)
    views.setTextViewText(R.id.widget_title, "Today's Tasks")
    views.setTextViewText(
      R.id.widget_count,
      "${taskData.completedCount}/${taskData.totalCount}"
    )

    // Setup click handlers
    val intent = Intent(context, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

    // Update widget
    appWidgetManager.updateAppWidget(appWidgetId, views)
  }

  private fun loadTaskData(context: Context): TaskData {
    // Load from SharedPreferences or database
    val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
    val tasksJson = prefs.getString("tasks", "[]")
    val tasks = Gson().fromJson(tasksJson, Array<Task>::class.java)

    return TaskData(
      tasks = tasks.toList(),
      completedCount = tasks.count { it.completed },
      totalCount = tasks.size
    )
  }
}

data class TaskData(
  val tasks: List<Task>,
  val completedCount: Int,
  val totalCount: Int
)

data class Task(
  val id: String,
  val title: String,
  val completed: Boolean
)
```

## XML Layouts

### Basic Widget Layout

Create `android/app/src/main/res/layout/task_widget.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:id="@+id/widget_container"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical"
  android:padding="16dp"
  android:background="@drawable/widget_background">

  <!-- Header -->
  <LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="horizontal"
    android:gravity="center_vertical">

    <TextView
      android:id="@+id/widget_title"
      android:layout_width="0dp"
      android:layout_height="wrap_content"
      android:layout_weight="1"
      android:text="Tasks"
      android:textSize="18sp"
      android:textStyle="bold"
      android:textColor="?attr/colorOnSurface" />

    <TextView
      android:id="@+id/widget_count"
      android:layout_width="wrap_content"
      android:layout_height="wrap_content"
      android:text="0/0"
      android:textSize="14sp"
      android:textColor="?attr/colorOnSurfaceVariant" />
  </LinearLayout>

  <!-- Progress Bar -->
  <ProgressBar
    android:id="@+id/widget_progress"
    style="@style/Widget.AppCompat.ProgressBar.Horizontal"
    android:layout_width="match_parent"
    android:layout_height="8dp"
    android:layout_marginTop="12dp"
    android:layout_marginBottom="12dp"
    android:progressTint="?attr/colorPrimary"
    android:progressBackgroundTint="?attr/colorSurfaceVariant" />

  <!-- Task List -->
  <ListView
    android:id="@+id/widget_task_list"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1"
    android:divider="@null" />

  <!-- Add Button -->
  <Button
    android:id="@+id/widget_add_button"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginTop="12dp"
    android:text="+ Add Task"
    style="@style/Widget.Material3.Button.TonalButton" />
</LinearLayout>
```

### Task Item Layout

Create `android/app/src/main/res/layout/task_widget_item.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:layout_width="match_parent"
  android:layout_height="wrap_content"
  android:orientation="horizontal"
  android:padding="8dp"
  android:gravity="center_vertical">

  <CheckBox
    android:id="@+id/task_checkbox"
    android:layout_width="24dp"
    android:layout_height="24dp"
    android:layout_marginEnd="12dp"
    android:buttonTint="?attr/colorPrimary" />

  <TextView
    android:id="@+id/task_title"
    android:layout_width="0dp"
    android:layout_height="wrap_content"
    android:layout_weight="1"
    android:textSize="14sp"
    android:textColor="?attr/colorOnSurface"
    android:maxLines="1"
    android:ellipsize="end" />

  <View
    android:id="@+id/task_priority_indicator"
    android:layout_width="8dp"
    android:layout_height="8dp"
    android:layout_marginStart="8dp"
    android:background="@drawable/priority_indicator"
    android:visibility="gone" />
</LinearLayout>
```

### Widget Background

Create `android/app/src/main/res/drawable/widget_background.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
  <solid android:color="?attr/colorSurface" />
  <corners android:radius="16dp" />
  <stroke
    android:width="1dp"
    android:color="?attr/colorOutlineVariant" />
</shape>
```

## Widget Provider

### Advanced Widget Provider

```kotlin
package com.yourapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.yourapp.MainActivity
import com.yourapp.R

class TaskWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    for (appWidgetId in appWidgetIds) {
      val size = getWidgetSize(context, appWidgetManager, appWidgetId)
      updateAppWidget(context, appWidgetManager, appWidgetId, size)
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle
  ) {
    val size = getWidgetSize(context, appWidgetManager, appWidgetId)
    updateAppWidget(context, appWidgetManager, appWidgetId, size)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)

    when (intent.action) {
      ACTION_TOGGLE_TASK -> {
        val taskId = intent.getStringExtra(EXTRA_TASK_ID)
        if (taskId != null) {
          toggleTask(context, taskId)
          updateAllWidgets(context)
        }
      }
      ACTION_ADD_TASK -> {
        openApp(context, "tasks/new")
      }
      ACTION_REFRESH -> {
        updateAllWidgets(context)
      }
    }
  }

  private fun getWidgetSize(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int
  ): WidgetSize {
    val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
    val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
    val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)

    return when {
      width < 110 -> WidgetSize.SMALL
      width < 250 -> WidgetSize.MEDIUM
      height < 150 -> WidgetSize.LARGE
      else -> WidgetSize.EXTRA_LARGE
    }
  }

  private fun updateAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    size: WidgetSize
  ) {
    val layoutId = when (size) {
      WidgetSize.SMALL -> R.layout.task_widget_small
      WidgetSize.MEDIUM -> R.layout.task_widget_medium
      WidgetSize.LARGE -> R.layout.task_widget_large
      WidgetSize.EXTRA_LARGE -> R.layout.task_widget_extra_large
    }

    val views = RemoteViews(context.packageName, layoutId)
    val taskData = loadTaskData(context)

    // Update UI based on size
    when (size) {
      WidgetSize.SMALL -> updateSmallWidget(views, taskData, context)
      WidgetSize.MEDIUM -> updateMediumWidget(views, taskData, context)
      WidgetSize.LARGE -> updateLargeWidget(views, taskData, context)
      WidgetSize.EXTRA_LARGE -> updateExtraLargeWidget(views, taskData, context)
    }

    appWidgetManager.updateAppWidget(appWidgetId, views)
  }

  private fun updateMediumWidget(
    views: RemoteViews,
    data: TaskData,
    context: Context
  ) {
    // Set header
    views.setTextViewText(R.id.widget_title, "Today's Tasks")
    views.setTextViewText(R.id.widget_count, "${data.completedCount}/${data.totalCount}")

    // Set progress
    val progress = if (data.totalCount > 0) {
      (data.completedCount * 100) / data.totalCount
    } else 0
    views.setProgressBar(R.id.widget_progress, 100, progress, false)

    // Set task list
    val intent = Intent(context, TaskWidgetService::class.java).apply {
      putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
    }
    views.setRemoteAdapter(R.id.widget_task_list, intent)

    // Set click handlers
    val openAppIntent = Intent(context, MainActivity::class.java)
    val openAppPendingIntent = PendingIntent.getActivity(
      context, 0, openAppIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    views.setOnClickPendingIntent(R.id.widget_container, openAppPendingIntent)

    // Add task button
    val addTaskIntent = Intent(context, TaskWidgetProvider::class.java).apply {
      action = ACTION_ADD_TASK
    }
    val addTaskPendingIntent = PendingIntent.getBroadcast(
      context, 0, addTaskIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    views.setOnClickPendingIntent(R.id.widget_add_button, addTaskPendingIntent)

    // Task item click template
    val toggleTaskIntent = Intent(context, TaskWidgetProvider::class.java).apply {
      action = ACTION_TOGGLE_TASK
    }
    val toggleTaskPendingIntent = PendingIntent.getBroadcast(
      context, 0, toggleTaskIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
    views.setPendingIntentTemplate(R.id.widget_task_list, toggleTaskPendingIntent)
  }

  private fun toggleTask(context: Context, taskId: String) {
    val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
    val tasksJson = prefs.getString("tasks", "[]") ?: "[]"
    val tasks = Gson().fromJson(tasksJson, Array<Task>::class.java).toMutableList()

    val taskIndex = tasks.indexOfFirst { it.id == taskId }
    if (taskIndex != -1) {
      tasks[taskIndex] = tasks[taskIndex].copy(completed = !tasks[taskIndex].completed)
      prefs.edit().putString("tasks", Gson().toJson(tasks)).apply()
    }
  }

  private fun updateAllWidgets(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val componentName = ComponentName(context, TaskWidgetProvider::class.java)
    val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
    onUpdate(context, appWidgetManager, appWidgetIds)
  }

  private fun openApp(context: Context, route: String? = null) {
    val intent = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      if (route != null) {
        data = Uri.parse("yourapp://$route")
      }
    }
    context.startActivity(intent)
  }

  companion object {
    const val ACTION_TOGGLE_TASK = "com.yourapp.TOGGLE_TASK"
    const val ACTION_ADD_TASK = "com.yourapp.ADD_TASK"
    const val ACTION_REFRESH = "com.yourapp.REFRESH_WIDGET"
    const val EXTRA_TASK_ID = "task_id"
  }
}

enum class WidgetSize {
  SMALL, MEDIUM, LARGE, EXTRA_LARGE
}
```

## Data Binding

### Widget Service for Collections

```kotlin
package com.yourapp.widget

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService

class TaskWidgetService : RemoteViewsService() {
  override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
    return TaskRemoteViewsFactory(this.applicationContext, intent)
  }
}

class TaskRemoteViewsFactory(
  private val context: Context,
  intent: Intent
) : RemoteViewsService.RemoteViewsFactory {

  private var tasks: List<Task> = emptyList()

  override fun onCreate() {
    loadTasks()
  }

  override fun onDataSetChanged() {
    loadTasks()
  }

  override fun onDestroy() {
    tasks = emptyList()
  }

  override fun getCount(): Int = tasks.size

  override fun getViewAt(position: Int): RemoteViews {
    val task = tasks[position]
    val views = RemoteViews(context.packageName, R.layout.task_widget_item)

    // Set task data
    views.setTextViewText(R.id.task_title, task.title)
    views.setBoolean(R.id.task_checkbox, "setChecked", task.completed)

    // Set click fill-in intent
    val fillInIntent = Intent().apply {
      putExtra(TaskWidgetProvider.EXTRA_TASK_ID, task.id)
    }
    views.setOnClickFillInIntent(R.id.task_checkbox, fillInIntent)

    // Priority indicator
    if (task.priority == "high") {
      views.setInt(R.id.task_priority_indicator, "setVisibility", View.VISIBLE)
      views.setInt(
        R.id.task_priority_indicator,
        "setBackgroundColor",
        Color.parseColor("#EF4444")
      )
    } else {
      views.setInt(R.id.task_priority_indicator, "setVisibility", View.GONE)
    }

    return views
  }

  override fun getLoadingView(): RemoteViews? = null

  override fun getViewTypeCount(): Int = 1

  override fun getItemId(position: Int): Long = position.toLong()

  override fun hasStableIds(): Boolean = true

  private fun loadTasks() {
    val prefs = context.getSharedPreferences("widget_data", Context.MODE_PRIVATE)
    val tasksJson = prefs.getString("tasks", "[]") ?: "[]"
    tasks = Gson().fromJson(tasksJson, Array<Task>::class.java)
      .filter { !it.completed }
      .take(10)
      .toList()
  }
}
```

## Widget Updates

### Manual Updates

```typescript
import { requestWidgetUpdate } from 'react-native-android-widget';

export async function updateWidget(widgetName: string) {
  try {
    await requestWidgetUpdate({ widgetName });
  } catch (error) {
    console.error('Widget update failed:', error);
  }
}

// Update all widgets
export async function updateAllWidgets() {
  await updateWidget('TaskWidgetSmall');
  await updateWidget('TaskWidgetMedium');
  await updateWidget('TaskWidgetLarge');
  await updateWidget('TaskWidgetExtraLarge');
}
```

### Automatic Updates

```kotlin
// WorkManager periodic update
class WidgetUpdateWorker(
  context: Context,
  params: WorkerParameters
) : Worker(context, params) {

  override fun doWork(): Result {
    val appWidgetManager = AppWidgetManager.getInstance(applicationContext)
    val componentName = ComponentName(
      applicationContext,
      TaskWidgetProvider::class.java
    )
    val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

    TaskWidgetProvider().onUpdate(
      applicationContext,
      appWidgetManager,
      appWidgetIds
    )

    return Result.success()
  }

  companion object {
    fun schedule(context: Context) {
      val request = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
        15, TimeUnit.MINUTES // Minimum interval
      ).build()

      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "widget_update",
        ExistingPeriodicWorkPolicy.KEEP,
        request
      )
    }
  }
}
```

### Update on Data Change

```typescript
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { updateAllWidgets } from './widgetUpdater';

export function useWidgetSync() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        // Update widgets when app goes to background
        updateAllWidgets();
      }
    });

    return () => subscription.remove();
  }, []);
}

// In your task service
export async function updateTask(taskId: string, updates: Partial<Task>) {
  // Update task in database
  await database.tasks.update(taskId, updates);

  // Update widgets
  await updateAllWidgets();
}
```

## Glance API (Jetpack Compose)

### Modern Widget with Glance

```kotlin
package com.yourapp.widget

import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class TaskGlanceWidget : GlanceAppWidget() {

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      TaskWidgetContent()
    }
  }

  @Composable
  fun TaskWidgetContent() {
    val tasks = loadTasks()
    val completedCount = tasks.count { it.completed }
    val totalCount = tasks.size

    Column(
      modifier = GlanceModifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.surface)
        .padding(16.dp)
        .cornerRadius(16.dp)
    ) {
      // Header
      Row(
        modifier = GlanceModifier.fillMaxWidth(),
        horizontalAlignment = Alignment.SpaceBetween
      ) {
        Text(
          text = "Today's Tasks",
          style = TextStyle(
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
          )
        )
        Text(
          text = "$completedCount/$totalCount",
          style = TextStyle(
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        )
      }

      Spacer(modifier = GlanceModifier.height(12.dp))

      // Progress
      LinearProgressIndicator(
        progress = if (totalCount > 0) completedCount.toFloat() / totalCount else 0f,
        modifier = GlanceModifier.fillMaxWidth()
      )

      Spacer(modifier = GlanceModifier.height(12.dp))

      // Task List
      tasks.take(5).forEach { task ->
        TaskItem(task)
      }

      Spacer(modifier = GlanceModifier.defaultWeight())

      // Add Button
      Button(
        text = "+ Add Task",
        onClick = actionStartActivity<MainActivity>(
          actionParametersOf(
            "route" to "tasks/new"
          )
        ),
        modifier = GlanceModifier.fillMaxWidth()
      )
    }
  }

  @Composable
  fun TaskItem(task: Task) {
    Row(
      modifier = GlanceModifier
        .fillMaxWidth()
        .padding(vertical = 8.dp)
        .clickable(
          onClick = actionRunCallback<ToggleTaskAction>(
            actionParametersOf("taskId" to task.id)
          )
        ),
      verticalAlignment = Alignment.CenterVertically
    ) {
      CheckBox(
        checked = task.completed,
        onCheckedChange = null,
        modifier = GlanceModifier.size(24.dp)
      )

      Spacer(modifier = GlanceModifier.width(12.dp))

      Text(
        text = task.title,
        style = TextStyle(
          fontSize = 14.sp,
          color = if (task.completed) {
            MaterialTheme.colorScheme.onSurfaceVariant
          } else {
            MaterialTheme.colorScheme.onSurface
          },
          textDecoration = if (task.completed) {
            TextDecoration.LineThrough
          } else {
            TextDecoration.None
          }
        ),
        modifier = GlanceModifier.defaultWeight(),
        maxLines = 1
      )

      if (task.priority == "high") {
        Box(
          modifier = GlanceModifier
            .size(8.dp)
            .background(Color.Red)
            .cornerRadius(4.dp)
        )
      }
    }
  }
}

class TaskWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = TaskGlanceWidget()
}

class ToggleTaskAction : ActionCallback {
  override suspend fun onAction(
    context: Context,
    glanceId: GlanceId,
    parameters: ActionParameters
  ) {
    val taskId = parameters[taskIdKey] ?: return
    toggleTask(context, taskId)
    TaskGlanceWidget().update(context, glanceId)
  }

  companion object {
    val taskIdKey = ActionParameters.Key<String>("taskId")
  }
}
```

## Testing

### Testing Widgets

```kotlin
// Widget test
@Test
fun testWidgetUpdate() {
  val context = InstrumentationRegistry.getInstrumentation().targetContext
  val appWidgetManager = AppWidgetManager.getInstance(context)
  val componentName = ComponentName(context, TaskWidgetProvider::class.java)

  // Create test widget
  val appWidgetId = appWidgetManager.allocateAppWidgetId()

  // Update widget
  val provider = TaskWidgetProvider()
  provider.onUpdate(context, appWidgetManager, intArrayOf(appWidgetId))

  // Verify widget was updated
  val views = appWidgetManager.getAppWidgetInfo(appWidgetId)
  assertNotNull(views)
}
```

### Manual Testing

1. **Add widget to home screen:**
   - Long-press on home screen
   - Select "Widgets"
   - Find your app's widgets
   - Drag to home screen

2. **Test interactions:**
   - Click on widget elements
   - Verify app opens correctly
   - Check deep links work

3. **Test updates:**
   - Change app data
   - Verify widget updates
   - Check refresh timing

4. **Test resizing:**
   - Long-press widget
   - Resize to different sizes
   - Verify layout adapts

## Best Practices

### 1. Performance

- Keep widgets lightweight
- Limit bitmap sizes
- Use efficient layouts
- Cache data appropriately
- Avoid expensive operations

### 2. Updates

- Don't update too frequently (battery drain)
- Use minimum 15-minute intervals
- Update only when necessary
- Use WorkManager for background updates

### 3. User Experience

- Provide visual feedback
- Handle errors gracefully
- Show loading states
- Support dark mode
- Follow Material Design

### 4. Battery Efficiency

```kotlin
// Good: Update on data change
fun onTaskUpdated() {
  if (shouldUpdateWidget()) {
    updateWidget()
  }
}

// Bad: Update every second
Timer().schedule(1000) {
  updateWidget() // Don't do this!
}
```

### 5. Configuration Activity

```kotlin
class WidgetConfigActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.widget_config)

    val appWidgetId = intent.getIntExtra(
      AppWidgetManager.EXTRA_APPWIDGET_ID,
      AppWidgetManager.INVALID_APPWIDGET_ID
    )

    // Show configuration UI
    setupConfigUI(appWidgetId)

    // Save configuration and finish
    saveButton.setOnClickListener {
      saveConfiguration(appWidgetId)

      val result = Intent().apply {
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
      }
      setResult(RESULT_OK, result)
      finish()
    }
  }
}
```

## Troubleshooting

### Widget Not Appearing

1. Check AndroidManifest.xml configuration
2. Verify widget info XML exists
3. Check layout resources
4. Ensure minimum size is correct

### Widget Not Updating

1. Check update interval (minimum 15 minutes)
2. Verify broadcast receiver is registered
3. Check SharedPreferences permissions
4. Enable logging to debug

### Layout Issues

1. Test on different launcher apps
2. Check for API-level differences
3. Verify RemoteViews compatibility
4. Test different widget sizes

### Click Actions Not Working

1. Verify PendingIntent flags
2. Check intent filters
3. Test with FLAG_MUTABLE for templates
4. Verify broadcast receiver is registered

### Common Errors

```kotlin
// Error: Widget too small
// Fix: Increase minWidth/minHeight in widget info XML

// Error: Update too frequent
// Fix: Set updatePeriodMillis to at least 900000 (15 minutes)

// Error: RemoteViews crash
// Fix: Only use supported views in RemoteViews

// Error: Memory issues
// Fix: Limit bitmap sizes, optimize layouts
```

## Resources

- [Android Widgets Guide](https://developer.android.com/guide/topics/appwidgets)
- [Glance Documentation](https://developer.android.com/jetpack/androidx/releases/glance)
- [Material Design Widgets](https://material.io/design/platform-guidance/android-widget.html)
- [Widget Best Practices](https://developer.android.com/guide/topics/appwidgets/design)
