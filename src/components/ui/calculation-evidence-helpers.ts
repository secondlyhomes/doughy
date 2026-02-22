import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import type { CalculationStatus, ConfidenceLevel } from './calculation-evidence-types';

/**
 * Gets status badge configuration
 */
export function getStatusConfig(status: CalculationStatus): {
  variant: 'success' | 'warning' | 'outline';
  label: string;
  icon: React.ComponentType<any>;
} {
  switch (status) {
    case 'verified':
      return { variant: 'success', label: 'Verified', icon: CheckCircle2 };
    case 'estimated':
      return { variant: 'warning', label: 'Estimated', icon: Info };
    case 'needs_review':
      return { variant: 'outline', label: 'Needs Review', icon: AlertCircle };
  }
}

/**
 * Gets confidence badge variant
 */
export function getConfidenceBadge(confidence: ConfidenceLevel): {
  variant: 'success' | 'warning' | 'destructive';
  label: string;
} {
  switch (confidence) {
    case 'high':
      return { variant: 'success', label: 'High' };
    case 'medium':
      return { variant: 'warning', label: 'Medium' };
    case 'low':
      return { variant: 'destructive', label: 'Low' };
  }
}
