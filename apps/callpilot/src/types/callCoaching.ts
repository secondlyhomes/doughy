export type SuggestionCategory =
  | 'opener'
  | 'objection_response'
  | 'closing'
  | 'discovery'
  | 'value_prop'

export interface TalkingPointSuggestion {
  id: string
  text: string
  category: SuggestionCategory
  priority: 'high' | 'medium' | 'low'
  used: boolean
}

export interface CallCoaching {
  contactId: string
  suggestedApproach: string
  watchOutFor: string[]
  keyFacts: string[]
  objections: string[]
  suggestions: TalkingPointSuggestion[]
  relationshipStrength?: 'new' | 'building' | 'established' | 'strong'
}
