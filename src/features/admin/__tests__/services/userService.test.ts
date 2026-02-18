// Tests for userService.ts
import {
  getRoleLabel,
  isAdminRole,
  getUsers,
  getUserById,
  updateUserRole,
  restoreUser,
  deleteUser,
  type UserRole,
} from '../../services/userService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoleLabel', () => {
    it('returns "Admin" for admin role', () => {
      expect(getRoleLabel('admin')).toBe('Admin');
    });

    it('returns "Support" for support role', () => {
      expect(getRoleLabel('support')).toBe('Support');
    });

    it('returns "Standard" for standard role', () => {
      expect(getRoleLabel('standard')).toBe('Standard');
    });

    it('returns "User" for user role', () => {
      expect(getRoleLabel('user')).toBe('User');
    });

    it('returns "User" for unknown role (default case)', () => {
      expect(getRoleLabel('unknown' as UserRole)).toBe('User');
    });
  });

  describe('isAdminRole', () => {
    it('returns true for admin role', () => {
      expect(isAdminRole('admin')).toBe(true);
    });

    it('returns true for support role', () => {
      expect(isAdminRole('support')).toBe(true);
    });

    it('returns false for standard role', () => {
      expect(isAdminRole('standard')).toBe(false);
    });

    it('returns false for user role', () => {
      expect(isAdminRole('user')).toBe(false);
    });
  });

  describe('getUsers', () => {
    const mockUserData = [
      {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        first_name: null,
        last_name: null,
        role: 'user',
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    it('fetches users with default filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUserData, count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.success).toBe(true);
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
    });

    it('applies search filter with sanitized input', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUserData, count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getUsers({ search: 'test@example.com' });

      expect(mockQuery.or).toHaveBeenCalled();
    });

    it('sanitizes dangerous characters from search input', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getUsers({ search: "test'; DROP TABLE users;--" });

      // The dangerous characters should be stripped
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('test DROP TABLE users')
      );
    });

    it('skips search filter if sanitized input is empty', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      // Use only special characters that sanitize completely removes (not allowed: alphanumeric, @, ., -, _)
      await getUsers({ search: "';+*#$" });

      // Should not call or() since sanitized input is empty
      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it('applies role filter when not "all"', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getUsers({ role: 'admin' });

      expect(mockQuery.eq).toHaveBeenCalledWith('role', 'admin');
    });

    it('includes deleted users when includeDeleted is true', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getUsers({ includeDeleted: true });

      // Should not call eq with is_deleted
      const eqCalls = mockQuery.eq.mock.calls;
      const hasDeletedFilter = eqCalls.some((call: unknown[]) => call[0] === 'is_deleted');
      expect(hasDeletedFilter).toBe(false);
    });

    it('applies sorting parameters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getUsers({ sortBy: 'email', sortOrder: 'asc' });

      expect(mockQuery.order).toHaveBeenCalledWith('email', { ascending: true });
    });

    it('applies pagination', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getUsers({ page: 2, limit: 10 });

      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
    });

    it('uses first_name and last_name when name is null', async () => {
      const userWithFirstLast = {
        id: 'user-2',
        email: 'first@example.com',
        name: null,
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [userWithFirstLast], count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.users![0].name).toBe('John Doe');
    });

    it('handles missing is_deleted field', async () => {
      const userWithoutDeleted = {
        id: 'user-3',
        email: 'no-deleted@example.com',
        name: 'No Deleted',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [userWithoutDeleted], count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.users![0].isDeleted).toBe(false);
    });

    it('handles missing created_at field', async () => {
      const userWithoutCreatedAt = {
        id: 'user-4',
        email: 'no-created@example.com',
        name: 'No Created',
        role: 'user',
        is_deleted: false,
        updated_at: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [userWithoutCreatedAt], count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.users![0].createdAt).toBeDefined();
    });

    it('returns error on database failure', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, count: null, error: new Error('DB Error') }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Error');
    });

    it('returns generic error message for non-Error objects', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockRejectedValue('String error'),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch users');
    });

    it('handles null data gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, count: null, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUsers();

      expect(result.success).toBe(true);
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getUserById', () => {
    it('fetches user by ID successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUserById('user-1');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.id).toBe('user-1');
    });

    it('uses first_name and last_name when name is null', async () => {
      const mockUser = {
        id: 'user-2',
        email: 'test@example.com',
        name: null,
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'user',
        is_deleted: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUserById('user-2');

      expect(result.user!.name).toBe('Jane Smith');
    });

    it('returns error on database failure', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUserById('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });

    it('handles non-Error objects', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue('String error'),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getUserById('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch user');
    });
  });

  describe('updateUserRole', () => {
    it('updates user role successfully', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await updateUserRole('user-1', 'admin');

      expect(result.success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      );
    });

    it('returns error on database failure', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await updateUserRole('user-1', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });

    it('handles non-Error objects', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue('String error'),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await updateUserRole('user-1', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update role');
    });
  });

  describe('restoreUser', () => {
    it('restores user successfully', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await restoreUser('user-1');

      expect(result.success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_deleted: false })
      );
    });

    it('returns error on database failure', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Restore failed') }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await restoreUser('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Restore failed');
    });

    it('handles non-Error objects', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue('String error'),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await restoreUser('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to restore user');
    });
  });

  describe('deleteUser', () => {
    it('soft deletes user successfully', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await deleteUser('user-1');

      expect(result.success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_deleted: true })
      );
    });

    it('returns error on database failure', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await deleteUser('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });

    it('handles non-Error objects', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue('String error'),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await deleteUser('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete user');
    });
  });
});
