// src/features/deals/hooks/next-action/ui.ts
// UI helper functions for Next Best Action

import type { ActionCategory } from './types';

/**
 * Get action button text based on category
 */
export function getActionButtonText(category: ActionCategory): string {
  switch (category) {
    case 'contact':
      return 'Contact Seller';
    case 'analyze':
      return 'Run Analysis';
    case 'walkthrough':
      return 'Start Walkthrough';
    case 'underwrite':
      return 'Quick Underwrite';
    case 'offer':
      return 'Create Offer';
    case 'negotiate':
      return 'View Counter';
    case 'close':
      return 'View Details';
    case 'followup':
      return 'Follow Up';
    case 'document':
      return 'Add Documents';
    default:
      return 'Take Action';
  }
}

/**
 * Get action icon name based on category
 */
export function getActionIcon(category: ActionCategory): string {
  switch (category) {
    case 'contact':
      return 'phone';
    case 'analyze':
      return 'bar-chart-2';
    case 'walkthrough':
      return 'camera';
    case 'underwrite':
      return 'calculator';
    case 'offer':
      return 'file-text';
    case 'negotiate':
      return 'message-circle';
    case 'close':
      return 'check-circle';
    case 'followup':
      return 'clock';
    case 'document':
      return 'folder-plus';
    default:
      return 'play';
  }
}
