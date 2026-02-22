// src/features/assistant/components/DealAssistant.tsx
// Floating AI assistant for Deal OS with Actions/Ask/Jobs tabs

import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ErrorBoundary } from '@/features/layout/components/ErrorBoundary';

import { ActionsTab } from './ActionsTab';
import { AskTab } from './AskTab';
import { JobsTab } from './JobsTab';
import { PatchSetPreview } from './PatchSetPreview';
import { AssistantBubble } from './AssistantBubble';
import { AssistantSheetHeader } from './AssistantSheetHeader';
import { AssistantTabBar } from './AssistantTabBar';

import { useAIJobs } from '../hooks/useAIJobs';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { PatchSet } from '../types/patchset';
import { ActionDefinition } from '../actions/catalog';
import { AIJob } from '../types/jobs'; // Used in handleJobPress callback type

import { TabId, DealAssistantProps } from './deal-assistant-types';
import { styles } from './deal-assistant-styles';

export function DealAssistant({ dealId, onStateChange }: DealAssistantProps) {
  const context = useAssistantContext();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('actions');
  const [patchSetPreview, setPatchSetPreview] = useState<PatchSet | null>(null);

  // AI Jobs for badge count
  const { pendingCount } = useAIJobs(dealId);

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
      <AssistantBubble
        isOpen={isOpen}
        pendingCount={pendingCount}
        onToggle={handleToggle}
      />

      {/* Bottom Sheet Panel */}
      <BottomSheet
        visible={isOpen}
        onClose={handleClose}
        snapPoints={['80%']}
        useGlass
      >
        {/* Header */}
        <AssistantSheetHeader
          dealId={dealId}
          contextOneLiner={context.summary.oneLiner}
          onClose={handleClose}
        />

        {/* Tabs */}
        <AssistantTabBar
          activeTab={activeTab}
          pendingCount={pendingCount}
          onTabChange={setActiveTab}
        />

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

export default DealAssistant;
