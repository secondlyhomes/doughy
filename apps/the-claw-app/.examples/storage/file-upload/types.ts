/**
 * TypeScript types and interfaces for FileUpload component
 */

export interface SelectedFile {
  name: string;
  size: number;
  uri: string;
}

export interface UploadResult {
  url: string;
  path: string;
}

export interface FileUploadProps {
  bucket: string;
  path: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  label?: string;
  description?: string;
}

export interface FileSelectorProps {
  onSelectFile: () => void;
  disabled: boolean;
  maxSizeMB?: number;
}

export interface FilePreviewProps {
  file: SelectedFile;
  uploading: boolean;
  progress: number;
  onUpload: () => void;
  onCancel: () => void;
}

export interface UploadProgressProps {
  progress: number;
}
