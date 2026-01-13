// Tests for PropertyDocsTab component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PropertyDocsTab } from '../PropertyDocsTab';
import { Property } from '../../types';

// Mock the hooks
const mockRefetch = jest.fn();
const mockDeleteDocument = jest.fn();

jest.mock('../../hooks/usePropertyDocuments', () => ({
  usePropertyDocuments: jest.fn(() => ({
    documents: [],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    documentsByCategory: new Map(),
  })),
  useDocumentMutations: jest.fn(() => ({
    pickDocument: jest.fn(),
    uploadDocument: jest.fn(),
    deleteDocument: mockDeleteDocument,
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

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock UploadDocumentSheet
jest.mock('../UploadDocumentSheet', () => ({
  UploadDocumentSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <mock-upload-sheet testID="upload-sheet" /> : null,
}));

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 'prop-123',
  address: '123 Main St',
  address_line_1: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  propertyType: 'single_family',
  property_type: 'single_family',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1500,
  sqft: 1500,
  ...overrides,
});

describe('PropertyDocsTab', () => {
  const { usePropertyDocuments } = require('../../hooks/usePropertyDocuments');

  beforeEach(() => {
    jest.clearAllMocks();
    usePropertyDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      documentsByCategory: new Map(),
    });
  });

  it('should render Documents header', () => {
    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Documents')).toBeTruthy();
  });

  it('should render Upload button', () => {
    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Upload')).toBeTruthy();
  });

  it('should show empty state when no documents', () => {
    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('No Documents')).toBeTruthy();
    expect(getByText('Upload First Document')).toBeTruthy();
  });

  it('should show supported document types in empty state', () => {
    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Supported Document Types')).toBeTruthy();
    expect(getByText('Contract')).toBeTruthy();
    expect(getByText('Inspection')).toBeTruthy();
  });

  it('should show loading state', () => {
    usePropertyDocuments.mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      documentsByCategory: new Map(),
    });

    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Loading documents...')).toBeTruthy();
  });

  it('should show error state', () => {
    usePropertyDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
      documentsByCategory: new Map(),
    });

    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Failed to load')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('should call refetch when Retry is pressed', () => {
    usePropertyDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
      documentsByCategory: new Map(),
    });

    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    fireEvent.press(getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should show document count badge when documents exist', () => {
    const mockDocuments = [
      { id: 'doc-1', title: 'Contract', type: 'contract' },
      { id: 'doc-2', title: 'Inspection', type: 'inspection' },
    ];

    usePropertyDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      documentsByCategory: new Map([
        ['contract', [mockDocuments[0]]],
        ['inspection', [mockDocuments[1]]],
      ]),
    });

    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('2')).toBeTruthy();
  });

  it('should render documents grouped by category', () => {
    const mockDocuments = [
      { id: 'doc-1', title: 'Purchase Contract', type: 'contract' },
      { id: 'doc-2', title: 'Home Inspection', type: 'inspection' },
    ];

    usePropertyDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      documentsByCategory: new Map([
        ['contract', [mockDocuments[0]]],
        ['inspection', [mockDocuments[1]]],
        ['appraisal', []],
        ['photo', []],
        ['receipt', []],
        ['other', []],
      ]),
    });

    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Contract')).toBeTruthy();
    expect(getByText('Inspection')).toBeTruthy();
  });

  it('should toggle category expansion when header is pressed', () => {
    const mockDocuments = [
      { id: 'doc-1', title: 'Contract 1', type: 'contract' },
    ];

    usePropertyDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      documentsByCategory: new Map([
        ['contract', mockDocuments],
        ['inspection', []],
        ['appraisal', []],
        ['photo', []],
        ['receipt', []],
        ['other', []],
      ]),
    });

    const { getByText, queryByText } = render(<PropertyDocsTab property={createMockProperty()} />);

    // Contract category should be expanded by default
    expect(getByText('Contract 1')).toBeTruthy();

    // Toggle collapse
    fireEvent.press(getByText('Contract'));

    // Document should be hidden after collapse
    expect(queryByText('Contract 1')).toBeNull();
  });

  it('should show upload info section', () => {
    const { getByText } = render(<PropertyDocsTab property={createMockProperty()} />);
    expect(getByText('Upload Documents')).toBeTruthy();
    expect(getByText(/Supported formats/)).toBeTruthy();
  });

  it('should open upload sheet when Upload button is pressed', async () => {
    const { getByText, getByTestId } = render(<PropertyDocsTab property={createMockProperty()} />);

    fireEvent.press(getByText('Upload'));

    await waitFor(() => {
      expect(getByTestId('upload-sheet')).toBeTruthy();
    });
  });

  it('should confirm before deleting document', () => {
    const mockDocuments = [
      { id: 'doc-1', title: 'Test Document', type: 'contract' },
    ];

    usePropertyDocuments.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      documentsByCategory: new Map([
        ['contract', mockDocuments],
        ['inspection', []],
        ['appraisal', []],
        ['photo', []],
        ['receipt', []],
        ['other', []],
      ]),
    });

    const { getByTestId } = render(<PropertyDocsTab property={createMockProperty()} />);

    // Find delete button by icon
    const deleteButton = getByTestId('icon-Trash2').parent;
    fireEvent.press(deleteButton!);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Document',
      expect.stringContaining('Test Document'),
      expect.any(Array)
    );
  });
});
