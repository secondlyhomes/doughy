import { ViewStyle } from 'react-native';

export type CalculationStatus = 'verified' | 'estimated' | 'needs_review';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceSource {
  /** Source label (e.g., "County Tax Records", "MLS Listing") */
  label: string;

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** Specific value or detail from source */
  value?: string;

  /** When the data was retrieved/verified */
  timestamp?: string;
}

export interface CalculationStep {
  /** Step label */
  label: string;

  /** Formula or calculation description */
  formula?: string;

  /** Result value */
  result: string;

  /** Evidence sources for this step */
  sources?: EvidenceSource[];

  /** Additional explanation */
  explanation?: string;
}

export interface CalculationEvidenceProps {
  /** Calculation title (e.g., "ARV Calculation", "ROI Analysis") */
  title: string;

  /** Final result to display */
  finalResult: string;

  /** Calculation status */
  status: CalculationStatus;

  /** Breakdown steps */
  steps: CalculationStep[];

  /** Card variant */
  variant?: 'default' | 'glass';

  /** Start collapsed */
  startCollapsed?: boolean;

  /** Custom style */
  style?: ViewStyle;
}
