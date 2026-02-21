// src/features/assistant/components/actions-tab-types.ts
// Type definitions for ActionsTab

import { ActionDefinition } from '../actions/catalog';
import { PatchSet } from '../types/patchset';

export interface ActionsTabProps {
  dealId?: string;
  onActionSelect?: (action: ActionDefinition, patchSet?: PatchSet) => void;
  onJobCreated?: (jobId: string) => void;
}
