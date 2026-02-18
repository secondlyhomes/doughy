/**
 * FileUpload module exports
 */

// Main component
export { FileUpload } from './FileUpload';

// Sub-components (for advanced usage)
export { FileSelector } from './components/FileSelector';
export { FilePreview } from './components/FilePreview';
export { UploadProgress } from './components/UploadProgress';

// Hook (for custom implementations)
export { useFileUploadLogic } from './hooks/useFileUploadLogic';

// Types
export type {
  FileUploadProps,
  FileSelectorProps,
  FilePreviewProps,
  UploadProgressProps,
  SelectedFile,
  UploadResult,
} from './types';

// Utilities
export { formatFileSize } from './utils';
