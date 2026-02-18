/**
 * Test Suite: Authentication Flow Integration
 * Description: End-to-end tests for user registration, login, and profile creation
 * Phase: 5 - Testing & Documentation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SECRET_KEY = Deno.env.get('SUPABASE_SECRET_KEY') || '';

// Helper to generate unique test email
function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

Deno.test('Auth Flow: User signup creates profile automatically', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();

  try {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test-password-123!@#',
    });

    assertEquals(authError, null, 'Signup should succeed without errors');
    assertExists(authData.user, 'User should be created');
    assertExists(authData.user?.id, 'User should have an ID');

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was auto-created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user!.id)
      .single();

    assertEquals(profileError, null, 'Profile query should succeed');
    assertExists(profile, 'Profile should be auto-created');
    assertEquals(profile.id, authData.user!.id, 'Profile ID should match user ID');
    assertEquals(profile.email, testEmail, 'Profile email should match');
    assertEquals(profile.role, 'user', 'Default role should be "user"');
  } finally {
    // Cleanup: Delete test user (requires service role key)
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});

Deno.test('Auth Flow: User can login with correct credentials', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();
  const testPassword = 'test-password-123!@#';

  try {
    // Create test user
    const { data: signupData } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    assertExists(signupData.user, 'User should be created');

    // Sign out
    await supabase.auth.signOut();

    // Sign in with credentials
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    assertEquals(loginError, null, 'Login should succeed');
    assertExists(loginData.user, 'Should return user on successful login');
    assertExists(loginData.session, 'Should return session on successful login');
    assertEquals(loginData.user?.email, testEmail, 'Logged in user should match');
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});

Deno.test('Auth Flow: User cannot login with incorrect password', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();
  const testPassword = 'test-password-123!@#';

  try {
    // Create test user
    await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    // Sign out
    await supabase.auth.signOut();

    // Try to sign in with wrong password
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'wrong-password',
    });

    assertExists(loginError, 'Should return error for wrong password');
    assertEquals(loginData.user, null, 'Should not return user for wrong password');
    assertEquals(loginData.session, null, 'Should not return session for wrong password');
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});

Deno.test('Auth Flow: User can view their own profile', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();

  try {
    // Create and login test user
    const { data: authData } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test-password-123!@#',
    });

    assertExists(authData.user, 'User should be created');

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Query own profile (should succeed due to RLS policy)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user!.id)
      .single();

    assertEquals(profileError, null, 'User should be able to view own profile');
    assertExists(profile, 'Profile should exist');
    assertEquals(profile.email, testEmail, 'Profile should match user');
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});

Deno.test('Auth Flow: User cannot view other users profiles', async () => {
  const supabase1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const supabase2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail1 = generateTestEmail();
  const testEmail2 = generateTestEmail();

  try {
    // Create two test users
    const { data: user1Data } = await supabase1.auth.signUp({
      email: testEmail1,
      password: 'test-password-123!@#',
    });

    const { data: user2Data } = await supabase2.auth.signUp({
      email: testEmail2,
      password: 'test-password-123!@#',
    });

    assertExists(user1Data.user, 'User 1 should be created');
    assertExists(user2Data.user, 'User 2 should be created');

    // Wait for triggers
    await new Promise(resolve => setTimeout(resolve, 1000));

    // User 1 tries to view User 2's profile (should fail due to RLS)
    const { data: otherProfile, error: otherProfileError } = await supabase1
      .from('user_profiles')
      .select('*')
      .eq('id', user2Data.user!.id)
      .single();

    // Should either return null or error due to RLS
    assertEquals(
      otherProfile === null || otherProfileError !== null,
      true,
      'User should not be able to view other users profiles'
    );
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();

      for (const email of [testEmail1, testEmail2]) {
        const testUser = users?.users.find(u => u.email === email);
        if (testUser) {
          await adminClient.auth.admin.deleteUser(testUser.id);
        }
      }
    }
  }
});

Deno.test('Auth Flow: User can update their own profile', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();

  try {
    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test-password-123!@#',
    });

    assertExists(authData.user, 'User should be created');

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update own profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ full_name: 'Test User' })
      .eq('id', authData.user!.id)
      .select()
      .single();

    assertEquals(updateError, null, 'User should be able to update own profile');
    assertExists(updatedProfile, 'Updated profile should be returned');
    assertEquals(updatedProfile.full_name, 'Test User', 'Full name should be updated');
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});

Deno.test('Auth Flow: User cannot escalate their own role', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();

  try {
    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test-password-123!@#',
    });

    assertExists(authData.user, 'User should be created');

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to escalate role to admin (should fail due to RLS policy)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user!.id);

    assertExists(updateError, 'Should not allow user to escalate own role');

    // Verify role is still 'user'
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', authData.user!.id)
      .single();

    assertEquals(profile?.role, 'user', 'Role should remain as "user"');
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});

Deno.test('Auth Flow: Session persists across requests', async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const testEmail = generateTestEmail();
  const testPassword = 'test-password-123!@#';

  try {
    // Create and login test user
    await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    const { data: loginData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    assertExists(loginData.session, 'Should have session after login');

    // Get current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    assertExists(currentSession, 'Session should persist');
    assertEquals(
      currentSession?.access_token,
      loginData.session?.access_token,
      'Session token should match'
    );
  } finally {
    // Cleanup
    if (SUPABASE_SECRET_KEY) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      const { data: users } = await adminClient.auth.admin.listUsers();
      const testUser = users?.users.find(u => u.email === testEmail);
      if (testUser) {
        await adminClient.auth.admin.deleteUser(testUser.id);
      }
    }
  }
});
