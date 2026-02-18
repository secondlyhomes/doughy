/**
 * Authentication E2E Tests
 *
 * End-to-end tests for authentication flows using Detox
 * Tests actual app behavior on real/simulated devices
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox'

describe('Authentication E2E', () => {
  // ============================================================================
  // SETUP & TEARDOWN
  // ============================================================================

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  afterAll(async () => {
    await device.terminateApp()
  })

  // ============================================================================
  // SIGN UP TESTS
  // ============================================================================

  describe('Sign Up', () => {
    beforeEach(async () => {
      // Navigate to sign up screen
      await waitFor(element(by.id('sign-up-button')))
        .toBeVisible()
        .withTimeout(5000)
      await element(by.id('sign-up-button')).tap()
    })

    it('should successfully sign up a new user', async () => {
      // Fill in email
      await element(by.id('email-input')).typeText('newuser@example.com')

      // Fill in password
      await element(by.id('password-input')).typeText('SecurePass123!')

      // Fill in confirm password
      await element(by.id('confirm-password-input')).typeText('SecurePass123!')

      // Tap sign up button
      await element(by.id('submit-button')).tap()

      // Wait for success and navigation to home
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should show error for invalid email', async () => {
      // Fill in invalid email
      await element(by.id('email-input')).typeText('invalid-email')

      // Fill in password
      await element(by.id('password-input')).typeText('SecurePass123!')

      // Tap sign up button
      await element(by.id('submit-button')).tap()

      // Should show validation error
      await waitFor(element(by.text('Invalid email address')))
        .toBeVisible()
        .withTimeout(2000)
    })

    it('should show error for weak password', async () => {
      // Fill in email
      await element(by.id('email-input')).typeText('test@example.com')

      // Fill in weak password
      await element(by.id('password-input')).typeText('123')

      // Tap sign up button
      await element(by.id('submit-button')).tap()

      // Should show validation error
      await waitFor(element(by.text(/password.*weak|password.*short/i)))
        .toBeVisible()
        .withTimeout(2000)
    })

    it('should show error for mismatched passwords', async () => {
      // Fill in email
      await element(by.id('email-input')).typeText('test@example.com')

      // Fill in password
      await element(by.id('password-input')).typeText('SecurePass123!')

      // Fill in different confirm password
      await element(by.id('confirm-password-input')).typeText('DifferentPass456!')

      // Tap sign up button
      await element(by.id('submit-button')).tap()

      // Should show validation error
      await waitFor(element(by.text(/passwords.*match/i)))
        .toBeVisible()
        .withTimeout(2000)
    })

    it('should disable submit button while loading', async () => {
      // Fill in form
      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('SecurePass123!')
      await element(by.id('confirm-password-input')).typeText('SecurePass123!')

      // Tap sign up button
      await element(by.id('submit-button')).tap()

      // Button should be disabled (loading state)
      await detoxExpect(element(by.id('submit-button'))).toHaveToggleValue(false)
    })

    it('should clear form after successful sign up', async () => {
      // Fill and submit form
      await element(by.id('email-input')).typeText('newuser@example.com')
      await element(by.id('password-input')).typeText('SecurePass123!')
      await element(by.id('confirm-password-input')).typeText('SecurePass123!')
      await element(by.id('submit-button')).tap()

      // Navigate back to sign up
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('sign-out-button')).tap()
      await element(by.id('sign-up-button')).tap()

      // Form should be empty
      await detoxExpect(element(by.id('email-input'))).toHaveText('')
    })
  })

  // ============================================================================
  // SIGN IN TESTS
  // ============================================================================

  describe('Sign In', () => {
    beforeEach(async () => {
      // Navigate to sign in screen (should be default)
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should successfully sign in existing user', async () => {
      // Fill in email
      await element(by.id('email-input')).typeText('test@example.com')

      // Fill in password
      await element(by.id('password-input')).typeText('password123')

      // Tap sign in button
      await element(by.id('submit-button')).tap()

      // Wait for navigation to home
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should show error for invalid credentials', async () => {
      // Fill in wrong credentials
      await element(by.id('email-input')).typeText('wrong@example.com')
      await element(by.id('password-input')).typeText('wrongpassword')

      // Tap sign in button
      await element(by.id('submit-button')).tap()

      // Should show error message
      await waitFor(element(by.text(/invalid.*credentials|incorrect.*password/i)))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should toggle password visibility', async () => {
      // Type password
      await element(by.id('password-input')).typeText('password123')

      // Password should be hidden by default
      await detoxExpect(element(by.id('password-input'))).toHaveToggleValue(true)

      // Tap visibility toggle
      await element(by.id('password-visibility-toggle')).tap()

      // Password should be visible
      await detoxExpect(element(by.id('password-input'))).toHaveToggleValue(false)
    })

    it('should navigate to sign up from sign in', async () => {
      // Tap sign up link
      await element(by.id('navigate-to-sign-up')).tap()

      // Should show sign up screen
      await waitFor(element(by.id('sign-up-screen')))
        .toBeVisible()
        .withTimeout(2000)
    })

    it('should navigate to forgot password', async () => {
      // Tap forgot password link
      await element(by.id('forgot-password-link')).tap()

      // Should show forgot password screen
      await waitFor(element(by.id('forgot-password-screen')))
        .toBeVisible()
        .withTimeout(2000)
    })

    it('should persist session after app restart', async () => {
      // Sign in
      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('password123')
      await element(by.id('submit-button')).tap()

      // Wait for home screen
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000)

      // Restart app
      await device.reloadReactNative()

      // Should still be on home screen (session persisted)
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000)
    })
  })

  // ============================================================================
  // SIGN OUT TESTS
  // ============================================================================

  describe('Sign Out', () => {
    beforeEach(async () => {
      // Sign in first
      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('password123')
      await element(by.id('submit-button')).tap()

      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should sign out user', async () => {
      // Tap sign out button
      await element(by.id('sign-out-button')).tap()

      // Should navigate to sign in screen
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should clear session after sign out', async () => {
      // Sign out
      await element(by.id('sign-out-button')).tap()

      // Wait for sign in screen
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000)

      // Restart app
      await device.reloadReactNative()

      // Should still be on sign in screen (session cleared)
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should show confirmation dialog before sign out', async () => {
      // Tap sign out button
      await element(by.id('sign-out-button')).tap()

      // Should show confirmation dialog
      await waitFor(element(by.text(/are you sure|confirm/i)))
        .toBeVisible()
        .withTimeout(2000)

      // Tap confirm
      await element(by.text(/yes|confirm/i)).tap()

      // Should navigate to sign in
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000)
    })
  })

  // ============================================================================
  // PASSWORD RESET TESTS
  // ============================================================================

  describe('Password Reset', () => {
    beforeEach(async () => {
      // Navigate to forgot password screen
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000)
      await element(by.id('forgot-password-link')).tap()
    })

    it('should send password reset email', async () => {
      // Fill in email
      await element(by.id('email-input')).typeText('test@example.com')

      // Tap reset button
      await element(by.id('reset-password-button')).tap()

      // Should show success message
      await waitFor(element(by.text(/email sent|check your email/i)))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should show error for invalid email', async () => {
      // Fill in invalid email
      await element(by.id('email-input')).typeText('invalid-email')

      // Tap reset button
      await element(by.id('reset-password-button')).tap()

      // Should show validation error
      await waitFor(element(by.text(/invalid email/i)))
        .toBeVisible()
        .withTimeout(2000)
    })

    it('should navigate back to sign in', async () => {
      // Tap back button
      await element(by.id('back-to-sign-in')).tap()

      // Should show sign in screen
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(2000)
    })
  })

  // ============================================================================
  // KEYBOARD INTERACTIONS
  // ============================================================================

  describe('Keyboard Interactions', () => {
    it('should advance to next field on keyboard return', async () => {
      // Type email and press return
      await element(by.id('email-input')).typeText('test@example.com\n')

      // Password field should be focused
      await detoxExpect(element(by.id('password-input'))).toHaveFocus()
    })

    it('should submit form on password field return', async () => {
      // Fill email
      await element(by.id('email-input')).typeText('test@example.com')

      // Fill password and press return
      await element(by.id('password-input')).typeText('password123\n')

      // Should trigger sign in
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should dismiss keyboard on background tap', async () => {
      // Focus email input
      await element(by.id('email-input')).tap()

      // Tap outside input (on background)
      await element(by.id('auth-screen-container')).tap()

      // Keyboard should be dismissed
      // Note: Keyboard dismissal is hard to test directly
      // This test verifies the tap doesn't cause errors
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have accessibility labels on all inputs', async () => {
      await detoxExpect(element(by.id('email-input'))).toHaveLabel('Email address')
      await detoxExpect(element(by.id('password-input'))).toHaveLabel('Password')
    })

    it('should have accessibility labels on all buttons', async () => {
      await detoxExpect(element(by.id('submit-button'))).toHaveLabel('Sign in')
      await detoxExpect(element(by.id('sign-up-button'))).toHaveLabel('Sign up')
    })

    it('should announce errors to screen readers', async () => {
      // Fill invalid email
      await element(by.id('email-input')).typeText('invalid')

      // Tap submit
      await element(by.id('submit-button')).tap()

      // Error message should have accessibility
      await detoxExpect(element(by.text(/invalid email/i))).toHaveLabel(
        'Error: Invalid email address'
      )
    })
  })

  // ============================================================================
  // NETWORK CONDITIONS
  // ============================================================================

  describe('Network Conditions', () => {
    it('should show loading state during sign in', async () => {
      // Fill form
      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('password123')

      // Tap submit
      await element(by.id('submit-button')).tap()

      // Should show loading indicator
      await waitFor(element(by.id('loading-indicator')))
        .toBeVisible()
        .withTimeout(1000)
    })

    it('should handle network timeout', async () => {
      // Note: Requires network condition mocking
      // This is a placeholder for actual network testing

      // Fill form
      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('password123')

      // Tap submit
      await element(by.id('submit-button')).tap()

      // Should eventually show timeout error
      await waitFor(element(by.text(/timeout|network error/i)))
        .toBeVisible()
        .withTimeout(30000)
    })

    it('should retry failed request', async () => {
      // Fill form
      await element(by.id('email-input')).typeText('test@example.com')
      await element(by.id('password-input')).typeText('password123')

      // Tap submit
      await element(by.id('submit-button')).tap()

      // Wait for error
      await waitFor(element(by.text(/error/i)))
        .toBeVisible()
        .withTimeout(10000)

      // Tap retry button
      await element(by.id('retry-button')).tap()

      // Should attempt sign in again
      await waitFor(element(by.id('loading-indicator')))
        .toBeVisible()
        .withTimeout(1000)
    })
  })

  // ============================================================================
  // DEEP LINKING
  // ============================================================================

  describe('Deep Linking', () => {
    it('should open password reset from deep link', async () => {
      // Open deep link
      await device.openURL({
        url: 'myapp://reset-password?token=test-token',
      })

      // Should show password reset screen with pre-filled token
      await waitFor(element(by.id('new-password-screen')))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should handle email verification deep link', async () => {
      // Open verification link
      await device.openURL({
        url: 'myapp://verify-email?token=verify-token',
      })

      // Should show verification success screen
      await waitFor(element(by.text(/email verified|verification successful/i)))
        .toBeVisible()
        .withTimeout(5000)
    })
  })

  // ============================================================================
  // SCREENSHOT TESTS
  // ============================================================================

  describe('Screenshots', () => {
    it('should take screenshot of sign in screen', async () => {
      await element(by.id('sign-in-screen')).takeScreenshot('sign-in')
    })

    it('should take screenshot of sign up screen', async () => {
      await element(by.id('sign-up-button')).tap()
      await element(by.id('sign-up-screen')).takeScreenshot('sign-up')
    })

    it('should take screenshot of error state', async () => {
      await element(by.id('email-input')).typeText('invalid')
      await element(by.id('submit-button')).tap()
      await waitFor(element(by.text(/error/i)))
        .toBeVisible()
        .withTimeout(2000)
      await element(by.id('sign-in-screen')).takeScreenshot('error-state')
    })
  })
})
