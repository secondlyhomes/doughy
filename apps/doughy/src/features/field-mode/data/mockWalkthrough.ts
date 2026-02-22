// src/features/field-mode/data/mockWalkthrough.ts
// Mock walkthrough data for development and testing

import { DealWalkthrough, WalkthroughItem, AISummary, PhotoBucket } from '../types';

/**
 * Sample AI-organized summary demonstrating the output format
 */
export const mockAISummary: AISummary = {
  issues: [
    'Roof appears to have missing shingles near chimney (exterior photo 2)',
    'Water stain on kitchen ceiling suggests possible leak',
    'HVAC unit is 18+ years old, may need replacement',
    'Electrical panel has double-tapped breakers - safety concern',
    'Foundation crack visible in basement corner (~1/4" wide)',
  ],
  questions: [
    'When was the roof last replaced?',
    'Has the water stain on the ceiling been addressed?',
    'Is there a home warranty that covers the HVAC?',
    'Has the electrical panel been inspected recently?',
    'Has the foundation crack been monitored or repaired?',
  ],
  scope_bullets: [
    'Roof repair/partial replacement: Estimated $3,000-$5,000',
    'Ceiling repair and leak investigation: Estimated $500-$1,500',
    'HVAC replacement (if needed): Estimated $5,000-$8,000',
    'Electrical panel upgrade: Estimated $1,500-$2,500',
    'Foundation crack repair: Estimated $500-$1,000',
    'Total estimated repairs: $10,500-$18,000',
  ],
};

/**
 * Sample walkthrough items demonstrating different buckets and types
 */
export const mockWalkthroughItems: WalkthroughItem[] = [
  // Exterior/Roof
  {
    id: 'item-1',
    walkthrough_id: 'wt-1',
    bucket: 'exterior_roof',
    item_type: 'photo',
    file_url: 'https://example.com/photos/exterior-front.jpg',
    notes: 'Front of house, good curb appeal',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'item-2',
    walkthrough_id: 'wt-1',
    bucket: 'exterior_roof',
    item_type: 'photo',
    file_url: 'https://example.com/photos/roof-damage.jpg',
    notes: 'Missing shingles near chimney',
    created_at: '2024-01-15T10:32:00Z',
  },
  {
    id: 'item-3',
    walkthrough_id: 'wt-1',
    bucket: 'exterior_roof',
    item_type: 'voice_memo',
    file_url: 'https://example.com/audio/roof-notes.m4a',
    transcript: 'The roof looks like it has some damage near the chimney area. I can see at least five or six missing shingles. Going to want to get a roofer out here for an estimate.',
    created_at: '2024-01-15T10:33:00Z',
  },

  // Kitchen
  {
    id: 'item-4',
    walkthrough_id: 'wt-1',
    bucket: 'kitchen',
    item_type: 'photo',
    file_url: 'https://example.com/photos/kitchen-overview.jpg',
    notes: 'Kitchen overview - dated but functional',
    created_at: '2024-01-15T10:40:00Z',
  },
  {
    id: 'item-5',
    walkthrough_id: 'wt-1',
    bucket: 'kitchen',
    item_type: 'photo',
    file_url: 'https://example.com/photos/kitchen-ceiling.jpg',
    notes: 'Water stain on ceiling',
    created_at: '2024-01-15T10:41:00Z',
  },

  // Bathrooms
  {
    id: 'item-6',
    walkthrough_id: 'wt-1',
    bucket: 'baths',
    item_type: 'photo',
    file_url: 'https://example.com/photos/bath-main.jpg',
    notes: 'Main bath - tile in good condition',
    created_at: '2024-01-15T10:50:00Z',
  },
  {
    id: 'item-7',
    walkthrough_id: 'wt-1',
    bucket: 'baths',
    item_type: 'voice_memo',
    file_url: 'https://example.com/audio/bath-notes.m4a',
    transcript: 'Both bathrooms are in decent shape. The main bath has original tile from the 70s but it is clean and not cracked. Half bath downstairs just needs a new toilet seat.',
    created_at: '2024-01-15T10:52:00Z',
  },

  // Basement/Mechanical
  {
    id: 'item-8',
    walkthrough_id: 'wt-1',
    bucket: 'basement_mechanical',
    item_type: 'photo',
    file_url: 'https://example.com/photos/hvac-unit.jpg',
    notes: 'HVAC unit - manufactured 2006',
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'item-9',
    walkthrough_id: 'wt-1',
    bucket: 'basement_mechanical',
    item_type: 'photo',
    file_url: 'https://example.com/photos/foundation-crack.jpg',
    notes: 'Foundation crack in NE corner',
    created_at: '2024-01-15T11:05:00Z',
  },

  // Electrical/Plumbing
  {
    id: 'item-10',
    walkthrough_id: 'wt-1',
    bucket: 'electrical_plumbing',
    item_type: 'photo',
    file_url: 'https://example.com/photos/electrical-panel.jpg',
    notes: 'Panel with double-tapped breakers',
    created_at: '2024-01-15T11:10:00Z',
  },
  {
    id: 'item-11',
    walkthrough_id: 'wt-1',
    bucket: 'electrical_plumbing',
    item_type: 'voice_memo',
    file_url: 'https://example.com/audio/electrical-notes.m4a',
    transcript: 'The electrical panel is a 100 amp service. I see some double tapped breakers which is a code violation. Recommend having an electrician evaluate and potentially upgrade to 200 amp service.',
    created_at: '2024-01-15T11:12:00Z',
  },

  // Notes/Other
  {
    id: 'item-12',
    walkthrough_id: 'wt-1',
    bucket: 'notes_other',
    item_type: 'voice_memo',
    file_url: 'https://example.com/audio/general-notes.m4a',
    transcript: 'Overall the house has good bones. Main concerns are the roof, HVAC age, and electrical panel. Foundation crack should be monitored but does not look structural. I would budget 15 to 20 thousand for repairs to be safe.',
    created_at: '2024-01-15T11:20:00Z',
  },
];

/**
 * Complete mock walkthrough with all data
 */
export const mockWalkthrough: DealWalkthrough = {
  id: 'wt-1',
  deal_id: 'deal-1',
  status: 'organized',
  ai_summary: mockAISummary,
  items: mockWalkthroughItems,
  created_at: '2024-01-15T10:30:00Z',
  completed_at: '2024-01-15T11:30:00Z',
};

/**
 * Empty walkthrough for new deals
 */
export const emptyWalkthrough: DealWalkthrough = {
  id: 'wt-new',
  deal_id: '',
  status: 'in_progress',
  items: [],
  created_at: new Date().toISOString(),
};

/**
 * In-progress walkthrough (partially filled)
 */
export const inProgressWalkthrough: DealWalkthrough = {
  id: 'wt-2',
  deal_id: 'deal-2',
  status: 'in_progress',
  items: mockWalkthroughItems.slice(0, 4), // Only first few items
  created_at: '2024-01-16T14:00:00Z',
};

/**
 * Get items by bucket
 */
export const getItemsByBucket = (
  items: WalkthroughItem[],
  bucket: PhotoBucket
): WalkthroughItem[] => {
  return items.filter((item) => item.bucket === bucket);
};

/**
 * Get photo count by bucket
 */
export const getPhotoCountByBucket = (
  items: WalkthroughItem[],
  bucket: PhotoBucket
): number => {
  return items.filter(
    (item) => item.bucket === bucket && item.item_type === 'photo'
  ).length;
};

/**
 * Get voice memo count by bucket
 */
export const getMemoCountByBucket = (
  items: WalkthroughItem[],
  bucket: PhotoBucket
): number => {
  return items.filter(
    (item) => item.bucket === bucket && item.item_type === 'voice_memo'
  ).length;
};
