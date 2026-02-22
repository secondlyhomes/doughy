// src/components/deals/evidence-trail-helpers.ts
// Helper functions for EvidenceTrailModal

import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import type { ConfidenceLevel } from './evidence-trail-types';

export function getConfidenceConfig(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'high':
      return { label: 'High Confidence', variant: 'success' as const, icon: CheckCircle2 };
    case 'medium':
      return { label: 'Medium Confidence', variant: 'warning' as const, icon: AlertCircle };
    case 'low':
      return { label: 'Low Confidence', variant: 'destructive' as const, icon: AlertCircle };
  }
}

export function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
