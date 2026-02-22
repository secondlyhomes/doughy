// src/features/deals/screens/cockpit/CockpitModals.tsx
// Aggregates all modal/sheet overlays for the Deal Cockpit screen

import React from 'react';
import { Alert } from 'react-native';
import { EvidenceTrailModal } from '@/components/deals';
import {
  AddDealEventSheet,
  DealActionsSheet,
} from '../../components';
import { getDealAddress } from '../../types';
import type { Deal } from '../../types';

interface EvidenceModalState {
  visible: boolean;
  field: 'mao' | 'profit' | 'risk' | null;
}

interface CockpitModalsProps {
  deal: Deal;
  showAddEventSheet: boolean;
  onCloseAddEventSheet: () => void;
  showActionsSheet: boolean;
  onCloseActionsSheet: () => void;
  evidenceModal: EvidenceModalState;
  onCloseEvidenceModal: () => void;
  onRefetch: () => void;
}

export function CockpitModals({
  deal,
  showAddEventSheet,
  onCloseAddEventSheet,
  showActionsSheet,
  onCloseActionsSheet,
  evidenceModal,
  onCloseEvidenceModal,
  onRefetch,
}: CockpitModalsProps) {
  return (
    <>
      {/* Add Event Sheet */}
      <AddDealEventSheet
        visible={showAddEventSheet}
        dealId={deal.id}
        dealAddress={getDealAddress(deal)}
        onClose={onCloseAddEventSheet}
        onSaved={onRefetch}
      />

      {/* Deal Actions Sheet */}
      <DealActionsSheet
        deal={deal}
        isOpen={showActionsSheet}
        onClose={onCloseActionsSheet}
        onEdit={() => {
          Alert.alert('Edit Deal', 'Edit deal functionality coming soon!', [
            { text: 'OK' },
          ]);
        }}
        onDelete={() => {
          Alert.alert(
            'Delete Deal',
            'Are you sure you want to delete this deal? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Delete', 'Delete functionality coming soon!');
                },
              },
            ]
          );
        }}
      />

      {/* Evidence Trail Modal */}
      <EvidenceTrailModal
        visible={evidenceModal.visible}
        onClose={onCloseEvidenceModal}
        fieldName={
          evidenceModal.field === 'mao'
            ? 'Maximum Allowable Offer'
            : evidenceModal.field === 'profit'
              ? 'Profit / Cash Flow'
              : evidenceModal.field === 'risk'
                ? 'Risk Score'
                : ''
        }
        currentValue={
          evidenceModal.field === 'mao'
            ? '$0'
            : evidenceModal.field === 'profit'
              ? '$0'
              : '0/5'
        }
        confidence="medium"
        sources={[
          {
            id: '1',
            source: 'AI Estimate',
            value: 'Calculated from property data',
            confidence: 'medium',
            timestamp: new Date().toISOString(),
            isActive: true,
          },
        ]}
        onOverride={(value) => {
          Alert.alert('Override', `Would set value to: ${value}`);
          onCloseEvidenceModal();
        }}
      />
    </>
  );
}
