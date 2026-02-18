/**
 * Local Auth Context (No Database)
 *
 * Simple authentication using AsyncStorage only
 * Perfect for prototypes or apps without backend auth
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AUTH_STORAGE_KEY = '@app/auth-user'

interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Local Auth Provider
 *
 * @example
 * ```tsx
 * // Wrap your app
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // Use in components
 * function MyScreen() {
 *   const { user, signIn, signOut } = useAuth()
 *
 *   if (!user) {
 *     return <LoginScreen />
 *   }
 *
 *   return <HomeScreen user={user} onLogout={signOut} />
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from storage on mount
  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const userJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY)
      if (userJson) {
        setUser(JSON.parse(userJson))
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // In real app, validate against stored credentials
    // For demo, accept any email/password
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const user: User = {
      id: generateId(),
      email,
      name: email.split('@')[0], // Use email prefix as name
      createdAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    setUser(user)
  }

  async function signUp(email: string, password: string, name?: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    const user: User = {
      id: generateId(),
      email,
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    setUser(user)
  }

  async function signOut(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Generate simple unique ID
 */
function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Type exports
 */
export type { User, AuthContextValue }
