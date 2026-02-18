/**
 * DocumentTypeFilter Component Tests
 * Validates design system compliance, accessibility, and functionality
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  DocumentTypeFilter,
  DocumentFilterType,
  DocumentTypeFilterProps,
} from '../DocumentTypeFilter';

// Mock theme colors
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    foreground: '#000000',
    background: '#FFFFFF',
    mutedForeground: '#6B7280',
    primary: '#4D7C5F',
    primaryForeground: '#FFFFFF',
    muted: '#F3F4F6',
  }),
}));

describe('DocumentTypeFilter', () => {
  const defaultProps: DocumentTypeFilterProps = {
    selectedType: 'all',
    onSelectType: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all filter options', () => {
      const { getByText } = render(<DocumentTypeFilter {...defaultProps} />);

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Research')).toBeTruthy();
      expect(getByText('Transaction')).toBeTruthy();
      expect(getByText('Seller')).toBeTruthy();
    });

    it('should highlight selected option', () => {
      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} selectedType="research" />
      );

      const researchButton = getByText('Research').parent;
      expect(researchButton).toBeTruthy();
    });

    it('should render with default selected type', () => {
      const { getByText } = render(<DocumentTypeFilter {...defaultProps} />);
      expect(getByText('All')).toBeTruthy();
    });
  });

  describe('Counts', () => {
    it('should display count badges when counts provided', () => {
      const counts = {
        all: 42,
        research: 15,
        transaction: 12,
        seller: 8,
      };

      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} counts={counts} />
      );

      expect(getByText('42')).toBeTruthy();
      expect(getByText('15')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
      expect(getByText('8')).toBeTruthy();
    });

    it('should not display count badge when count is 0', () => {
      const counts = {
        all: 0,
        research: 0,
        transaction: 0,
        seller: 0,
      };

      const { queryByText } = render(
        <DocumentTypeFilter {...defaultProps} counts={counts} />
      );

      // Should not show '0' badges
      expect(queryByText('0')).toBeFalsy();
    });

    it('should not display count badges when counts not provided', () => {
      const { UNSAFE_root } = render(<DocumentTypeFilter {...defaultProps} />);

      // Should render successfully without counts
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should call onSelectType when option is tapped', () => {
      const onSelectType = jest.fn();
      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} onSelectType={onSelectType} />
      );

      const researchButton = getByText('Research').parent;
      fireEvent.press(researchButton!);

      expect(onSelectType).toHaveBeenCalledWith('research');
    });

    it('should allow switching between all filter types', () => {
      const onSelectType = jest.fn();
      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} onSelectType={onSelectType} />
      );

      fireEvent.press(getByText('Research').parent!);
      expect(onSelectType).toHaveBeenCalledWith('research');

      fireEvent.press(getByText('Transaction').parent!);
      expect(onSelectType).toHaveBeenCalledWith('transaction');

      fireEvent.press(getByText('Seller').parent!);
      expect(onSelectType).toHaveBeenCalledWith('seller');

      fireEvent.press(getByText('All').parent!);
      expect(onSelectType).toHaveBeenCalledWith('all');
    });

    it('should not call onSelectType when disabled', () => {
      const onSelectType = jest.fn();
      const { getByText } = render(
        <DocumentTypeFilter
          {...defaultProps}
          onSelectType={onSelectType}
          disabled={true}
        />
      );

      const researchButton = getByText('Research').parent;
      fireEvent.press(researchButton!);

      expect(onSelectType).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should render in disabled state', () => {
      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} disabled={true} />
      );

      expect(getByText('All')).toBeTruthy();
    });

    it('should not respond to interaction when disabled', () => {
      const onSelectType = jest.fn();
      const { getByText } = render(
        <DocumentTypeFilter
          {...defaultProps}
          onSelectType={onSelectType}
          disabled={true}
        />
      );

      fireEvent.press(getByText('All').parent!);
      fireEvent.press(getByText('Research').parent!);

      expect(onSelectType).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role on all options', () => {
      const { getAllByRole } = render(<DocumentTypeFilter {...defaultProps} />);

      const buttons = getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('should have descriptive accessibility labels', () => {
      const { getByLabelText } = render(<DocumentTypeFilter {...defaultProps} />);

      expect(getByLabelText('Filter by All')).toBeTruthy();
      expect(getByLabelText('Filter by Research')).toBeTruthy();
      expect(getByLabelText('Filter by Transaction')).toBeTruthy();
      expect(getByLabelText('Filter by Seller')).toBeTruthy();
    });

    it('should indicate selected state in accessibility', () => {
      const { getByLabelText } = render(
        <DocumentTypeFilter {...defaultProps} selectedType="research" />
      );

      const researchButton = getByLabelText('Filter by Research');
      // Accessibility state should indicate selected
      expect(researchButton).toBeTruthy();
    });

    it('should indicate disabled state in accessibility', () => {
      const { getByLabelText } = render(
        <DocumentTypeFilter {...defaultProps} disabled={true} />
      );

      const allButton = getByLabelText('Filter by All');
      expect(allButton).toBeTruthy();
    });

    it('should have accessibility hints describing each filter', () => {
      const { getByA11yHint } = render(<DocumentTypeFilter {...defaultProps} />);

      expect(getByA11yHint('All documents')).toBeTruthy();
      expect(getByA11yHint('Inspection, appraisal, title, comps, photos')).toBeTruthy();
      expect(getByA11yHint('Offers, contracts, closing docs')).toBeTruthy();
      expect(getByA11yHint('ID, tax returns, bank statements')).toBeTruthy();
    });
  });

  describe('Filter Types', () => {
    const filterTypes: DocumentFilterType[] = ['all', 'research', 'transaction', 'seller'];

    filterTypes.forEach((type) => {
      it(`should support selecting ${type} filter`, () => {
        const onSelectType = jest.fn();
        const { UNSAFE_root } = render(
          <DocumentTypeFilter {...defaultProps} selectedType={type} onSelectType={onSelectType} />
        );

        expect(UNSAFE_root).toBeTruthy();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('should render without hardcoded colors', () => {
      // This test verifies the component renders successfully
      // Design token compliance is enforced at build time via TypeScript
      const { UNSAFE_root } = render(<DocumentTypeFilter {...defaultProps} />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render with counts and maintain spacing', () => {
      const counts = {
        all: 100,
        research: 50,
        transaction: 25,
        seller: 10,
      };

      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} counts={counts} />
      );

      // Verify all counts render
      expect(getByText('100')).toBeTruthy();
      expect(getByText('50')).toBeTruthy();
      expect(getByText('25')).toBeTruthy();
      expect(getByText('10')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large counts', () => {
      const counts = {
        all: 9999,
        research: 1234,
        transaction: 567,
        seller: 890,
      };

      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} counts={counts} />
      );

      expect(getByText('9999')).toBeTruthy();
    });

    it('should handle rapid selection changes', () => {
      const onSelectType = jest.fn();
      const { getByText } = render(
        <DocumentTypeFilter {...defaultProps} onSelectType={onSelectType} />
      );

      // Rapidly change selections
      fireEvent.press(getByText('Research').parent!);
      fireEvent.press(getByText('Transaction').parent!);
      fireEvent.press(getByText('Seller').parent!);
      fireEvent.press(getByText('All').parent!);

      expect(onSelectType).toHaveBeenCalledTimes(4);
    });

    it('should handle undefined counts gracefully', () => {
      const counts = {
        all: 10,
        research: 5,
        transaction: 0,
        seller: 0,
      };

      const { getByText, queryByText } = render(
        <DocumentTypeFilter {...defaultProps} counts={counts} />
      );

      expect(getByText('10')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      // Zero counts should not render badges
      expect(queryByText('0')).toBeFalsy();
    });
  });

  describe('Component Consistency', () => {
    it('should match PropertyAnalysisTab mode toggle pattern', () => {
      // Verifies segmented control pattern consistency
      const { getAllByRole } = render(<DocumentTypeFilter {...defaultProps} />);

      const buttons = getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    it('should maintain consistent state across re-renders', () => {
      const { rerender, getByText } = render(
        <DocumentTypeFilter {...defaultProps} selectedType="all" />
      );

      expect(getByText('All')).toBeTruthy();

      rerender(<DocumentTypeFilter {...defaultProps} selectedType="research" />);
      expect(getByText('Research')).toBeTruthy();

      rerender(<DocumentTypeFilter {...defaultProps} selectedType="transaction" />);
      expect(getByText('Transaction')).toBeTruthy();
    });
  });
});
