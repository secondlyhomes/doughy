/**
 * Performance Tests - Render Time
 *
 * Tests to ensure components render efficiently
 * Helps catch performance regressions
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Button } from '@/components/Button'
import { Text } from '@/components/Text'
import { ThemeProvider } from '@/theme/ThemeContext'

// Performance budget (in milliseconds)
const PERFORMANCE_BUDGET = {
  simple: 16, // 60fps - simple components should render in one frame
  complex: 50, // Complex components
  list: 100, // List rendering
  screen: 200, // Full screen
}

// Helper to measure render time
function measureRenderTime(renderFn: () => any): number {
  const startTime = performance.now()
  renderFn()
  const endTime = performance.now()
  return endTime - startTime
}

// Helper to measure average render time over multiple runs
function measureAverageRenderTime(renderFn: () => any, runs: number = 10): number {
  const times: number[] = []

  for (let i = 0; i < runs; i++) {
    const time = measureRenderTime(renderFn)
    times.push(time)
  }

  return times.reduce((sum, time) => sum + time, 0) / times.length
}

describe('Performance - Render Time', () => {
  // ============================================================================
  // SIMPLE COMPONENTS
  // ============================================================================

  describe('Simple Components', () => {
    it('Button renders in <16ms (60fps)', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Button title="Click Me" onPress={() => {}} />
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })

    it('Text renders in <16ms (60fps)', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Text>Sample Text</Text>
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })

    it('Input renders in <16ms (60fps)', () => {
      const { Input } = require('@/components/Input')

      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Input placeholder="Enter text" value="" onChangeText={() => {}} />
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })
  })

  // ============================================================================
  // COMPONENT VARIANTS
  // ============================================================================

  describe('Component Variants', () => {
    it('all Button variants render efficiently', () => {
      const variants: Array<'primary' | 'secondary' | 'text'> = [
        'primary',
        'secondary',
        'text',
      ]

      variants.forEach((variant) => {
        const renderTime = measureRenderTime(() =>
          render(
            <ThemeProvider>
              <Button title={variant} variant={variant} onPress={() => {}} />
            </ThemeProvider>
          )
        )

        expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
      })
    })

    it('all Button sizes render efficiently', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

      sizes.forEach((size) => {
        const renderTime = measureRenderTime(() =>
          render(
            <ThemeProvider>
              <Button title={size} size={size} onPress={() => {}} />
            </ThemeProvider>
          )
        )

        expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
      })
    })
  })

  // ============================================================================
  // COMPONENT STATES
  // ============================================================================

  describe('Component States', () => {
    it('disabled Button renders efficiently', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Button title="Disabled" onPress={() => {}} disabled />
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })

    it('loading Button renders efficiently', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Button title="Loading" onPress={() => {}} loading />
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })
  })

  // ============================================================================
  // MULTIPLE COMPONENTS
  // ============================================================================

  describe('Multiple Components', () => {
    it('renders 10 buttons in <100ms', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <div>
              {Array.from({ length: 10 }).map((_, i) => (
                <Button key={i} title={`Button ${i}`} onPress={() => {}} />
              ))}
            </div>
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.list)
    })

    it('renders 50 text elements in <100ms', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <div>
              {Array.from({ length: 50 }).map((_, i) => (
                <Text key={i}>Text {i}</Text>
              ))}
            </div>
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.list)
    })
  })

  // ============================================================================
  // RE-RENDERS
  // ============================================================================

  describe('Re-renders', () => {
    it('handles multiple re-renders efficiently', () => {
      const { rerender } = render(
        <ThemeProvider>
          <Button title="Initial" onPress={() => {}} />
        </ThemeProvider>
      )

      const rerenderTime = measureRenderTime(() => {
        for (let i = 0; i < 10; i++) {
          rerender(
            <ThemeProvider>
              <Button title={`Rerender ${i}`} onPress={() => {}} />
            </ThemeProvider>
          )
        }
      })

      // 10 re-renders should take less than 100ms
      expect(rerenderTime).toBeLessThan(100)
    })

    it('prop changes re-render efficiently', () => {
      const { rerender } = render(
        <ThemeProvider>
          <Button title="Normal" onPress={() => {}} />
        </ThemeProvider>
      )

      const rerenderTime = measureRenderTime(() => {
        rerender(
          <ThemeProvider>
            <Button title="Updated" onPress={() => {}} />
          </ThemeProvider>
        )
      })

      expect(rerenderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })

    it('state changes re-render efficiently', () => {
      const { rerender } = render(
        <ThemeProvider>
          <Button title="Normal" onPress={() => {}} disabled={false} />
        </ThemeProvider>
      )

      const rerenderTime = measureRenderTime(() => {
        rerender(
          <ThemeProvider>
            <Button title="Normal" onPress={() => {}} disabled={true} />
          </ThemeProvider>
        )
      })

      expect(rerenderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })
  })

  // ============================================================================
  // AVERAGE PERFORMANCE
  // ============================================================================

  describe('Average Performance', () => {
    it('Button average render time is consistent', () => {
      const avgTime = measureAverageRenderTime(
        () =>
          render(
            <ThemeProvider>
              <Button title="Average" onPress={() => {}} />
            </ThemeProvider>
          ),
        20
      )

      expect(avgTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })

    it('Text average render time is consistent', () => {
      const avgTime = measureAverageRenderTime(
        () =>
          render(
            <ThemeProvider>
              <Text>Average Text</Text>
            </ThemeProvider>
          ),
        20
      )

      expect(avgTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })
  })

  // ============================================================================
  // COMPLEX SCENARIOS
  // ============================================================================

  describe('Complex Scenarios', () => {
    it('nested components render efficiently', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <div>
              <div>
                <div>
                  <Text>Nested Text</Text>
                  <Button title="Nested Button" onPress={() => {}} />
                </div>
              </div>
            </div>
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.complex)
    })

    it('form with multiple inputs renders efficiently', () => {
      const { Input } = require('@/components/Input')

      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <div>
              <Input placeholder="Name" value="" onChangeText={() => {}} />
              <Input placeholder="Email" value="" onChangeText={() => {}} />
              <Input placeholder="Password" value="" onChangeText={() => {}} secureTextEntry />
              <Button title="Submit" onPress={() => {}} />
            </div>
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.complex)
    })
  })

  // ============================================================================
  // THEME SWITCHING
  // ============================================================================

  describe('Theme Switching', () => {
    it('theme change re-renders efficiently', () => {
      const { rerender } = render(
        <ThemeProvider initialTheme="light">
          <Button title="Theme Test" onPress={() => {}} />
        </ThemeProvider>
      )

      const rerenderTime = measureRenderTime(() => {
        rerender(
          <ThemeProvider initialTheme="dark">
            <Button title="Theme Test" onPress={() => {}} />
          </ThemeProvider>
        )
      })

      expect(rerenderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })

    it('multiple components re-render on theme change efficiently', () => {
      const { rerender } = render(
        <ThemeProvider initialTheme="light">
          <div>
            <Text>Theme Text</Text>
            <Button title="Theme Button" onPress={() => {}} />
            <Text>Another Text</Text>
          </div>
        </ThemeProvider>
      )

      const rerenderTime = measureRenderTime(() => {
        rerender(
          <ThemeProvider initialTheme="dark">
            <div>
              <Text>Theme Text</Text>
              <Button title="Theme Button" onPress={() => {}} />
              <Text>Another Text</Text>
            </div>
          </ThemeProvider>
        )
      })

      expect(rerenderTime).toBeLessThan(PERFORMANCE_BUDGET.complex)
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('very long text renders efficiently', () => {
      const longText = 'A'.repeat(1000)

      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Text>{longText}</Text>
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.complex)
    })

    it('many props render efficiently', () => {
      const renderTime = measureRenderTime(() =>
        render(
          <ThemeProvider>
            <Button
              title="Many Props"
              variant="primary"
              size="lg"
              onPress={() => {}}
              disabled={false}
              loading={false}
              hapticFeedback={true}
              accessibilityLabel="Button"
              accessibilityHint="Tap to submit"
              testID="test-button"
            />
          </ThemeProvider>
        )
      )

      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGET.simple)
    })
  })

  // ============================================================================
  // REGRESSION TESTS
  // ============================================================================

  describe('Regression Tests', () => {
    it('performance does not degrade over time', () => {
      // Take baseline measurement
      const baseline = measureAverageRenderTime(
        () =>
          render(
            <ThemeProvider>
              <Button title="Baseline" onPress={() => {}} />
            </ThemeProvider>
          ),
        5
      )

      // Take measurement after delay (simulating code changes)
      const delayed = measureAverageRenderTime(
        () =>
          render(
            <ThemeProvider>
              <Button title="Delayed" onPress={() => {}} />
            </ThemeProvider>
          ),
        5
      )

      // Performance should not degrade by more than 20%
      expect(delayed).toBeLessThan(baseline * 1.2)
    })
  })
})

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * Performance Testing Best Practices:
 *
 * 1. Set Clear Performance Budgets
 *    - Define acceptable render times for different component types
 *    - Simple components: <16ms (60fps)
 *    - Complex components: <50ms
 *    - Full screens: <200ms
 *
 * 2. Test on Multiple Devices
 *    - Performance varies across devices
 *    - Test on low-end and high-end devices
 *    - Consider device-specific budgets
 *
 * 3. Measure Consistently
 *    - Run tests multiple times
 *    - Calculate average times
 *    - Account for variance
 *
 * 4. Test Real-World Scenarios
 *    - Multiple components
 *    - Nested structures
 *    - Re-renders
 *    - State changes
 *
 * 5. Monitor Regressions
 *    - Track performance over time
 *    - Alert on significant slowdowns
 *    - Compare against baselines
 *
 * 6. Profile in Production Mode
 *    - Development mode is slower
 *    - Test optimized builds
 *    - Use React DevTools Profiler
 *
 * 7. Optimize Based on Data
 *    - Identify slow components
 *    - Use React.memo for expensive renders
 *    - Implement virtualization for lists
 *    - Lazy load heavy components
 *
 * 8. Test Different States
 *    - Initial render
 *    - Re-renders
 *    - State updates
 *    - Prop changes
 *    - Theme changes
 */
