// src/features/assistant/components/DealAssistant.tsx
// Floating AI assistant for Deal OS with Actions/Ask/Jobs tabs

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  X,
  Zap,
  MessageCircle,
  Clock,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { BORDER_RADIUS } from '@/constants/design-tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ErrorBoundary } from '@/features/layout/components/ErrorBoundary';
import { FAB_SIZE, FAB_BOTTOM_OFFSET, FAB_RIGHT_MARGIN, FAB_LEFT_MARGIN, FAB_Z_INDEX } from '@/components/ui/FloatingGlassTabBar';
import { GlassButton } from '@/components/ui/GlassButton';

import { ActionsTab } from './ActionsTab';
import { AskTab } from './AskTab';
import { JobsTab } from './JobsTab';
import { PatchSetPreview } from './PatchSetPreview';

import { useAIJobs } from '../hooks/useAIJobs';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { PatchSet } from '../types/patchset';
import { ActionDefinition } from '../actions/catalog';
import { AIJob } from '../types/jobs'; // Used in handleJobPress callback type

// UI Constants
const TAB_BAR_HEIGHT = 80; // Approximate tab bar height
const MIN_BUBBLE_TOP_OFFSET = 100; // Minimum distance from top

type TabId = 'actions' | 'ask' | 'jobs';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
}

const TABS: TabConfig[] = [
  { id: 'actions', label: 'Actions', icon: Zap },
  { id: 'ask', label: 'Ask', icon: MessageCircle },
  { id: 'jobs', label: 'Jobs', icon: Clock },
];

interface DealAssistantProps {
  /** Current deal ID (optional - shows empty state if not set) */
  dealId?: string;
  /** Callback when assistant state changes */
  onStateChange?: (isOpen: boolean) => void;
}

export function DealAssistant({ dealId, onStateChange }: DealAssistantProps) {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { buttonBottom } = useTabBarPadding();
  const context = useAssistantContext();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('actions');
  const [patchSetPreview, setPatchSetPreview] = useState<PatchSet | null>(null);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bubblePosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Store insets in ref for PanResponder access
  const insetsRef = useRef(insets);
  insetsRef.current = insets;

  // AI Jobs for badge count
  const { pendingCount } = useAIJobs(dealId);

  // Pulse animation for bubble
  // Note: useNativeDriver must be false because scaleAnim shares a transform
  // with bubblePosition, which requires JS driver for PanResponder
  useEffect(() => {
    if (!isOpen && pendingCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else if (!isOpen) {
      // Single pulse on mount
      const timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, pendingCount, scaleAnim]);

  // Pan responder for draggable bubble
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: Animated.event(
        [null, { dx: bubblePosition.x, dy: bubblePosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        const screen = Dimensions.get('window');
        const currentInsets = insetsRef.current;

        // Snap X to edges with margin + safe area
        const leftSnapX = -(screen.width - FAB_SIZE - FAB_LEFT_MARGIN - currentInsets.right);
        const rightSnapX = 0; // Default position (right edge)
        const snapX = gestureState.moveX > screen.width / 2 ? rightSnapX : leftSnapX;

        // Clamp Y within safe bounds
        const minY = -(screen.height - FAB_BOTTOM_OFFSET - MIN_BUBBLE_TOP_OFFSET - currentInsets.top);
        const maxY = FAB_BOTTOM_OFFSET - TAB_BAR_HEIGHT - currentInsets.bottom;
        const clampedY = Math.max(minY, Math.min(gestureState.dy, maxY));

        Animated.spring(bubblePosition, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  // Handlers
  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    onStateChange?.(newState);
  }, [isOpen, onStateChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onStateChange?.(false);
  }, [onStateChange]);

  const handleActionSelect = useCallback((action: ActionDefinition, patchSet?: PatchSet) => {
    if (patchSet) {
      setPatchSetPreview(patchSet);
    }
    // For long-running actions, could switch to jobs tab
    if (action.isLongRunning) {
      setActiveTab('jobs');
    }
  }, []);

  const handleJobPress = useCallback((job: AIJob) => {
    // TODO: Show job details modal
    console.log('Job selected:', job.id);
  }, []);

  const handlePatchSetApplied = useCallback(() => {
    setPatchSetPreview(null);
    // Could show success toast
  }, []);

  return (
    <>
      {/* Floating Bubble - Glass effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: buttonBottom + FAB_BOTTOM_OFFSET,  // Dynamic: adapts to device safe area
            right: FAB_RIGHT_MARGIN,
            zIndex: FAB_Z_INDEX.ASSISTANT,
          },
          {
            transform: [
              { translateX: bubblePosition.x },
              { translateY: bubblePosition.y },
              { scale: scaleAnim },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <GlassButton
          icon={<Sparkles size={24} color="white" />}
          onPress={handleToggle}
          size={FAB_SIZE}
          effect="regular"
          accessibilityLabel="Open AI Assistant"
        />
        {/* Badge - positioned outside GlassButton */}
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
            <Text style={[styles.badgeText, { color: colors.destructiveForeground }]}>{pendingCount}</Text>
          </View>
        )}
      </Animated.View>

      {/* Bottom Sheet Panel */}
      <BottomSheet
        visible={isOpen}
        onClose={handleClose}
        snapPoints={['80%']}
        useGlass
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Sparkles size={20} color={colors.primary} />
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                AI Assistant
              </Text>
              {dealId && (
                <Text
                  style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {context.summary.oneLiner}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close AI Assistant"
          >
            <X size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label} tab${tab.id === 'jobs' && pendingCount > 0 ? `, ${pendingCount} pending` : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                <Icon
                  size={18}
                  color={isActive ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {tab.label}
                </Text>
                {/* Jobs tab badge */}
                {tab.id === 'jobs' && pendingCount > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.tabBadgeText, { color: colors.primaryForeground }]}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content - Each tab wrapped in ErrorBoundary for isolation */}
        <View style={styles.tabContent}>
          {activeTab === 'actions' && (
            <ErrorBoundary>
              <ActionsTab
                dealId={dealId}
                onActionSelect={handleActionSelect}
              />
            </ErrorBoundary>
          )}
          {activeTab === 'ask' && (
            <ErrorBoundary>
              <AskTab dealId={dealId} />
            </ErrorBoundary>
          )}
          {activeTab === 'jobs' && (
            <ErrorBoundary>
              <JobsTab dealId={dealId} onJobPress={handleJobPress} />
            </ErrorBoundary>
          )}
        </View>
      </BottomSheet>

      {/* PatchSet Preview Modal */}
      <PatchSetPreview
        visible={!!patchSetPreview}
        patchSet={patchSetPreview}
        onClose={() => setPatchSetPreview(null)}
        onApplied={handlePatchSetApplied}
      />
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: BORDER_RADIUS['10'],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 250,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
});

export default DealAssistant;
