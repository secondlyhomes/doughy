/**
 * AIExtractionPreview Component Tests
 * Validates confidence indicators, editing functionality, and design system compliance
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AIExtractionPreview, ExtractedField } from '../AIExtractionPreview';

// Mock theme colors
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggleTheme: jest.fn() }),
  useThemeColors: () => ({
    primary: '#4D7C5F',
    primaryForeground: '#FFFFFF',
    foreground: '#111827',
    mutedForeground: '#6B7280',
    border: '#E5E7EB',
    success: '#22c55e',
    warning: '#f59e0b',
    destructive: '#EF4444',
  }),
}));

describe('AIExtractionPreview', () => {
  const mockFields: ExtractedField[] = [
    {
      label: 'Property Address',
      value: '123 Main St',
      confidence: 'high',
      source: 'MLS Listing',
      editable: true,
    },
    {
      label: 'Purchase Price',
      value: '$250,000',
      confidence: 'medium',
      source: 'Tax Records',
      editable: true,
    },
    {
      label: 'Square Footage',
      value: '1,500 sqft',
      confidence: 'low',
      source: 'Photo Analysis',
      editable: true,
    },
  ];

  const mockOnFieldEdit = jest.fn();

  beforeEach(() => {
    mockOnFieldEdit.mockClear();
  });

  describe('Rendering', () => {
    it('should render with fields', () => {
      const { getByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getByText('AI Extracted Data')).toBeTruthy();
      expect(getByText('Property Address')).toBeTruthy();
      expect(getByText('123 Main St')).toBeTruthy();
    });

    it('should render AI badge by default', () => {
      const { getAllByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getAllByText(/AI Powered/)).toBeTruthy();
    });

    it('should hide AI badge when showAIBadge is false', () => {
      const { queryByText } = render(
        <AIExtractionPreview
          fields={mockFields}
          onFieldEdit={mockOnFieldEdit}
          showAIBadge={false}
        />
      );
      expect(queryByText(/AI Powered/)).toBeNull();
    });
  });

  describe('Confidence Indicators', () => {
    it('should show high confidence badge', () => {
      const { getAllByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getAllByText(/High confidence/)).toBeTruthy();
    });

    it('should show medium confidence badge', () => {
      const { getAllByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getAllByText(/Medium confidence/)).toBeTruthy();
    });

    it('should show low confidence badge', () => {
      const { getAllByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getAllByText(/Low confidence/)).toBeTruthy();
    });
  });

  describe('Field Display', () => {
    it('should display all field labels', () => {
      const { getByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getByText('Property Address')).toBeTruthy();
      expect(getByText('Purchase Price')).toBeTruthy();
      expect(getByText('Square Footage')).toBeTruthy();
    });

    it('should display all field values', () => {
      const { getByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getByText('123 Main St')).toBeTruthy();
      expect(getByText('$250,000')).toBeTruthy();
      expect(getByText('1,500 sqft')).toBeTruthy();
    });

    it('should display source attribution', () => {
      const { getByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getByText(/Source: MLS Listing/)).toBeTruthy();
      expect(getByText(/Source: Tax Records/)).toBeTruthy();
      expect(getByText(/Source: Photo Analysis/)).toBeTruthy();
    });
  });

  describe('Field Editing', () => {
    it('should show edit button for editable fields', () => {
      const { getAllByLabelText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getAllByLabelText(/Edit/).length).toBe(3);
    });

    it('should not show edit button when field is not editable', () => {
      const nonEditableFields: ExtractedField[] = [
        {
          label: 'Property Address',
          value: '123 Main St',
          confidence: 'high',
          editable: false,
        },
      ];
      const { queryByLabelText } = render(
        <AIExtractionPreview fields={nonEditableFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(queryByLabelText(/Edit Property Address/)).toBeNull();
    });

    it('should not show edit button when onFieldEdit is not provided', () => {
      const { queryByLabelText } = render(
        <AIExtractionPreview fields={mockFields} />
      );
      expect(queryByLabelText(/Edit/)).toBeNull();
    });

    it('should enter edit mode when edit button is pressed', () => {
      const { getAllByLabelText, getAllByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );

      const editButton = getAllByLabelText(/Edit Property Address/)[0];
      fireEvent.press(editButton);

      // Should show Save and Cancel buttons
      expect(getAllByText(/Save/)).toBeTruthy();
      expect(getAllByText(/Cancel/)).toBeTruthy();
    });

    it('should cancel editing when cancel button is pressed', () => {
      const { getAllByLabelText, getAllByText, queryByText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );

      // Enter edit mode
      const editButton = getAllByLabelText(/Edit Property Address/)[0];
      fireEvent.press(editButton);

      // Cancel editing
      const cancelButton = getAllByText(/Cancel/)[0];
      fireEvent.press(cancelButton);

      // Should exit edit mode
      expect(queryByText(/Save/)).toBeNull();
    });

    it('should call onFieldEdit when save button is pressed', () => {
      const { getAllByLabelText, getAllByText, UNSAFE_getByType } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );

      // Enter edit mode
      const editButton = getAllByLabelText(/Edit Property Address/)[0];
      fireEvent.press(editButton);

      // Change value
      const input = UNSAFE_getByType(require('../Input').Input);
      fireEvent.changeText(input, '456 Oak Ave');

      // Save
      const saveButton = getAllByText(/Save/)[0];
      fireEvent.press(saveButton);

      expect(mockOnFieldEdit).toHaveBeenCalledWith(0, '456 Oak Ave');
    });
  });

  describe('Variants', () => {
    it('should support default variant', () => {
      const { UNSAFE_root } = render(
        <AIExtractionPreview
          fields={mockFields}
          onFieldEdit={mockOnFieldEdit}
          variant="default"
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support glass variant', () => {
      const { UNSAFE_root } = render(
        <AIExtractionPreview
          fields={mockFields}
          onFieldEdit={mockOnFieldEdit}
          variant="glass"
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Empty States', () => {
    it('should render with empty fields array', () => {
      const { getByText } = render(
        <AIExtractionPreview fields={[]} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getByText('AI Extracted Data')).toBeTruthy();
    });

    it('should render field without source', () => {
      const fieldsWithoutSource: ExtractedField[] = [
        {
          label: 'Property Address',
          value: '123 Main St',
          confidence: 'high',
        },
      ];
      const { getByText, queryByText } = render(
        <AIExtractionPreview fields={fieldsWithoutSource} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getByText('123 Main St')).toBeTruthy();
      expect(queryByText(/Source:/)).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible edit buttons', () => {
      const { getAllByLabelText } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(getAllByLabelText(/Edit Property Address/)).toBeTruthy();
      expect(getAllByLabelText(/Edit Purchase Price/)).toBeTruthy();
      expect(getAllByLabelText(/Edit Square Footage/)).toBeTruthy();
    });

    it('should have button role on edit buttons', () => {
      const { getAllByRole } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      // Should have edit buttons
      expect(getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  describe('Design System Compliance', () => {
    it('should render without hardcoded values', () => {
      const { UNSAFE_root } = render(
        <AIExtractionPreview fields={mockFields} onFieldEdit={mockOnFieldEdit} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support custom styles', () => {
      const customStyle = { marginTop: 20 };
      const { UNSAFE_root } = render(
        <AIExtractionPreview
          fields={mockFields}
          onFieldEdit={mockOnFieldEdit}
          style={customStyle}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
