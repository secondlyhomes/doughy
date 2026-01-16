// src/features/admin/services/userService.ts
// User management service for admin

import { supabase } from '@/lib/supabase';

// Use actual DB role types - no mapping needed
export type UserRole = 'admin' | 'standard' | 'user' | 'support';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserListResult {
  success: boolean;
  users?: AdminUser[];
  total?: number;
  error?: string;
}

export interface UserResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | 'all';
  includeDeleted?: boolean;
  sortBy?: 'created_at' | 'email' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Get display label for role
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'support':
      return 'Support';
    case 'standard':
      return 'Standard';
    case 'user':
    default:
      return 'User';
  }
}

/**
 * Check if role has admin privileges
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'support';
}

/**
 * Sanitize search input to prevent injection
 */
function sanitizeSearchInput(input: string): string {
  // Remove special characters that could affect the query
  // Allow alphanumeric, spaces, @, ., -, _
  return input.replace(/[^a-zA-Z0-9\s@.\-_]/g, '').trim();
}

/**
 * Fetch list of users with optional filtering
 */
export async function getUsers(filters: UserFilters = {}): Promise<UserListResult> {
  try {
    const {
      search,
      role = 'all',
      includeDeleted = false,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });

    // Filter deleted users unless explicitly requested
    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    // Apply search filter with sanitized input
    if (search) {
      const sanitized = sanitizeSearchInput(search);
      if (sanitized.length > 0) {
        query = query.or(`email.ilike.%${sanitized}%,name.ilike.%${sanitized}%`);
      }
    }

    // Apply role filter - use actual DB role value
    if (role !== 'all') {
      query = query.eq('role', role);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    const users: AdminUser[] = (data || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || (u.first_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : null),
      role: u.role as UserRole,
      isDeleted: u.is_deleted ?? false,
      createdAt: u.created_at || new Date().toISOString(),
      updatedAt: u.updated_at,
    }));

    return {
      success: true,
      users,
      total: count || 0,
    };
  } catch (error) {
    console.error('[admin] Error fetching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}

/**
 * Fetch single user by ID
 */
export async function getUserById(userId: string): Promise<UserResult> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const user: AdminUser = {
      id: data.id,
      email: data.email,
      name: data.name || (data.first_name ? `${data.first_name || ''} ${data.last_name || ''}`.trim() : null),
      role: data.role as UserRole,
      isDeleted: data.is_deleted ?? false,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at,
    };

    return { success: true, user };
  } catch (error) {
    console.error('[admin] Error fetching user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    };
  }
}

/**
 * Restore a soft-deleted user
 */
export async function restoreUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_deleted: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore user',
    };
  }
}

/**
 * Soft delete user (sets is_deleted to true)
 * This is reversible via restoreUser
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}
