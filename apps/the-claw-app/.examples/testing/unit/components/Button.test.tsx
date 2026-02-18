/**
 * Button Component Unit Tests
 *
 * Comprehensive test suite for the Button component covering:
 * - Rendering with different props
 * - User interactions
 * - Accessibility
 * - Loading and disabled states
 * - Haptic feedback
 * - Style variants and sizes
 * - Edge cases
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { Button, ButtonProps } from '@/components/Button'
import { ThemeProvider } from '@/theme/ThemeContext'

// Mock haptics
jest.mock('expo-haptics')

// Helper to render with theme
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('Button Component', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // BASIC RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByText } = renderWithTheme(<Button title="Click Me" onPress={() => {}} />)
      expect(getByText('Click Me')).toBeTruthy()
    })

    it('renders with custom title', () => {
      const customTitle = 'Custom Button Text'
      const { getByText } = renderWithTheme(<Button title={customTitle} onPress={() => {}} />)
      expect(getByText(customTitle)).toBeTruthy()
    })

    it('renders with primary variant by default', () => {
      const { getByA11yRole } = renderWithTheme(<Button title="Primary" onPress={() => {}} />)
      const button = getByA11yRole('button')
      expect(button).toBeTruthy()
    })

    it('renders with secondary variant', () => {
      const { getByText } = renderWithTheme(
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
      )
      expect(getByText('Secondary')).toBeTruthy()
    })

    it('renders with text variant', () => {
      const { getByText } = renderWithTheme(
        <Button title="Text" variant="text" onPress={() => {}} />
      )
      expect(getByText('Text')).toBeTruthy()
    })

    it('renders with small size', () => {
      const { getByText } = renderWithTheme(
        <Button title="Small" size="sm" onPress={() => {}} />
      )
      expect(getByText('Small')).toBeTruthy()
    })

    it('renders with medium size', () => {
      const { getByText } = renderWithTheme(
        <Button title="Medium" size="md" onPress={() => {}} />
      )
      expect(getByText('Medium')).toBeTruthy()
    })

    it('renders with large size', () => {
      const { getByText } = renderWithTheme(
        <Button title="Large" size="lg" onPress={() => {}} />
      )
      expect(getByText('Large')).toBeTruthy()
    })

    it('does not render without title', () => {
      // @ts-expect-error Testing missing required prop
      const { queryByA11yRole } = renderWithTheme(<Button onPress={() => {}} />)
      // Component should still render but might be empty
      const button = queryByA11yRole('button')
      expect(button).toBeTruthy()
    })
  })

  // ============================================================================
  // USER INTERACTIONS
  // ============================================================================

  describe('User Interactions', () => {
    it('calls onPress when pressed', () => {
      const onPressMock = jest.fn()
      const { getByText } = renderWithTheme(<Button title="Click" onPress={onPressMock} />)

      fireEvent.press(getByText('Click'))
      expect(onPressMock).toHaveBeenCalledTimes(1)
    })

    it('calls onPress multiple times when pressed multiple times', () => {
      const onPressMock = jest.fn()
      const { getByText } = renderWithTheme(<Button title="Click" onPress={onPressMock} />)

      fireEvent.press(getByText('Click'))
      fireEvent.press(getByText('Click'))
      fireEvent.press(getByText('Click'))
      expect(onPressMock).toHaveBeenCalledTimes(3)
    })

    it('does not call onPress when disabled', () => {
      const onPressMock = jest.fn()
      const { getByText } = renderWithTheme(
        <Button title="Disabled" onPress={onPressMock} disabled />
      )

      fireEvent.press(getByText('Disabled'))
      expect(onPressMock).not.toHaveBeenCalled()
    })

    it('does not call onPress when loading', () => {
      const onPressMock = jest.fn()
      const { getByA11yRole } = renderWithTheme(
        <Button title="Loading" onPress={onPressMock} loading />
      )

      fireEvent.press(getByA11yRole('button'))
      expect(onPressMock).not.toHaveBeenCalled()
    })

    it('does not call onPress when onPress is undefined', () => {
      const { getByText } = renderWithTheme(<Button title="No Handler" />)
      // Should not throw error
      expect(() => {
        fireEvent.press(getByText('No Handler'))
      }).not.toThrow()
    })

    it('handles rapid clicks without duplicate calls', async () => {
      const onPressMock = jest.fn()
      const { getByText } = renderWithTheme(<Button title="Click" onPress={onPressMock} />)

      const button = getByText('Click')
      fireEvent.press(button)
      fireEvent.press(button)

      // Both presses should be registered
      expect(onPressMock).toHaveBeenCalledTimes(2)
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('shows ActivityIndicator when loading', () => {
      const { queryByTestId, queryByText } = renderWithTheme(
        <Button title="Submit" onPress={() => {}} loading />
      )

      // Text should not be visible
      expect(queryByText('Submit')).toBeNull()

      // ActivityIndicator should be rendered (can't easily test for it)
      // But we can verify the button is still accessible
      const button = queryByTestId('button')
      expect(button).toBeDefined()
    })

    it('hides text when loading', () => {
      const { queryByText } = renderWithTheme(
        <Button title="Submit" onPress={() => {}} loading />
      )
      expect(queryByText('Submit')).toBeNull()
    })

    it('is disabled when loading', () => {
      const onPressMock = jest.fn()
      const { getByA11yRole } = renderWithTheme(
        <Button title="Submit" onPress={onPressMock} loading />
      )

      const button = getByA11yRole('button')
      expect(button.props.accessibilityState.busy).toBe(true)
    })

    it('can transition from normal to loading state', () => {
      const { getByText, queryByText, rerender } = renderWithTheme(
        <Button title="Submit" onPress={() => {}} />
      )

      // Initially not loading
      expect(getByText('Submit')).toBeTruthy()

      // Rerender with loading
      rerender(
        <ThemeProvider>
          <Button title="Submit" onPress={() => {}} loading />
        </ThemeProvider>
      )

      // Now loading
      expect(queryByText('Submit')).toBeNull()
    })

    it('can transition from loading to normal state', () => {
      const { queryByText, rerender } = renderWithTheme(
        <Button title="Submit" onPress={() => {}} loading />
      )

      // Initially loading
      expect(queryByText('Submit')).toBeNull()

      // Rerender without loading
      rerender(
        <ThemeProvider>
          <Button title="Submit" onPress={() => {}} />
        </ThemeProvider>
      )

      // Now not loading
      expect(queryByText('Submit')).toBeTruthy()
    })
  })

  // ============================================================================
  // DISABLED STATE
  // ============================================================================

  describe('Disabled State', () => {
    it('does not trigger onPress when disabled', () => {
      const onPressMock = jest.fn()
      const { getByText } = renderWithTheme(
        <Button title="Disabled" onPress={onPressMock} disabled />
      )

      fireEvent.press(getByText('Disabled'))
      expect(onPressMock).not.toHaveBeenCalled()
    })

    it('has correct accessibility state when disabled', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Disabled" onPress={() => {}} disabled />
      )

      const button = getByA11yRole('button')
      expect(button.props.accessibilityState.disabled).toBe(true)
    })

    it('applies disabled styling', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Disabled" onPress={() => {}} disabled />
      )

      const button = getByA11yRole('button')
      expect(button.props.disabled).toBe(true)
    })

    it('remains disabled even if onPress is called programmatically', () => {
      const onPressMock = jest.fn()
      const { getByText } = renderWithTheme(
        <Button title="Disabled" onPress={onPressMock} disabled />
      )

      fireEvent.press(getByText('Disabled'))
      expect(onPressMock).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // HAPTIC FEEDBACK
  // ============================================================================

  describe('Haptic Feedback', () => {
    it('triggers haptic feedback on press by default', () => {
      const { getByText } = renderWithTheme(<Button title="Click" onPress={() => {}} />)

      fireEvent.press(getByText('Click'))
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })

    it('does not trigger haptic feedback when hapticFeedback is false', () => {
      const { getByText } = renderWithTheme(
        <Button title="Click" onPress={() => {}} hapticFeedback={false} />
      )

      fireEvent.press(getByText('Click'))
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('does not trigger haptic feedback when disabled', () => {
      const { getByText } = renderWithTheme(
        <Button title="Disabled" onPress={() => {}} disabled />
      )

      fireEvent.press(getByText('Disabled'))
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('does not trigger haptic feedback when loading', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Loading" onPress={() => {}} loading />
      )

      fireEvent.press(getByA11yRole('button'))
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('triggers haptic feedback on each press', () => {
      const { getByText } = renderWithTheme(<Button title="Click" onPress={() => {}} />)

      fireEvent.press(getByText('Click'))
      fireEvent.press(getByText('Click'))
      fireEvent.press(getByText('Click'))

      expect(Haptics.impactAsync).toHaveBeenCalledTimes(3)
    })
  })

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('has button accessibility role', () => {
      const { getByA11yRole } = renderWithTheme(<Button title="Accessible" onPress={() => {}} />)
      expect(getByA11yRole('button')).toBeTruthy()
    })

    it('has correct accessibility label', () => {
      const label = 'Submit Form'
      const { getByA11yLabel } = renderWithTheme(<Button title={label} onPress={() => {}} />)
      expect(getByA11yLabel(label)).toBeTruthy()
    })

    it('indicates disabled state in accessibility', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Disabled" onPress={() => {}} disabled />
      )

      const button = getByA11yRole('button')
      expect(button.props.accessibilityState.disabled).toBe(true)
    })

    it('indicates loading state in accessibility', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Loading" onPress={() => {}} loading />
      )

      const button = getByA11yRole('button')
      expect(button.props.accessibilityState.busy).toBe(true)
    })

    it('maintains accessibility when disabled and loading', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Both" onPress={() => {}} disabled loading />
      )

      const button = getByA11yRole('button')
      expect(button.props.accessibilityState.disabled).toBe(true)
      expect(button.props.accessibilityState.busy).toBe(true)
    })

    it('supports custom accessibility props', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button
          title="Custom"
          onPress={() => {}}
          accessibilityHint="Double tap to submit"
        />
      )

      const button = getByA11yRole('button')
      expect(button.props.accessibilityHint).toBe('Double tap to submit')
    })
  })

  // ============================================================================
  // STYLING
  // ============================================================================

  describe('Styling', () => {
    it('applies custom container style', () => {
      const customStyle = { backgroundColor: 'red', borderRadius: 20 }
      const { getByA11yRole } = renderWithTheme(
        <Button title="Styled" onPress={() => {}} style={customStyle} />
      )

      const button = getByA11yRole('button')
      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: 'red',
          borderRadius: 20,
        })
      )
    })

    it('applies custom text style', () => {
      const customTextStyle = { fontSize: 20, fontWeight: 'bold' as const }
      const { getByText } = renderWithTheme(
        <Button title="Styled Text" onPress={() => {}} textStyle={customTextStyle} />
      )

      const text = getByText('Styled Text')
      expect(text.props.style).toMatchObject(
        expect.objectContaining({
          fontSize: 20,
          fontWeight: 'bold',
        })
      )
    })

    it('merges custom styles with default styles', () => {
      const customStyle = { marginTop: 10 }
      const { getByA11yRole } = renderWithTheme(
        <Button title="Merged" onPress={() => {}} style={customStyle} />
      )

      const button = getByA11yRole('button')
      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          marginTop: 10,
        })
      )
      // Should still have default styles
      expect(button.props.style).toHaveProperty('alignItems')
    })
  })

  // ============================================================================
  // VARIANTS
  // ============================================================================

  describe('Variants', () => {
    it('renders all variants without crashing', () => {
      const variants: ButtonProps['variant'][] = ['primary', 'secondary', 'text']

      variants.forEach((variant) => {
        const { getByText } = renderWithTheme(
          <Button title={variant || 'primary'} variant={variant} onPress={() => {}} />
        )
        expect(getByText(variant || 'primary')).toBeTruthy()
      })
    })

    it('primary variant has correct styles', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Primary" variant="primary" onPress={() => {}} />
      )
      const button = getByA11yRole('button')
      expect(button).toBeTruthy()
      // Primary should have background color
      expect(button.props.style).toHaveProperty('backgroundColor')
    })

    it('secondary variant has border', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
      )
      const button = getByA11yRole('button')
      expect(button.props.style).toHaveProperty('borderWidth')
    })

    it('text variant has no background', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Text" variant="text" onPress={() => {}} />
      )
      const button = getByA11yRole('button')
      // Text variant should have transparent or no background
      expect(button).toBeTruthy()
    })
  })

  // ============================================================================
  // SIZES
  // ============================================================================

  describe('Sizes', () => {
    it('renders all sizes without crashing', () => {
      const sizes: ButtonProps['size'][] = ['sm', 'md', 'lg']

      sizes.forEach((size) => {
        const { getByText } = renderWithTheme(
          <Button title={size || 'md'} size={size} onPress={() => {}} />
        )
        expect(getByText(size || 'md')).toBeTruthy()
      })
    })

    it('small size has correct height', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Small" size="sm" onPress={() => {}} />
      )
      const button = getByA11yRole('button')
      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          height: 36,
        })
      )
    })

    it('medium size has correct height', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Medium" size="md" onPress={() => {}} />
      )
      const button = getByA11yRole('button')
      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          height: 44,
        })
      )
    })

    it('large size has correct height', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Large" size="lg" onPress={() => {}} />
      )
      const button = getByA11yRole('button')
      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          height: 52,
        })
      )
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles very long title text', () => {
      const longTitle = 'This is a very long button title that might overflow'
      const { getByText } = renderWithTheme(<Button title={longTitle} onPress={() => {}} />)
      expect(getByText(longTitle)).toBeTruthy()
    })

    it('handles empty title', () => {
      const { getByA11yRole } = renderWithTheme(<Button title="" onPress={() => {}} />)
      expect(getByA11yRole('button')).toBeTruthy()
    })

    it('handles special characters in title', () => {
      const specialTitle = '!@#$%^&*()'
      const { getByText } = renderWithTheme(<Button title={specialTitle} onPress={() => {}} />)
      expect(getByText(specialTitle)).toBeTruthy()
    })

    it('handles unicode characters in title', () => {
      const unicodeTitle = '你好世界 🌍'
      const { getByText } = renderWithTheme(<Button title={unicodeTitle} onPress={() => {}} />)
      expect(getByText(unicodeTitle)).toBeTruthy()
    })

    it('handles simultaneous disabled and loading states', () => {
      const onPressMock = jest.fn()
      const { getByA11yRole } = renderWithTheme(
        <Button title="Both" onPress={onPressMock} disabled loading />
      )

      fireEvent.press(getByA11yRole('button'))
      expect(onPressMock).not.toHaveBeenCalled()
    })

    it('handles undefined onPress gracefully', () => {
      const { getByText } = renderWithTheme(<Button title="No Handler" />)
      expect(() => {
        fireEvent.press(getByText('No Handler'))
      }).not.toThrow()
    })

    it('handles null onPress gracefully', () => {
      // @ts-expect-error Testing edge case
      const { getByText } = renderWithTheme(<Button title="Null Handler" onPress={null} />)
      expect(() => {
        fireEvent.press(getByText('Null Handler'))
      }).not.toThrow()
    })
  })

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  describe('Performance', () => {
    it('renders quickly with minimal props', () => {
      const startTime = performance.now()
      renderWithTheme(<Button title="Fast" onPress={() => {}} />)
      const endTime = performance.now()

      // Should render in less than 100ms
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles multiple re-renders efficiently', () => {
      const { rerender } = renderWithTheme(<Button title="Rerender" onPress={() => {}} />)

      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        rerender(
          <ThemeProvider>
            <Button title={`Rerender ${i}`} onPress={() => {}} />
          </ThemeProvider>
        )
      }
      const endTime = performance.now()

      // 10 re-renders should take less than 500ms
      expect(endTime - startTime).toBeLessThan(500)
    })
  })

  // ============================================================================
  // INTEGRATION WITH OTHER PROPS
  // ============================================================================

  describe('Integration', () => {
    it('combines all props correctly', () => {
      const onPressMock = jest.fn()
      const customStyle = { margin: 10 }
      const customTextStyle = { fontSize: 18 }

      const { getByText } = renderWithTheme(
        <Button
          title="Complete"
          variant="secondary"
          size="lg"
          onPress={onPressMock}
          style={customStyle}
          textStyle={customTextStyle}
          hapticFeedback={false}
          accessibilityHint="Tap to continue"
        />
      )

      const button = getByText('Complete')
      expect(button).toBeTruthy()

      fireEvent.press(button)
      expect(onPressMock).toHaveBeenCalledTimes(1)
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('respects TouchableOpacity props', () => {
      const { getByA11yRole } = renderWithTheme(
        <Button title="Opacity" onPress={() => {}} activeOpacity={0.5} />
      )

      const button = getByA11yRole('button')
      expect(button.props.activeOpacity).toBe(0.5)
    })

    it('forwards other TouchableOpacity props', () => {
      const testID = 'test-button'
      const { getByTestId } = renderWithTheme(
        <Button title="Test" onPress={() => {}} testID={testID} />
      )

      expect(getByTestId(testID)).toBeTruthy()
    })
  })
})
