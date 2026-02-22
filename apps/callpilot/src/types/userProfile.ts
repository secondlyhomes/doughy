export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  sellingStyle: string;
  strengths: string[];
  commonObjections: string[];
  industry: string;
  onboardingCompleted: boolean;
  plan: 'free' | 'pro' | 'annual';
  callsThisMonth: number;
  callLimit: number;
  businessPhoneNumber: string | null;
  aiProfileId: string | null;
}
