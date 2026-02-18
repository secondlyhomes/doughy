# Common Errors and Solutions

Comprehensive guide to the most common errors you'll encounter and how to fix them.

## Table of Contents

1. [Metro/Bundler Errors](#metrobundler-errors)
2. [Build Errors](#build-errors)
3. [Runtime Errors](#runtime-errors)
4. [Database Errors](#database-errors)
5. [Authentication Errors](#authentication-errors)
6. [Navigation Errors](#navigation-errors)
7. [Dependency Errors](#dependency-errors)
8. [Type Errors](#type-errors)

---

## Metro/Bundler Errors

### Error: "Unable to resolve module @/components/..."

**Symptoms:**
```
Error: Unable to resolve module `@/components/Button` from `src/screens/home-screen.tsx`
```

**Cause:** Path alias not configured or Metro cache issue

**Solutions:**

1. **Restart Metro with cache clear:**
```bash
npx expo start --clear
```

2. **Verify tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

3. **Verify babel.config.js:**
```javascript
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
}
```

4. **Restart TypeScript server in VS Code:**
   - `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

### Error: "Metro bundler failed to start"

**Symptoms:**
```
Error: EADDRINUSE: address already in use :::8081
```

**Cause:** Port 8081 already in use

**Solutions:**

1. **Kill process using port 8081:**

**macOS/Linux:**
```bash
lsof -ti:8081 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

2. **Use different port:**
```bash
npx expo start --port 8082
```

3. **Find and close other Metro instances:**
```bash
ps aux | grep metro
kill <PID>
```

---

### Error: "Transform Error: ..."

**Symptoms:**
```
TransformError: ... SyntaxError: Unexpected token
```

**Cause:** Syntax error or incompatible JavaScript features

**Solutions:**

1. **Check for syntax errors** in the referenced file
2. **Verify Babel configuration:**
```javascript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
}
```

3. **Clear all caches:**
```bash
npx expo start --clear
rm -rf node_modules
npm install
```

---

### Error: "Unable to find expo in this project"

**Symptoms:**
```
Error: Unable to find expo in this project - have you run yarn / npm install yet?
```

**Cause:** Dependencies not installed or corrupted

**Solutions:**

1. **Reinstall dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

2. **Verify expo is in package.json:**
```json
{
  "dependencies": {
    "expo": "~54.0.0"
  }
}
```

3. **Check Node.js version:**
```bash
node --version
# Should be 20.x or higher
```

---

## Build Errors

### Error: EAS Build Failed

**Symptoms:**
```
❌ Build failed
```

**Solutions:**

1. **View detailed logs:**
```bash
eas build:list
eas build:view <build-id>
```

2. **Common causes:**

**TypeScript errors:**
```bash
# Fix before building
npx tsc --noEmit
```

**Missing dependencies:**
```bash
npm install
```

**Invalid app.json:**
- Check JSON syntax
- Verify all required fields

3. **Clear EAS cache:**
```bash
eas build --platform ios --clear-cache
```

---

### Error: iOS Pod Install Failed

**Symptoms:**
```
[!] CocoaPods could not find compatible versions for pod "..."
```

**Cause:** Incompatible iOS dependencies

**Solutions:**

1. **Update pods:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

2. **Clear derived data (macOS):**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

3. **Verify Podfile:**
```ruby
platform :ios, '13.0'
```

---

### Error: Android Gradle Build Failed

**Symptoms:**
```
Execution failed for task ':app:mergeDebugResources'
```

**Solutions:**

1. **Clean Android build:**
```bash
cd android
./gradlew clean
cd ..
```

2. **Clear Gradle cache:**
```bash
rm -rf android/.gradle
rm -rf android/app/build
```

3. **Verify gradle.properties:**
```properties
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m
```

4. **Update Gradle version in android/gradle/wrapper/gradle-wrapper.properties:**
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip
```

---

### Error: "No development team found"

**Symptoms (iOS):**
```
error: No development team found
```

**Cause:** Apple Developer account not configured

**Solutions:**

1. **Configure in Xcode:**
   - Open `ios/YourApp.xcworkspace`
   - Select project in navigator
   - Go to "Signing & Capabilities"
   - Select your team

2. **Or use EAS (easier):**
```bash
eas build --platform ios
# Follow prompts to configure signing
```

---

## Runtime Errors

### Error: "Invariant Violation: ViewPropTypes..."

**Symptoms:**
```
Invariant Violation: ViewPropTypes has been removed from React Native
```

**Cause:** Old library using deprecated ViewPropTypes

**Solutions:**

1. **Install compatibility library:**
```bash
npm install deprecated-react-native-prop-types
```

2. **Update the problematic library** to latest version

3. **Or patch it:**
```bash
npx patch-package <library-name>
```

---

### Error: "Cannot read property '...' of undefined"

**Symptoms:**
```
TypeError: Cannot read property 'name' of undefined
```

**Cause:** Accessing property of null/undefined object

**Solutions:**

1. **Add null checks:**
```typescript
// Before
const name = user.profile.name

// After
const name = user?.profile?.name ?? 'Default'
```

2. **Initialize state properly:**
```typescript
const [data, setData] = useState<Data | null>(null)

if (!data) return <Loading />
```

3. **Add error boundaries:**
```typescript
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

---

### Error: "Maximum update depth exceeded"

**Symptoms:**
```
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

**Cause:** Infinite render loop

**Solutions:**

1. **Check useEffect dependencies:**
```typescript
// Bad: Missing dependency
useEffect(() => {
  setCount(count + 1)
}, []) // count changes but not in dependencies

// Good: Correct dependencies
useEffect(() => {
  // Only run once
}, [])
```

2. **Use functional updates:**
```typescript
// Bad
setCount(count + 1)

// Good
setCount(prev => prev + 1)
```

3. **Check for setState in render:**
```typescript
// Bad
function MyComponent() {
  setCount(count + 1) // In render!
  return <View />
}

// Good
function MyComponent() {
  useEffect(() => {
    setCount(count + 1)
  }, [])
  return <View />
}
```

---

### Error: "Hooks can only be called inside function components"

**Symptoms:**
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**Cause:** Calling hooks outside component or in wrong order

**Solutions:**

1. **Only call hooks at top level:**
```typescript
// Bad
if (condition) {
  const [value, setValue] = useState()
}

// Good
const [value, setValue] = useState()
if (condition) {
  // Use value
}
```

2. **Only in function components:**
```typescript
// Bad
const value = useState() // Outside component

// Good
function MyComponent() {
  const [value, setValue] = useState()
}
```

3. **Check for duplicate React versions:**
```bash
npm ls react
# If multiple versions, fix with:
npm dedupe
```

---

## Database Errors

### Error: "JWT expired"

**Symptoms:**
```
Error: JWT expired
```

**Cause:** Session expired (default: 1 hour)

**Solutions:**

1. **Session refreshes automatically with Supabase client**

2. **Manual refresh:**
```typescript
const { error } = await supabase.auth.refreshSession()
if (error) {
  // Redirect to login
  await supabase.auth.signOut()
}
```

3. **Handle in interceptor:**
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed')
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
  }
})
```

---

### Error: "Row level security policy violation"

**Symptoms:**
```
Error: new row violates row-level security policy for table "tasks"
```

**Cause:** RLS policy doesn't allow the operation

**Solutions:**

1. **Check policy exists:**
```sql
-- View policies
SELECT * FROM pg_policies WHERE tablename = 'tasks';
```

2. **Verify user is authenticated:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // Not logged in!
}
```

3. **Check policy matches operation:**
```sql
-- For INSERT
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- For SELECT
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

4. **Debug by temporarily disabling RLS (NEVER in production):**
```sql
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- Test query
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

---

### Error: "Null value in column violates not-null constraint"

**Symptoms:**
```
Error: null value in column "user_id" violates not-null constraint
```

**Cause:** Required field not provided

**Solutions:**

1. **Provide all required fields:**
```typescript
await supabase.from('tasks').insert({
  user_id: user.id, // Don't forget!
  title: 'New task',
})
```

2. **Use database default:**
```sql
ALTER TABLE tasks
ALTER COLUMN user_id SET DEFAULT auth.uid();
```

3. **Check for null in service layer:**
```typescript
if (!userId) {
  throw new Error('User ID required')
}
```

---

### Error: "Foreign key violation"

**Symptoms:**
```
Error: insert or update on table "tasks" violates foreign key constraint
```

**Cause:** Referenced record doesn't exist

**Solutions:**

1. **Verify foreign key exists:**
```typescript
// Before inserting task
const { data: user } = await supabase
  .from('users')
  .select('id')
  .eq('id', userId)
  .single()

if (!user) {
  throw new Error('User not found')
}
```

2. **Use CASCADE for deletes:**
```sql
ALTER TABLE tasks
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;
```

---

## Authentication Errors

### Error: "Invalid login credentials"

**Symptoms:**
```
Error: Invalid login credentials
```

**Cause:** Wrong email or password

**Solutions:**

1. **Double-check credentials**

2. **Verify user exists:**
```sql
SELECT * FROM auth.users WHERE email = 'user@example.com';
```

3. **Check if email is confirmed:**
```sql
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
```

4. **Reset password if needed:**
```typescript
await supabase.auth.resetPasswordForEmail(email)
```

---

### Error: "User already registered"

**Symptoms:**
```
Error: User already registered
```

**Cause:** Email already exists

**Solutions:**

1. **Handle gracefully:**
```typescript
try {
  await supabase.auth.signUp({ email, password })
} catch (error) {
  if (error.message.includes('already registered')) {
    Alert.alert('This email is already registered. Try logging in instead.')
  }
}
```

2. **Or redirect to login:**
```typescript
navigation.navigate('Login', { email })
```

---

### Error: "Email link is invalid or has expired"

**Symptoms:**
```
Error: Email link is invalid or has expired
```

**Cause:** Email verification link expired (default: 24 hours)

**Solutions:**

1. **Resend verification email:**
```typescript
await supabase.auth.resend({
  type: 'signup',
  email: email,
})
```

2. **Increase expiry in Supabase Dashboard:**
   - Authentication → Settings → Email Auth
   - Increase token expiry

---

## Navigation Errors

### Error: "The action '...' was not handled"

**Symptoms:**
```
The action 'NAVIGATE' with payload {"name":"Details"} was not handled by any navigator.
```

**Cause:** Screen doesn't exist in navigator

**Solutions:**

1. **Verify screen is registered:**
```typescript
<Stack.Screen name="Details" component={DetailsScreen} />
```

2. **Check navigation call matches:**
```typescript
// This
navigation.navigate('Details')

// Must match this
<Stack.Screen name="Details" ... />
```

3. **Check navigator hierarchy** - you can only navigate to screens in current navigator or parent navigators

---

### Error: "Couldn't find a navigation object"

**Symptoms:**
```
Error: Couldn't find a navigation object. Is your component inside a navigation container?
```

**Cause:** Using navigation hooks outside navigator

**Solutions:**

1. **Wrap app in NavigationContainer:**
```typescript
<NavigationContainer>
  <App />
</NavigationContainer>
```

2. **Pass navigation prop instead:**
```typescript
function MyScreen({ navigation }) {
  // Use navigation prop
}
```

---

## Dependency Errors

### Error: "Invariant Violation: 'main' has not been registered"

**Symptoms:**
```
Invariant Violation: "main" has not been registered
```

**Cause:** App entry point not found

**Solutions:**

1. **Check app.json:**
```json
{
  "expo": {
    "entryPoint": "./index.js"
  }
}
```

2. **Verify index.js exists:**
```javascript
import { registerRootComponent } from 'expo'
import App from './App'

registerRootComponent(App)
```

3. **Clear cache:**
```bash
npx expo start --clear
```

---

### Error: "Requiring unknown module 'undefined'"

**Symptoms:**
```
Error: Requiring unknown module "undefined"
```

**Cause:** Import path error or missing export

**Solutions:**

1. **Check import/export match:**
```typescript
// File: Button.tsx
export function Button() {} // Named export

// Import
import { Button } from './Button' // Correct
import Button from './Button' // Wrong!
```

2. **Verify file exists** at import path

3. **Check for circular dependencies**

---

## Type Errors

### Error: "Type 'string' is not assignable to type 'number'"

**Symptoms:**
```
Type 'string' is not assignable to type 'number'
```

**Cause:** Type mismatch

**Solutions:**

1. **Fix the type:**
```typescript
// Before
const count: number = "5" // Error!

// After
const count: number = 5 // Correct
const count: number = Number("5") // Convert string to number
```

2. **Use correct type:**
```typescript
const count: string = "5" // If it should be string
```

3. **Use type assertion (carefully!):**
```typescript
const count = "5" as unknown as number // Not recommended
```

---

### Error: "Property '...' does not exist on type '...'"

**Symptoms:**
```
Property 'username' does not exist on type 'User'
```

**Cause:** Type definition missing property

**Solutions:**

1. **Add property to type:**
```typescript
interface User {
  id: string
  email: string
  username: string // Add this
}
```

2. **Update Supabase types:**
```bash
npx supabase gen types typescript --linked > src/types/supabase.ts
```

3. **Use optional chaining:**
```typescript
const username = user?.username ?? 'Guest'
```

---

### Error: "Cannot use namespace 'X' as a type"

**Symptoms:**
```
Cannot use namespace 'Database' as a type
```

**Cause:** Importing namespace instead of type

**Solutions:**

1. **Import type correctly:**
```typescript
// Before
import { Database } from './supabase'
type User = Database // Error!

// After
import type { Database } from './supabase'
type User = Database['public']['Tables']['users']['Row']
```

---

## Quick Reference

| Error | Quick Fix |
|-------|-----------|
| Module not found | `npx expo start --clear` |
| Port in use | `lsof -ti:8081 \| xargs kill -9` |
| Pod install failed | `cd ios && pod install --repo-update` |
| Gradle build failed | `cd android && ./gradlew clean` |
| JWT expired | `await supabase.auth.refreshSession()` |
| RLS violation | Check policy and user auth |
| Build failed | `eas build:view <build-id>` |
| TypeScript error | `npx tsc --noEmit` |

---

**Still stuck?** Check:
- [Platform-Specific Issues](./PLATFORM-ISSUES.md)
- [Performance Issues](./PERFORMANCE-ISSUES.md)
- [Integration Issues](./INTEGRATION-ISSUES.md)
- [FAQ](../FAQ.md)
