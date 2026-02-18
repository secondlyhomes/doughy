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
  error?: string;
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
 * Uses Promise.all for parallel queries to improve performance
 */
export async function getAdminStats(): Promise<AdminStatsResult> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Execute all count queries in parallel for better performance
    // Note: totalUsers and activeUsers are currently identical since we don't have last_sign_in_at tracking
    // When activity tracking is added, activeUsers should filter by recent sign-in (e.g., last 30 days)
    const [
      totalUsersResult,
      totalLeadsResult,
      totalPropertiesResult,
      newUsersThisWeekResult,
      newLeadsThisWeekResult,
    ] = await Promise.all([
      // Get total users (excluding deleted)
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false),

      // Get total leads
      supabase
        .schema('crm').from('leads')
        .select('*', { count: 'exact', head: true }),

      // Get total properties
      supabase
        .schema('investor').from('properties')
        .select('*', { count: 'exact', head: true }),

      // Get new users this week
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())
        .eq('is_deleted', false),

      // Get new leads this week
      supabase
        .schema('crm').from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
    ]);

    // Check for errors
    if (totalUsersResult.error) throw totalUsersResult.error;
    if (totalLeadsResult.error) throw totalLeadsResult.error;
    if (totalPropertiesResult.error) throw totalPropertiesResult.error;
    if (newUsersThisWeekResult.error) throw newUsersThisWeekResult.error;
    if (newLeadsThisWeekResult.error) throw newLeadsThisWeekResult.error;

    return {
      success: true,
      stats: {
        totalUsers: totalUsersResult.count || 0,
        // activeUsers currently equals totalUsers until we add last_sign_in_at tracking
        activeUsers: totalUsersResult.count || 0,
        totalLeads: totalLeadsResult.count || 0,
        totalProperties: totalPropertiesResult.count || 0,
        newUsersThisWeek: newUsersThisWeekResult.count || 0,
        newLeadsThisWeek: newLeadsThisWeekResult.count || 0,
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
  try {
    const systems: SystemHealth[] = [];
    const now = new Date().toISOString();

    // Check Database connection
    try {
      const start = Date.now();
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      const latency = Date.now() - start;

      systems.push({
        name: 'Database',
        status: error ? 'outage' : latency > 1000 ? 'degraded' : 'operational',
        latency,
        lastChecked: now,
      });
    } catch (error) {
      console.error('[admin] Database health check failed:', error);
      systems.push({
        name: 'Database',
        status: 'outage',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error',
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
    } catch (error) {
      console.error('[admin] Auth health check failed:', error);
      systems.push({
        name: 'Authentication',
        status: 'outage',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error',
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
    } catch (error) {
      console.error('[admin] Storage health check failed:', error);
      systems.push({
        name: 'Storage',
        status: 'degraded',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Add API status (always operational if we got here)
    systems.unshift({
      name: 'API Server',
      status: 'operational',
      lastChecked: now,
    });

    // Check if all backend systems are in outage (excluding API Server)
    const backendSystems = systems.filter((s) => s.name !== 'API Server');
    const allBackendFailed = backendSystems.every((s) => s.status === 'outage');

    return {
      success: !allBackendFailed,
      systems,
      error: allBackendFailed ? 'All backend systems are experiencing outages' : undefined,
    };
  } catch (error) {
    console.error('[admin] Unexpected error in getSystemHealth:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check system health',
    };
  }
}
