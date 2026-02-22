# VS Code Configuration Feature

**Status:** Essential (Recommended for all projects)
**Cost:** FREE
**Dependencies:** VS Code

## What It Does

Provides instant productivity boosts for VS Code users:
- ⚡ **Code snippets** - Type shortcuts like `rnscreen`, `rnhook`, `rnsvc` for instant templates
- 🎨 **Editor settings** - Team-consistent formatting, linting, file exclusions
- 🔧 **Extension recommendations** - Auto-suggest essential extensions

**Result:** New developers productive in minutes. Consistent code formatting across team.

## When to Enable

✅ **Enable if:**
- Team uses VS Code (most common)
- Want consistent editor setup
- Need faster component creation

❌ **Skip if:**
- Team uses different IDEs exclusively
- Want developers to configure their own editors

## Installation

When you enable this feature, the setup script will:
1. Create `.vscode/` folder with:
   - `mobile-blueprint.code-snippets` - Component templates
   - `settings.json` - Team editor settings
   - `extensions.json` - Recommended extensions
2. No restart needed - snippets available immediately

**Time to enable:** 15 seconds

## Code Snippets Included

### React Native Component (`rnscreen`)

Type `rnscreen` and press Tab:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function ScreenNameScreen() {
  return (
    <View style={styles.container}>
      <Text>ScreenName</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Custom Hook (`rnhook`)

Type `rnhook` and press Tab:

```tsx
import { useState, useEffect } from 'react';

export function useHookName() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Effect logic
  }, []);

  return { data };
}
```

### Service Function (`rnsvc`)

Type `rnsvc` and press Tab:

```tsx
/**
 * Description of service function
 */
export async function functionName(): Promise<void> {
  try {
    // Implementation
  } catch (error) {
    console.error('Error in functionName:', error);
    throw error;
  }
}
```

### Supabase Query (`rnsupabase`)

Type `rnsupabase` and press Tab:

```tsx
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');

if (error) throw error;
return data;
```

### Test Case (`rntest`)

Type `rntest` and press Tab:

```tsx
describe('ComponentName', () => {
  it('should test behavior', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Editor Settings Included

### Formatting
- **Format on save:** Enabled
- **Default formatter:** Prettier
- **ESLint auto-fix:** Enabled on save

### TypeScript
- **TypeScript SDK:** Uses workspace version
- **Suggest imports:** Auto-imports enabled

### File Exclusions
Hides build artifacts in explorer:
- `**/.expo`
- `**/.expo-shared`
- `**/node_modules`
- `**/android` (optional)
- `**/ios` (optional)

### React Native Specific
- **Fast Refresh:** Enabled
- **Metro bundler:** Configured

## Recommended Extensions

When you open the project, VS Code will suggest:

**Essential:**
- ESLint - Linting
- Prettier - Code formatting
- React Native Tools - Debugging
- Jest - Test runner

**Recommended:**
- TypeScript + JavaScript Language Features
- Path Intellisense
- GitLens
- Error Lens

## Usage

### After Enabling

**Snippets available immediately** - just type the prefix and press Tab.

**Keyboard shortcuts:**
- `rnscreen` + Tab → Screen component
- `rnhook` + Tab → Custom hook
- `rnsvc` + Tab → Service function
- `rnsupabase` + Tab → Supabase query
- `rntest` + Tab → Test case

### Customizing Snippets

Edit `.vscode/mobile-blueprint.code-snippets`:

```json
{
  "My Custom Snippet": {
    "prefix": "mycustom",
    "body": [
      "// Your template here",
      "export function ${1:Name}() {",
      "  $0",
      "}"
    ],
    "description": "My custom template"
  }
}
```

**Variables available:**
- `${1:Name}` - First tab stop with placeholder
- `$0` - Final cursor position
- `${TM_FILENAME_BASE}` - File name without extension
- `${CLIPBOARD}` - Clipboard contents

### Customizing Settings

Edit `.vscode/settings.json`:

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true
  }
}
```

## Team Collaboration

### Commit `.vscode/` to Git

```bash
git add .vscode/
git commit -m "chore: add VS Code configuration"
```

**Benefits:**
- Everyone gets same snippets
- Consistent formatting
- Same extension recommendations

### Respect User Settings

`.vscode/settings.json` contains **workspace** settings (project-specific).

**User settings** (global) take precedence for:
- Theme
- Font
- Keyboard shortcuts

So developers can still personalize their editor.

## Troubleshooting

### Snippets Not Showing

1. Check file extension matches snippet scope (`.tsx` for React Native snippets)
2. Restart VS Code
3. Check `.vscode/mobile-blueprint.code-snippets` exists

### Prettier Not Formatting

1. Install Prettier extension
2. Check "Default Formatter" in settings is `esbenp.prettier-vscode`
3. Verify `editor.formatOnSave` is `true`

### ESLint Not Running

1. Install ESLint extension
2. Check `.eslintrc.js` exists in project root
3. Restart ESLint server: Cmd+Shift+P → "ESLint: Restart ESLint Server"

## Further Reading

- [VS Code Snippets Guide](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
- [VS Code Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings)
- [VS Code Extension Recommendations](https://code.visualstudio.com/docs/editor/extension-marketplace#_workspace-recommended-extensions)
