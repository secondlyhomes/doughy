/**
 * CRM Extraction Types
 *
 * Data extracted from call transcripts by The Claw.
 * Maps to claw.transcript_extractions table.
 * Each extraction is a field that can be approved/rejected by the user.
 */

export type ExtractionConfidence = 'high' | 'medium' | 'low';
export type ExtractionAction = 'fill_empty' | 'overwrite' | 'skip';
export type ExtractionStatus = 'pending_review' | 'partially_approved' | 'approved' | 'rejected';

export interface ExtractionField {
  field: string;
  value: string | number | boolean | null;
  confidence: ExtractionConfidence;
  sourceQuote: string;
  targetTable: string;
  targetColumn: string;
  targetPath: string | null;
  currentValue: string | number | boolean | null;
  action: ExtractionAction;
}

export interface TranscriptExtraction {
  id: string;
  userId: string;
  callId: string;
  leadId: string | null;
  propertyId: string | null;
  dealId: string | null;
  extractions: ExtractionField[];
  status: ExtractionStatus;
  createdAt: string;
}

/** Grouped extractions for display in approval UI */
export interface ExtractionGroup {
  label: string;
  icon: string;
  entityId: string | null;
  fields: ExtractionField[];
}
