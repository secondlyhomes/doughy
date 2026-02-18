/**
 * Navigation Types
 *
 * Type definitions for platform-specific navigation patterns.
 */

export type TabBarPosition = 'bottom' | 'top'
export type LabelPosition = 'below-icon' | 'beside-icon'
export type AnimationType = 'slide_from_right' | 'fade_from_bottom' | 'fade'
export type GestureDirection = 'horizontal' | 'vertical'
export type ModalPresentation = 'modal' | 'transparentModal' | 'fullScreenModal'
export type DrawerType = 'slide' | 'front' | 'back' | 'permanent'
export type HeaderBlurEffect = 'systemMaterial' | 'light' | 'dark'

export interface TabBarStyle {
  backgroundColor: string
  borderTopWidth?: number
  borderTopColor?: string
  paddingBottom?: number
  paddingTop?: number
  height: number
  elevation?: number
}

export interface TabBarConfig {
  position: TabBarPosition
  showLabel: boolean
  labelPosition: LabelPosition
  iconSize: number
  activeTintColor: string
  inactiveTintColor: string
  style: TabBarStyle
}

export interface TransitionSpec {
  animation: 'spring' | 'timing'
  config: {
    stiffness?: number
    damping?: number
    mass?: number
    overshootClamping?: boolean
    restDisplacementThreshold?: number
    restSpeedThreshold?: number
    duration?: number
  }
}

export interface ScreenTransitionConfig {
  animation: AnimationType
  gestureEnabled: boolean
  gestureDirection?: GestureDirection
  transitionSpec: {
    open: TransitionSpec
    close: TransitionSpec
  }
}

export interface HeaderStyle {
  backgroundColor: string
  borderBottomWidth?: number
  borderBottomColor?: string
  elevation?: number
  shadowOpacity?: number
}

export interface HeaderConfig {
  headerStyle: HeaderStyle
  headerTitleStyle: {
    fontSize: number
    fontWeight: string
    color: string
  }
  headerTitleAlign: 'center' | 'left'
  headerBackTitle?: string
  headerBackTitleStyle?: {
    fontSize: number
    color: string
  }
  headerTintColor: string
  headerLargeTitle?: boolean
  headerLargeTitleStyle?: {
    fontSize: number
    fontWeight: string
  }
  headerTransparent?: boolean
  headerBlurEffect?: HeaderBlurEffect
}

export interface ModalConfig {
  presentation: ModalPresentation
  cardStyle: {
    backgroundColor: string
  }
  cardStyleInterpolator?: (params: { current: { progress: any } }) => {
    cardStyle?: object
    overlayStyle?: object
  }
  gestureEnabled: boolean
  gestureDirection?: GestureDirection
}

export interface BackGestureConfig {
  gestureEnabled: boolean
  gestureDirection?: GestureDirection
  gestureResponseDistance?: number
}

export interface ActionSheetConfig {
  containerStyle: {
    backgroundColor: string
    borderTopLeftRadius: number
    borderTopRightRadius: number
    paddingBottom?: number
    elevation?: number
  }
  backdropStyle: {
    backgroundColor: string
  }
  showDragIndicator: boolean
  dragIndicatorStyle?: {
    width: number
    height: number
    backgroundColor: string
    borderRadius: number
    marginTop: number
  }
}

export interface ContextMenuConfig {
  menuConfig: {
    menuTitle?: string
    menuItems: unknown[]
  }
  previewConfig?: {
    borderRadius: number
    backgroundColor: string
    elevation?: number
  }
  isMenuPrimaryAction?: boolean
}

export interface DrawerStyle {
  backgroundColor: string
  width: number | string
  elevation?: number
}

export interface DrawerConfig {
  drawerType: DrawerType
  overlayColor?: string
  drawerStyle: DrawerStyle
  sceneContainerStyle?: {
    backgroundColor: string
  }
  gestureEnabled: boolean
  swipeEnabled: boolean
  swipeEdgeWidth?: number
}

export interface BottomSheetConfig {
  snapPoints: string[]
  backgroundStyle: {
    backgroundColor: string
    borderTopLeftRadius: number
    borderTopRightRadius: number
    elevation?: number
  }
  handleIndicatorStyle?: {
    backgroundColor?: string
    width?: number
    height?: number
    display?: 'none'
  }
  enablePanDownToClose: boolean
  animationConfigs?: {
    duration: number
    easing: 'spring' | 'linear'
  }
}

export interface PlatformConfig<T> {
  ios: T
  android: T
  default: T
}
