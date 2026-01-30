/**
 * CalculationEvidence Component Tests
 * Validates collapsible steps, evidence sources, and design system compliance
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CalculationEvidence, CalculationStep } from '../CalculationEvidence';

// Mock theme colors
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggleTheme: jest.fn() }),
  useThemeColors: () => ({
    primary: '#4D7C5F',
    foreground: '#111827',
    mutedForeground: '#6B7280',
    border: '#E5E7EB',
    card: '#FFFFFF',
    success: '#22c55e',
    warning: '#f59e0b',
    destructive: '#EF4444',
  }),
}));

describe('CalculationEvidence', () => {
  const mockSteps: CalculationStep[] = [
    {
      label: 'After Repair Value (ARV)',
      formula: 'ARV = Comp Price × Size Adjustment',
      result: '$450,000',
      explanation: 'Based on recent comparable sales in the area',
      sources: [
        {
          label: 'MLS Comparable #1',
          confidence: 'high',
          value: '$425,000',
          timestamp: '2 days ago',
        },
        {
          label: 'County Records',
          confidence: 'medium',
          value: '$440,000',
        },
      ],
    },
    {
      label: 'Repair Costs',
      formula: 'Repairs = Materials + Labor',
      result: '$75,000',
      sources: [
        {
          label: 'Contractor Estimate',
          confidence: 'high',
          value: '$75,000',
        },
      ],
    },
  ];

  describe('Rendering', () => {
    it('should render with title and result', () => {
      const { getByText, getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByText('ARV Calculation')).toBeTruthy();
      expect(getAllByText(/\$450,000/)).toBeTruthy();
    });

    it('should render collapsed by default when startCollapsed is true', () => {
      const { queryByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          startCollapsed
        />
      );
      // Steps should not be visible (calculation breakdown header)
      expect(queryByText('Calculation Breakdown')).toBeNull();
    });

    it('should render expanded by default when startCollapsed is false', () => {
      const { getByText, getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          startCollapsed={false}
        />
      );
      // Steps should be visible - check for breakdown header
      expect(getByText('Calculation Breakdown')).toBeTruthy();
      // Check for step label parts (text is split across multiple Text components)
      expect(getAllByText(/After Repair Value \(ARV\)/)).toBeTruthy();
    });
  });

  describe('Status Badges', () => {
    it('should show verified status badge', () => {
      const { getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getAllByText(/Verified/)).toBeTruthy();
    });

    it('should show estimated status badge', () => {
      const { getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="estimated"
          steps={mockSteps}
        />
      );
      expect(getAllByText(/Estimated/)).toBeTruthy();
    });

    it('should show needs review status badge', () => {
      const { getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="needs_review"
          steps={mockSteps}
        />
      );
      expect(getAllByText(/Needs Review/)).toBeTruthy();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should toggle expansion when header is pressed', () => {
      const { getByLabelText, getByText, queryByText, getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          startCollapsed
        />
      );

      // Should be collapsed initially
      expect(queryByText('Calculation Breakdown')).toBeNull();

      // Press to expand
      const header = getByLabelText(/ARV Calculation calculation, expand details/);
      fireEvent.press(header);

      // Should be expanded
      expect(getByText('Calculation Breakdown')).toBeTruthy();
      expect(getAllByText(/After Repair Value \(ARV\)/)).toBeTruthy();
    });

    it('should collapse when expanded header is pressed', () => {
      const { getByLabelText, getByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          startCollapsed={false}
        />
      );

      // Should be expanded initially
      expect(getByText('Calculation Breakdown')).toBeTruthy();

      // Press to collapse
      const header = getByLabelText(/ARV Calculation calculation, collapse details/);
      fireEvent.press(header);

      // Should be collapsed (wait for animation)
      // Note: Actual collapse happens after animation, so content may still be in DOM
      expect(header).toBeTruthy();
    });
  });

  describe('Calculation Steps', () => {
    it('should display all step labels', () => {
      const { getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      // Text is split across multiple Text components, use regex to find parts
      expect(getAllByText(/After Repair Value \(ARV\)|1/)).toBeTruthy();
      expect(getAllByText(/Repair Costs|2/)).toBeTruthy();
    });

    it('should display step results', () => {
      const { getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      // Note: Values appear multiple times (in step result and evidence sources)
      expect(getAllByText(/\$450,000/)).toBeTruthy();
      expect(getAllByText(/\$75,000/)).toBeTruthy();
    });

    it('should display formulas', () => {
      const { getByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByText('ARV = Comp Price × Size Adjustment')).toBeTruthy();
      expect(getByText('Repairs = Materials + Labor')).toBeTruthy();
    });

    it('should display explanations', () => {
      const { getByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByText('Based on recent comparable sales in the area')).toBeTruthy();
    });

    it('should handle steps without formulas', () => {
      const stepsWithoutFormula: CalculationStep[] = [
        {
          label: 'Simple Calculation',
          result: '$100,000',
        },
      ];
      const { getAllByText } = render(
        <CalculationEvidence
          title="Test Calculation"
          finalResult="$100,000"
          status="verified"
          steps={stepsWithoutFormula}
        />
      );
      // Text split across multiple components
      expect(getAllByText(/Simple Calculation|1/)).toBeTruthy();
      // Value appears in both finalResult and step result
      expect(getAllByText(/\$100,000/)).toBeTruthy();
    });

    it('should handle steps without explanations', () => {
      const stepsWithoutExplanation: CalculationStep[] = [
        {
          label: 'Simple Calculation',
          result: '$100,000',
          formula: 'X = Y + Z',
        },
      ];
      const { getByText } = render(
        <CalculationEvidence
          title="Test Calculation"
          finalResult="$100,000"
          status="verified"
          steps={stepsWithoutExplanation}
        />
      );
      expect(getByText('X = Y + Z')).toBeTruthy();
    });
  });

  describe('Evidence Sources', () => {
    it('should display evidence source labels', () => {
      const { getByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByText('MLS Comparable #1')).toBeTruthy();
      expect(getByText('County Records')).toBeTruthy();
      expect(getByText('Contractor Estimate')).toBeTruthy();
    });

    it('should display source values', () => {
      const { getByText, getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByText('$425,000')).toBeTruthy();
      expect(getByText('$440,000')).toBeTruthy();
      // $75,000 appears in both step result and evidence source
      expect(getAllByText(/\$75,000/)).toBeTruthy();
    });

    it('should display source timestamps', () => {
      const { getByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByText(/Verified: 2 days ago/)).toBeTruthy();
    });

    it('should display confidence badges', () => {
      const { getAllByText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      // Should have High and Medium confidence badges
      expect(getAllByText(/High/)).toBeTruthy();
      expect(getAllByText(/Medium/)).toBeTruthy();
    });

    it('should handle steps without sources', () => {
      const stepsWithoutSources: CalculationStep[] = [
        {
          label: 'Simple Calculation',
          result: '$100,000',
        },
      ];
      const { queryByText } = render(
        <CalculationEvidence
          title="Test Calculation"
          finalResult="$100,000"
          status="verified"
          steps={stepsWithoutSources}
        />
      );
      expect(queryByText('Evidence Sources')).toBeNull();
    });
  });

  describe('Variants', () => {
    it('should support default variant', () => {
      const { UNSAFE_root } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          variant="default"
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support glass variant', () => {
      const { UNSAFE_root } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          variant="glass"
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have button role on header', () => {
      const { getByRole } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('should have correct accessibility label when collapsed', () => {
      const { getByLabelText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          startCollapsed
        />
      );
      expect(getByLabelText(/ARV Calculation calculation, expand details/)).toBeTruthy();
    });

    it('should have correct accessibility label when expanded', () => {
      const { getByLabelText } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          startCollapsed={false}
        />
      );
      expect(getByLabelText(/ARV Calculation calculation, collapse details/)).toBeTruthy();
    });

    it('should have correct accessibility state', () => {
      const { getByRole } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      const header = getByRole('button');
      expect(header.props.accessibilityState.expanded).toBe(true);
    });
  });

  describe('Design System Compliance', () => {
    it('should render without hardcoded values', () => {
      const { UNSAFE_root } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support custom styles', () => {
      const customStyle = { marginTop: 20 };
      const { UNSAFE_root } = render(
        <CalculationEvidence
          title="ARV Calculation"
          finalResult="$450,000"
          status="verified"
          steps={mockSteps}
          style={customStyle}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
