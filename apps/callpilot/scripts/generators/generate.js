#!/usr/bin/env node

/**
 * Code Generation CLI
 *
 * Generate components, screens, features, services, hooks, and more
 * with production-ready templates following project conventions.
 *
 * Usage:
 *   npm run generate
 *   npm run generate component Button
 *   npm run generate screen UserProfile
 *   npm run generate feature Tasks
 */

const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')

// Template types
const TEMPLATE_TYPES = {
  component: {
    name: 'Component',
    description: 'UI component (e.g., Button, Card)',
    path: 'src/components',
    extension: '.tsx',
  },
  screen: {
    name: 'Screen',
    description: 'Screen component (e.g., tasks-screen)',
    path: 'src/screens',
    extension: '.tsx',
    suffix: '-screen',
  },
  context: {
    name: 'Context',
    description: 'React Context provider',
    path: 'src/contexts',
    extension: '.tsx',
    suffix: 'Context',
  },
  hook: {
    name: 'Hook',
    description: 'Custom React hook',
    path: 'src/hooks',
    extension: '.ts',
    prefix: 'use',
  },
  service: {
    name: 'Service',
    description: 'Business logic service',
    path: 'src/services',
    extension: '.ts',
  },
  feature: {
    name: 'Feature',
    description: 'Complete feature module',
    path: 'src/features',
    extension: '',
  },
  util: {
    name: 'Utility',
    description: 'Pure utility function',
    path: 'src/utils',
    extension: '.ts',
  },
  type: {
    name: 'Type',
    description: 'TypeScript type definitions',
    path: 'src/types',
    extension: '.ts',
  },
}

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const TEMPLATES_DIR = path.join(__dirname, 'templates')

/**
 * Main CLI
 */
async function main() {
  try {
    console.log(chalk.blue.bold('\n🎨 Code Generator\n'))

    // Parse CLI arguments
    const args = process.argv.slice(2)
    let templateType = args[0]
    let itemName = args[1]

    // If no template type provided, prompt for it
    if (!templateType) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'What would you like to generate?',
          choices: Object.entries(TEMPLATE_TYPES).map(([key, value]) => ({
            name: `${value.name} - ${value.description}`,
            value: key,
          })),
        },
      ])
      templateType = answer.type
    }

    // Validate template type
    const template = TEMPLATE_TYPES[templateType]
    if (!template) {
      console.error(chalk.red(`❌ Invalid template type: ${templateType}`))
      console.log(chalk.gray('\nAvailable types:'))
      Object.entries(TEMPLATE_TYPES).forEach(([key, value]) => {
        console.log(chalk.gray(`  - ${key}: ${value.description}`))
      })
      process.exit(1)
    }

    // If no name provided, prompt for it
    if (!itemName) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: `${template.name} name:`,
          validate: (input) => {
            if (!input) return 'Name is required'
            if (!/^[A-Za-z][A-Za-z0-9]*$/.test(input)) {
              return 'Name must start with a letter and contain only letters and numbers'
            }
            return true
          },
        },
      ])
      itemName = answer.name
    }

    // Generate the item
    await generate(templateType, itemName, template)

    console.log(chalk.green('\n✅ Generation complete!\n'))
  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('❌ Prompt could not be rendered in this environment'))
    } else {
      console.error(chalk.red('❌ Error:'), error.message)
    }
    process.exit(1)
  }
}

/**
 * Generate item from template
 */
async function generate(templateType, itemName, template) {
  // Format name based on template conventions
  const formattedName = formatName(itemName, template)

  // Get file path
  const filePath = getFilePath(formattedName, template)

  // Check if file already exists
  if (await fs.pathExists(filePath)) {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow(`File already exists: ${filePath}\nOverwrite?`),
        default: false,
      },
    ])

    if (!answer.overwrite) {
      console.log(chalk.gray('Cancelled'))
      return
    }
  }

  // Generate based on type
  if (templateType === 'feature') {
    await generateFeature(formattedName, template)
  } else {
    await generateFile(templateType, formattedName, template, filePath)
  }
}

/**
 * Format name based on template conventions
 */
function formatName(name, template) {
  // Remove existing prefix/suffix
  let formatted = name

  // Apply prefix
  if (template.prefix && !formatted.startsWith(template.prefix)) {
    // Capitalize first letter after prefix
    formatted = template.prefix + formatted.charAt(0).toUpperCase() + formatted.slice(1)
  } else if (!template.prefix) {
    // Just capitalize for non-prefix items
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  // Apply suffix
  if (template.suffix && !formatted.endsWith(template.suffix)) {
    formatted = formatted + template.suffix
  }

  return formatted
}

/**
 * Get file path for generated item
 */
function getFilePath(name, template) {
  const dir = path.join(PROJECT_ROOT, template.path)
  let fileName = name

  // For hooks, use camelCase filename
  if (template.prefix === 'use') {
    fileName = name.charAt(0).toLowerCase() + name.slice(1)
  }

  return path.join(dir, fileName + template.extension)
}

/**
 * Generate single file from template
 */
async function generateFile(templateType, name, template, filePath) {
  // Read template
  const templatePath = path.join(TEMPLATES_DIR, `${templateType}.template`)

  if (!await fs.pathExists(templatePath)) {
    console.error(chalk.red(`❌ Template not found: ${templatePath}`))
    process.exit(1)
  }

  let templateContent = await fs.readFile(templatePath, 'utf-8')

  // Replace placeholders
  const replacements = getReplacements(name, template)
  templateContent = replacePlaceholders(templateContent, replacements)

  // Ensure directory exists
  await fs.ensureDir(path.dirname(filePath))

  // Write file
  await fs.writeFile(filePath, templateContent)

  console.log(chalk.green('✅ Created:'), chalk.cyan(path.relative(PROJECT_ROOT, filePath)))

  // Generate test file if applicable
  if (['component', 'screen', 'hook', 'service', 'util'].includes(templateType)) {
    await generateTestFile(templateType, name, template, filePath)
  }

  // Show next steps
  showNextSteps(templateType, name, filePath)
}

/**
 * Generate test file
 */
async function generateTestFile(templateType, name, template, sourcePath) {
  const testTemplatePath = path.join(TEMPLATES_DIR, `${templateType}.test.template`)

  if (!await fs.pathExists(testTemplatePath)) {
    return // No test template available
  }

  // Determine test file path
  const sourceDir = path.dirname(sourcePath)
  const sourceFile = path.basename(sourcePath, template.extension)
  const testPath = path.join(sourceDir, '__tests__', `${sourceFile}.test${template.extension}`)

  // Read test template
  let testContent = await fs.readFile(testTemplatePath, 'utf-8')

  // Replace placeholders
  const replacements = getReplacements(name, template)
  testContent = replacePlaceholders(testContent, replacements)

  // Ensure directory exists
  await fs.ensureDir(path.dirname(testPath))

  // Write test file
  await fs.writeFile(testPath, testContent)

  console.log(chalk.green('✅ Created:'), chalk.cyan(path.relative(PROJECT_ROOT, testPath)))
}

/**
 * Generate complete feature module
 */
async function generateFeature(name, template) {
  const featureDir = path.join(PROJECT_ROOT, template.path, name.toLowerCase())

  // Prompt for feature options
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'includes',
      message: 'Include in feature:',
      choices: [
        { name: 'Components', value: 'components', checked: true },
        { name: 'Screens', value: 'screens', checked: true },
        { name: 'Context', value: 'context', checked: true },
        { name: 'Hooks', value: 'hooks', checked: true },
        { name: 'Services', value: 'services', checked: true },
        { name: 'Types', value: 'types', checked: true },
        { name: 'Tests', value: 'tests', checked: true },
      ],
    },
    {
      type: 'confirm',
      name: 'supabase',
      message: 'Include Supabase integration?',
      default: true,
    },
  ])

  const includes = answers.includes
  const useSupabase = answers.supabase

  // Create feature directory structure
  await fs.ensureDir(featureDir)

  const files = []

  // Generate index file
  const indexPath = path.join(featureDir, 'index.ts')
  files.push({ path: indexPath, content: generateFeatureIndex(name, includes) })

  // Generate components
  if (includes.includes('components')) {
    const componentsDir = path.join(featureDir, 'components')
    await fs.ensureDir(componentsDir)

    const componentName = `${name}List`
    const componentPath = path.join(componentsDir, `${componentName}.tsx`)
    files.push({
      path: componentPath,
      content: generateFeatureComponent(name, componentName),
    })
  }

  // Generate screens
  if (includes.includes('screens')) {
    const screensDir = path.join(featureDir, 'screens')
    await fs.ensureDir(screensDir)

    const screenPath = path.join(screensDir, `${name.toLowerCase()}-screen.tsx`)
    files.push({
      path: screenPath,
      content: generateFeatureScreen(name),
    })
  }

  // Generate context
  if (includes.includes('context')) {
    const contextPath = path.join(featureDir, `${name}Context.tsx`)
    files.push({
      path: contextPath,
      content: generateFeatureContext(name),
    })
  }

  // Generate hooks
  if (includes.includes('hooks')) {
    const hooksDir = path.join(featureDir, 'hooks')
    await fs.ensureDir(hooksDir)

    const hookPath = path.join(hooksDir, `use${name}.ts`)
    files.push({
      path: hookPath,
      content: generateFeatureHook(name),
    })
  }

  // Generate services
  if (includes.includes('services')) {
    const servicePath = path.join(featureDir, `${name.toLowerCase()}Service.ts`)
    files.push({
      path: servicePath,
      content: generateFeatureService(name, useSupabase),
    })
  }

  // Generate types
  if (includes.includes('types')) {
    const typesPath = path.join(featureDir, 'types.ts')
    files.push({
      path: typesPath,
      content: generateFeatureTypes(name),
    })
  }

  // Generate README
  const readmePath = path.join(featureDir, 'README.md')
  files.push({
    path: readmePath,
    content: generateFeatureReadme(name, includes, useSupabase),
  })

  // Write all files
  for (const file of files) {
    await fs.writeFile(file.path, file.content)
    console.log(chalk.green('✅ Created:'), chalk.cyan(path.relative(PROJECT_ROOT, file.path)))
  }

  console.log(chalk.green(`\n✅ Feature "${name}" generated!`))
  console.log(chalk.gray(`\nLocation: ${path.relative(PROJECT_ROOT, featureDir)}`))

  showFeatureNextSteps(name, useSupabase)
}

/**
 * Get replacements for template placeholders
 */
function getReplacements(name, template) {
  // Base name without prefix/suffix
  let baseName = name
  if (template.prefix) {
    baseName = baseName.replace(new RegExp(`^${template.prefix}`), '')
  }
  if (template.suffix) {
    baseName = baseName.replace(new RegExp(`${template.suffix}$`), '')
  }

  return {
    NAME: name,
    BASE_NAME: baseName,
    CAMEL_NAME: baseName.charAt(0).toLowerCase() + baseName.slice(1),
    UPPER_NAME: name.toUpperCase(),
    KEBAB_NAME: baseName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
    SNAKE_NAME: baseName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
    DATE: new Date().toISOString().split('T')[0],
  }
}

/**
 * Replace placeholders in template
 */
function replacePlaceholders(content, replacements) {
  let result = content

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value)
  }

  return result
}

/**
 * Generate feature index file
 */
function generateFeatureIndex(name, includes) {
  const exports = []

  if (includes.includes('components')) {
    exports.push(`export * from './components/${name}List'`)
  }
  if (includes.includes('screens')) {
    exports.push(`export * from './screens/${name.toLowerCase()}-screen'`)
  }
  if (includes.includes('context')) {
    exports.push(`export * from './${name}Context'`)
  }
  if (includes.includes('hooks')) {
    exports.push(`export * from './hooks/use${name}'`)
  }
  if (includes.includes('services')) {
    exports.push(`export * from './${name.toLowerCase()}Service'`)
  }
  if (includes.includes('types')) {
    exports.push(`export * from './types'`)
  }

  return `/**
 * ${name} Feature
 *
 * Generated: ${new Date().toISOString().split('T')[0]}
 */

${exports.join('\n')}
`
}

/**
 * Generate feature component
 */
function generateFeatureComponent(featureName, componentName) {
  const itemName = featureName.toLowerCase()

  return `/**
 * ${componentName} Component
 */

import React from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '@/components'
import { use${featureName} } from '../hooks/use${featureName}'
import type { ${featureName} } from '../types'

export interface ${componentName}Props {
  onPress?: (item: ${featureName}) => void
}

export function ${componentName}({ onPress }: ${componentName}Props) {
  const { theme } = useTheme()
  const { items, isLoading } = use${featureName}()

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No ${itemName}s found</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View
          style={[
            styles.item,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text>{item.name}</Text>
        </View>
      )}
      contentContainerStyle={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  item: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
`
}

/**
 * Generate feature screen
 */
function generateFeatureScreen(name) {
  const itemName = name.toLowerCase()

  return `/**
 * ${name} Screen
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '@/components'
import { ${name}Provider } from '../${name}Context'
import { ${name}List } from '../components/${name}List'

export function ${name}Screen() {
  const { theme } = useTheme()

  return (
    <${name}Provider>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={styles.title}>${name}</Text>
        </View>
        <${name}List />
      </View>
    </${name}Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
})
`
}

/**
 * Generate feature context
 */
function generateFeatureContext(name) {
  const itemName = name.toLowerCase()

  return `/**
 * ${name} Context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ${itemName}Service } from './${itemName}Service'
import type { ${name} } from './types'

interface ${name}ContextValue {
  items: ${name}[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  create: (data: Partial<${name}>) => Promise<${name}>
  update: (id: string, data: Partial<${name}>) => Promise<${name}>
  remove: (id: string) => Promise<void>
}

const ${name}Context = createContext<${name}ContextValue | undefined>(undefined)

interface ${name}ProviderProps {
  children: ReactNode
}

export function ${name}Provider({ children }: ${name}ProviderProps) {
  const [items, setItems] = useState<${name}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await ${itemName}Service.getAll()
      setItems(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  async function refresh() {
    await loadItems()
  }

  async function create(data: Partial<${name}>) {
    const item = await ${itemName}Service.create(data)
    setItems([...items, item])
    return item
  }

  async function update(id: string, data: Partial<${name}>) {
    const item = await ${itemName}Service.update(id, data)
    setItems(items.map((i) => (i.id === id ? item : i)))
    return item
  }

  async function remove(id: string) {
    await ${itemName}Service.remove(id)
    setItems(items.filter((i) => i.id !== id))
  }

  const value: ${name}ContextValue = {
    items,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
  }

  return <${name}Context.Provider value={value}>{children}</${name}Context.Provider>
}

export function use${name}Context(): ${name}ContextValue {
  const context = useContext(${name}Context)
  if (!context) {
    throw new Error('use${name}Context must be used within ${name}Provider')
  }
  return context
}
`
}

/**
 * Generate feature hook
 */
function generateFeatureHook(name) {
  return `/**
 * use${name} Hook
 */

import { use${name}Context } from '../${name}Context'

export function use${name}() {
  return use${name}Context()
}
`
}

/**
 * Generate feature service
 */
function generateFeatureService(name, useSupabase) {
  const itemName = name.toLowerCase()

  if (useSupabase) {
    return `/**
 * ${name} Service
 *
 * Handles ${itemName} data operations with Supabase
 */

import { supabase } from '@/services/supabase'
import type { ${name} } from './types'

const TABLE_NAME = '${itemName}s'

export const ${itemName}Service = {
  /**
   * Get all ${itemName}s
   */
  async getAll(): Promise<${name}[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get ${itemName} by ID
   */
  async getById(id: string): Promise<${name} | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create ${itemName}
   */
  async create(item: Partial<${name}>): Promise<${name}> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([item])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update ${itemName}
   */
  async update(id: string, updates: Partial<${name}>): Promise<${name}> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete ${itemName}
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
`
  } else {
    return `/**
 * ${name} Service
 *
 * Handles ${itemName} data operations with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ${name} } from './types'

const STORAGE_KEY = '@app/${itemName}s'

export const ${itemName}Service = {
  /**
   * Get all ${itemName}s
   */
  async getAll(): Promise<${name}[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEY)
    return json ? JSON.parse(json) : []
  },

  /**
   * Get ${itemName} by ID
   */
  async getById(id: string): Promise<${name} | null> {
    const items = await this.getAll()
    return items.find((item) => item.id === id) || null
  },

  /**
   * Create ${itemName}
   */
  async create(item: Partial<${name}>): Promise<${name}> {
    const items = await this.getAll()
    const newItem: ${name} = {
      id: Date.now().toString(),
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ${name}

    items.push(newItem)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    return newItem
  },

  /**
   * Update ${itemName}
   */
  async update(id: string, updates: Partial<${name}>): Promise<${name}> {
    const items = await this.getAll()
    const index = items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error('Item not found')
    }

    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    return items[index]
  },

  /**
   * Delete ${itemName}
   */
  async remove(id: string): Promise<void> {
    const items = await this.getAll()
    const filtered = items.filter((item) => item.id !== id)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },
}
`
  }
}

/**
 * Generate feature types
 */
function generateFeatureTypes(name) {
  const itemName = name.toLowerCase()

  return `/**
 * ${name} Types
 */

export interface ${name} {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface ${name}CreateInput {
  name: string
  description?: string
}

export interface ${name}UpdateInput {
  name?: string
  description?: string
}
`
}

/**
 * Generate feature README
 */
function generateFeatureReadme(name, includes, useSupabase) {
  const itemName = name.toLowerCase()

  return `# ${name} Feature

Generated: ${new Date().toISOString().split('T')[0]}

## Overview

Complete feature module for ${itemName} management.

## Structure

\`\`\`
${itemName}/
${includes.includes('components') ? `├── components/\n│   └── ${name}List.tsx\n` : ''}${includes.includes('screens') ? `├── screens/\n│   └── ${itemName}-screen.tsx\n` : ''}${includes.includes('hooks') ? `├── hooks/\n│   └── use${name}.ts\n` : ''}${includes.includes('context') ? `├── ${name}Context.tsx\n` : ''}${includes.includes('services') ? `├── ${itemName}Service.ts\n` : ''}${includes.includes('types') ? `├── types.ts\n` : ''}└── index.ts
\`\`\`

## Usage

${includes.includes('context') ? `### With Context

\`\`\`tsx
import { ${name}Provider, use${name} } from '@/features/${itemName}'

function App() {
  return (
    <${name}Provider>
      <${name}Screen />
    </${name}Provider>
  )
}

function ${name}Screen() {
  const { items, create, update, remove } = use${name}()

  // Use the hook
}
\`\`\`
` : ''}
${includes.includes('services') ? `### Direct Service Usage

\`\`\`tsx
import { ${itemName}Service } from '@/features/${itemName}'

// Get all
const items = await ${itemName}Service.getAll()

// Create
const item = await ${itemName}Service.create({ name: 'New Item' })

// Update
await ${itemName}Service.update(item.id, { name: 'Updated' })

// Delete
await ${itemName}Service.remove(item.id)
\`\`\`
` : ''}
${useSupabase ? `## Database Setup

### 1. Create Migration

\`\`\`bash
npm run db:migration create_${itemName}s
\`\`\`

### 2. Add Schema

\`\`\`sql
create table ${itemName}s (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table ${itemName}s enable row level security;

create policy "${name}s are viewable by owner"
  on ${itemName}s for select
  using (auth.uid() = user_id);

create policy "${name}s are insertable by owner"
  on ${itemName}s for insert
  with check (auth.uid() = user_id);

create policy "${name}s are updatable by owner"
  on ${itemName}s for update
  using (auth.uid() = user_id);

create policy "${name}s are deletable by owner"
  on ${itemName}s for delete
  using (auth.uid() = user_id);
\`\`\`

### 3. Run Migration

\`\`\`bash
npm run db:migrate
npm run gen:types
\`\`\`
` : ''}
## Next Steps

1. Customize types in \`types.ts\`
${includes.includes('components') ? `2. Style components in \`components/\`\n` : ''}${includes.includes('screens') ? `3. Add navigation to \`screens/\`\n` : ''}${useSupabase ? `4. Set up database tables\n5. Configure RLS policies\n` : ''}${includes.includes('services') ? `6. Extend service methods as needed\n` : ''}
## Related Docs

- [New Feature Pattern](../../docs/patterns/NEW-FEATURE.md)
${useSupabase ? `- [Supabase Tables](../../docs/patterns/SUPABASE-TABLE.md)\n` : ''}- [Component Guidelines](../../docs/05-ui-ux/DESIGN-PHILOSOPHY.md)
`
}

/**
 * Show next steps after generation
 */
function showNextSteps(templateType, name, filePath) {
  console.log(chalk.blue('\n📋 Next Steps:\n'))

  switch (templateType) {
    case 'component':
      console.log(chalk.gray(`1. Import: ${chalk.cyan(`import { ${name} } from '@/components'`)}`))
      console.log(chalk.gray(`2. Add to ${chalk.cyan('src/components/index.ts')} if not auto-exported`))
      console.log(chalk.gray(`3. Write tests in ${chalk.cyan('__tests__/')}`))
      break

    case 'screen':
      console.log(chalk.gray(`1. Add to ${chalk.cyan('app/')} routing`))
      console.log(chalk.gray(`2. Import: ${chalk.cyan(`import { ${name} } from '@/screens'`)}`))
      console.log(chalk.gray(`3. Test on device`))
      break

    case 'hook':
      console.log(chalk.gray(`1. Import: ${chalk.cyan(`import { ${name} } from '@/hooks'`)}`))
      console.log(chalk.gray(`2. Use in components: ${chalk.cyan(`const value = ${name}()`)}`))
      console.log(chalk.gray(`3. Write tests`))
      break

    case 'service':
      console.log(chalk.gray(`1. Import: ${chalk.cyan(`import { ${name.toLowerCase()}Service } from '@/services'`)}`))
      console.log(chalk.gray(`2. Use in hooks/components`))
      console.log(chalk.gray(`3. Write integration tests`))
      break

    case 'context':
      console.log(chalk.gray(`1. Add to ${chalk.cyan('app/_layout.tsx')} providers`))
      console.log(chalk.gray(`2. Use: ${chalk.cyan(`const value = use${name.replace('Context', '')}()`)}`))
      break
  }
}

/**
 * Show next steps for feature
 */
function showFeatureNextSteps(name, useSupabase) {
  console.log(chalk.blue('\n📋 Next Steps:\n'))
  console.log(chalk.gray(`1. Review generated files in ${chalk.cyan(`src/features/${name.toLowerCase()}/`)}`))
  console.log(chalk.gray(`2. Customize types in ${chalk.cyan('types.ts')}`))

  if (useSupabase) {
    console.log(chalk.gray(`3. Create database migration: ${chalk.cyan('npm run db:migration create_' + name.toLowerCase() + 's')}`))
    console.log(chalk.gray(`4. Run migration: ${chalk.cyan('npm run db:migrate')}`))
    console.log(chalk.gray(`5. Generate types: ${chalk.cyan('npm run gen:types')}`))
  }

  console.log(chalk.gray(`${useSupabase ? '6' : '3'}. Import feature: ${chalk.cyan(`import { ${name}Screen } from '@/features/${name.toLowerCase()}'`)}`))
  console.log(chalk.gray(`${useSupabase ? '7' : '4'}. Add to navigation`))
  console.log(chalk.gray(`${useSupabase ? '8' : '5'}. Test on device`))
}

// Run CLI
main()
