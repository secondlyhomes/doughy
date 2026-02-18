// src/features/real-estate/types/documents.ts
// Document-related types

export interface Document {
  id: string;
  property_id?: string | null;
  lead_id?: string | null;
  // Made nullable to match database types
  title?: string | null;
  url?: string | null;
  type?: string | null;
  status?: string | null;
  created_at?: string | null;
  // Additional fields needed for compatibility
  name?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  uploadDate?: string | null;
  category?: string | null;
  updated_at?: string | null;
  needs_signature?: boolean | null;
}
