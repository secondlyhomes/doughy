/**
 * iOS Navigation Patterns
 * iOS-specific navigation configurations following Apple's Human Interface Guidelines.
 */

import { StyleSheet, Text, View } from 'react-native'
import type {
  TabBarConfig, ScreenTransitionConfig, HeaderConfig, ModalConfig,
  BackGestureConfig, ActionSheetConfig, ContextMenuConfig, DrawerConfig,
  BottomSheetConfig,
} from '../navigation-types'

const IOS_SPRING_CONFIG = {
  stiffness: 1000, damping: 500, mass: 3,
  overshootClamping: true, restDisplacementThreshold: 0.01, restSpeedThreshold: 0.01,
}

export const IOS_TAB_BAR_CONFIG: TabBarConfig = {
  position: 'bottom', showLabel: true, labelPosition: 'below-icon', iconSize: 24,
  activeTintColor: '#007AFF', inactiveTintColor: '#8E8E93',
  style: {
    backgroundColor: '#FFFFFF', borderTopWidth: 0.5, borderTopColor: '#E5E5EA',
    paddingBottom: 8, paddingTop: 8, height: 64,
  },
}

export const IOS_SCREEN_TRANSITIONS: ScreenTransitionConfig = {
  animation: 'slide_from_right', gestureEnabled: true, gestureDirection: 'horizontal',
  transitionSpec: {
    open: { animation: 'spring', config: IOS_SPRING_CONFIG },
    close: { animation: 'spring', config: IOS_SPRING_CONFIG },
  },
}

export const IOS_HEADER_CONFIG: HeaderConfig = {
  headerStyle: { backgroundColor: '#F8F9FA', borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontSize: 17, fontWeight: '600', color: '#000000' },
  headerTitleAlign: 'center', headerBackTitle: 'Back',
  headerBackTitleStyle: { fontSize: 17, color: '#007AFF' },
  headerTintColor: '#007AFF', headerLargeTitle: true,
  headerLargeTitleStyle: { fontSize: 34, fontWeight: '700' },
  headerTransparent: false, headerBlurEffect: 'systemMaterial',
}

export const IOS_MODAL_CONFIG: ModalConfig = {
  presentation: 'modal',
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: ({ current: { progress } }) => ({
    cardStyle: {
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
    },
    overlayStyle: { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
  }),
  gestureEnabled: true, gestureDirection: 'vertical',
}

export const IOS_BACK_GESTURE: BackGestureConfig = {
  gestureEnabled: true, gestureDirection: 'horizontal', gestureResponseDistance: 50,
}

export const IOS_ACTION_SHEET_CONFIG: ActionSheetConfig = {
  containerStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 34,
  },
  backdropStyle: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  showDragIndicator: true,
  dragIndicatorStyle: { width: 36, height: 5, backgroundColor: '#C6C6C8', borderRadius: 3, marginTop: 8 },
}

export const IOS_CONTEXT_MENU_CONFIG: ContextMenuConfig = {
  menuConfig: { menuTitle: '', menuItems: [] },
  previewConfig: { borderRadius: 10, backgroundColor: '#FFFFFF' },
  isMenuPrimaryAction: false,
}

export const IOS_DRAWER_CONFIG: DrawerConfig = {
  drawerType: 'slide', overlayColor: 'rgba(0, 0, 0, 0.5)',
  drawerStyle: { backgroundColor: '#FFFFFF', width: '80%' },
  sceneContainerStyle: { backgroundColor: '#F8F9FA' },
  gestureEnabled: true, swipeEnabled: true, swipeEdgeWidth: 50,
}

export const IOS_BOTTOM_SHEET_CONFIG: BottomSheetConfig = {
  snapPoints: ['25%', '50%', '90%'],
  backgroundStyle: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  handleIndicatorStyle: { backgroundColor: '#C6C6C8', width: 36, height: 5 },
  enablePanDownToClose: true,
  animationConfigs: { duration: 300, easing: 'spring' },
}

export function IOSSearchBar() {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchPlaceholder}>Search</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8F9FA' },
  searchBar: {
    backgroundColor: '#E5E5EA', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
  },
  searchPlaceholder: { color: '#8E8E93', fontSize: 17 },
})
