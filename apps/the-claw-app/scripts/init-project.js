#!/usr/bin/env node

/**
 * Interactive Project Setup Wizard
 *
 * Walks developers through setting up their mobile app with:
 * - Theme configuration
 * - Component selection
 * - Database setup (optional)
 * - Authentication (optional)
 * - Feature selection (optional)
 * - Navigation structure
 */

const inquirer = require('inquirer')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

// Paths
const ROOT_DIR = path.join(__dirname, '..')
const EXAMPLES_DIR = path.join(ROOT_DIR, '.examples')
const SRC_DIR = path.join(ROOT_DIR, 'src')
const APP_DIR = path.join(ROOT_DIR, 'app')

// Console helpers
const log = console.log
const success = (msg) => log(chalk.green('✅ ' + msg))
const info = (msg) => log(chalk.blue('ℹ️  ' + msg))
const warn = (msg) => log(chalk.yellow('⚠️  ' + msg))
const error = (msg) => log(chalk.red('❌ ' + msg))
const step = (msg) => log(chalk.cyan('\n' + msg))

/**
 * Main wizard function
 */
async function runWizard() {
  log(chalk.bold.magenta('\n🎨 Mobile App Blueprint - Setup Wizard\n'))
  log('This wizard will help you set up your React Native app.\n')

  try {
    // Collect all answers
    const answers = {}

    // Step 1: Theme Configuration
    step('1️⃣  Theme Configuration')
    answers.theme = await askThemeQuestions()

    // Step 2: Components
    step('2️⃣  Component Selection')
    answers.components = await askComponentQuestions()

    // Step 3: Database
    step('3️⃣  Database Backend (Optional)')
    answers.database = await askDatabaseQuestions()

    // Step 4: Authentication
    step('4️⃣  Authentication (Optional)')
    answers.auth = await askAuthQuestions(answers.database)

    // Step 5: Features
    step('5️⃣  Features (Optional)')
    answers.features = await askFeatureQuestions(answers.database)

    // Step 6: Navigation
    step('6️⃣  Navigation Structure')
    answers.navigation = await askNavigationQuestions(answers.auth)

    // Confirm before proceeding
    step('📋 Summary')
    displaySummary(answers)

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with setup?',
        default: true,
      },
    ])

    if (!confirm) {
      warn('Setup cancelled.')
      process.exit(0)
    }

    // Execute setup
    step('🚀 Setting up your project...')
    await setupProject(answers)

    // Success message
    log('\n' + chalk.bold.green('✅ Setup complete! Your app is ready.\n'))
    displayNextSteps(answers)
  } catch (err) {
    error('Setup failed: ' + err.message)
    console.error(err)
    process.exit(1)
  }
}

/**
 * Ask theme configuration questions
 */
async function askThemeQuestions() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'colorScheme',
      message: 'Choose your primary color:',
      choices: [
        { name: 'Purple (Default)', value: 'purple' },
        { name: 'Blue', value: 'blue' },
        { name: 'Green', value: 'green' },
        { name: 'Orange', value: 'orange' },
        { name: 'Red', value: 'red' },
      ],
      default: 'purple',
    },
    {
      type: 'list',
      name: 'typography',
      message: 'Typography style:',
      choices: [
        { name: 'Default (System fonts)', value: 'default' },
        { name: 'Lexend (ADHD-friendly)', value: 'lexend' },
      ],
      default: 'default',
    },
  ])

  return answers
}

/**
 * Ask component selection questions
 */
async function askComponentQuestions() {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'includeAdvanced',
      message: 'Include advanced components? (Card, LoadingState, ErrorState, EmptyState, FormField)',
      default: true,
    },
  ])

  return answers
}

/**
 * Ask database questions
 */
async function askDatabaseQuestions() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'backend',
      message: 'Database backend:',
      choices: [
        { name: 'None (Local storage only)', value: 'none' },
        { name: 'Supabase (Recommended)', value: 'supabase' },
        { name: 'Other (Manual setup)', value: 'other' },
      ],
      default: 'none',
    },
  ])

  // If Supabase, ask for credentials
  if (answers.backend === 'supabase') {
    const supabaseAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Supabase URL:',
        validate: (input) =>
          input.startsWith('https://') ? true : 'Must be a valid HTTPS URL',
      },
      {
        type: 'input',
        name: 'anonKey',
        message: 'Supabase Anon Key:',
        validate: (input) => (input.length > 0 ? true : 'Anon key is required'),
      },
    ])

    answers.supabase = supabaseAnswers
  }

  return answers
}

/**
 * Ask authentication questions
 */
async function askAuthQuestions(databaseAnswers) {
  const { needsAuth } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'needsAuth',
      message: 'Do you need authentication?',
      default: true,
    },
  ])

  if (!needsAuth) {
    return { needsAuth: false }
  }

  const authType =
    databaseAnswers.backend === 'supabase'
      ? 'supabase'
      : databaseAnswers.backend === 'none'
      ? 'local'
      : null

  const answers = { needsAuth: true, authType }

  if (!authType) {
    // Ask which auth system
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Authentication system:',
        choices: [
          { name: 'Local (AsyncStorage only)', value: 'local' },
          { name: 'Supabase Auth', value: 'supabase' },
          { name: 'Other (Manual setup)', value: 'other' },
        ],
      },
    ])
    answers.authType = type
  }

  return answers
}

/**
 * Ask feature selection questions
 */
async function askFeatureQuestions(databaseAnswers) {
  const { includeTasks } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'includeTasks',
      message: 'Include Tasks CRUD example?',
      default: true,
    },
  ])

  if (!includeTasks) {
    return { includeTasks: false }
  }

  const tasksType =
    databaseAnswers.backend === 'supabase'
      ? 'supabase'
      : databaseAnswers.backend === 'none'
      ? 'local'
      : null

  const answers = { includeTasks: true, tasksType }

  if (!tasksType) {
    // Ask which backend
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Tasks backend:',
        choices: [
          { name: 'Local (AsyncStorage)', value: 'local' },
          { name: 'Supabase', value: 'supabase' },
        ],
      },
    ])
    answers.tasksType = type
  }

  return answers
}

/**
 * Ask navigation questions
 */
async function askNavigationQuestions(authAnswers) {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useTabs',
      message: 'Use tab navigation?',
      default: true,
    },
  ])

  if (answers.useTabs) {
    const { tabCount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'tabCount',
        message: 'Number of tabs:',
        choices: ['2', '3', '4', '5'],
        default: '4',
      },
    ])
    answers.tabCount = parseInt(tabCount)
  }

  return answers
}

/**
 * Display setup summary
 */
function displaySummary(answers) {
  log('\nYour configuration:')
  log(chalk.bold('\nTheme:'))
  log(`  Color: ${answers.theme.colorScheme}`)
  log(`  Typography: ${answers.theme.typography}`)

  log(chalk.bold('\nComponents:'))
  log(`  Advanced components: ${answers.components.includeAdvanced ? 'Yes' : 'No'}`)

  log(chalk.bold('\nDatabase:'))
  log(`  Backend: ${answers.database.backend}`)
  if (answers.database.backend === 'supabase') {
    log(`  URL: ${answers.database.supabase.url}`)
  }

  log(chalk.bold('\nAuthentication:'))
  log(`  Enabled: ${answers.auth.needsAuth ? 'Yes' : 'No'}`)
  if (answers.auth.needsAuth) {
    log(`  Type: ${answers.auth.authType}`)
  }

  log(chalk.bold('\nFeatures:'))
  log(`  Tasks: ${answers.features.includeTasks ? 'Yes' : 'No'}`)
  if (answers.features.includeTasks) {
    log(`  Backend: ${answers.features.tasksType}`)
  }

  log(chalk.bold('\nNavigation:'))
  log(`  Tabs: ${answers.navigation.useTabs ? 'Yes' : 'No'}`)
  if (answers.navigation.useTabs) {
    log(`  Tab count: ${answers.navigation.tabCount}`)
  }

  log('')
}

/**
 * Execute project setup based on answers
 */
async function setupProject(answers) {
  // 1. Create directories
  await createDirectories()

  // 2. Setup theme
  await setupTheme(answers.theme)

  // 3. Copy components
  await setupComponents(answers.components)

  // 4. Setup database
  if (answers.database.backend === 'supabase') {
    await setupSupabase(answers.database)
  }

  // 5. Setup auth
  if (answers.auth.needsAuth) {
    await setupAuth(answers.auth)
  }

  // 6. Setup features
  if (answers.features.includeTasks) {
    await setupTasks(answers.features)
  }

  // 7. Setup navigation
  await setupNavigation(answers.navigation, answers.auth)

  // 8. Create environment file
  await createEnvFile(answers)

  // 9. Update package.json
  await updatePackageJson(answers)
}

/**
 * Create necessary directories
 */
async function createDirectories() {
  info('Creating directory structure...')

  const dirs = [
    path.join(SRC_DIR, 'components'),
    path.join(SRC_DIR, 'contexts'),
    path.join(SRC_DIR, 'features'),
    path.join(SRC_DIR, 'hooks'),
    path.join(SRC_DIR, 'services'),
    path.join(SRC_DIR, 'types'),
    path.join(SRC_DIR, 'utils'),
    path.join(APP_DIR, '(auth)'),
    path.join(APP_DIR, '(tabs)'),
  ]

  for (const dir of dirs) {
    await fs.ensureDir(dir)
  }

  success('Directory structure created')
}

/**
 * Setup theme based on user selection
 */
async function setupTheme(themeAnswers) {
  info('Configuring theme...')

  // Theme already exists in src/theme/ from Week 1
  // Just update color if needed
  const tokensPath = path.join(SRC_DIR, 'theme', 'tokens.ts')

  if (themeAnswers.colorScheme !== 'purple') {
    // Update primary color
    const colorMap = {
      blue: { 500: '#3b82f6' },
      green: { 500: '#10b981' },
      orange: { 500: '#f97316' },
      red: { 500: '#ef4444' },
    }

    // Would need to read and modify the file
    // For now, just inform user
    info(`Theme color set to: ${themeAnswers.colorScheme}`)
    info(`Update src/theme/tokens.ts manually to change primary color to ${colorMap[themeAnswers.colorScheme]?.[500]}`)
  }

  success('Theme configured')
}

/**
 * Setup components
 */
async function setupComponents(componentAnswers) {
  if (componentAnswers.includeAdvanced) {
    info('Copying advanced components...')

    const componentsSource = path.join(EXAMPLES_DIR, 'components', 'advanced')
    const componentsDest = path.join(SRC_DIR, 'components', 'advanced')

    await fs.copy(componentsSource, componentsDest)

    success('Advanced components copied')
  }
}

/**
 * Setup Supabase
 */
async function setupSupabase(databaseAnswers) {
  info('Setting up Supabase...')

  // Copy Supabase client
  const clientSource = path.join(EXAMPLES_DIR, 'database', 'supabase-client.ts')
  const clientDest = path.join(SRC_DIR, 'services', 'supabase.ts')

  await fs.copy(clientSource, clientDest)

  // Copy database types placeholder
  const typesDir = path.join(SRC_DIR, 'types')
  await fs.ensureDir(typesDir)

  const databaseTypes = `// Generated types from Supabase
// Run: npm run gen:types

export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
  }
}
`

  await fs.writeFile(path.join(typesDir, 'database.ts'), databaseTypes)

  success('Supabase client configured')
}

/**
 * Setup authentication
 */
async function setupAuth(authAnswers) {
  info(`Setting up ${authAnswers.authType} authentication...`)

  // Copy auth context
  const authSource = path.join(
    EXAMPLES_DIR,
    'features',
    `auth-${authAnswers.authType}`,
    'AuthContext.tsx'
  )
  const authDest = path.join(SRC_DIR, 'contexts', 'AuthContext.tsx')

  await fs.copy(authSource, authDest)

  // Copy auth screens
  const screensSource = path.join(EXAMPLES_DIR, 'screens', 'auth')
  const screensDest = path.join(APP_DIR, '(auth)')

  await fs.copy(screensSource, screensDest)

  // Rename to match Expo Router convention
  await fs.move(
    path.join(screensDest, 'LoginScreen.tsx'),
    path.join(screensDest, 'login.tsx'),
    { overwrite: true }
  )
  await fs.move(
    path.join(screensDest, 'SignupScreen.tsx'),
    path.join(screensDest, 'signup.tsx'),
    { overwrite: true }
  )

  success('Authentication configured')
}

/**
 * Setup tasks feature
 */
async function setupTasks(featureAnswers) {
  info(`Setting up tasks (${featureAnswers.tasksType})...`)

  const tasksSource = path.join(
    EXAMPLES_DIR,
    'features',
    `tasks-${featureAnswers.tasksType}`
  )
  const tasksDest = path.join(SRC_DIR, 'features', 'tasks')

  await fs.copy(tasksSource, tasksDest)

  success('Tasks feature configured')
}

/**
 * Setup navigation
 */
async function setupNavigation(navAnswers, authAnswers) {
  info('Setting up navigation...')

  // Create root layout with auth guard if auth is enabled
  const rootLayoutContent = authAnswers.needsAuth
    ? generateRootLayoutWithAuth()
    : generateRootLayoutBasic()

  await fs.writeFile(path.join(APP_DIR, '_layout.tsx'), rootLayoutContent)

  if (navAnswers.useTabs) {
    // Create tabs layout
    const tabsLayoutContent = generateTabsLayout(navAnswers.tabCount)
    await fs.writeFile(
      path.join(APP_DIR, '(tabs)', '_layout.tsx'),
      tabsLayoutContent
    )

    // Create tab screens
    const tabScreens = ['index', 'profile', 'settings']
    if (navAnswers.tabCount >= 4) tabScreens.splice(1, 0, 'tasks')

    for (const screen of tabScreens.slice(0, navAnswers.tabCount)) {
      const screenContent = generateTabScreen(screen)
      await fs.writeFile(
        path.join(APP_DIR, '(tabs)', `${screen}.tsx`),
        screenContent
      )
    }
  }

  success('Navigation configured')
}

/**
 * Create .env file
 */
async function createEnvFile(answers) {
  info('Creating .env file...')

  let envContent = '# Environment Variables\n\n'

  if (answers.database.backend === 'supabase') {
    envContent += `# Supabase\nEXPO_PUBLIC_SUPABASE_URL=${answers.database.supabase.url}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${answers.database.supabase.anonKey}\n\n`
  }

  const envPath = path.join(ROOT_DIR, '.env')
  await fs.writeFile(envPath, envContent)

  success('.env file created')
}

/**
 * Update package.json with scripts
 */
async function updatePackageJson(answers) {
  info('Updating package.json...')

  const packagePath = path.join(ROOT_DIR, 'package.json')
  const pkg = await fs.readJson(packagePath)

  // Add scripts
  if (!pkg.scripts) pkg.scripts = {}

  if (answers.database.backend === 'supabase') {
    pkg.scripts['gen:types'] =
      'supabase gen types typescript --project-id your-project-ref > src/types/database.ts'
  }

  await fs.writeJson(packagePath, pkg, { spaces: 2 })

  success('package.json updated')
}

/**
 * Generate root layout with auth
 */
function generateRootLayoutWithAuth() {
  return `import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { ThemeProvider } from '@/theme'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components'

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, loading, segments])

  if (loading) {
    return <LoadingState />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  )
}
`
}

/**
 * Generate basic root layout
 */
function generateRootLayoutBasic() {
  return `import { Stack } from 'expo-router'
import { ThemeProvider } from '@/theme'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  )
}
`
}

/**
 * Generate tabs layout
 */
function generateTabsLayout(tabCount) {
  return `import { Tabs } from 'expo-router'
import { useTheme } from '@/theme'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      ${tabCount >= 4 ? '<Tabs.Screen name="tasks" options={{ title: "Tasks" }} />' : ''}
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
`
}

/**
 * Generate tab screen
 */
function generateTabScreen(name) {
  const titles = {
    index: 'Home',
    tasks: 'Tasks',
    profile: 'Profile',
    settings: 'Settings',
  }

  return `import { View, StyleSheet } from 'react-native'
import { Text } from '@/components'

export default function ${
    name.charAt(0).toUpperCase() + name.slice(1)
  }Screen() {
  return (
    <View style={styles.container}>
      <Text variant="h1">${titles[name]}</Text>
      <Text variant="body">This is the ${titles[name].toLowerCase()} screen.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
})
`
}

/**
 * Display next steps
 */
function displayNextSteps(answers) {
  log(chalk.bold('📚 Next Steps:\n'))

  log('1. Install dependencies:')
  log(chalk.gray('   npm install\n'))

  if (answers.database.backend === 'supabase') {
    log('2. Run Supabase migrations:')
    log(chalk.gray('   See .examples/database/README.md\n'))

    log('3. Generate TypeScript types:')
    log(chalk.gray('   npm run gen:types\n'))
  }

  log(`${answers.database.backend === 'supabase' ? '4' : '2'}. Start development server:`)
  log(chalk.gray('   npm start\n'))

  log(chalk.bold('📖 Documentation:\n'))
  log('  - Examples: .examples/README.md')
  log('  - Features: .examples/features/')
  log('  - Components: .examples/components/')
  if (answers.database.backend === 'supabase') {
    log('  - Database: .examples/database/')
  }

  log('\n' + chalk.bold.green('Happy coding! 🚀\n'))
}

// Run wizard
runWizard()
