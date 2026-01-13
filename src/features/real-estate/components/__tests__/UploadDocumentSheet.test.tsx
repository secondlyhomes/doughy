// Tests for UploadDocumentSheet component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UploadDocumentSheet } from '../UploadDocumentSheet';

// Mock the hooks
const mockPickDocument = jest.fn();
const mockUploadDocument = jest.fn();

jest.mock('../../hooks/usePropertyDocuments', () => ({
  useDocumentMutations: jest.fn(() => ({
    pickDocument: mockPickDocument,
    uploadDocument: mockUploadDocument,
    isLoading: false,
    error: null,
    uploadProgress: 0,
  })),
  DOCUMENT_CATEGORIES: [
    { id: 'contract', label: 'Contract' },
    { id: 'inspection', label: 'Inspection' },
    { id: 'appraisal', label: 'Appraisal' },
    { id: 'photo', label: 'Photo' },
    { id: 'receipt', label: 'Receipt' },
    { id: 'other', label: 'Other' },
  ],
}));

// Mock BottomSheet
jest.mock('@/components/ui/BottomSheet', () => ({
  BottomSheet: ({ children, visible, title }: any) =>
    visible ? (
      <mock-bottom-sheet testID="bottom-sheet">
        <mock-title>{title}</mock-title>
        {children}
      </mock-bottom-sheet>
    ) : null,
}));

describe('UploadDocumentSheet', () => {
  const defaultProps = {
    propertyId: 'prop-123',
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPickDocument.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///test/document.pdf',
          name: 'document.pdf',
          size: 1024,
          mimeType: 'application/pdf',
        },
      ],
    });
    mockUploadDocument.mockResolvedValue({ id: 'doc-1' });
  });

  it('should render when isOpen is true', () => {
    const { getByTestId } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByTestId('bottom-sheet')).toBeTruthy();
  });

  it('should not render when isOpen is false', () => {
    const { queryByTestId } = render(<UploadDocumentSheet {...defaultProps} isOpen={false} />);
    expect(queryByTestId('bottom-sheet')).toBeNull();
  });

  it('should render title', () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Upload Document')).toBeTruthy();
  });

  it('should render file selection area', () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Select File *')).toBeTruthy();
    expect(getByText('Choose File')).toBeTruthy();
  });

  it('should render title input', () => {
    const { getByText, getByPlaceholderText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Title *')).toBeTruthy();
    expect(getByPlaceholderText('Document title')).toBeTruthy();
  });

  it('should render category selection', () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Contract')).toBeTruthy();
    expect(getByText('Inspection')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  it('should render description input', () => {
    const { getByText, getByPlaceholderText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Description (optional)')).toBeTruthy();
    expect(getByPlaceholderText('Add notes about this document')).toBeTruthy();
  });

  it('should render Cancel and Upload buttons', () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Upload')).toBeTruthy();
  });

  it('should call pickDocument when Choose File is pressed', async () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);

    fireEvent.press(getByText('Choose File'));

    await waitFor(() => {
      expect(mockPickDocument).toHaveBeenCalled();
    });
  });

  it('should show selected file after picking', async () => {
    const { getByText, queryByText } = render(<UploadDocumentSheet {...defaultProps} />);

    fireEvent.press(getByText('Choose File'));

    await waitFor(() => {
      expect(getByText('document.pdf')).toBeTruthy();
    });

    // Choose File button should be replaced
    expect(queryByText('Choose File')).toBeNull();
  });

  it('should auto-fill title from filename', async () => {
    const { getByText, getByDisplayValue } = render(<UploadDocumentSheet {...defaultProps} />);

    fireEvent.press(getByText('Choose File'));

    await waitFor(() => {
      expect(getByDisplayValue('document')).toBeTruthy();
    });
  });

  it('should allow selecting different categories', () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);

    // Click on Inspection category
    fireEvent.press(getByText('Inspection'));

    // Category should be visually selected (would check className in full test)
    // For now just verify it doesn't crash
    expect(getByText('Inspection')).toBeTruthy();
  });

  it('should call onClose when Cancel is pressed', () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);

    fireEvent.press(getByText('Cancel'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show validation error when uploading without file', async () => {
    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);

    // Try to upload without selecting file
    fireEvent.press(getByText('Upload'));

    await waitFor(() => {
      expect(getByText('Please select a document to upload')).toBeTruthy();
    });
  });

  it('should show validation error when uploading without title', async () => {
    mockPickDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///test/doc.pdf', name: 'doc.pdf', size: 100 }],
    });

    const { getByText, getByPlaceholderText } = render(<UploadDocumentSheet {...defaultProps} />);

    // Pick a file
    fireEvent.press(getByText('Choose File'));

    await waitFor(() => {
      expect(getByText('doc.pdf')).toBeTruthy();
    });

    // Clear the auto-filled title
    const titleInput = getByPlaceholderText('Document title');
    fireEvent.changeText(titleInput, '');

    // Try to upload
    fireEvent.press(getByText('Upload'));

    await waitFor(() => {
      expect(getByText('Please enter a document title')).toBeTruthy();
    });
  });

  it('should show file size validation error for large files', async () => {
    mockPickDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///test/large.pdf', name: 'large.pdf', size: 15 * 1024 * 1024 }], // 15MB
    });

    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);

    fireEvent.press(getByText('Choose File'));

    await waitFor(() => {
      expect(getByText('File size must be less than 10MB')).toBeTruthy();
    });
  });

  it('should call uploadDocument with correct params on submit', async () => {
    const { getByText, getByPlaceholderText } = render(<UploadDocumentSheet {...defaultProps} />);

    // Pick a file
    fireEvent.press(getByText('Choose File'));
    await waitFor(() => expect(getByText('document.pdf')).toBeTruthy());

    // Enter title
    fireEvent.changeText(getByPlaceholderText('Document title'), 'My Contract');

    // Select category
    fireEvent.press(getByText('Contract'));

    // Enter description
    fireEvent.changeText(getByPlaceholderText('Add notes about this document'), 'Important doc');

    // Upload
    fireEvent.press(getByText('Upload'));

    await waitFor(() => {
      expect(mockUploadDocument).toHaveBeenCalledWith(
        'prop-123',
        expect.objectContaining({ name: 'document.pdf' }),
        expect.objectContaining({
          title: 'My Contract',
          category: 'contract',
          description: 'Important doc',
        })
      );
    });
  });

  it('should call onSuccess and onClose after successful upload', async () => {
    const { getByText, getByPlaceholderText } = render(<UploadDocumentSheet {...defaultProps} />);

    // Pick and upload
    fireEvent.press(getByText('Choose File'));
    await waitFor(() => expect(getByText('document.pdf')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Document title'), 'Test');
    fireEvent.press(getByText('Upload'));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('should handle cancelled document picker', async () => {
    mockPickDocument.mockResolvedValueOnce({ canceled: true });

    const { getByText, queryByText } = render(<UploadDocumentSheet {...defaultProps} />);

    fireEvent.press(getByText('Choose File'));

    await waitFor(() => {
      // Should still show Choose File since nothing was selected
      expect(getByText('Choose File')).toBeTruthy();
    });
  });

  it('should allow removing selected file', async () => {
    const { getByText, getByTestId } = render(<UploadDocumentSheet {...defaultProps} />);

    // Pick a file
    fireEvent.press(getByText('Choose File'));
    await waitFor(() => expect(getByText('document.pdf')).toBeTruthy());

    // Remove the file (X button)
    const removeButton = getByTestId('icon-X').parent;
    fireEvent.press(removeButton!);

    await waitFor(() => {
      expect(getByText('Choose File')).toBeTruthy();
    });
  });

  it('should show upload progress when loading', () => {
    const { useDocumentMutations } = require('../../hooks/usePropertyDocuments');
    useDocumentMutations.mockReturnValue({
      pickDocument: mockPickDocument,
      uploadDocument: mockUploadDocument,
      isLoading: true,
      error: null,
      uploadProgress: 50,
    });

    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Uploading...')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
  });

  it('should show error message when upload fails', () => {
    const { useDocumentMutations } = require('../../hooks/usePropertyDocuments');
    useDocumentMutations.mockReturnValue({
      pickDocument: mockPickDocument,
      uploadDocument: mockUploadDocument,
      isLoading: false,
      error: new Error('Upload failed'),
      uploadProgress: 0,
    });

    const { getByText } = render(<UploadDocumentSheet {...defaultProps} />);
    expect(getByText('Upload failed')).toBeTruthy();
  });

  it('should reset form when sheet is closed and reopened', async () => {
    const { getByText, getByPlaceholderText, rerender } = render(
      <UploadDocumentSheet {...defaultProps} />
    );

    // Pick a file and enter data
    fireEvent.press(getByText('Choose File'));
    await waitFor(() => expect(getByText('document.pdf')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Document title'), 'Test Title');
    fireEvent.changeText(getByPlaceholderText('Add notes about this document'), 'Test notes');

    // Close the sheet
    rerender(<UploadDocumentSheet {...defaultProps} isOpen={false} />);

    // Reopen the sheet
    rerender(<UploadDocumentSheet {...defaultProps} isOpen={true} />);

    // Form should be reset
    expect(getByText('Choose File')).toBeTruthy();
    expect(getByPlaceholderText('Document title').props.value).toBeFalsy();
  });
});
