// src/features/admin/services/investor-seeder/types.ts
// Type definitions for investor seeding

export interface SeedResult {
  success: boolean;
  counts: {
    leads: number;
    properties: number;
    deals: number;
    captureItems: number;
    investorConversations: number;
    investorMessages: number;
    investorAIQueue: number;
  };
  errors?: string[];
  warnings?: string[];
}

export interface ClearResult {
  success: boolean;
  counts: {
    investorAIQueue: number;
    investorMessages: number;
    investorConversations: number;
    captureItems: number;
    deals: number;
    documents: number;
    properties: number;
    leads: number;
  };
  errors?: string[];
  warnings?: string[];
}

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
}
