// src/features/admin/services/adminService.ts
// Admin service for dashboard stats and system health

import { supabase } from '@/lib/supabase';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalProperties: number;
  newUsersThisWeek: number;
  newLeadsThisWeek: number;
}

export interface SystemHealth {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency?: number;
  lastChecked: string;
}

export interface AdminStatsResult {
  success: boolean;
  stats?: AdminStats;
  error?: string;
}

export interface SystemHealthResult {
  success: boolean;
  systems?: SystemHealth[];
  error?: string;
}

/**
 * Fetch admin dashboard stats
 */
export async function getAdminStats(): Promise<AdminStatsResult> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get total users (excluding deleted)
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (usersError) throw usersError;

    // Get active users (not deleted)
    // Note: We count non-deleted users as "active" since we don't have last_sign_in_at
    const { count: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (activeError) throw activeError;

    // Get total leads
    const { count: totalLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadsError) throw leadsError;

    // Get total properties
    const { count: totalProperties, error: propertiesError } = await supabase
      .from('re_properties')
      .select('*', { count: 'exact', head: true });

    if (propertiesError) throw propertiesError;

    // Get new users this week
    const { count: newUsersThisWeek, error: newUsersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())
      .eq('is_deleted', false);

    if (newUsersError) throw newUsersError;

    // Get new leads this week
    const { count: newLeadsThisWeek, error: newLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    if (newLeadsError) throw newLeadsError;

    return {
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalLeads: totalLeads || 0,
        totalProperties: totalProperties || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newLeadsThisWeek: newLeadsThisWeek || 0,
      },
    };
  } catch (error) {
    console.error('[admin] Error fetching stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}

/**
 * Check system health status
 */
export async function getSystemHealth(): Promise<SystemHealthResult> {
  const systems: SystemHealth[] = [];
  const now = new Date().toISOString();

  // Check Database connection
  try {
    const start = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = Date.now() - start;

    systems.push({
      name: 'Database',
      status: error ? 'outage' : latency > 1000 ? 'degraded' : 'operational',
      latency,
      lastChecked: now,
    });
  } catch {
    systems.push({
      name: 'Database',
      status: 'outage',
      lastChecked: now,
    });
  }

  // Check Auth service
  try {
    const start = Date.now();
    const { error } = await supabase.auth.getSession();
    const latency = Date.now() - start;

    systems.push({
      name: 'Authentication',
      status: error ? 'degraded' : 'operational',
      latency,
      lastChecked: now,
    });
  } catch {
    systems.push({
      name: 'Authentication',
      status: 'outage',
      lastChecked: now,
    });
  }

  // Check Storage
  try {
    const start = Date.now();
    const { error } = await supabase.storage.listBuckets();
    const latency = Date.now() - start;

    systems.push({
      name: 'Storage',
      status: error ? 'degraded' : 'operational',
      latency,
      lastChecked: now,
    });
  } catch {
    systems.push({
      name: 'Storage',
      status: 'degraded',
      lastChecked: now,
    });
  }

  // Add API status (always operational if we got here)
  systems.unshift({
    name: 'API Server',
    status: 'operational',
    lastChecked: now,
  });

  return {
    success: true,
    systems,
  };
}
