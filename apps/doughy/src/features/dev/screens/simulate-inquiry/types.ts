// src/features/dev/screens/simulate-inquiry/types.ts
// Types for SimulateInquiryScreen

export type Platform = 'airbnb' | 'furnishedfinder' | 'turbotenant' | 'zillow' | 'craigslist' | 'direct';

export interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
  sampleName: string;
  sampleProfession: string;
  sampleMessage: string;
  replyMethod: 'email_reply' | 'direct_email' | 'platform_only';
}
