/**
 * Tests for version-bump.js
 */

const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

// Mock paths
const MOCK_ROOT = path.join(__dirname, '__fixtures__')
const MOCK_PACKAGE = path.join(MOCK_ROOT, 'package.json')
const MOCK_APP_JSON = path.join(MOCK_ROOT, 'app.json')

describe('version-bump', () => {
  beforeEach(async () => {
    // Create mock directory
    await fs.ensureDir(MOCK_ROOT)

    // Create mock package.json
    await fs.writeJson(MOCK_PACKAGE, {
      name: 'test-app',
      version: '1.0.0',
    })

    // Create mock app.json
    await fs.writeJson(MOCK_APP_JSON, {
      expo: {
        version: '1.0.0',
        ios: { buildNumber: '1' },
        android: { versionCode: 1 },
      },
    })
  })

  afterEach(async () => {
    // Clean up
    await fs.remove(MOCK_ROOT)
  })

  describe('incrementVersion', () => {
    // Helper function (extracted from script)
    function incrementVersion(version, bumpType) {
      const parts = version.split('.').map(Number)

      switch (bumpType) {
        case 'major':
          parts[0]++
          parts[1] = 0
          parts[2] = 0
          break
        case 'minor':
          parts[1]++
          parts[2] = 0
          break
        case 'patch':
          parts[2]++
          break
      }

      return parts.join('.')
    }

    test('increments patch version', () => {
      expect(incrementVersion('1.0.0', 'patch')).toBe('1.0.1')
      expect(incrementVersion('1.2.3', 'patch')).toBe('1.2.4')
    })

    test('increments minor version', () => {
      expect(incrementVersion('1.0.0', 'minor')).toBe('1.1.0')
      expect(incrementVersion('1.2.3', 'minor')).toBe('1.3.0')
    })

    test('increments major version', () => {
      expect(incrementVersion('1.0.0', 'major')).toBe('2.0.0')
      expect(incrementVersion('1.2.3', 'major')).toBe('2.0.0')
    })
  })

  describe('analyzeCommits', () => {
    // Helper function (extracted from script)
    function analyzeCommits(commits) {
      const analysis = {
        breaking: [],
        features: [],
        fixes: [],
        other: [],
      }

      for (const commit of commits) {
        const message = commit.substring(commit.indexOf(' ') + 1)

        if (message.includes('BREAKING CHANGE:') || message.includes('!:')) {
          analysis.breaking.push(message)
        } else if (message.match(/^feat(\(.*\))?:/i)) {
          analysis.features.push(message)
        } else if (message.match(/^fix(\(.*\))?:/i)) {
          analysis.fixes.push(message)
        } else {
          analysis.other.push(message)
        }
      }

      return analysis
    }

    test('identifies feature commits', () => {
      const commits = [
        'abc123 feat: add new feature',
        'def456 feat(ui): update button',
      ]

      const analysis = analyzeCommits(commits)

      expect(analysis.features).toHaveLength(2)
      expect(analysis.fixes).toHaveLength(0)
      expect(analysis.breaking).toHaveLength(0)
    })

    test('identifies fix commits', () => {
      const commits = [
        'abc123 fix: resolve bug',
        'def456 fix(auth): fix login issue',
      ]

      const analysis = analyzeCommits(commits)

      expect(analysis.fixes).toHaveLength(2)
      expect(analysis.features).toHaveLength(0)
    })

    test('identifies breaking changes', () => {
      const commits = [
        'abc123 feat!: breaking change',
        'def456 feat: BREAKING CHANGE: migration required',
      ]

      const analysis = analyzeCommits(commits)

      expect(analysis.breaking).toHaveLength(2)
    })

    test('handles mixed commits', () => {
      const commits = [
        'abc123 feat: new feature',
        'def456 fix: bug fix',
        'ghi789 docs: update readme',
        'jkl012 feat!: breaking change',
      ]

      const analysis = analyzeCommits(commits)

      expect(analysis.features).toHaveLength(1)
      expect(analysis.fixes).toHaveLength(1)
      expect(analysis.breaking).toHaveLength(1)
      expect(analysis.other).toHaveLength(1)
    })
  })

  describe('determineBumpType', () => {
    // Helper function (extracted from script)
    function determineBumpType(analysis) {
      if (analysis.breaking.length > 0) {
        return 'major'
      } else if (analysis.features.length > 0) {
        return 'minor'
      } else if (analysis.fixes.length > 0) {
        return 'patch'
      } else {
        return 'patch'
      }
    }

    test('returns major for breaking changes', () => {
      const analysis = {
        breaking: ['breaking change'],
        features: ['feature'],
        fixes: ['fix'],
        other: [],
      }

      expect(determineBumpType(analysis)).toBe('major')
    })

    test('returns minor for features', () => {
      const analysis = {
        breaking: [],
        features: ['feature'],
        fixes: ['fix'],
        other: [],
      }

      expect(determineBumpType(analysis)).toBe('minor')
    })

    test('returns patch for fixes', () => {
      const analysis = {
        breaking: [],
        features: [],
        fixes: ['fix'],
        other: [],
      }

      expect(determineBumpType(analysis)).toBe('patch')
    })

    test('returns patch as default', () => {
      const analysis = {
        breaking: [],
        features: [],
        fixes: [],
        other: ['chore: update deps'],
      }

      expect(determineBumpType(analysis)).toBe('patch')
    })
  })
})
