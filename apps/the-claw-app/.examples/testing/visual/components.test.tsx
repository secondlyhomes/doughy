/**
 * Visual Regression Tests for Components
 *
 * Snapshot tests to catch unintended visual changes
 * Tests components in different states and themes
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { Button } from '@/components/Button'
import { Text } from '@/components/Text'
import { Input } from '@/components/Input'
import { ThemeProvider } from '@/theme/ThemeContext'

// Helper to render with theme
function renderWithTheme(
  ui: React.ReactElement,
  theme: 'light' | 'dark' = 'light'
) {
  return render(<ThemeProvider initialTheme={theme}>{ui}</ThemeProvider>)
}

describe('Visual Regression - Components', () => {
  // ============================================================================
  // BUTTON COMPONENT
  // ============================================================================

  describe('Button', () => {
    describe('Variants', () => {
      it('matches snapshot - primary variant', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Primary Button" variant="primary" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - secondary variant', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Secondary Button" variant="secondary" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - text variant', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Text Button" variant="text" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Sizes', () => {
      it('matches snapshot - small size', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Small" size="sm" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - medium size', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Medium" size="md" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - large size', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Large" size="lg" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('States', () => {
      it('matches snapshot - normal state', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Normal" onPress={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - disabled state', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Disabled" onPress={() => {}} disabled />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - loading state', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Loading" onPress={() => {}} loading />
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Themes', () => {
      it('matches snapshot - light theme', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Light Theme" onPress={() => {}} />,
          'light'
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - dark theme', () => {
        const { toJSON } = renderWithTheme(
          <Button title="Dark Theme" onPress={() => {}} />,
          'dark'
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Combined States', () => {
      it('matches snapshot - primary small disabled', () => {
        const { toJSON } = renderWithTheme(
          <Button
            title="Combined"
            variant="primary"
            size="sm"
            disabled
            onPress={() => {}}
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - secondary large loading', () => {
        const { toJSON } = renderWithTheme(
          <Button
            title="Combined"
            variant="secondary"
            size="lg"
            loading
            onPress={() => {}}
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })
  })

  // ============================================================================
  // TEXT COMPONENT
  // ============================================================================

  describe('Text', () => {
    describe('Variants', () => {
      it('matches snapshot - heading variant', () => {
        const { toJSON } = renderWithTheme(
          <Text variant="heading">Heading Text</Text>
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - body variant', () => {
        const { toJSON } = renderWithTheme(
          <Text variant="body">Body Text</Text>
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - caption variant', () => {
        const { toJSON } = renderWithTheme(
          <Text variant="caption">Caption Text</Text>
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Themes', () => {
      it('matches snapshot - light theme', () => {
        const { toJSON } = renderWithTheme(
          <Text>Light Theme Text</Text>,
          'light'
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - dark theme', () => {
        const { toJSON } = renderWithTheme(
          <Text>Dark Theme Text</Text>,
          'dark'
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Text Content', () => {
      it('matches snapshot - short text', () => {
        const { toJSON } = renderWithTheme(<Text>Short</Text>)
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - long text', () => {
        const { toJSON } = renderWithTheme(
          <Text>
            This is a very long text that might wrap to multiple lines and we want to
            ensure it renders consistently across different test runs
          </Text>
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - special characters', () => {
        const { toJSON } = renderWithTheme(
          <Text>Special: !@#$%^&*()</Text>
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - unicode characters', () => {
        const { toJSON } = renderWithTheme(
          <Text>Unicode: 你好 🌍 café</Text>
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })
  })

  // ============================================================================
  // INPUT COMPONENT
  // ============================================================================

  describe('Input', () => {
    describe('States', () => {
      it('matches snapshot - normal state', () => {
        const { toJSON } = renderWithTheme(
          <Input placeholder="Enter text" value="" onChangeText={() => {}} />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - with value', () => {
        const { toJSON } = renderWithTheme(
          <Input
            placeholder="Enter text"
            value="Sample text"
            onChangeText={() => {}}
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - disabled state', () => {
        const { toJSON } = renderWithTheme(
          <Input
            placeholder="Disabled"
            value=""
            onChangeText={() => {}}
            editable={false}
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - error state', () => {
        const { toJSON } = renderWithTheme(
          <Input
            placeholder="Email"
            value="invalid"
            onChangeText={() => {}}
            error="Invalid email address"
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Types', () => {
      it('matches snapshot - text input', () => {
        const { toJSON } = renderWithTheme(
          <Input
            placeholder="Text"
            value=""
            onChangeText={() => {}}
            keyboardType="default"
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - email input', () => {
        const { toJSON } = renderWithTheme(
          <Input
            placeholder="Email"
            value=""
            onChangeText={() => {}}
            keyboardType="email-address"
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - password input', () => {
        const { toJSON } = renderWithTheme(
          <Input
            placeholder="Password"
            value=""
            onChangeText={() => {}}
            secureTextEntry
          />
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })

    describe('Themes', () => {
      it('matches snapshot - light theme', () => {
        const { toJSON } = renderWithTheme(
          <Input placeholder="Light theme" value="" onChangeText={() => {}} />,
          'light'
        )
        expect(toJSON()).toMatchSnapshot()
      })

      it('matches snapshot - dark theme', () => {
        const { toJSON } = renderWithTheme(
          <Input placeholder="Dark theme" value="" onChangeText={() => {}} />,
          'dark'
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })
  })

  // ============================================================================
  // COMPONENT COMBINATIONS
  // ============================================================================

  describe('Component Combinations', () => {
    it('matches snapshot - form layout', () => {
      const { toJSON } = renderWithTheme(
        <div>
          <Text variant="heading">Sign In</Text>
          <Input placeholder="Email" value="" onChangeText={() => {}} />
          <Input
            placeholder="Password"
            value=""
            onChangeText={() => {}}
            secureTextEntry
          />
          <Button title="Sign In" onPress={() => {}} />
        </div>
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('matches snapshot - card layout', () => {
      const { toJSON } = renderWithTheme(
        <div>
          <Text variant="heading">Card Title</Text>
          <Text variant="body">Card body text with some content</Text>
          <Button title="Action" variant="primary" size="sm" onPress={() => {}} />
        </div>
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('matches snapshot - list item', () => {
      const { toJSON } = renderWithTheme(
        <div>
          <Text variant="body">List item title</Text>
          <Text variant="caption">List item subtitle</Text>
          <Button title="•••" variant="text" size="sm" onPress={() => {}} />
        </div>
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  // ============================================================================
  // RESPONSIVE LAYOUTS
  // ============================================================================

  describe('Responsive Layouts', () => {
    it('matches snapshot - mobile layout', () => {
      const { toJSON } = renderWithTheme(
        <div style={{ width: 375 }}>
          <Text variant="heading">Mobile View</Text>
          <Button title="Full Width Button" onPress={() => {}} />
        </div>
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('matches snapshot - tablet layout', () => {
      const { toJSON } = renderWithTheme(
        <div style={{ width: 768 }}>
          <Text variant="heading">Tablet View</Text>
          <Button title="Centered Button" onPress={() => {}} />
        </div>
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('matches snapshot - empty string', () => {
      const { toJSON } = renderWithTheme(<Text></Text>)
      expect(toJSON()).toMatchSnapshot()
    })

    it('matches snapshot - null children', () => {
      const { toJSON } = renderWithTheme(
        <div>{null}</div>
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('matches snapshot - undefined value', () => {
      const { toJSON } = renderWithTheme(
        <Input placeholder="Test" value={undefined as any} onChangeText={() => {}} />
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('matches snapshot - very long button text', () => {
      const { toJSON } = renderWithTheme(
        <Button
          title="This is a very long button text that might overflow or wrap"
          onPress={() => {}}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })
})

// ============================================================================
// SNAPSHOT TESTING BEST PRACTICES
// ============================================================================

/**
 * Best Practices for Snapshot Testing:
 *
 * 1. Keep snapshots focused and small
 *    - Test individual components, not entire screens
 *    - Break down complex components into smaller tests
 *
 * 2. Test different states and variants
 *    - Normal, disabled, loading, error states
 *    - All variants and sizes
 *    - Light and dark themes
 *
 * 3. Update snapshots intentionally
 *    - Review snapshot diffs before updating
 *    - Run `npm test -- -u` to update all snapshots
 *    - Run `npm test -- Button.test.tsx -u` to update specific file
 *
 * 4. Use descriptive test names
 *    - Clearly indicate what the snapshot represents
 *    - Include variant, state, and theme in name
 *
 * 5. Don't snapshot everything
 *    - Focus on visual components
 *    - Avoid snapshotting logic/data structures
 *    - Use regular assertions for behavior
 *
 * 6. Review snapshots in PRs
 *    - All team members should review snapshot changes
 *    - Ensure changes are intentional
 *    - Look for unexpected changes
 *
 * 7. Keep snapshots in version control
 *    - Commit snapshot files
 *    - Don't add to .gitignore
 *
 * 8. Consider alternatives for complex components
 *    - Visual regression testing tools (Percy, Chromatic)
 *    - Screenshot testing with Detox
 *    - Specific assertions for behavior
 */
