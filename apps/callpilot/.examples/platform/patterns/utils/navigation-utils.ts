/**
 * Navigation Utilities
 *
 * Shared utilities and default configurations for platform-specific navigation.
 */

import { Platform, StyleSheet, Text, View } from 'react-native'
import type {
  TabBarConfig,
  ScreenTransitionConfig,
  HeaderConfig,
  ModalConfig,
  BackGestureConfig,
  ActionSheetConfig,
  ContextMenuConfig,
  DrawerConfig,
  BottomSheetConfig,
} from '../navigation-types'

// Default/fallback configurations

export const DEFAULT_TAB_BAR_CONFIG: TabBarConfig = {
  position: 'bottom',
  showLabel: true,
  labelPosition: 'below-icon',
  iconSize: 24,
  activeTintColor: '#0066CC',
  inactiveTintColor: '#666666',
  style: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: 60,
  },
}

export const DEFAULT_SCREEN_TRANSITIONS: ScreenTransitionConfig = {
  animation: 'fade',
  gestureEnabled: false,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 200,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 150,
      },
    },
  },
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  headerStyle: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerTitleAlign: 'center',
  headerTintColor: '#0066CC',
}

export const DEFAULT_MODAL_CONFIG: ModalConfig = {
  presentation: 'modal',
  cardStyle: {
    backgroundColor: '#FFFFFF',
  },
  gestureEnabled: false,
}

export const DEFAULT_BACK_GESTURE: BackGestureConfig = {
  gestureEnabled: false,
}

export const DEFAULT_ACTION_SHEET_CONFIG: ActionSheetConfig = {
  containerStyle: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  backdropStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  showDragIndicator: false,
}

export const DEFAULT_CONTEXT_MENU_CONFIG: ContextMenuConfig = {
  menuConfig: {
    menuItems: [],
  },
}

export const DEFAULT_DRAWER_CONFIG: DrawerConfig = {
  drawerType: 'front',
  drawerStyle: {
    backgroundColor: '#FFFFFF',
    width: 280,
  },
  gestureEnabled: false,
  swipeEnabled: false,
}

export const DEFAULT_BOTTOM_SHEET_CONFIG: BottomSheetConfig = {
  snapPoints: ['50%', '90%'],
  backgroundStyle: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  enablePanDownToClose: true,
}

/**
 * Get platform-specific card background color
 */
export function getCardBackgroundColor(): string {
  return Platform.select({
    ios: '#F8F9FA',
    android: '#FAFAFA',
    default: '#FFFFFF',
  }) as string
}

/**
 * Default search bar component for fallback
 */
export function DefaultSearchBar() {
  return (
    <View style={styles.searchContainer}>
      <Text>Search</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
})
