// src/features/auth/services/onboardingService.ts
// Onboarding survey service

import { supabase } from '@/lib/supabase';

export interface OnboardingResponse {
  platformSelection?: string;
  referralSource?: string;
  primaryUseCase?: string;
  experienceLevel?: string;
  companySize?: string;
}

export interface OnboardingResult {
  success: boolean;
  error?: string;
}

// Survey question definitions
export const SURVEY_QUESTIONS = {
  platformSelection: {
    question: 'What best describes you?',
    options: [
      { value: 'investor', label: 'RE Investor (Wholesaling, Flipping, Buy & Hold)' },
      { value: 'landlord', label: 'Landlord (Managing Rentals & Guests)' },
      { value: 'both', label: 'Both - I invest AND manage rentals' },
    ],
  },
  referralSource: {
    question: 'How did you hear about us?',
    options: [
      { value: 'search', label: 'Search Engine (Google, Bing, etc.)' },
      { value: 'social', label: 'Social Media' },
      { value: 'friend', label: 'Friend or Colleague' },
      { value: 'podcast', label: 'Podcast' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'conference', label: 'Conference/Event' },
      { value: 'other', label: 'Other' },
    ],
  },
  primaryUseCase: {
    question: "What's your primary use case?",
    options: [
      { value: 'wholesaling', label: 'Wholesaling' },
      { value: 'flipping', label: 'Fix & Flip' },
      { value: 'rental', label: 'Buy & Hold Rentals' },
      { value: 'multifamily', label: 'Multifamily Investing' },
      { value: 'commercial', label: 'Commercial Real Estate' },
      { value: 'agent', label: "I'm a Real Estate Agent" },
      { value: 'other', label: 'Other' },
    ],
  },
  experienceLevel: {
    question: "What's your real estate experience level?",
    options: [
      { value: 'beginner', label: 'Just Getting Started (0 deals)' },
      { value: 'intermediate', label: 'Growing (1-10 deals)' },
      { value: 'experienced', label: 'Experienced (11-50 deals)' },
      { value: 'expert', label: 'Expert (50+ deals)' },
    ],
  },
  companySize: {
    question: 'How large is your team?',
    optional: true,
    options: [
      { value: 'solo', label: 'Just Me' },
      { value: 'small', label: '2-5 People' },
      { value: 'medium', label: '6-20 People' },
      { value: 'large', label: '20+ People' },
    ],
  },
} as const;

export type SurveyStep = keyof typeof SURVEY_QUESTIONS;

/**
 * Save onboarding survey responses
 */
export async function saveOnboardingResponses(
  responses: OnboardingResponse
): Promise<OnboardingResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Save responses to profiles table
    // Using type assertion for fields that may not be in generated types yet
    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_responses: responses,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', user.id);

    if (error) {
      console.error('[onboarding] Error saving responses:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[onboarding] Exception saving responses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save responses',
    };
  }
}

/**
 * Skip onboarding (mark as complete without responses)
 */
export async function skipOnboarding(): Promise<OnboardingResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Using type assertion for fields that may not be in generated types yet
    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_complete: true,
        onboarding_skipped: true,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', user.id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip onboarding',
    };
  }
}

/**
 * Result of checking onboarding status
 */
export interface OnboardingStatusResult {
  complete: boolean;
  error?: string;
}

/**
 * Check if user has completed onboarding
 * Returns an object with completion status and any error that occurred
 */
export async function checkOnboardingStatus(): Promise<OnboardingStatusResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { complete: false, error: 'Not authenticated' };
    }

    // Using type assertion for fields that may not be in generated types yet
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();

    if (error) {
      return { complete: false, error: error.message };
    }

    if (!data) {
      return { complete: false, error: 'Profile not found' };
    }

    return { complete: (data as Record<string, unknown>).onboarding_complete === true };
  } catch (error) {
    return {
      complete: false,
      error: error instanceof Error ? error.message : 'Failed to check onboarding status',
    };
  }
}
