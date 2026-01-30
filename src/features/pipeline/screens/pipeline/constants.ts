// src/features/pipeline/screens/pipeline/constants.ts
// Constants for pipeline screen

import { Users, Briefcase, Building } from 'lucide-react-native';
import type { SegmentOption, PipelineSegment } from './types';

export const SEGMENTS: SegmentOption[] = [
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'deals', label: 'Deals', icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio', icon: Building },
];

export const SEGMENT_CONTROL_HEIGHT = 38; // Inner content height (excludes 3px padding on each side)
