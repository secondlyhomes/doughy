// src/features/settings/services/landlord-seeder/helpers.ts
// Helper functions for landlord seeding

import { supabase } from '@/lib/supabase';

/**
 * Get the current authenticated user's ID
 * @throws Error if user is not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

/**
 * Ensures the user has a workspace for multi-tenancy.
 * Creates one if it doesn't exist.
 */
export async function ensureUserHasWorkspace(userId: string): Promise<string> {
  // Check if user already has a workspace
  const { data: existingMembership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (existingMembership?.workspace_id) {
    return existingMembership.workspace_id;
  }

  // Create a new workspace for the user
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: 'My Workspace',
      owner_id: userId,
    })
    .select()
    .single();

  if (workspaceError) {
    throw new Error(`Failed to create workspace: ${workspaceError.message}`);
  }

  // Add user as owner member
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
      is_active: true,
    });

  if (memberError) {
    throw new Error(`Failed to add workspace member: ${memberError.message}`);
  }

  console.log('Created workspace:', workspace.id);
  return workspace.id;
}
