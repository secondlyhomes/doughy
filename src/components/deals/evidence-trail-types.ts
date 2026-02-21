// src/components/deals/evidence-trail-types.ts
// Types for EvidenceTrailModal and sub-components

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceSource {
  /** Unique identifier */
  id: string;

  /** Source name (e.g., "Zillow", "County Records", "AI Estimate") */
  source: string;

  /** Value from this source */
  value: string | number;

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** When this data was retrieved */
  timestamp?: string;

  /** Whether this is the currently active/selected value */
  isActive?: boolean;

  /** Optional link to source */
  url?: string;
}

export interface EvidenceOverride {
  /** Original value */
  originalValue: string | number;

  /** Overridden value */
  overrideValue: string | number;

  /** When override was made */
  timestamp: string;

  /** Reason for override (optional) */
  reason?: string;
}

export interface EvidenceTrailModalProps {
  /** Whether modal is visible */
  visible: boolean;

  /** Close handler */
  onClose: () => void;

  /** Field name (e.g., "ARV", "Repair Cost") */
  fieldName: string;

  /** Current value */
  currentValue: string | number;

  /** Overall confidence level */
  confidence: ConfidenceLevel;

  /** Evidence sources for this field */
  sources: EvidenceSource[];

  /** Override history */
  overrides?: EvidenceOverride[];

  /** Callback when user overrides value */
  onOverride?: (newValue: string | number, reason?: string) => void;

  /** Callback when user selects a source */
  onSelectSource?: (sourceId: string) => void;
}
