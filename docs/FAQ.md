# Frequently Asked Questions (FAQ)

Comprehensive answers to common questions about the Mobile App Blueprint.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [React Native & Expo](#react-native--expo)
4. [Supabase & Database](#supabase--database)
5. [Authentication](#authentication)
6. [Components & UI](#components--ui)
7. [State Management](#state-management)
8. [Navigation](#navigation)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Performance](#performance)
12. [Security](#security)
13. [Third-Party Integrations](#third-party-integrations)
14. [Troubleshooting](#troubleshooting)
15. [Best Practices](#best-practices)

---

## Getting Started

### 1. What is the Mobile App Blueprint?

A production-ready React Native + Expo + Supabase starter template with authentication, database integration, theming, testing, and deployment configured. It saves you weeks of setup time.

### 2. Who is this blueprint for?

- Solo developers building mobile apps
- Teams wanting a standardized starting point
- Developers migrating from Firebase to Supabase
- Anyone tired of configuring the same setup repeatedly

### 3. What makes this different from other templates?

- **Comprehensive**: Everything you need, not just basics
- **Production-ready**: Security, testing, CI/CD included
- **Well-documented**: 80+ docs covering every aspect
- **Opinionated**: Best practices baked in
- **Maintained**: Regular updates for latest Expo/Supabase versions

### 4. Do I need to know React Native before using this?

Basic React knowledge is sufficient. The blueprint follows React patterns and includes tutorials to help you learn. However, understanding JavaScript/TypeScript is essential.

### 5. How much does it cost to use this blueprint?

The blueprint itself is free and open source. However:
- Expo: Free tier available, paid plans for teams
- Supabase: Free tier available, paid for scale
- Apple Developer: $99/year for App Store
- Google Play: $25 one-time fee

### 6. Can I use this for commercial projects?

Yes! It's MIT licensed. You can use it for personal or commercial projects without restrictions.

### 7. How do I get support?

- Check documentation in `docs/` folder
- Search GitHub issues
- Create a new issue for bugs
- Join community Discord (link in README)

### 8. How often is this updated?

Regular updates when new Expo SDK or Supabase versions release, plus ongoing improvements based on community feedback.

### 9. Can I contribute to the blueprint?

Absolutely! See `CONTRIBUTING.md` for guidelines. We welcome bug fixes, feature additions, and documentation improvements.

### 10. What's the learning curve?

- Experienced React developers: 1-2 days
- JavaScript developers new to React: 1-2 weeks
- New to mobile development: 2-4 weeks

---

## Development Environment

### 11. What operating systems are supported?

- **macOS**: Full support (iOS + Android)
- **Windows**: Android only (can't run iOS simulator)
- **Linux**: Android only

### 12. Do I need a physical device for testing?

No, but recommended. You can use:
- iOS Simulator (Mac only)
- Android Emulator (any OS)
- Expo Go on physical device (easiest)

### 13. Can I develop iOS apps without a Mac?

Sort of. You can:
- Write code on any OS
- Build iOS apps using EAS Build (cloud)
- Test on physical device with Expo Go
- But can't run iOS Simulator without Mac

### 14. What code editor should I use?

VS Code is recommended with these extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier
- ESLint
- TypeScript and JavaScript Language Features

### 15. How much disk space do I need?

- Project: ~500 MB
- Node modules: ~1 GB
- Xcode (iOS, Mac only): ~15 GB
- Android Studio: ~10 GB

### 16. What are the minimum hardware requirements?

- **RAM**: 8 GB minimum, 16 GB recommended
- **CPU**: Modern dual-core minimum, quad-core recommended
- **Storage**: 20 GB free space minimum

### 17. Do I need to install Xcode?

Only if you want to run iOS Simulator. For building iOS apps, EAS Build handles it in the cloud.

### 18. Do I need to install Android Studio?

Only if you want to run Android Emulator. For building Android apps, EAS Build handles it.

### 19. What Node.js version should I use?

Node.js 20+ (LTS version recommended). Check compatibility at docs.expo.dev.

### 20. Should I use npm, yarn, or pnpm?

The blueprint uses npm, but you can use:
- npm (included with Node.js)
- yarn (faster, more reliable)
- pnpm (most efficient disk usage)

---

## React Native & Expo

### 21. What's the difference between React Native and Expo?

React Native is the framework. Expo is tooling that makes React Native development easier (builds, updates, APIs, etc.).

### 22. Can I use this blueprint with bare React Native?

It's built for Expo, but you can eject if needed. However, you'd lose many Expo benefits.

### 23. What Expo SDK version does this use?

Currently Expo SDK 54+. Check `package.json` for exact version.

### 24. Can I add custom native modules?

Yes! Either:
- Use Expo config plugins (preferred)
- Create a development build
- Eject to bare workflow (last resort)

### 25. What's a development build?

A custom version of Expo Go with your native code. Required for custom native modules.

### 26. How do I create a development build?

```bash
eas build --profile development --platform ios
```

### 27. Can I use React Native libraries not in Expo?

Most libraries work. Check directory.expo.dev for compatibility.

### 28. What about Expo Go limitations?

Expo Go can't use:
- Custom native code
- Push notifications (dev only)
- Some permissions

Development builds solve this.

### 29. How does Fast Refresh work?

Fast Refresh reloads changed components instantly while preserving state. It's automatic—just save your files.

### 30. When should I restart the Metro bundler?

Restart when:
- Adding new dependencies
- Changing environment variables
- Modifying native code
- Encountering weird cache issues

---

## Supabase & Database

### 31. Why Supabase over Firebase?

- Open source
- Uses PostgreSQL (standard SQL)
- Self-hostable
- Better pricing
- RLS for security
- More control

### 32. Can I self-host Supabase?

Yes! Supabase is fully open source. See supabase.com/docs/guides/self-hosting.

### 33. What database does Supabase use?

PostgreSQL, a powerful open-source relational database.

### 34. What's Row Level Security (RLS)?

Database-level security that filters data based on the authenticated user. It's enforced at the database, not just client code.

### 35. Do I have to enable RLS?

Yes! Never disable RLS for convenience. It's your primary security layer.

### 36. How do I write RLS policies?

See `docs/03-database/RLS-POLICIES.md` for comprehensive guide. Basic pattern:
```sql
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

### 37. Can I use migrations?

Yes! The blueprint uses Supabase migrations. See `supabase/migrations/` folder.

### 38. How do I apply migrations?

```bash
npx supabase db push
```

### 39. How do I rollback migrations?

```bash
npx supabase db reset
```

### 40. What's the difference between anon and service_role keys?

- **anon**: Public, safe in client code, respects RLS
- **service_role**: Private, server-only, bypasses RLS

### 41. Can I use Supabase Storage?

Yes! Great for images, files, etc. See `docs/` for examples.

### 42. Does Supabase support real-time?

Yes! Real-time subscriptions for INSERT, UPDATE, DELETE events.

### 43. What's the Supabase free tier limit?

- 500 MB database
- 1 GB file storage
- 50 MB file uploads
- 2 GB bandwidth
- 50,000 monthly active users

### 44. How do I upgrade my Supabase plan?

In Supabase Dashboard → Settings → Billing. Starts at $25/month.

### 45. Can I use multiple Supabase projects?

Yes! Use different `.env` files for dev/staging/production.

---

## Authentication

### 46. What auth methods are supported?

- Email/password
- Magic link (passwordless)
- OAuth (Google, Apple, GitHub, etc.)
- Phone/SMS (with Twilio)

### 47. How do I add social login?

1. Enable provider in Supabase Dashboard
2. Configure OAuth credentials
3. Use `supabase.auth.signInWithOAuth()`

See `docs/04-authentication/OAUTH-INTEGRATION.md`.

### 48. Do I need to handle JWT tokens manually?

No! Supabase client handles token storage, refresh, and auth headers automatically.

### 49. How long do sessions last?

- Access token: 1 hour
- Refresh token: 7 days (configurable)

### 50. What happens when a token expires?

Supabase automatically refreshes it using the refresh token.

### 51. How do I implement "Remember Me"?

Supabase sessions persist by default. For explicit logout:
```typescript
await supabase.auth.signOut()
```

### 52. Can I require email verification?

Yes! Enable in Supabase Dashboard → Authentication → Settings.

### 53. How do I customize email templates?

Supabase Dashboard → Authentication → Email Templates. Full HTML customization supported.

### 54. Can I use custom authentication providers?

Yes, but requires server-side code. See Supabase Auth docs.

### 55. How do I protect routes?

Use the `ProtectedRoute` component:
```typescript
<ProtectedRoute>
  <TasksScreen />
</ProtectedRoute>
```

---

## Components & UI

### 56. What UI library does this use?

React Native core components + custom themed components. No heavy UI library to reduce bundle size.

### 57. Can I use React Native Paper/NativeBase/etc.?

Yes, but you'll need to integrate their theming with the blueprint's theme system.

### 58. How does theming work?

Theme context provides tokens (colors, spacing, etc.). See `docs/05-ui-ux/THEMING.md`.

### 59. Can I use Tailwind CSS?

Yes! NativeWind works with React Native. See integration guide.

### 60. What about dark mode?

Theme system supports light/dark modes. Toggle with `ThemeContext`.

### 61. How do I add custom fonts?

1. Add font files to `assets/fonts/`
2. Use `expo-font` to load them
3. Reference in styles

See Expo docs for details.

### 62. What icon library is used?

None by default. Recommend:
- `@expo/vector-icons` (included)
- `react-native-vector-icons`
- Custom SVGs

### 63. How do I add splash screen?

Configure in `app.json`:
```json
{
  "splash": {
    "image": "./assets/splash.png",
    "backgroundColor": "#ffffff"
  }
}
```

### 64. How do I change the app icon?

Replace `assets/icon.png` with 1024x1024 PNG, then rebuild.

### 65. Should I use StyleSheet or inline styles?

Prefer theme tokens in inline styles for maintainability:
```typescript
<View style={{ padding: theme.spacing[4] }} />
```

### 65a. How do I add Liquid Glass effects?

Install `expo-glass-effect` and `expo-blur`, then use the `GlassView` component:

```bash
npx expo install expo-glass-effect expo-blur
```

The `GlassView` component provides a three-tier fallback: native glass on iOS 26+, blur on older iOS, semi-transparent view on Android. See `docs/05-ui-ux/LIQUID-GLASS.md` for the full guide.

### 65b. What happens to glass effects on Android or older iOS?

The `GlassView` component handles this automatically:
- **iOS 26+**: Native Liquid Glass via `expo-glass-effect`
- **iOS < 26**: `expo-blur` BlurView (gaussian blur)
- **Android**: Semi-transparent View with theme fallback colors

### 65c. Why does glass not render on my Settings tab?

Tabs rendered but not yet focused don't get a proper layout pass, so `UIVisualEffectView` fails to initialize. Fix with a one-time remount on first focus using `useFocusEffect`. See the Troubleshooting section in `docs/05-ui-ux/LIQUID-GLASS.md`.

---

## State Management

### 66. What state management library is used?

React Context + hooks. No Redux/MobX/Zustand by default.

### 67. When should I use Context?

When state needs to be shared across many components (auth, theme, etc.).

### 68. When should I use local state?

For component-specific state (form inputs, UI toggles, etc.).

### 69. Should I add Redux?

Only if you have complex state needs. Most apps don't need it.

### 70. How do I handle form state?

- Simple forms: `useState`
- Complex forms: React Hook Form

### 71. What about global loading states?

Use a `LoadingContext` or show loading in individual components.

### 72. How do I handle errors globally?

Use Error Boundaries:
```typescript
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

### 73. Should I use Recoil/Jotai/Zustand?

They're great alternatives to Context if you prefer atomic state management.

### 74. How do I persist state?

Use AsyncStorage or MMKV:
```typescript
await AsyncStorage.setItem('key', JSON.stringify(value))
```

### 75. What's the best way to handle async state?

Use custom hooks:
```typescript
const { data, loading, error } = useAsyncData(fetchTasks)
```

---

## Navigation

### 76. What navigation library is used?

React Navigation (most popular, well-maintained).

### 77. Can I use Expo Router instead?

Yes! It's built on React Navigation. Migration guide available.

### 78. How do I add a new screen?

1. Create screen component in `src/screens/`
2. Add to navigator configuration
3. Navigate using `navigation.navigate('ScreenName')`

### 79. How do I pass params between screens?

```typescript
navigation.navigate('Details', { id: '123' })

// In Details screen
const { id } = route.params
```

### 80. What's the difference between Stack, Tab, and Drawer navigators?

- **Stack**: Pages stack on top (iOS style)
- **Tab**: Bottom tabs (common in apps)
- **Drawer**: Side menu (less common on mobile)

### 81. Can I mix navigation types?

Yes! Common pattern:
```
Tab Navigator
├── Stack Navigator (Home)
├── Stack Navigator (Profile)
└── Stack Navigator (Settings)
```

### 82. How do I handle deep linking?

Configure in `app.json`:
```json
{
  "scheme": "myapp",
  "intentFilters": [...]
}
```

### 83. How do I show a modal?

Use Stack Navigator with presentation mode:
```typescript
<Stack.Screen
  name="Modal"
  component={ModalScreen}
  options={{ presentation: 'modal' }}
/>
```

### 84. How do I customize the header?

```typescript
<Stack.Screen
  options={{
    title: 'My Screen',
    headerRight: () => <Button />,
  }}
/>
```

### 85. How do I hide the header?

```typescript
options={{ headerShown: false }}
```

---

## Testing

### 86. What testing framework is used?

Jest + React Native Testing Library.

### 87. How do I run tests?

```bash
npm test
```

### 88. How do I write a component test?

```typescript
import { render } from '@testing-library/react-native'
import { MyComponent } from './MyComponent'

test('renders correctly', () => {
  const { getByText } = render(<MyComponent />)
  expect(getByText('Hello')).toBeTruthy()
})
```

### 89. How do I mock Supabase?

```typescript
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}))
```

### 90. Should I test every component?

Focus on:
- Business logic (services, hooks)
- Critical user flows
- Complex components

Don't obsess over 100% coverage.

### 91. What about E2E tests?

Use Detox or Maestro. Setup guides in `docs/10-testing/`.

### 92. How do I test navigation?

```typescript
import { NavigationContainer } from '@react-navigation/native'

const { getByText } = render(
  <NavigationContainer>
    <MyScreen />
  </NavigationContainer>
)
```

### 93. What's a good test coverage target?

70-80% is realistic and valuable. 100% is usually overkill.

### 94. How do I test async code?

```typescript
test('loads data', async () => {
  const { findByText } = render(<DataComponent />)
  expect(await findByText('Loaded')).toBeTruthy()
})
```

### 95. Should I use snapshot tests?

Sparingly. They're brittle and often not worth the maintenance.

---

## Deployment

### 96. How do I build for production?

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 97. Do I need a Mac to build iOS apps?

No! EAS Build runs on cloud servers, building iOS from any OS.

### 98. How much do EAS builds cost?

Free tier includes limited builds. Paid plans start at $29/month for unlimited.

### 99. Can I build locally instead of using EAS?

Yes, but:
- iOS: Requires Mac
- Android: Requires Android SDK setup
- EAS is much easier

### 100. How do I submit to App Store?

```bash
eas submit --platform ios
```

Or manually upload via App Store Connect.

### 101. How do I submit to Play Store?

```bash
eas submit --platform android
```

Or manually upload via Play Console.

### 102. What's an OTA update?

Over-The-Air update. Push JS changes without app store review.

```bash
eas update --branch production
```

### 103. When can I use OTA updates?

✅ JS code changes
✅ Assets (images, etc.)
❌ Native code changes
❌ New permissions

### 104. How long does app review take?

- **iOS**: 1-3 days average, up to 7 days
- **Android**: Few hours to 1 day

### 105. What if my app is rejected?

Read rejection reason carefully, fix issues, resubmit. Common reasons:
- Missing privacy policy
- Incomplete information
- Crashes during review
- Guideline violations

---

## Performance

### 106. How do I optimize app performance?

- Use FlatList for lists
- Enable `removeClippedSubviews`
- Use `getItemLayout` for fixed-size items
- Implement pagination
- Optimize images
- Use native driver for animations

### 107. What's causing my app to be slow?

Profile with:
- React DevTools Profiler
- Flipper
- Xcode Instruments (iOS)
- Android Profiler

### 108. How do I reduce bundle size?

- Remove unused dependencies
- Use dynamic imports
- Enable Hermes (default in Expo)
- Optimize images

### 109. Should I use Hermes?

Yes! It's enabled by default in Expo and significantly improves performance.

### 110. How do I optimize images?

- Use WebP format
- Resize to actual display size
- Use `expo-image` for better caching
- Lazy load images

---

## Security

### 111. How do I secure my API keys?

- Use environment variables
- Never commit `.env` file
- Use different keys for dev/prod
- Rotate keys regularly

### 112. What's the difference between .env and app.json secrets?

- `.env`: Build time, not in bundle
- `EXPO_PUBLIC_*`: Build time, in bundle (OK for public APIs)

### 113. Can users see my environment variables?

Variables prefixed with `EXPO_PUBLIC_` are bundled and visible. Others are not.

### 114. How do I prevent API key theft?

For sensitive keys:
- Use them server-side only
- Implement rate limiting
- Use Supabase RLS as security layer

### 115. What about code obfuscation?

Not really effective on mobile. Focus on server-side security instead.

---

## Third-Party Integrations

### 116. Can I use Firebase with this?

Yes, but you'd be duplicating Supabase functionality. Pick one.

### 117. How do I add payment processing?

Use RevenueCat (recommended) or Stripe. See `docs/08-payments/`.

### 118. Can I use Google Maps?

Yes! Use `react-native-maps`.

### 119. How do I add push notifications?

See `docs/06-native-features/PUSH-NOTIFICATIONS.md`.

### 120. Can I use AI APIs?

Yes! See `docs/07-ai-integration/` for OpenAI, Anthropic examples.

---

## Troubleshooting

### 121. "Unable to resolve module"

```bash
npx expo start --clear
```

### 122. "Build failed" on EAS

Check build logs:
```bash
eas build:list
eas build:view <build-id>
```

### 123. App crashes on startup

Check device logs:
- iOS: Xcode → Devices → View Logs
- Android: `adb logcat`

### 124. Changes not appearing

- Restart Metro: `r` in terminal
- Clear cache: `npx expo start --clear`
- Hard refresh: Shake device → Reload

### 125. Database queries not working

- Check RLS policies
- Verify authentication
- Check console for errors

---

## Best Practices

### 126. Should I use TypeScript?

Yes! The blueprint is TypeScript by default. It catches bugs early and improves code quality.

### 127. How often should I update dependencies?

Monthly for patch versions, quarterly for minor versions. Test thoroughly.

### 128. Should I write tests first (TDD)?

If you're comfortable with TDD, yes. Otherwise, write tests after for critical paths.

### 129. How do I organize large projects?

Use feature-based organization:
```
features/
├── auth/
│   ├── components/
│   ├── screens/
│   └── services/
└── tasks/
    ├── components/
    ├── screens/
    └── services/
```

### 130. What's the biggest mistake developers make?

- Disabling RLS for convenience (huge security risk)
- Not testing on physical devices
- Hardcoding API keys
- Over-engineering simple features
- Ignoring accessibility

---

**Have a question not answered here? [Create an issue](https://github.com/your-org/your-repo/issues) or check the comprehensive docs in the `docs/` folder.**
