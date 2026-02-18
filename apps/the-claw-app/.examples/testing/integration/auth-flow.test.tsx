/**
 * Authentication Flow Integration Tests
 *
 * End-to-end tests for complete authentication flows:
 * - Sign up flow
 * - Sign in flow
 * - Sign out flow
 * - Password reset flow
 * - Session persistence
 * - Navigation after auth
 */

import React from 'react'
import { renderWithProviders, createMockUser, waitFor, fireEvent } from '../utils/testUtils'

// Note: These tests assume you have actual Auth components and screens
// Adjust imports based on your actual implementation

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // SIGN UP FLOW
  // ============================================================================

  describe('Sign Up Flow', () => {
    it('completes full sign up flow successfully', async () => {
      const mockSupabase = global.mockSupabaseClient

      // Mock successful sign up
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: createMockUser({ email: 'newuser@example.com' }),
          session: {
            access_token: 'new-token',
            refresh_token: 'new-refresh',
          },
        },
        error: null,
      })

      // Render sign up screen
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <div>
          {/* Replace with actual SignUpScreen component */}
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <input placeholder="Confirm Password" data-testid="confirm-password-input" />
          <button onClick={() => {}}>Sign Up</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'newuser@example.com')

      // Fill in password
      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'SecurePass123!')

      // Fill in confirm password
      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'SecurePass123!')

      // Submit form
      const signUpButton = getByText('Sign Up')
      fireEvent.press(signUpButton)

      // Wait for sign up to complete
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        })
      })
    })

    it('validates email format', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}}>Sign Up</button>
        </div>
      )

      // Fill in invalid email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'invalid-email')

      // Fill in password
      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'SecurePass123!')

      // Submit form
      const signUpButton = getByText('Sign Up')
      fireEvent.press(signUpButton)

      // Should show validation error
      const errorMessage = await findByText(/invalid email/i)
      expect(errorMessage).toBeTruthy()
    })

    it('validates password strength', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}}>Sign Up</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'test@example.com')

      // Fill in weak password
      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, '123')

      // Submit form
      const signUpButton = getByText('Sign Up')
      fireEvent.press(signUpButton)

      // Should show validation error
      const errorMessage = await findByText(/password.*weak|password.*short/i)
      expect(errorMessage).toBeTruthy()
    })

    it('validates password confirmation match', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <input placeholder="Confirm Password" data-testid="confirm-password-input" />
          <button onClick={() => {}}>Sign Up</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'test@example.com')

      // Fill in password
      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'SecurePass123!')

      // Fill in non-matching confirm password
      const confirmPasswordInput = getByPlaceholderText('Confirm Password')
      fireEvent.changeText(confirmPasswordInput, 'DifferentPass456!')

      // Submit form
      const signUpButton = getByText('Sign Up')
      fireEvent.press(signUpButton)

      // Should show validation error
      const errorMessage = await findByText(/passwords.*match/i)
      expect(errorMessage).toBeTruthy()
    })

    it('handles duplicate email error', async () => {
      const mockSupabase = global.mockSupabaseClient

      // Mock duplicate email error
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}}>Sign Up</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'existing@example.com')

      // Fill in password
      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'SecurePass123!')

      // Submit form
      const signUpButton = getByText('Sign Up')
      fireEvent.press(signUpButton)

      // Should show error message
      const errorMessage = await findByText(/already registered/i)
      expect(errorMessage).toBeTruthy()
    })

    it('disables submit button while loading', async () => {
      const mockSupabase = global.mockSupabaseClient

      // Mock slow sign up
      mockSupabase.auth.signUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 1000))
      )

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}} disabled={false}>
            Sign Up
          </button>
        </div>
      )

      // Fill in form
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'test@example.com')

      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'SecurePass123!')

      // Submit form
      const signUpButton = getByText('Sign Up')
      fireEvent.press(signUpButton)

      // Button should be disabled during loading
      await waitFor(() => {
        expect(signUpButton.props.disabled).toBe(true)
      })
    })
  })

  // ============================================================================
  // SIGN IN FLOW
  // ============================================================================

  describe('Sign In Flow', () => {
    it('completes full sign in flow successfully', async () => {
      const mockSupabase = global.mockSupabaseClient

      const mockUser = createMockUser({ email: 'user@example.com' })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      })

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}}>Sign In</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'user@example.com')

      // Fill in password
      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'password123')

      // Submit form
      const signInButton = getByText('Sign In')
      fireEvent.press(signInButton)

      // Wait for sign in to complete
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'password123',
        })
      })
    })

    it('handles invalid credentials', async () => {
      const mockSupabase = global.mockSupabaseClient

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}}>Sign In</button>
        </div>
      )

      // Fill in credentials
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'wrong@example.com')

      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'wrongpassword')

      // Submit form
      const signInButton = getByText('Sign In')
      fireEvent.press(signInButton)

      // Should show error message
      const errorMessage = await findByText(/invalid.*credentials/i)
      expect(errorMessage).toBeTruthy()
    })

    it('navigates to home screen after successful sign in', async () => {
      const mockSupabase = global.mockSupabaseClient
      const mockNavigate = jest.fn()

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: createMockUser(),
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      })

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={mockNavigate}>Sign In</button>
        </div>
      )

      // Fill in and submit
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'user@example.com')

      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'password123')

      const signInButton = getByText('Sign In')
      fireEvent.press(signInButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })

    it('persists session after sign in', async () => {
      const mockSupabase = global.mockSupabaseClient
      const SecureStore = require('expo-secure-store')

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: createMockUser(),
          session: {
            access_token: 'persisted-token',
            refresh_token: 'persisted-refresh',
          },
        },
        error: null,
      })

      const { getByPlaceholderText, getByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <input placeholder="Password" data-testid="password-input" />
          <button onClick={() => {}}>Sign In</button>
        </div>
      )

      // Fill in and submit
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'user@example.com')

      const passwordInput = getByPlaceholderText('Password')
      fireEvent.changeText(passwordInput, 'password123')

      const signInButton = getByText('Sign In')
      fireEvent.press(signInButton)

      await waitFor(() => {
        expect(SecureStore.setItemAsync).toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // SIGN OUT FLOW
  // ============================================================================

  describe('Sign Out Flow', () => {
    it('signs out user and clears session', async () => {
      const mockSupabase = global.mockSupabaseClient
      const SecureStore = require('expo-secure-store')

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const mockUser = createMockUser()

      const { getByText } = renderWithProviders(
        <div>
          <div>Welcome, {mockUser.email}</div>
          <button onClick={() => {}}>Sign Out</button>
        </div>,
        {
          authenticated: true,
          user: mockUser,
        }
      )

      // Click sign out
      const signOutButton = getByText('Sign Out')
      fireEvent.press(signOutButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth-session')
      })
    })

    it('navigates to login screen after sign out', async () => {
      const mockSupabase = global.mockSupabaseClient
      const mockNavigate = jest.fn()

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { getByText } = renderWithProviders(
        <div>
          <button onClick={mockNavigate}>Sign Out</button>
        </div>,
        {
          authenticated: true,
        }
      )

      const signOutButton = getByText('Sign Out')
      fireEvent.press(signOutButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })

    it('handles sign out errors gracefully', async () => {
      const mockSupabase = global.mockSupabaseClient

      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Network error' },
      })

      const { getByText, findByText } = renderWithProviders(
        <div>
          <button onClick={() => {}}>Sign Out</button>
        </div>,
        {
          authenticated: true,
        }
      )

      const signOutButton = getByText('Sign Out')
      fireEvent.press(signOutButton)

      // Should still show error but clear local state
      const errorMessage = await findByText(/error/i)
      expect(errorMessage).toBeTruthy()
    })
  })

  // ============================================================================
  // PASSWORD RESET FLOW
  // ============================================================================

  describe('Password Reset Flow', () => {
    it('sends password reset email', async () => {
      const mockSupabase = global.mockSupabaseClient

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <button onClick={() => {}}>Reset Password</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'user@example.com')

      // Click reset button
      const resetButton = getByText('Reset Password')
      fireEvent.press(resetButton)

      await waitFor(() => {
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'user@example.com'
        )
      })

      // Should show success message
      const successMessage = await findByText(/email sent|check your email/i)
      expect(successMessage).toBeTruthy()
    })

    it('validates email before sending reset', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <button onClick={() => {}}>Reset Password</button>
        </div>
      )

      // Fill in invalid email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'invalid-email')

      // Click reset button
      const resetButton = getByText('Reset Password')
      fireEvent.press(resetButton)

      // Should show validation error
      const errorMessage = await findByText(/invalid email/i)
      expect(errorMessage).toBeTruthy()
    })

    it('handles non-existent email', async () => {
      const mockSupabase = global.mockSupabaseClient

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'User not found' },
      })

      const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
        <div>
          <input placeholder="Email" data-testid="email-input" />
          <button onClick={() => {}}>Reset Password</button>
        </div>
      )

      // Fill in email
      const emailInput = getByPlaceholderText('Email')
      fireEvent.changeText(emailInput, 'nonexistent@example.com')

      // Click reset button
      const resetButton = getByText('Reset Password')
      fireEvent.press(resetButton)

      // Should show error message
      const errorMessage = await findByText(/not found|does not exist/i)
      expect(errorMessage).toBeTruthy()
    })
  })

  // ============================================================================
  // SESSION PERSISTENCE
  // ============================================================================

  describe('Session Persistence', () => {
    it('restores session on app restart', async () => {
      const SecureStore = require('expo-secure-store')
      const mockSupabase = global.mockSupabaseClient

      const mockSession = {
        access_token: 'stored-token',
        refresh_token: 'stored-refresh',
        user: createMockUser(),
      }

      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockSession))

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { findByText } = renderWithProviders(
        <div>
          <div>Loading...</div>
        </div>
      )

      // Should restore session
      await waitFor(() => {
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth-session')
        expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      })
    })

    it('handles expired session on restore', async () => {
      const SecureStore = require('expo-secure-store')
      const mockSupabase = global.mockSupabaseClient

      SecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({ access_token: 'expired-token' })
      )

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const { findByText } = renderWithProviders(
        <div>
          <div>Please sign in</div>
        </div>
      )

      // Should clear expired session
      await waitFor(() => {
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth-session')
      })
    })
  })

  // ============================================================================
  // NAVIGATION INTEGRATION
  // ============================================================================

  describe('Navigation Integration', () => {
    it('redirects to login when accessing protected route', async () => {
      const mockNavigate = jest.fn()

      const { findByText } = renderWithProviders(
        <div>
          <div>Protected Content</div>
        </div>,
        {
          authenticated: false,
        }
      )

      // Should redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('login')
      })
    })

    it('allows access to protected route when authenticated', () => {
      const { getByText } = renderWithProviders(
        <div>
          <div>Protected Content</div>
        </div>,
        {
          authenticated: true,
        }
      )

      // Should show protected content
      expect(getByText('Protected Content')).toBeTruthy()
    })

    it('redirects from login to home when already authenticated', async () => {
      const mockNavigate = jest.fn()

      const { findByText } = renderWithProviders(
        <div>
          <div>Login Screen</div>
        </div>,
        {
          authenticated: true,
          initialRoute: '/login',
        }
      )

      // Should redirect to home
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('home')
      })
    })
  })
})
