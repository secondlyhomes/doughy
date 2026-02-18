/**
 * useAuth Hook Unit Tests
 *
 * Comprehensive test suite for authentication hook covering:
 * - Sign up flow
 * - Sign in flow
 * - Sign out flow
 * - Session management
 * - Error handling
 * - Token persistence
 * - OAuth flows
 */

import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useAuth } from '@/hooks/useAuth'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mock dependencies
jest.mock('expo-secure-store')
jest.mock('@react-native-async-storage/async-storage')

describe('useAuth Hook', () => {
  // Mock Supabase client
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup Supabase mock
    mockSupabase = global.mockSupabaseClient

    // Reset auth methods
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    })

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      },
      error: null,
    })

    mockSupabase.auth.signOut.mockResolvedValue({
      error: null,
    })

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    // Setup SecureStore mock
    ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null)
    ;(SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined)
    ;(SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined)

    // Setup AsyncStorage mock
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('Initialization', () => {
    it('initializes with null user and session', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.loading).toBe(true)
    })

    it('loads persisted session on mount', async () => {
      const mockSession = {
        access_token: 'stored-token',
        refresh_token: 'stored-refresh',
      }

      ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSession)
      )

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toEqual(mockSession)
    })

    it('handles missing persisted session', async () => {
      ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null)

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('handles corrupted session data', async () => {
      ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue('invalid-json')

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toBeNull()
    })
  })

  // ============================================================================
  // SIGN UP
  // ============================================================================

  describe('Sign Up', () => {
    it('successfully signs up a new user', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signUp({
          email: 'new@example.com',
          password: 'password123',
        })
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      })

      expect(result.current.user).toBeTruthy()
      expect(result.current.user?.email).toBe('test@example.com')
    })

    it('handles sign up with additional metadata', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signUp({
          email: 'new@example.com',
          password: 'password123',
          options: {
            data: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
        })
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      })
    })

    it('handles sign up errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signUp({
            email: 'existing@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow('Email already exists')

      expect(result.current.user).toBeNull()
    })

    it('handles network errors during sign up', async () => {
      mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signUp({
            email: 'test@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow('Network error')
    })

    it('persists session after successful sign up', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signUp({
          email: 'new@example.com',
          password: 'password123',
        })
      })

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth-session',
        expect.any(String)
      )
    })

    it('validates email format before sign up', async () => {
      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signUp({
            email: 'invalid-email',
            password: 'password123',
          })
        })
      ).rejects.toThrow()
    })

    it('validates password strength before sign up', async () => {
      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signUp({
            email: 'test@example.com',
            password: '123', // Too short
          })
        })
      ).rejects.toThrow()
    })
  })

  // ============================================================================
  // SIGN IN
  // ============================================================================

  describe('Sign In', () => {
    it('successfully signs in existing user', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.current.user).toBeTruthy()
      expect(result.current.session).toBeTruthy()
    })

    it('handles incorrect credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signIn({
            email: 'wrong@example.com',
            password: 'wrongpassword',
          })
        })
      ).rejects.toThrow('Invalid credentials')

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('persists session after successful sign in', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(SecureStore.setItemAsync).toHaveBeenCalled()
    })

    it('handles network errors during sign in', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network timeout'))

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow('Network timeout')
    })

    it('updates loading state during sign in', async () => {
      const { result } = renderHook(() => useAuth())

      let loadingDuringSignIn = false

      act(() => {
        result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
        loadingDuringSignIn = result.current.loading
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(loadingDuringSignIn).toBe(true)
    })
  })

  // ============================================================================
  // SIGN OUT
  // ============================================================================

  describe('Sign Out', () => {
    it('successfully signs out user', async () => {
      const { result } = renderHook(() => useAuth())

      // First sign in
      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(result.current.user).toBeTruthy()

      // Then sign out
      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('clears persisted session on sign out', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth-session')
    })

    it('handles sign out when not signed in', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })

    it('handles errors during sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      await expect(
        act(async () => {
          await result.current.signOut()
        })
      ).rejects.toThrow('Sign out failed')
    })

    it('clears local state even if sign out fails', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Network error' },
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      try {
        await act(async () => {
          await result.current.signOut()
        })
      } catch (error) {
        // Expected to throw
      }

      // Should still clear local state
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  describe('Session Management', () => {
    it('refreshes expired session automatically', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'new-token',
            refresh_token: 'new-refresh',
          },
        },
        error: null,
      })

      await act(async () => {
        await result.current.refreshSession()
      })

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('handles session refresh errors', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' },
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.refreshSession()
        })
      ).rejects.toThrow('Refresh failed')
    })

    it('subscribes to auth state changes', async () => {
      const { result } = renderHook(() => useAuth())

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })

    it('unsubscribes from auth state changes on unmount', () => {
      const unsubscribeMock = jest.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      })

      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })

    it('updates session when auth state changes', async () => {
      let authCallback: any

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        }
      })

      const { result } = renderHook(() => useAuth())

      const newSession = {
        access_token: 'updated-token',
        refresh_token: 'updated-refresh',
        user: {
          id: 'user-456',
          email: 'updated@example.com',
        },
      }

      act(() => {
        authCallback('SIGNED_IN', newSession)
      })

      await waitFor(() => {
        expect(result.current.session).toEqual(newSession)
      })
    })
  })

  // ============================================================================
  // OAUTH
  // ============================================================================

  describe('OAuth', () => {
    it('initiates OAuth sign in', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth.provider.com', provider: 'google' },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signInWithOAuth({ provider: 'google' })
      })

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
      })
    })

    it('handles OAuth errors', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null, provider: null },
        error: { message: 'OAuth provider not configured' },
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signInWithOAuth({ provider: 'google' })
        })
      ).rejects.toThrow('OAuth provider not configured')
    })
  })

  // ============================================================================
  // PASSWORD RESET
  // ============================================================================

  describe('Password Reset', () => {
    it('sends password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.resetPassword('test@example.com')
      })

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com'
      )
    })

    it('handles password reset errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: 'Email not found' },
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.resetPassword('nonexistent@example.com')
        })
      ).rejects.toThrow('Email not found')
    })
  })

  // ============================================================================
  // USER PROFILE
  // ============================================================================

  describe('User Profile', () => {
    it('updates user profile', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: {
              first_name: 'Updated',
              last_name: 'Name',
            },
          },
        },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.updateProfile({
          data: {
            first_name: 'Updated',
            last_name: 'Name',
          },
        })
      })

      expect(mockSupabase.auth.updateUser).toHaveBeenCalled()
    })

    it('handles profile update errors', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Update failed' },
      })

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.updateProfile({
            data: { first_name: 'Failed' },
          })
        })
      ).rejects.toThrow('Update failed')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles concurrent sign in attempts', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        // Fire multiple sign in attempts simultaneously
        const promises = [
          result.current.signIn({ email: 'test1@example.com', password: 'password' }),
          result.current.signIn({ email: 'test2@example.com', password: 'password' }),
          result.current.signIn({ email: 'test3@example.com', password: 'password' }),
        ]

        await Promise.all(promises)
      })

      // Should handle gracefully without race conditions
      expect(result.current.user).toBeTruthy()
    })

    it('handles session expiration', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      // Simulate session expiration
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      await act(async () => {
        await result.current.checkSession()
      })

      expect(result.current.session).toBeNull()
    })

    it('handles missing Supabase client', async () => {
      // Temporarily remove mock
      const originalMock = global.mockSupabaseClient
      // @ts-expect-error Testing edge case
      global.mockSupabaseClient = null

      const { result } = renderHook(() => useAuth())

      await expect(
        act(async () => {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow()

      // Restore mock
      global.mockSupabaseClient = originalMock
    })
  })
})
