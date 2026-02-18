# End-to-End Testing with Maestro

## Overview

E2E tests verify complete user flows work correctly. We use [Maestro](https://maestro.mobile.dev) for its speed and simplicity.

## Why Maestro?

| Feature | Maestro | Detox | Appium |
|---------|---------|-------|--------|
| Setup time | Minutes | Hours | Hours |
| Test syntax | YAML | JavaScript | Multiple |
| Speed | Fast | Medium | Slow |
| Reliability | High | Medium | Low |
| Learning curve | Low | Medium | High |

## Installation

```bash
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

## Project Structure

```
e2e/
├── flows/
│   ├── auth/
│   │   ├── login.yaml
│   │   ├── signup.yaml
│   │   └── logout.yaml
│   ├── tasks/
│   │   ├── create-task.yaml
│   │   ├── complete-task.yaml
│   │   └── delete-task.yaml
│   └── settings/
│       └── change-theme.yaml
├── config.yaml
└── README.md
```

## Writing Tests

### Basic Flow

```yaml
# e2e/flows/auth/login.yaml
appId: com.yourapp.app
---
- launchApp
- assertVisible: "Welcome"
- tapOn: "Sign In"
- tapOn:
    id: "email-input"
- inputText: "test@example.com"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn: "Continue"
- assertVisible: "Dashboard"
```

### With Test IDs

Add testID props to components:

```typescript
// React Native component
<TextInput
  testID="email-input"
  placeholder="Email"
/>
```

Reference in Maestro:

```yaml
- tapOn:
    id: "email-input"
```

### Assertions

```yaml
# Text visible
- assertVisible: "Welcome back"

# Text not visible
- assertNotVisible: "Error"

# Element exists by ID
- assertVisible:
    id: "submit-button"

# Element contains text
- assertVisible:
    text: "Tasks.*"
    regex: true
```

### Conditionals

```yaml
- runFlow:
    when:
      visible: "Accept Cookies"
    file: dismiss-cookies.yaml
```

### Loops and Variables

```yaml
# Create 3 tasks
- repeat:
    times: 3
    commands:
      - tapOn: "Add Task"
      - inputText: "Task ${index}"
      - tapOn: "Save"
```

## Complete Example: Task Creation Flow

```yaml
# e2e/flows/tasks/create-task.yaml
appId: com.yourapp.app
name: Create Task Flow
---
# Ensure logged in
- runFlow:
    when:
      visible: "Sign In"
    file: ../auth/login.yaml

# Navigate to tasks
- tapOn: "Tasks"
- assertVisible: "My Tasks"

# Create new task
- tapOn:
    id: "add-task-button"
- assertVisible: "New Task"

# Fill form
- tapOn:
    id: "task-title-input"
- inputText: "Buy groceries"

- tapOn:
    id: "task-description-input"
- inputText: "Milk, eggs, bread"

# Set due date
- tapOn: "Due Date"
- tapOn: "Tomorrow"

# Save
- tapOn: "Save Task"

# Verify created
- assertVisible: "Buy groceries"
- assertVisible: "Tomorrow"

# Cleanup - delete task
- longPressOn: "Buy groceries"
- tapOn: "Delete"
- tapOn: "Confirm"
- assertNotVisible: "Buy groceries"
```

## Running Tests

```bash
# Run single flow
maestro test e2e/flows/auth/login.yaml

# Run all flows
maestro test e2e/flows/

# With specific device
maestro test --device emulator-5554 e2e/flows/

# Record video
maestro record e2e/flows/auth/login.yaml

# Debug mode (step through)
maestro test --debug e2e/flows/auth/login.yaml
```

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH

      - name: Build iOS app
        run: npx expo run:ios --configuration Release

      - name: Run E2E tests
        run: maestro test e2e/flows/

      - name: Upload failure artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: maestro-failures
          path: ~/.maestro/tests
```

### Maestro Cloud (Recommended)

```bash
# Upload and run in cloud
maestro cloud e2e/flows/

# With API key
MAESTRO_CLOUD_API_KEY=xxx maestro cloud e2e/flows/
```

## Best Practices

### 1. Use Test IDs

```typescript
// Always add testID for interactive elements
<TouchableOpacity testID="submit-button">
  <Text>Submit</Text>
</TouchableOpacity>
```

### 2. Keep Flows Focused

```yaml
# GOOD - Single purpose
# login.yaml - Just login
# create-task.yaml - Just create task

# BAD - Kitchen sink
# full-app-test.yaml - Everything
```

### 3. Make Flows Reusable

```yaml
# e2e/flows/helpers/ensure-logged-in.yaml
- runFlow:
    when:
      visible: "Sign In"
    file: ../auth/login.yaml
```

### 4. Handle Flaky Elements

```yaml
# Wait for element
- extendedWaitUntil:
    visible: "Dashboard"
    timeout: 10000

# Retry on failure
- retry:
    times: 3
    commands:
      - tapOn: "Submit"
```

### 5. Clean Up After Tests

```yaml
# At end of test
- runFlow:
    file: cleanup.yaml
```

## Critical Flows to Test

| Priority | Flow | Frequency |
|----------|------|-----------|
| P0 | Login/Logout | Every PR |
| P0 | Core feature (task creation) | Every PR |
| P1 | Signup | Daily |
| P1 | Payment flow | Daily |
| P2 | Settings changes | Weekly |
| P2 | Edge cases | Weekly |

## Debugging

### View Hierarchy

```bash
# Dump current view hierarchy
maestro hierarchy
```

### Screenshots

```yaml
- takeScreenshot: "before-submit"
- tapOn: "Submit"
- takeScreenshot: "after-submit"
```

### Verbose Output

```bash
maestro test --debug-output e2e/flows/login.yaml
```

## Checklist

- [ ] Maestro installed locally
- [ ] Test IDs added to key components
- [ ] Critical flows covered (auth, core features)
- [ ] CI pipeline runs E2E on PRs
- [ ] Failure artifacts uploaded
- [ ] Tests run in under 10 minutes
