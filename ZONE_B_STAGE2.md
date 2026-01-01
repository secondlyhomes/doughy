# ZONE B: Auth, Admin & Settings - Stage 2

**Instance 2 Assignment - Full Implementation**

## Overview

Fully implement all authentication, admin panel, billing, and settings features from the web app.

**Source Directories:**
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/auth/` (86 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/admin/` (58 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/settings/` (7 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/billing/` (20 files)
- `/Users/dinosaur/Documents/doughy-ai-web-backup/src/features/teams/` (8 files)

**Target Directory:** `/Users/dinosaur/Documents/doughy-ai-mobile/src/features/`

---

## Current Status (Stage 1 Complete)

| Screen | Status | File |
|--------|--------|------|
| LoginScreen | DONE | `auth/screens/LoginScreen.tsx` |
| SignupScreen | DONE | `auth/screens/SignupScreen.tsx` |
| ForgotPasswordScreen | DONE | `auth/screens/ForgotPasswordScreen.tsx` |
| AuthProvider | DONE | `auth/context/AuthProvider.tsx` |
| useAuth hook | DONE | `auth/hooks/useAuth.ts` |
| SettingsScreen | DONE | `settings/screens/SettingsScreen.tsx` |

---

## Phase 1: Complete Auth Flow (Priority: CRITICAL)

### 1.1 Email Verification Flow

**Web Files to Convert:**
- `src/features/auth/pages/VerifyEmail.tsx`
- `src/features/auth/components/VerifyEmailForm.tsx`

**Mobile Implementation:**
```
src/features/auth/screens/
├── VerifyEmailScreen.tsx      [ ] - Show verification status
├── VerifyEmailSentScreen.tsx  [ ] - "Check your email" screen
```

### 1.2 Onboarding Survey

**Web Files to Convert:**
- `src/features/auth/components/onboarding/OnboardingSurvey.tsx`
- `src/features/auth/components/onboarding/SurveyStep*.tsx`

**Mobile Implementation:**
```
src/features/auth/screens/
├── OnboardingSurveyScreen.tsx  [ ] - Multi-step survey
├── components/
│   ├── SurveyProgress.tsx      [ ] - Progress indicator
│   ├── SurveyQuestion.tsx      [ ] - Question component
│   └── SurveyOptions.tsx       [ ] - Selection options
```

### 1.3 Password Reset Complete Flow

**Web Files to Convert:**
- `src/features/auth/pages/ResetPassword.tsx`
- `src/features/auth/components/ResetPasswordForm.tsx`

**Mobile Implementation:**
```
src/features/auth/screens/
├── ResetPasswordScreen.tsx     [ ] - Enter new password (deep link)
```

### 1.4 Social Auth (Optional)

**Web Files:**
- `src/features/auth/components/SocialAuth.tsx`

**Mobile Notes:**
- Use `expo-auth-session` for OAuth
- Supabase supports Google, Apple, GitHub auth

---

## Phase 2: User Profile & Settings (Priority: HIGH)

### 2.1 Profile Management

**Web Files to Convert:**
- `src/features/auth/components/profile/ProfileForm.tsx`
- `src/features/auth/components/profile/AvatarUpload.tsx`
- `src/features/auth/pages/Profile.tsx`

**Mobile Implementation:**
```
src/features/settings/screens/
├── ProfileScreen.tsx           [x] Basic done, enhance
├── EditProfileScreen.tsx       [ ] - Edit name, email, phone
├── ChangePasswordScreen.tsx    [ ] - Change password form
├── components/
│   ├── AvatarPicker.tsx        [ ] - Image picker for avatar
│   └── ProfileField.tsx        [ ] - Editable field component
```

### 2.2 Notification Settings

**Web Files to Convert:**
- `src/features/notifications/` directory

**Mobile Implementation:**
```
src/features/notifications/
├── screens/
│   └── NotificationSettingsScreen.tsx  [x] Basic done
├── hooks/
│   └── usePushNotifications.ts         [ ] - Expo push setup
├── services/
│   └── notificationService.ts          [ ] - Register tokens
```

### 2.3 App Settings

**Mobile Implementation:**
```
src/features/settings/screens/
├── SettingsScreen.tsx          [x] Basic done
├── AppearanceScreen.tsx        [ ] - Theme, dark mode
├── PrivacyScreen.tsx           [ ] - Privacy settings
├── AboutScreen.tsx             [ ] - App info, version
├── HelpScreen.tsx              [ ] - FAQ, support contact
```

---

## Phase 3: Admin Dashboard (Priority: MEDIUM)

### 3.1 Admin Overview

**Web Files to Convert:**
- `src/features/admin/pages/AdminDashboard.tsx`
- `src/features/admin/components/AdminStats.tsx`
- `src/features/admin/components/SystemHealth.tsx`

**Mobile Implementation:**
```
src/features/admin/screens/
├── AdminDashboardScreen.tsx    [x] Basic done, enhance
├── components/
│   ├── AdminStatCard.tsx       [ ] - Stat display card
│   ├── SystemHealthCard.tsx    [ ] - Health indicators
│   └── QuickActionButton.tsx   [ ] - Admin quick actions
```

### 3.2 User Management

**Web Files to Convert:**
- `src/features/admin/pages/AdminUsers.tsx`
- `src/features/admin/components/users/UserTable.tsx`
- `src/features/admin/components/users/UserDetails.tsx`
- `src/features/admin/components/users/EditUserModal.tsx`

**Mobile Implementation:**
```
src/features/admin/screens/
├── UserManagementScreen.tsx    [ ] - User list
├── UserDetailScreen.tsx        [ ] - User details view
├── EditUserScreen.tsx          [ ] - Edit user form
├── components/
│   ├── UserCard.tsx            [ ] - User list item
│   ├── UserRoleBadge.tsx       [ ] - Role display
│   └── UserActionSheet.tsx     [ ] - Actions menu
```

### 3.3 Integrations Management

**Web Files to Convert:**
- `src/features/admin/pages/AdminIntegrations.tsx`
- `src/features/admin/components/integrations/*.tsx`

**Mobile Implementation:**
```
src/features/admin/screens/
├── IntegrationsScreen.tsx      [ ] - List integrations
├── IntegrationDetailScreen.tsx [ ] - Integration config
├── components/
│   ├── IntegrationCard.tsx     [ ] - Integration item
│   └── IntegrationStatus.tsx   [ ] - Connection status
```

### 3.4 System Logs

**Web Files to Convert:**
- `src/features/admin/pages/AdminLogs.tsx`

**Mobile Implementation:**
```
src/features/admin/screens/
├── SystemLogsScreen.tsx        [ ] - Scrollable log view
├── LogDetailScreen.tsx         [ ] - Single log detail
```

---

## Phase 4: Billing & Subscription (Priority: MEDIUM)

### 4.1 Subscription Management

**Web Files to Convert:**
- `src/features/billing/pages/Subscription.tsx`
- `src/features/billing/components/PlanCard.tsx`
- `src/features/billing/components/UsageStats.tsx`

**Mobile Implementation:**
```
src/features/billing/screens/
├── SubscriptionScreen.tsx      [x] Basic done, enhance
├── PlansScreen.tsx             [ ] - View all plans
├── UpgradeScreen.tsx           [ ] - Upgrade flow
├── components/
│   ├── CurrentPlanCard.tsx     [ ] - Current subscription
│   ├── PlanComparisonCard.tsx  [ ] - Plan features
│   ├── UsageProgressBar.tsx    [ ] - Usage display
│   └── BillingHistoryItem.tsx  [ ] - Past invoices
```

### 4.2 Payment Methods

**Web Files to Convert:**
- `src/features/billing/components/PaymentMethods.tsx`
- `src/features/billing/components/AddPaymentMethod.tsx`

**Mobile Implementation:**
```
src/features/billing/screens/
├── PaymentMethodsScreen.tsx    [ ] - Saved cards
├── AddPaymentScreen.tsx        [ ] - Add new card
├── components/
│   ├── PaymentMethodCard.tsx   [ ] - Card display
│   └── CardForm.tsx            [ ] - Card input form
```

**Notes:**
- Use Stripe React Native SDK: `@stripe/stripe-react-native`
- Or implement with Stripe API + web view

---

## Phase 5: Team Management (Priority: LOW)

### 5.1 Team Settings

**Web Files to Convert:**
- `src/features/teams/pages/TeamSettings.tsx`
- `src/features/teams/components/*.tsx`

**Mobile Implementation:**
```
src/features/teams/screens/
├── TeamSettingsScreen.tsx      [x] Basic done
├── TeamMembersScreen.tsx       [ ] - Member list
├── InviteMemberScreen.tsx      [ ] - Send invite
├── MemberDetailScreen.tsx      [ ] - Member permissions
├── components/
│   ├── MemberCard.tsx          [ ] - Team member item
│   ├── RoleSelector.tsx        [ ] - Role picker
│   └── InviteForm.tsx          [ ] - Invite form
```

---

## Hooks to Implement

```
src/features/auth/hooks/
├── useAuth.ts                  [x] Done
├── useProfile.ts               [ ] - Profile data hook
├── useAuthLoading.ts           [ ] - Loading states

src/features/admin/hooks/
├── useAdminStats.ts            [ ] - Admin dashboard data
├── useUsers.ts                 [ ] - User management
├── useSystemHealth.ts          [ ] - System status

src/features/billing/hooks/
├── useSubscription.ts          [ ] - Current subscription
├── usePlans.ts                 [ ] - Available plans
├── useUsage.ts                 [ ] - Usage statistics
```

---

## Services to Implement

```
src/features/auth/services/
├── authService.ts              [ ] - Auth API calls
├── profileService.ts           [ ] - Profile updates

src/features/admin/services/
├── adminService.ts             [ ] - Admin API calls
├── userService.ts              [ ] - User management API

src/features/billing/services/
├── billingService.ts           [ ] - Billing API calls
├── stripeService.ts            [ ] - Stripe integration
```

---

## Navigation Updates

Add these to the navigation stack:

```tsx
// In MainNavigator or SettingsNavigator
<Stack.Screen name="EditProfile" component={EditProfileScreen} />
<Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
<Stack.Screen name="Appearance" component={AppearanceScreen} />
<Stack.Screen name="Subscription" component={SubscriptionScreen} />
<Stack.Screen name="Plans" component={PlansScreen} />
<Stack.Screen name="TeamMembers" component={TeamMembersScreen} />

// Admin Navigator (role-gated)
<Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
<Stack.Screen name="UserManagement" component={UserManagementScreen} />
<Stack.Screen name="Integrations" component={IntegrationsScreen} />
<Stack.Screen name="SystemLogs" component={SystemLogsScreen} />
```

---

## Dependencies to Install

```bash
npm install @stripe/stripe-react-native  # For payments
npm install expo-auth-session            # For social auth
npm install expo-web-browser             # For OAuth flows
```

---

## Role-Based Access Control

Implement role checking for admin features:

```tsx
// src/features/auth/hooks/usePermissions.ts
export function usePermissions() {
  const { profile } = useAuth();

  return {
    isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
    isSuperAdmin: profile?.role === 'super_admin',
    canManageUsers: profile?.role === 'admin' || profile?.role === 'super_admin',
    canViewBilling: true, // All users
    canManageTeam: profile?.role === 'admin' || profile?.role === 'super_admin',
  };
}
```

---

## Testing Checklist

- [ ] Login/Logout flow works
- [ ] Signup with email verification works
- [ ] Password reset flow works
- [ ] Profile editing saves to database
- [ ] Avatar upload works
- [ ] Admin dashboard loads stats
- [ ] User management CRUD works
- [ ] Subscription display is accurate
- [ ] Team invite flow works
