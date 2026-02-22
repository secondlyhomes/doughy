// src/components/deals/metric-card-types.ts
// Types for the MetricCard component

import { ViewStyle } from 'react-native';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface BreakdownItem {
  label: string;
  value: string | number;
  isSubtraction?: boolean;
}

export interface MetricBreakdown {
  formula: string;
  items: BreakdownItem[];
}

export interface MetricAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface MetricCardProps {
  /** Label for the metric (e.g., "MAO", "Net Profit") */
  label: string;

  /** Main value to display */
  value: string | number;

  /** Icon to display next to label */
  icon?: React.ReactNode;

  /** Optional breakdown showing calculation details */
  breakdown?: MetricBreakdown;

  /** Optional actions when fully expanded */
  actions?: MetricAction[];

  /** Confidence level for color coding */
  confidence?: ConfidenceLevel;

  /** Compact mode for sticky headers */
  compact?: boolean;

  /** Whether card is disabled */
  disabled?: boolean;

  /** Custom style */
  style?: ViewStyle;

  /** Callback when evidence info is pressed */
  onEvidencePress?: () => void;
}

export type CardState = 'collapsed' | 'expanded' | 'actionable';
