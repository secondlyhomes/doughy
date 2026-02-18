export interface BriefSection {
  title: string;
  items: string[];
}

export interface PreCallBrief {
  id: string;
  contactId: string;
  contactName: string;
  generatedAt: string;
  lastConversation: BriefSection;
  keyFacts: string[];
  suggestedApproach: string;
  watchOutFor: string[];
  relationshipStrength: 'new' | 'building' | 'established' | 'strong';
}
