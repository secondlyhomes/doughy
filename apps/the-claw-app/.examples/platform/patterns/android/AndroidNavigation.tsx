/**
 * Android Navigation Patterns
 *
 * Android-specific navigation configurations following Material Design guidelines.
 */

import { StyleSheet, Text, View } from 'react-native'
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

export const ANDROID_TAB_BAR_CONFIG: TabBarConfig = {
  position: 'bottom',
  showLabel: true,
  labelPosition: 'below-icon',
  iconSize: 24,
  activeTintColor: '#1976D2',
  inactiveTintColor: '#757575',
  style: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 8,
    height: 56,
  },
}

export const ANDROID_SCREEN_TRANSITIONS: ScreenTransitionConfig = {
  animation: 'fade_from_bottom',
  gestureEnabled: false,
  gestureDirection: 'vertical',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 250,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
      },
    },
  },
}

export const ANDROID_HEADER_CONFIG: HeaderConfig = {
  headerStyle: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  headerTitleStyle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
  },
  headerTitleAlign: 'left',
  headerBackTitle: undefined,
  headerTintColor: '#000000',
  headerLargeTitle: false,
  headerTransparent: false,
}

export const ANDROID_MODAL_CONFIG: ModalConfig = {
  presentation: 'transparentModal',
  cardStyle: {
    backgroundColor: '#FFFFFF',
  },
  cardStyleInterpolator: ({ current: { progress } }) => ({
    cardStyle: {
      opacity: progress,
    },
  }),
  gestureEnabled: false,
}

export const ANDROID_BACK_GESTURE: BackGestureConfig = {
  gestureEnabled: false,
}

export const ANDROID_ACTION_SHEET_CONFIG: ActionSheetConfig = {
  containerStyle: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    elevation: 16,
  },
  backdropStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  showDragIndicator: false,
}

export const ANDROID_CONTEXT_MENU_CONFIG: ContextMenuConfig = {
  menuConfig: {
    menuItems: [],
  },
  previewConfig: {
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    elevation: 8,
  },
}

export const ANDROID_DRAWER_CONFIG: DrawerConfig = {
  drawerType: 'front',
  overlayColor: 'rgba(0, 0, 0, 0.5)',
  drawerStyle: {
    backgroundColor: '#FFFFFF',
    width: 280,
    elevation: 16,
  },
  sceneContainerStyle: {
    backgroundColor: '#FAFAFA',
  },
  gestureEnabled: true,
  swipeEnabled: true,
  swipeEdgeWidth: 20,
}

export const ANDROID_BOTTOM_SHEET_CONFIG: BottomSheetConfig = {
  snapPoints: ['25%', '50%', '90%'],
  backgroundStyle: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    elevation: 16,
  },
  handleIndicatorStyle: {
    display: 'none',
  },
  enablePanDownToClose: true,
  animationConfigs: {
    duration: 250,
    easing: 'linear',
  },
}

export function AndroidSearchBar() {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchPlaceholder}>Search</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchPlaceholder: {
    color: '#757575',
    fontSize: 16,
  },
})
