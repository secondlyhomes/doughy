// src/features/campaigns/hooks/campaigns/index.ts
// Barrel export for campaign hooks

// Re-export types
export type {
  CampaignFilters,
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateStepInput,
  EnrollContactsInput,
  UpdateStepInput,
  DeleteStepInput,
  PauseEnrollmentInput,
} from './types';

// Re-export query keys
export { campaignKeys } from './queryKeys';

// Re-export query hooks
export {
  useCampaigns,
  useCampaign,
  useCampaignSteps,
  useCampaignEnrollments,
} from './campaignQueries';

// Re-export campaign mutations
export {
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from './campaignMutations';

// Re-export step mutations
export {
  useCreateCampaignStep,
  useUpdateCampaignStep,
  useDeleteCampaignStep,
} from './stepMutations';

// Re-export enrollment mutations
export {
  useEnrollContacts,
  usePauseEnrollment,
  useResumeEnrollment,
  useRemoveFromCampaign,
} from './enrollmentMutations';
