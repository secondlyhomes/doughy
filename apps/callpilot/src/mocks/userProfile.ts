/**
 * Mock User Profile
 *
 * Provides a realistic user profile for Dino Garcia, a Senior Insurance Agent
 * at Secondly Homes Insurance, used for development and testing.
 */

import type { UserProfile } from '@/types';

export const mockUserProfile: UserProfile = {
  id: 'user-1',
  firstName: 'Dino',
  lastName: 'Garcia',
  company: 'Secondly Homes Insurance',
  role: 'Senior Insurance Agent',
  sellingStyle:
    'Consultative - focuses on building trust and understanding client needs before presenting solutions',
  strengths: [
    'Building rapport with business owners',
    'Explaining complex coverage in simple terms',
    'Identifying cross-sell opportunities',
  ],
  commonObjections: [
    'Price too high compared to current carrier',
    'Happy with existing coverage',
    'Need to discuss with business partner',
  ],
  industry: 'Insurance',
  onboardingCompleted: true,
  plan: 'pro',
  callsThisMonth: 47,
  callLimit: 200,
  businessPhoneNumber: '(415) 555-0100',
  aiProfileId: 'ai-profile-1',
};
