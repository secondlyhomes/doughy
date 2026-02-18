/**
 * styles.ts
 *
 * StyleSheet definitions for Focus Filter components
 */

import { StyleSheet } from 'react-native';

export const focusFilterStyles = StyleSheet.create({
  // FocusFilterBanner styles
  bannerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  bannerSubtext: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0.9,
    color: '#FFFFFF',
  },

  // TaskListWithFocusFilter styles
  hiddenTasksContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    marginBottom: 16,
  },
  hiddenTasksText: {
    margin: 0,
    fontSize: 15,
    color: '#3C3C43',
  },
  taskItemContainer: {
    // Task item styling - extend as needed
  },
});
