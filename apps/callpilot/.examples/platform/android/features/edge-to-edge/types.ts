/**
 * Edge-to-Edge Types
 *
 * Type definitions for edge-to-edge display functionality.
 */

import { ViewStyle } from 'react-native';

/**
 * System bar appearance configuration
 */
export interface SystemBarStyle {
  statusBarColor?: string;
  navigationBarColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  navigationBarStyle?: 'light' | 'dark';
}

/**
 * Window insets from system
 */
export interface WindowInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Edge-to-edge hook options
 */
export interface UseEdgeToEdgeOptions {
  enabled?: boolean;
  style?: SystemBarStyle;
}

/**
 * Edge-to-edge hook return value
 */
export interface UseEdgeToEdgeResult {
  isEdgeToEdge: boolean;
  insets: WindowInsets;
}

/**
 * Safe area edge types
 */
export type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * Common component props with children and style
 */
export interface BaseContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * EdgeToEdgeContainer props
 */
export interface EdgeToEdgeContainerProps extends BaseContainerProps {
  backgroundColor?: string;
}

/**
 * SafeAreaView props
 */
export interface SafeAreaViewProps extends BaseContainerProps {
  edges?: SafeAreaEdge[];
}

/**
 * InsetAwareScrollView props
 */
export interface InsetAwareScrollViewProps {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

/**
 * BottomSheetWithInsets props
 */
export interface BottomSheetWithInsetsProps extends BaseContainerProps {}

/**
 * FABWithInsets props
 */
export interface FABWithInsetsProps {
  onPress: () => void;
  icon: React.ReactNode;
  style?: ViewStyle;
}

/**
 * FullScreenImageViewer props
 */
export interface FullScreenImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}
