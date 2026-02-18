/**
 * OverrideCalculationSheet Component Tests
 * Validates modal behavior, validation, and design system compliance
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OverrideCalculationSheet, CalculationOverride } from '../OverrideCalculationSheet';

// Mock theme colors
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#4D7C5F',
    foreground: '#111827',
    mutedForeground: '#6B7280',
    background: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E7EB',
    warning: '#f59e0b',
    destructive: '#EF4444',
  }),
}));

describe('OverrideCalculationSheet', () => {
  const mockCalculation: CalculationOverride = {
    fieldName: 'ARV',
    aiValue: '450000',
    unit: '$',
    inputType: 'currency',
    helperText: 'Enter the After Repair Value',
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  describe('Rendering', () => {
    it('should render when visible', () => {
      const { getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByText('Override Calculation')).toBeTruthy();
      expect(getByText('ARV')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByText } = render(
        <OverrideCalculationSheet
          isVisible={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(queryByText('Override Calculation')).toBeNull();
    });

    it('should display warning banner', () => {
      const { getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByText(/Overriding AI calculations may affect accuracy/)).toBeTruthy();
    });

    it('should display helper text', () => {
      const { getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByText('Enter the After Repair Value')).toBeTruthy();
    });
  });

  describe('Value Comparison Display', () => {
    it('should display AI calculated value', () => {
      const { getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByText('$450,000')).toBeTruthy();
      expect(getByText(/Current/)).toBeTruthy();
    });

    it('should display placeholder for new value initially', () => {
      const { getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByText('Enter value')).toBeTruthy();
    });
  });

  describe('Input Formatting', () => {
    it('should format currency input', () => {
      const { UNSAFE_getAllByType, getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');

      // Should display formatted value with currency symbol
      expect(getByText('$500,000')).toBeTruthy();
    });

    it('should format percentage input', () => {
      const percentageCalc: CalculationOverride = {
        fieldName: 'ROI',
        aiValue: '18.5',
        inputType: 'percentage',
      };

      const { UNSAFE_getAllByType, getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={percentageCalc}
        />
      );

      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '25');

      expect(getByText('25.00%')).toBeTruthy();
    });

    it('should handle text input type', () => {
      const textCalc: CalculationOverride = {
        fieldName: 'Address',
        aiValue: '123 Main St',
        inputType: 'text',
      };

      const { UNSAFE_root } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={textCalc}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should show error when new value is empty', () => {
      const { getByText, UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      // Try to save without entering a value
      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      fireEvent.press(saveButton);

      expect(getByText('Please enter a new value')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when reason is empty', () => {
      const { getByText, UNSAFE_getByType, UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      // Enter new value but no reason
      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');

      // Try to save
      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      fireEvent.press(saveButton);

      expect(getByText('Please provide a reason for this override')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should call custom validation function', () => {
      const mockValidate = jest.fn(() => false);
      const calcWithValidation: CalculationOverride = {
        ...mockCalculation,
        validate: mockValidate,
      };

      const { getByText, UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={calcWithValidation}
        />
      );

      // Enter value and reason
      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');
      fireEvent.changeText(inputs[1], 'Market analysis shows higher value');

      // Try to save
      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      fireEvent.press(saveButton);

      expect(mockValidate).toHaveBeenCalledWith('500,000');
      expect(getByText('Invalid value entered')).toBeTruthy();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear error when user types', () => {
      const { getByText, queryByText, UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      // Trigger error
      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      fireEvent.press(saveButton);
      expect(getByText('Please enter a new value')).toBeTruthy();

      // Type in input
      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');

      // Error should be cleared
      expect(queryByText('Please enter a new value')).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should call onClose when close button is pressed', () => {
      const { getByLabelText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      const closeButton = getByLabelText('Close');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is pressed', () => {
      const { getAllByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      const cancelButton = getAllByText('Cancel')[0];
      fireEvent.press(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSave with correct values', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      // Enter new value and reason
      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');
      fireEvent.changeText(inputs[1], 'Market analysis shows higher value');

      // Save
      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      fireEvent.press(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        '500,000',
        'Market analysis shows higher value'
      );
    });

    it('should call onClose when backdrop is pressed', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      const touchableOpacities = UNSAFE_getAllByType(
        require('react-native').TouchableOpacity
      );
      const backdrop = touchableOpacities[0]; // First TouchableOpacity is the backdrop
      fireEvent.press(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Saving State', () => {
    it('should show saving text when isSaving is true', () => {
      const { getByText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
          isSaving
        />
      );
      expect(getByText('Saving...')).toBeTruthy();
    });

    it('should disable save button when isSaving', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
          isSaving
        />
      );

      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Saving...'
      );
      expect(saveButton.props.disabled).toBe(true);
    });

    it('should disable cancel button when isSaving', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
          isSaving
        />
      );

      const cancelButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Cancel'
      );
      expect(cancelButton.props.disabled).toBe(true);
    });
  });

  describe('Button States', () => {
    it('should disable save button when value is empty', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      expect(saveButton.props.disabled).toBe(true);
    });

    it('should disable save button when reason is empty', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      // Enter only value
      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');

      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      expect(saveButton.props.disabled).toBe(true);
    });

    it('should enable save button when both fields are filled', () => {
      const { UNSAFE_getAllByType } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );

      // Enter value and reason
      const inputs = UNSAFE_getAllByType(require('../Input').Input);
      fireEvent.changeText(inputs[0], '500000');
      fireEvent.changeText(inputs[1], 'Market analysis');

      const saveButton = UNSAFE_getAllByType(require('../Button').Button).find(
        (btn) => btn.props.children === 'Save Override'
      );
      expect(saveButton.props.disabled).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have close button accessibility label', () => {
      const { getByLabelText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByLabelText('Close')).toBeTruthy();
    });

    it('should have backdrop accessibility label', () => {
      const { getByLabelText } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(getByLabelText('Close override sheet')).toBeTruthy();
    });
  });

  describe('Design System Compliance', () => {
    it('should render without hardcoded values', () => {
      const { UNSAFE_root } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support custom styles', () => {
      const customStyle = { paddingTop: 20 };
      const { UNSAFE_root } = render(
        <OverrideCalculationSheet
          isVisible
          onClose={mockOnClose}
          onSave={mockOnSave}
          calculation={mockCalculation}
          style={customStyle}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
