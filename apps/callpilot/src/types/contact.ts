import type { CommunicationChannel } from './communication';

export type ContactSource = 'referral' | 'cold' | 'inbound' | 'renewal' | 'inbound_sms';
export type ContactStatus = 'prospect' | 'quoted' | 'negotiating' | 'won' | 'lost' | 'pending_review';
export type OptStatus = 'opted_in' | 'opted_out' | 'pending';
export type ContactTemperature = 'hot' | 'warm' | 'cold';
export type ContactModule = 'investor' | 'landlord';

export type InvestorContactType =
  | 'motivated_seller'
  | 'wholesaler'
  | 'agent'
  | 'lender'
  | 'buyer'
  | 'lead';

export type LandlordContactType =
  | 'tenant'
  | 'guest'
  | 'contractor'
  | 'vendor'
  | 'applicant';

export type ContactType = InvestorContactType | LandlordContactType;

export interface LeaseInfo {
  propertyAddress: string;
  unitNumber: string | null;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
}

export interface ContractorInfo {
  specialty: string;
  totalJobs: number;
  avgJobCost: number;
  avgResponseTime: string | null;
}

export interface ContactCommunicationStats {
  totalCalls: number;
  totalTexts: number;
  totalEmails: number;
  lastCommunicationDate: string | null;
  lastCommunicationChannel: CommunicationChannel | null;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  source: ContactSource;
  policyType: string;
  estimatedPremium: number;
  lastContactDate: string;
  nextFollowUp: string;
  callCount: number;
  status: ContactStatus;
  notes: string;
  keyFacts: string[];
  objections: string[];
  optStatus: OptStatus | null;
  tags: string[] | null;
  communicationStats: ContactCommunicationStats | null;
  preferredChannel: CommunicationChannel | null;
  score: number | null;
  temperature: ContactTemperature;
  address: string;
  module: ContactModule;
  contactType: ContactType | null;
  leaseInfo: LeaseInfo | null;
  contractorInfo: ContractorInfo | null;
}

export const MODULE_LABELS: Record<ContactModule, string> = {
  investor: 'Investor',
  landlord: 'Landlord',
};

export const MODULE_ICONS: Record<ContactModule, string> = {
  investor: '\uD83D\uDCB0',
  landlord: '\uD83C\uDFE0',
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  motivated_seller: 'Motivated Seller',
  wholesaler: 'Wholesaler',
  agent: 'Agent',
  lender: 'Lender',
  buyer: 'Buyer',
  lead: 'Lead',
  tenant: 'Tenant',
  guest: 'Guest',
  contractor: 'Contractor',
  vendor: 'Vendor',
  applicant: 'Applicant',
};
