// Tests for usePermissions hook
import { renderHook } from '@testing-library/react-native';
import { usePermissions, useHasPermission, useHasAnyPermission, useHasAllPermissions } from '../usePermissions';
import type { UserProfile } from '../../types';

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('role-based permissions', () => {
    it('grants admin permissions correctly', () => {
      const mockProfile: UserProfile = {
        id: 'user-1',
        role: 'admin',
        email_verified: true,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isSupport).toBe(false);
      expect(result.current.isUser).toBe(false);
      expect(result.current.role).toBe('admin');

      // Admin has all management permissions
      expect(result.current.canManageUsers).toBe(true);
      expect(result.current.canViewAdminPanel).toBe(true);
      expect(result.current.canManageBilling).toBe(true);
      expect(result.current.canManageTeam).toBe(true);
      expect(result.current.canInviteMembers).toBe(true);
      expect(result.current.canViewAnalytics).toBe(true);
      expect(result.current.canManageProperties).toBe(true);
      expect(result.current.canManageLeads).toBe(true);
      expect(result.current.canAccessAI).toBe(true);
    });

    it('grants support permissions correctly', () => {
      const mockProfile: UserProfile = {
        id: 'user-2',
        role: 'support',
        email_verified: true,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSupport).toBe(true);
      expect(result.current.isUser).toBe(false);
      expect(result.current.role).toBe('support');

      // Support can view admin panel but not manage users
      expect(result.current.canManageUsers).toBe(false);
      expect(result.current.canViewAdminPanel).toBe(true);
      expect(result.current.canManageBilling).toBe(false);
      expect(result.current.canManageTeam).toBe(false);
      expect(result.current.canInviteMembers).toBe(true);
      expect(result.current.canViewAnalytics).toBe(true);
      expect(result.current.canManageProperties).toBe(true);
      expect(result.current.canManageLeads).toBe(true);
      expect(result.current.canAccessAI).toBe(true);
    });

    it('grants user permissions correctly for "user" role', () => {
      const mockProfile: UserProfile = {
        id: 'user-3',
        role: 'user',
        email_verified: true,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSupport).toBe(false);
      expect(result.current.isUser).toBe(true);
      expect(result.current.role).toBe('user');

      // Regular users have limited permissions
      expect(result.current.canManageUsers).toBe(false);
      expect(result.current.canViewAdminPanel).toBe(false);
      expect(result.current.canManageBilling).toBe(false);
      expect(result.current.canManageTeam).toBe(false);
      expect(result.current.canInviteMembers).toBe(false);
      expect(result.current.canViewAnalytics).toBe(true);
      expect(result.current.canManageProperties).toBe(true);
      expect(result.current.canManageLeads).toBe(true);
      expect(result.current.canAccessAI).toBe(true);
    });

    it('grants user permissions correctly for "standard" role', () => {
      const mockProfile: UserProfile = {
        id: 'user-4',
        role: 'standard',
        email_verified: true,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSupport).toBe(false);
      expect(result.current.isUser).toBe(true);
      expect(result.current.role).toBe('standard');
    });
  });

  describe('status-based permissions', () => {
    it('reflects email verification status', () => {
      const mockProfile: UserProfile = {
        id: 'user-5',
        role: 'user',
        email_verified: false,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isEmailVerified).toBe(false);
      expect(result.current.hasCompletedSetup).toBe(false);
    });

    it('reflects onboarding completion status', () => {
      const mockProfile: UserProfile = {
        id: 'user-6',
        role: 'user',
        email_verified: true,
        onboarding_complete: false,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isOnboardingComplete).toBe(false);
      expect(result.current.hasCompletedSetup).toBe(false);
    });

    it('requires both email verification and onboarding for completed setup', () => {
      const mockProfile: UserProfile = {
        id: 'user-7',
        role: 'user',
        email_verified: true,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isEmailVerified).toBe(true);
      expect(result.current.isOnboardingComplete).toBe(true);
      expect(result.current.hasCompletedSetup).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles missing profile gracefully', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        isAuthenticated: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSupport).toBe(false);
      expect(result.current.isUser).toBe(true); // Defaults to 'user'
      expect(result.current.role).toBe('user');
      expect(result.current.isEmailVerified).toBe(false);
      expect(result.current.isOnboardingComplete).toBe(false);
      expect(result.current.canManageProperties).toBe(false);
    });

    it('handles missing role gracefully', () => {
      const mockProfile: Partial<UserProfile> = {
        id: 'user-8',
        email_verified: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile as UserProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe('user'); // Defaults to 'user'
      expect(result.current.isUser).toBe(true);
    });

    it('handles unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        profile: null,
        isAuthenticated: false,
      } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canViewAnalytics).toBe(false);
      expect(result.current.canManageProperties).toBe(false);
      expect(result.current.canManageLeads).toBe(false);
      expect(result.current.canAccessAI).toBe(false);
    });
  });

  describe('memoization', () => {
    it('returns stable object when profile unchanged', () => {
      const mockProfile: UserProfile = {
        id: 'user-9',
        role: 'admin',
        email_verified: true,
        onboarding_complete: true,
      };

      mockUseAuth.mockReturnValue({
        profile: mockProfile,
        isAuthenticated: true,
      } as ReturnType<typeof useAuth>);

      const { result, rerender } = renderHook(() => usePermissions());
      const firstResult = result.current;

      rerender();

      // Should return the same object reference (memoized)
      expect(result.current).toBe(firstResult);
    });
  });
});

describe('useHasPermission', () => {
  it('returns true when user has the permission', () => {
    const mockProfile: UserProfile = {
      id: 'user-10',
      role: 'admin',
      email_verified: true,
      onboarding_complete: true,
    };

    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useHasPermission('canManageUsers'));

    expect(result.current).toBe(true);
  });

  it('returns false when user lacks the permission', () => {
    const mockProfile: UserProfile = {
      id: 'user-11',
      role: 'user',
      email_verified: true,
      onboarding_complete: true,
    };

    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useHasPermission('canManageUsers'));

    expect(result.current).toBe(false);
  });
});

describe('useHasAnyPermission', () => {
  it('returns true when user has at least one permission', () => {
    const mockProfile: UserProfile = {
      id: 'user-12',
      role: 'support',
      email_verified: true,
      onboarding_complete: true,
    };

    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() =>
      useHasAnyPermission(['canManageUsers', 'canViewAdminPanel'])
    );

    expect(result.current).toBe(true); // Has canViewAdminPanel
  });

  it('returns false when user has none of the permissions', () => {
    const mockProfile: UserProfile = {
      id: 'user-13',
      role: 'user',
      email_verified: true,
      onboarding_complete: true,
    };

    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() =>
      useHasAnyPermission(['canManageUsers', 'canManageBilling'])
    );

    expect(result.current).toBe(false);
  });
});

describe('useHasAllPermissions', () => {
  it('returns true when user has all permissions', () => {
    const mockProfile: UserProfile = {
      id: 'user-14',
      role: 'admin',
      email_verified: true,
      onboarding_complete: true,
    };

    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() =>
      useHasAllPermissions(['canManageUsers', 'canViewAdminPanel', 'canManageBilling'])
    );

    expect(result.current).toBe(true);
  });

  it('returns false when user lacks even one permission', () => {
    const mockProfile: UserProfile = {
      id: 'user-15',
      role: 'support',
      email_verified: true,
      onboarding_complete: true,
    };

    mockUseAuth.mockReturnValue({
      profile: mockProfile,
      isAuthenticated: true,
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() =>
      useHasAllPermissions(['canViewAdminPanel', 'canManageUsers'])
    );

    expect(result.current).toBe(false); // Lacks canManageUsers
  });
});
