export interface CommunicationStyleProfile {
  id: string;
  userId: string;
  confidenceScore: number;
  communicationsAnalyzed: number;
  toneProfile: {
    formality: number;
    warmth: number;
    directness: number;
    primaryTone: string;
    samplePhrases: string[];
  };
  patterns: {
    averageResponseTime: number;
    preferredCallLength: number;
    peakProductivityHours: string[];
    followUpFrequency: number;
    objectionHandlingStyle: string;
    closingApproach: string;
  };
  strengths: string[];
  growthAreas: string[];
  questionnaire: QuestionnaireAnswers | null;
}

export interface QuestionnaireAnswers {
  yearsExperience: string;
  sellingStyle: string;
  biggestChallenge: string;
  idealCustomer: string;
  competitiveAdvantage: string;
}

export interface AIProfileSettings {
  passiveLearningEnabled: boolean;
  analyzeCallTranscripts: boolean;
  analyzeTextMessages: boolean;
  analyzeEmails: boolean;
  retainAnalysisMonths: number;
}
