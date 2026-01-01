# ZONE B: Auth, Admin & Settings - Stage 3

**Instance 2 Assignment | Priority: HIGH**

---

## Before You Begin

### Required Reading
1. Read `EXPO_UNIVERSAL_MASTER_PLAN.md` first
2. Read this document completely
3. Check Zone A progress for UI component availability

### Your Mission
Implement all authentication, admin panel, settings, billing, and team management features from the web app.

### Dependencies on Zone A
You need these components from Zone A:
- Button, Input, Select, Checkbox, Switch (Phase 1 - wait for these)
- Dialog, Sheet, Card, Tabs (Phase 2)
- Toast, Alert (Phase 3)

**Start with business logic (hooks, services) while waiting for UI components.**

---

## Source Files Reference

| Feature | Web Source | File Count |
|---------|------------|------------|
| Auth | `/Users/dinosaur/Documents/doughy-ai/src/features/auth/` | 81 files |
| Admin | `/Users/dinosaur/Documents/doughy-ai/src/features/admin/` | 58 files |
| Settings | `/Users/dinosaur/Documents/doughy-ai/src/features/settings/` | 7 files |
| Billing | `/Users/dinosaur/Documents/doughy-ai/src/features/billing/` | 20 files |
| Teams | `/Users/dinosaur/Documents/doughy-ai/src/features/teams/` | 8 files |
| Pricing | `/Users/dinosaur/Documents/doughy-ai/src/features/pricing/` | 8 files |
| Notifications | `/Users/dinosaur/Documents/doughy-ai/src/features/notifications/` | 1 file |

---

## Current Status

### Already Completed (Stage 1-2)
- [x] LoginScreen - basic implementation
- [x] SignupScreen - basic implementation
- [x] ForgotPasswordScreen - basic implementation
- [x] AuthProvider - Supabase auth context
- [x] useAuth hook - basic auth operations
- [x] SettingsScreen - placeholder
- [x] ProfileScreen - placeholder
- [x] AdminDashboardScreen - placeholder

### Needs Full Implementation
- [ ] Complete auth flow (verification, onboarding)
- [ ] Profile management
- [ ] Full admin panel
- [ ] Billing/subscription
- [ ] Team management
- [ ] Notifications

---

## Phase 1: Complete Auth Flow (CRITICAL)

### 1.1 Email Verification

**Web Files:**
- `src/features/auth/pages/VerifyEmail.tsx`
- `src/features/auth/services/emailVerificationService.ts`

**Create:**
```
src/features/auth/
├── screens/
│   ├── VerifyEmailScreen.tsx       [ ] - Check email prompt
│   └── EmailVerifiedScreen.tsx     [ ] - Success confirmation
├── services/
│   └── emailVerificationService.ts [ ] - Verification API calls
```

**VerifyEmailScreen Requirements:**
- Show "Check your email" message
- Resend verification email button
- Auto-check verification status
- Navigate to app on verification

**Checklist:**
- [ ] Screen displays correctly
- [ ] Resend button works
- [ ] Auto-checks verification
- [ ] Navigates on success

### 1.2 Onboarding Survey

**Web Files:**
- `src/features/auth/components/onboarding/OnboardingSurvey.tsx`
- `src/features/auth/components/onboarding/SurveyStep*.tsx`
- `src/features/auth/services/onboardingService.ts`

**Create:**
```
src/features/auth/
├── screens/
│   └── OnboardingScreen.tsx        [ ] - Multi-step survey
├── components/
│   ├── OnboardingProgress.tsx      [ ] - Step indicator
│   ├── OnboardingStep.tsx          [ ] - Single step wrapper
│   ├── SurveyQuestion.tsx          [ ] - Question display
│   └── SurveyOptions.tsx           [ ] - Answer options
├── services/
│   └── onboardingService.ts        [ ] - Save survey responses
```

**OnboardingScreen Requirements:**
- Multi-step survey flow
- Progress indicator
- Save answers on each step
- Skip option (if allowed)
- Navigate to dashboard on complete

**Survey Questions (from web):**
1. How did you hear about us?
2. What's your primary use case?
3. What's your experience level?
4. Company size (optional)

**Checklist:**
- [ ] All steps render
- [ ] Progress indicator works
- [ ] Answers save correctly
- [ ] Navigation on complete

### 1.3 Password Reset Complete Flow

**Web Files:**
- `src/features/auth/pages/ResetPassword.tsx`
- `src/features/auth/services/passwordResetService.ts`

**Create:**
```
src/features/auth/
├── screens/
│   └── ResetPasswordScreen.tsx     [ ] - New password form
├── services/
│   └── passwordResetService.ts     [ ] - Reset API calls
```

**ResetPasswordScreen Requirements:**
- Receives token from deep link
- New password + confirm password fields
- Password strength indicator
- Success message and redirect

**Checklist:**
- [ ] Deep link opens screen
- [ ] Password validation works
- [ ] Reset API call succeeds
- [ ] Redirects to login

### 1.4 MFA Setup (Multi-Factor Authentication)

**Web Files:**
- `src/features/auth/components/mfa/MFASetup.tsx`
- `src/features/auth/services/mfaService.ts`

**Create:**
```
src/features/auth/
├── screens/
│   ├── MFASetupScreen.tsx          [ ] - Enable MFA flow
│   └── MFAVerifyScreen.tsx         [ ] - Enter MFA code
├── components/
│   └── MFACodeInput.tsx            [ ] - 6-digit code input
├── services/
│   └── mfaService.ts               [ ] - MFA API calls
```

**Checklist:**
- [ ] QR code displays (for authenticator apps)
- [ ] Code verification works
- [ ] Backup codes shown
- [ ] Login requires MFA when enabled

### 1.5 Auth Guards

**Create:**
```
src/features/auth/
├── guards/
│   ├── AuthGuard.tsx               [ ] - Require authentication
│   ├── AdminGuard.tsx              [ ] - Require admin role
│   ├── EmailVerifiedGuard.tsx      [ ] - Require verified email
│   └── OnboardingGuard.tsx         [ ] - Require completed onboarding
```

**AuthGuard Example:**
```tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

**Checklist:**
- [ ] AuthGuard blocks unauthenticated
- [ ] AdminGuard checks role
- [ ] EmailVerifiedGuard works
- [ ] OnboardingGuard works

---

## Phase 2: Profile & Settings

### 2.1 Profile Management

**Web Files:**
- `src/features/auth/pages/Profile.tsx`
- `src/features/auth/components/profile/ProfileForm.tsx`
- `src/features/auth/components/profile/AvatarUpload.tsx`

**Create:**
```
src/features/settings/
├── screens/
│   ├── ProfileScreen.tsx           [ ] - View/edit profile
│   ├── EditProfileScreen.tsx       [ ] - Dedicated edit form
│   └── ChangePasswordScreen.tsx    [ ] - Change password
├── components/
│   ├── ProfileHeader.tsx           [ ] - Avatar + name display
│   ├── ProfileField.tsx            [ ] - Editable field
│   ├── AvatarPicker.tsx            [ ] - Image picker for avatar
│   └── ProfileForm.tsx             [ ] - Full profile form
├── hooks/
│   └── useProfile.ts               [ ] - Profile data hook
├── services/
│   └── profileService.ts           [ ] - Profile API calls
```

**ProfileScreen Requirements:**
- Display user info (name, email, phone)
- Avatar with edit option
- Edit button to EditProfileScreen
- Logout button

**EditProfileScreen Requirements:**
- Form with all profile fields
- Avatar upload
- Save and cancel buttons
- Validation

**ChangePasswordScreen Requirements:**
- Current password field
- New password + confirm
- Password strength indicator
- Success toast

**Checklist:**
- [ ] Profile displays correctly
- [ ] Avatar upload works
- [ ] Profile edits save
- [ ] Password change works

### 2.2 App Settings

**Create:**
```
src/features/settings/
├── screens/
│   ├── SettingsScreen.tsx          [ ] - Settings list (enhance existing)
│   ├── AppearanceScreen.tsx        [ ] - Theme settings
│   ├── NotificationsScreen.tsx     [ ] - Push notification settings
│   ├── PrivacyScreen.tsx           [ ] - Privacy settings
│   ├── SecurityScreen.tsx          [ ] - Security options
│   ├── DataExportScreen.tsx        [ ] - Export user data
│   └── AboutScreen.tsx             [ ] - App info, version
├── components/
│   ├── SettingsSection.tsx         [ ] - Section header + items
│   ├── SettingsItem.tsx            [ ] - Single setting row
│   └── SettingsToggle.tsx          [ ] - Toggle setting
```

**SettingsScreen Requirements:**
- Sections: Account, Appearance, Notifications, Privacy, Security, About
- Navigate to sub-screens
- Quick toggles where appropriate

**AppearanceScreen Requirements:**
- Theme selection (Light/Dark/System)
- Preview of theme
- Persists preference

**Checklist:**
- [ ] All settings sections render
- [ ] Navigation to sub-screens works
- [ ] Theme switching works
- [ ] Settings persist

---

## Phase 3: Admin Dashboard

### 3.1 Admin Overview

**Web Files:**
- `src/features/admin/pages/AdminDashboard.tsx`
- `src/features/admin/components/AdminStats.tsx`
- `src/features/admin/components/SystemHealth.tsx`

**Create:**
```
src/features/admin/
├── screens/
│   └── AdminDashboardScreen.tsx    [ ] - Enhance existing
├── components/
│   ├── AdminStatCard.tsx           [ ] - Single stat display
│   ├── AdminStatsGrid.tsx          [ ] - Grid of stats
│   ├── SystemHealthCard.tsx        [ ] - System status
│   ├── QuickActionButton.tsx       [ ] - Admin action button
│   └── AdminQuickActions.tsx       [ ] - Action buttons grid
├── hooks/
│   ├── useAdminStats.ts            [ ] - Dashboard stats
│   └── useSystemHealth.ts          [ ] - System health data
```

**AdminDashboardScreen Requirements:**
- Total users, leads, properties stats
- System health indicators
- Quick action buttons (Users, Logs, Settings)
- Recent activity feed

**Checklist:**
- [ ] Stats load and display
- [ ] Health indicators work
- [ ] Quick actions navigate
- [ ] Role-gated (admin only)

### 3.2 User Management

**Web Files:**
- `src/features/admin/pages/AdminUsers.tsx`
- `src/features/admin/components/users/UserTable.tsx`
- `src/features/admin/components/users/UserDetails.tsx`

**Create:**
```
src/features/admin/
├── screens/
│   ├── UserManagementScreen.tsx    [ ] - User list
│   ├── UserDetailScreen.tsx        [ ] - Single user detail
│   └── EditUserScreen.tsx          [ ] - Edit user form
├── components/
│   ├── UserCard.tsx                [ ] - User list item
│   ├── UserRoleBadge.tsx           [ ] - Role display
│   ├── UserStatusBadge.tsx         [ ] - Active/inactive
│   ├── UserActionSheet.tsx         [ ] - Actions menu
│   └── UserSearchBar.tsx           [ ] - Search users
├── hooks/
│   ├── useUsers.ts                 [ ] - Users list hook
│   └── useUser.ts                  [ ] - Single user hook
├── services/
│   └── userService.ts              [ ] - User management API
```

**UserManagementScreen Requirements:**
- FlatList of users
- Search/filter functionality
- Pull to refresh
- Tap to view detail

**UserDetailScreen Requirements:**
- User info display
- Edit, deactivate, delete actions
- Activity log for user
- Role management

**Checklist:**
- [ ] User list loads
- [ ] Search works
- [ ] User detail shows
- [ ] Role changes work
- [ ] User status toggle works

### 3.3 System Logs

**Web Files:**
- `src/features/admin/pages/AdminLogs.tsx`
- `src/features/admin/components/LiveLogs.tsx`

**Create:**
```
src/features/admin/
├── screens/
│   └── SystemLogsScreen.tsx        [ ] - Log viewer
├── components/
│   ├── LogItem.tsx                 [ ] - Single log entry
│   ├── LogFilters.tsx              [ ] - Filter controls
│   └── LogLevelBadge.tsx           [ ] - Level indicator
├── hooks/
│   └── useLogs.ts                  [ ] - Logs data hook
```

**SystemLogsScreen Requirements:**
- Scrollable log list
- Filter by level (info, warn, error)
- Filter by date range
- Search logs

**Checklist:**
- [ ] Logs load and display
- [ ] Level filtering works
- [ ] Search works
- [ ] Auto-refresh (optional)

### 3.4 Integrations

**Web Files:**
- `src/features/admin/pages/AdminIntegrations.tsx`
- `src/features/admin/components/integrations/*.tsx`

**Create:**
```
src/features/admin/
├── screens/
│   ├── IntegrationsScreen.tsx      [ ] - Integrations list
│   └── IntegrationDetailScreen.tsx [ ] - Single integration
├── components/
│   ├── IntegrationCard.tsx         [ ] - Integration item
│   ├── IntegrationStatus.tsx       [ ] - Connected status
│   └── IntegrationConfig.tsx       [ ] - Config form
```

**Checklist:**
- [ ] Integrations list displays
- [ ] Connection status shows
- [ ] Config saves correctly

---

## Phase 4: Billing & Subscription

### 4.1 Subscription Overview

**Web Files:**
- `src/features/billing/pages/Subscription.tsx`
- `src/features/billing/components/PlanCard.tsx`
- `src/features/billing/components/UsageStats.tsx`

**Create:**
```
src/features/billing/
├── screens/
│   ├── SubscriptionScreen.tsx      [ ] - Current subscription
│   ├── PlansScreen.tsx             [ ] - View all plans
│   └── UpgradeScreen.tsx           [ ] - Upgrade flow
├── components/
│   ├── CurrentPlanCard.tsx         [ ] - Current plan display
│   ├── PlanCard.tsx                [ ] - Single plan option
│   ├── PlanComparison.tsx          [ ] - Compare features
│   ├── UsageProgressBar.tsx        [ ] - Usage display
│   └── BillingHistoryItem.tsx      [ ] - Invoice item
├── hooks/
│   ├── useSubscription.ts          [ ] - Current subscription
│   ├── usePlans.ts                 [ ] - Available plans
│   └── useUsage.ts                 [ ] - Usage stats
├── services/
│   └── billingService.ts           [ ] - Billing API calls
```

**SubscriptionScreen Requirements:**
- Current plan display
- Usage statistics
- Upgrade button
- Billing history link

**PlansScreen Requirements:**
- All plans with features
- Highlight current plan
- Upgrade/downgrade options

**Checklist:**
- [ ] Current plan displays
- [ ] Usage stats accurate
- [ ] Plans list renders
- [ ] Upgrade flow works

### 4.2 Payment Methods

**Web Files:**
- `src/features/billing/components/PaymentMethods.tsx`
- `src/features/billing/components/AddPaymentMethod.tsx`

**Create:**
```
src/features/billing/
├── screens/
│   ├── PaymentMethodsScreen.tsx    [ ] - Saved payment methods
│   └── AddPaymentScreen.tsx        [ ] - Add new card
├── components/
│   ├── PaymentMethodCard.tsx       [ ] - Card display
│   ├── CardForm.tsx                [ ] - Card input form
│   └── DefaultBadge.tsx            [ ] - Default indicator
├── services/
│   └── stripeService.ts            [ ] - Stripe integration
```

**Notes:**
- Use `@stripe/stripe-react-native` for payment processing
- Or implement with Stripe web views

**Checklist:**
- [ ] Payment methods list
- [ ] Add new card works
- [ ] Set default works
- [ ] Delete card works

---

## Phase 5: Team Management

### 5.1 Team Settings

**Web Files:**
- `src/features/teams/pages/TeamSettings.tsx`
- `src/features/teams/components/*.tsx`

**Create:**
```
src/features/teams/
├── screens/
│   ├── TeamSettingsScreen.tsx      [ ] - Team overview
│   ├── TeamMembersScreen.tsx       [ ] - Member list
│   ├── InviteMemberScreen.tsx      [ ] - Send invite
│   └── MemberDetailScreen.tsx      [ ] - Member permissions
├── components/
│   ├── TeamHeader.tsx              [ ] - Team name + logo
│   ├── MemberCard.tsx              [ ] - Team member item
│   ├── RoleSelector.tsx            [ ] - Role picker
│   ├── InviteForm.tsx              [ ] - Invite form
│   └── PendingInvites.tsx          [ ] - Pending invitations
├── hooks/
│   ├── useTeam.ts                  [ ] - Team data
│   ├── useTeamMembers.ts           [ ] - Members list
│   └── useInvites.ts               [ ] - Pending invites
├── services/
│   └── teamService.ts              [ ] - Team API calls
```

**TeamMembersScreen Requirements:**
- List of team members
- Role badges
- Invite button
- Remove member option

**InviteMemberScreen Requirements:**
- Email input
- Role selection
- Send invite button

**Checklist:**
- [ ] Members list displays
- [ ] Invite flow works
- [ ] Role changes work
- [ ] Remove member works

---

## Shared Hooks & Services

### Hooks to Create

```
src/features/auth/hooks/
├── useAuth.ts                      [x] Exists - enhance
├── useProfile.ts                   [ ] Profile data
├── usePermissions.ts               [ ] Role-based permissions
├── useAuthLoading.ts               [ ] Loading states

src/features/admin/hooks/
├── useAdminStats.ts                [ ] Dashboard metrics
├── useUsers.ts                     [ ] User management
├── useSystemHealth.ts              [ ] System status
├── useLogs.ts                      [ ] System logs

src/features/billing/hooks/
├── useSubscription.ts              [ ] Current subscription
├── usePlans.ts                     [ ] Available plans
├── useUsage.ts                     [ ] Usage statistics
├── usePaymentMethods.ts            [ ] Saved cards

src/features/teams/hooks/
├── useTeam.ts                      [ ] Team data
├── useTeamMembers.ts               [ ] Members list
├── useInvites.ts                   [ ] Pending invites
```

### Services to Create

```
src/features/auth/services/
├── authService.ts                  [ ] Auth API calls
├── profileService.ts               [ ] Profile updates
├── emailVerificationService.ts     [ ] Email verification
├── passwordResetService.ts         [ ] Password reset
├── mfaService.ts                   [ ] MFA operations
├── onboardingService.ts            [ ] Onboarding survey

src/features/admin/services/
├── adminService.ts                 [ ] Admin API calls
├── userService.ts                  [ ] User management
├── logsService.ts                  [ ] Logs API

src/features/billing/services/
├── billingService.ts               [ ] Billing API calls
├── stripeService.ts                [ ] Stripe integration

src/features/teams/services/
├── teamService.ts                  [ ] Team API calls
├── inviteService.ts                [ ] Invite operations
```

---

## Permissions Hook

**Critical for role-based features:**

```tsx
// src/features/auth/hooks/usePermissions.ts
export function usePermissions() {
  const { profile } = useAuth();

  return {
    // Role checks
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    isSuperAdmin: profile?.role === 'super_admin',
    isUser: profile?.role === 'user',

    // Permission checks
    canManageUsers: profile?.role === 'admin' || profile?.role === 'super_admin',
    canViewAdminPanel: profile?.role === 'admin' || profile?.role === 'super_admin',
    canManageBilling: profile?.role === 'admin' || profile?.role === 'super_admin',
    canManageTeam: profile?.role === 'admin' || profile?.role === 'super_admin',
    canInviteMembers: profile?.role !== 'user',
    canViewAnalytics: true, // All authenticated users
  };
}
```

**Checklist:**
- [ ] All permissions defined
- [ ] Used in guards
- [ ] Used in UI (hide/show)

---

## Navigation Structure

Add these screens to navigation:

```tsx
// Auth Stack (unauthenticated)
<Stack.Screen name="Login" component={LoginScreen} />
<Stack.Screen name="Signup" component={SignupScreen} />
<Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
<Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
<Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
<Stack.Screen name="Onboarding" component={OnboardingScreen} />

// Settings Stack (authenticated)
<Stack.Screen name="Settings" component={SettingsScreen} />
<Stack.Screen name="Profile" component={ProfileScreen} />
<Stack.Screen name="EditProfile" component={EditProfileScreen} />
<Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
<Stack.Screen name="Appearance" component={AppearanceScreen} />
<Stack.Screen name="Notifications" component={NotificationsScreen} />
<Stack.Screen name="Privacy" component={PrivacyScreen} />
<Stack.Screen name="Security" component={SecurityScreen} />
<Stack.Screen name="About" component={AboutScreen} />

// Billing Stack (authenticated)
<Stack.Screen name="Subscription" component={SubscriptionScreen} />
<Stack.Screen name="Plans" component={PlansScreen} />
<Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
<Stack.Screen name="AddPayment" component={AddPaymentScreen} />

// Team Stack (authenticated)
<Stack.Screen name="TeamSettings" component={TeamSettingsScreen} />
<Stack.Screen name="TeamMembers" component={TeamMembersScreen} />
<Stack.Screen name="InviteMember" component={InviteMemberScreen} />
<Stack.Screen name="MemberDetail" component={MemberDetailScreen} />

// Admin Stack (admin only)
<Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
<Stack.Screen name="UserManagement" component={UserManagementScreen} />
<Stack.Screen name="UserDetail" component={UserDetailScreen} />
<Stack.Screen name="EditUser" component={EditUserScreen} />
<Stack.Screen name="SystemLogs" component={SystemLogsScreen} />
<Stack.Screen name="Integrations" component={IntegrationsScreen} />
```

---

## Dependencies to Install

```bash
# Stripe for payments
npx expo install @stripe/stripe-react-native

# Auth session for OAuth
npx expo install expo-auth-session expo-web-browser

# Secure storage (already installed)
npx expo install expo-secure-store
```

---

## Progress Tracking

### Phase 1: Complete Auth Flow
| Task | Status | Notes |
|------|--------|-------|
| VerifyEmailScreen | [ ] | |
| OnboardingScreen | [ ] | |
| ResetPasswordScreen | [ ] | |
| MFA Setup | [ ] | |
| Auth Guards | [ ] | |

### Phase 2: Profile & Settings
| Task | Status | Notes |
|------|--------|-------|
| ProfileScreen | [ ] | |
| EditProfileScreen | [ ] | |
| ChangePasswordScreen | [ ] | |
| SettingsScreen (enhance) | [ ] | |
| AppearanceScreen | [ ] | |
| NotificationsScreen | [ ] | |

### Phase 3: Admin Dashboard
| Task | Status | Notes |
|------|--------|-------|
| AdminDashboardScreen | [ ] | |
| UserManagementScreen | [ ] | |
| UserDetailScreen | [ ] | |
| SystemLogsScreen | [ ] | |
| IntegrationsScreen | [ ] | |

### Phase 4: Billing
| Task | Status | Notes |
|------|--------|-------|
| SubscriptionScreen | [ ] | |
| PlansScreen | [ ] | |
| PaymentMethodsScreen | [ ] | |
| Stripe integration | [ ] | |

### Phase 5: Team Management
| Task | Status | Notes |
|------|--------|-------|
| TeamSettingsScreen | [ ] | |
| TeamMembersScreen | [ ] | |
| InviteMemberScreen | [ ] | |
| MemberDetailScreen | [ ] | |

---

## Testing Checklist

### Auth Flow
- [ ] Login works (email/password)
- [ ] Signup creates account
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Onboarding survey saves
- [ ] MFA setup works
- [ ] Logout clears session

### Admin (as admin user)
- [ ] Admin dashboard loads
- [ ] User list displays
- [ ] Can edit users
- [ ] Logs display and filter
- [ ] Non-admins cannot access

### Settings
- [ ] Profile displays user data
- [ ] Profile edits save
- [ ] Password change works
- [ ] Theme switching works
- [ ] Settings persist

### Billing
- [ ] Subscription displays
- [ ] Plans list renders
- [ ] Payment methods show
- [ ] Add card works (Stripe)

---

## Blockers & Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| (Add issues here) | | |

---

## Exports for Other Zones

When your hooks are ready, other zones can import:

```tsx
// Auth hooks
import { useAuth, usePermissions } from '@/features/auth/hooks';

// Guards
import { AuthGuard, AdminGuard } from '@/features/auth/guards';
```

---

*Last Updated: [Update this when you make progress]*
*Status: IN PROGRESS*
