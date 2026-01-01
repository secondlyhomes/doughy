// src/features/real-estate/types/documents.ts
// Document-related types

export interface Document {
  id: string;
  property_id: string;
  lead_id?: string;
  title: string;
  url: string;
  type: string;
  status?: string;
  created_at?: string;
  // Additional fields needed for compatibility
  name?: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  uploadDate?: string;
  category?: string;
  updated_at?: string;
  needs_signature?: boolean;
}
