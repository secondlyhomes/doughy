# Manual Test Checklist

## Overview

Some tests can't be automated. Use this checklist before every release to catch issues that automated tests miss.

## When to Use This

- [ ] Before TestFlight/Play Store submission
- [ ] After major feature releases
- [ ] After significant refactoring
- [ ] When automated tests can't cover something

## Pre-Release Checklist

### 1. Fresh Install (P0)

**iOS:**
- [ ] Delete app completely
- [ ] Install from TestFlight
- [ ] App launches without crash
- [ ] Onboarding flow works
- [ ] Can create account
- [ ] Can log in

**Android:**
- [ ] Delete app completely
- [ ] Install from APK/Play Store
- [ ] App launches without crash
- [ ] Onboarding flow works
- [ ] Can create account
- [ ] Can log in

### 2. Upgrade Path (P0)

- [ ] Install previous version
- [ ] Add test data
- [ ] Upgrade to new version
- [ ] Data is preserved
- [ ] No crashes
- [ ] No functionality broken

### 3. Authentication (P0)

- [ ] Email/password sign up
- [ ] Email/password sign in
- [ ] Apple Sign In (iOS)
- [ ] Google Sign In
- [ ] Password reset flow
- [ ] Logout
- [ ] Session persists after app restart
- [ ] Session persists after device restart

### 4. Core Features (P0)

Test the main feature of your app:

**Example for Task App:**
- [ ] Create task
- [ ] View task list
- [ ] Edit task
- [ ] Complete task
- [ ] Delete task
- [ ] Task syncs to server
- [ ] Task appears on other devices

### 5. Offline Mode (P1)

- [ ] Turn on airplane mode
- [ ] Create/edit data
- [ ] Turn off airplane mode
- [ ] Data syncs correctly
- [ ] No duplicate items
- [ ] No data loss

### 6. Push Notifications (P1)

- [ ] Notification permissions requested appropriately
- [ ] Notifications received when app closed
- [ ] Notifications received when app in background
- [ ] Tapping notification opens correct screen
- [ ] Badge count updates correctly

### 7. Navigation (P1)

- [ ] All tabs accessible
- [ ] Back button works correctly
- [ ] Deep links work
- [ ] Hardware back button (Android)
- [ ] Swipe to go back (iOS)
- [ ] Modal dismissal works
- [ ] No navigation stack issues

### 8. UI/UX (P1)

- [ ] All text readable
- [ ] Touch targets accessible (48x48 minimum)
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] Empty states helpful
- [ ] Pull to refresh works
- [ ] Scroll works smoothly

### 9. Keyboard (P1)

- [ ] Keyboard doesn't cover input
- [ ] Can dismiss keyboard
- [ ] Form fields navigate correctly
- [ ] Return key works appropriately
- [ ] Autofill works (email, password)

### 10. Theme/Appearance (P2)

**Light Mode:**
- [ ] All screens readable
- [ ] No contrast issues
- [ ] Icons visible

**Dark Mode:**
- [ ] All screens readable
- [ ] No bright flashes
- [ ] Icons visible
- [ ] OLED black where expected

### 11. Accessibility (P2)

**VoiceOver (iOS):**
- [ ] All screens navigable
- [ ] Labels make sense
- [ ] No unlabeled buttons

**TalkBack (Android):**
- [ ] All screens navigable
- [ ] Labels make sense
- [ ] No unlabeled buttons

**Dynamic Type:**
- [ ] App usable at largest text size
- [ ] No text truncation hides critical info

### 12. Device Variations (P2)

**iOS:**
- [ ] iPhone SE (small screen)
- [ ] iPhone 15 Pro (standard)
- [ ] iPhone 15 Pro Max (large)
- [ ] iPad (if supported)

**Android:**
- [ ] Small screen phone
- [ ] Standard phone
- [ ] Large phone
- [ ] Tablet (if supported)

### 13. Performance (P2)

- [ ] App launches in < 3 seconds
- [ ] No visible lag when scrolling
- [ ] Animations smooth (60fps)
- [ ] No memory warnings
- [ ] Battery usage reasonable

### 14. Error Handling (P2)

- [ ] Network error shows message
- [ ] Server error shows message
- [ ] Invalid input shows error
- [ ] Can recover from errors
- [ ] Retry works

### 15. Edge Cases (P3)

- [ ] Very long text input
- [ ] Special characters in input
- [ ] Rapid repeated actions
- [ ] Low storage warning
- [ ] Low memory
- [ ] Screen rotation (if supported)

## Platform-Specific Tests

### iOS Only

- [ ] Face ID/Touch ID works
- [ ] Share extension works (if applicable)
- [ ] Siri shortcuts work (if applicable)
- [ ] Widget works (if applicable)
- [ ] App Clip works (if applicable)
- [ ] StoreKit testing (subscriptions)

### Android Only

- [ ] Back button behavior
- [ ] Picture-in-picture (if applicable)
- [ ] Split screen (if applicable)
- [ ] Different Android versions (10, 11, 12, 13, 14)
- [ ] Different manufacturers (Samsung, Pixel, etc.)

## Payment Testing (If Applicable)

### Subscriptions
- [ ] Can view subscription options
- [ ] Can purchase subscription
- [ ] Features unlock after purchase
- [ ] Subscription status syncs
- [ ] Can cancel subscription
- [ ] Grace period works

### Sandbox Testing
- [ ] Apple sandbox accounts work
- [ ] Google test accounts work
- [ ] Test purchases complete

## Release Notes Verification

For each item in release notes:
- [ ] Feature/fix actually works
- [ ] No regressions in related areas

## Sign-Off

| Area | Tester | Date | Status |
|------|--------|------|--------|
| Fresh Install | | | |
| Upgrade Path | | | |
| Authentication | | | |
| Core Features | | | |
| Offline Mode | | | |
| Notifications | | | |
| Navigation | | | |
| UI/UX | | | |
| Accessibility | | | |
| Performance | | | |

## Notes

_Add any issues found during testing:_

1.
2.
3.

## Post-Release Monitoring

After release:
- [ ] Monitor Sentry for new crashes
- [ ] Monitor app store reviews
- [ ] Check analytics for anomalies
- [ ] Verify backend metrics stable
