// src/features/pipeline/screens/pipeline/types.ts
// Types for pipeline screen

import type { LeadWithProperties } from '@/features/leads/types';
import type { Deal } from '@/features/deals/types';
import type { PortfolioProperty } from '@/features/portfolio/types';

export type PipelineSegment = 'leads' | 'deals' | 'portfolio';

// Union type for all pipeline items (used for FlatList typing)
export type PipelineItem = LeadWithProperties | Deal | PortfolioProperty;

export interface SegmentOption {
  id: PipelineSegment;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}
