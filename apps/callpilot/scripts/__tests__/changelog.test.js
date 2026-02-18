/**
 * Tests for generate-changelog.js
 */

const fs = require('fs-extra')
const path = require('path')

describe('generate-changelog', () => {
  describe('parseCommit', () => {
    // Helper function (extracted from script)
    function parseCommit(commit) {
      const message = commit.substring(commit.indexOf(' ') + 1)

      const match = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)/)

      if (!match) {
        return {
          type: 'other',
          scope: null,
          subject: message,
          breaking: message.includes('BREAKING CHANGE:'),
          raw: message,
        }
      }

      return {
        type: match[1].toLowerCase(),
        scope: match[2] || null,
        subject: match[3],
        breaking: message.includes('BREAKING CHANGE:') || message.includes('!:'),
        raw: message,
      }
    }

    test('parses conventional commit', () => {
      const parsed = parseCommit('abc123 feat: add new feature')

      expect(parsed.type).toBe('feat')
      expect(parsed.scope).toBeNull()
      expect(parsed.subject).toBe('add new feature')
      expect(parsed.breaking).toBe(false)
    })

    test('parses commit with scope', () => {
      const parsed = parseCommit('abc123 fix(auth): resolve login issue')

      expect(parsed.type).toBe('fix')
      expect(parsed.scope).toBe('auth')
      expect(parsed.subject).toBe('resolve login issue')
    })

    test('identifies breaking changes', () => {
      const parsed1 = parseCommit('abc123 feat!: breaking change')
      const parsed2 = parseCommit('abc123 feat: BREAKING CHANGE: migration needed')

      expect(parsed1.breaking).toBe(true)
      expect(parsed2.breaking).toBe(true)
    })

    test('handles non-conventional commits', () => {
      const parsed = parseCommit('abc123 random commit message')

      expect(parsed.type).toBe('other')
      expect(parsed.subject).toBe('random commit message')
    })
  })

  describe('groupCommits', () => {
    // Helper function
    function parseCommit(commit) {
      const message = commit.substring(commit.indexOf(' ') + 1)
      const match = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)/)

      if (!match) {
        return {
          type: 'other',
          scope: null,
          subject: message,
          breaking: message.includes('BREAKING CHANGE:'),
          raw: message,
        }
      }

      return {
        type: match[1].toLowerCase(),
        scope: match[2] || null,
        subject: match[3],
        breaking: message.includes('BREAKING CHANGE:') || message.includes('!:'),
        raw: message,
      }
    }

    function groupCommits(commits) {
      const groups = {
        breaking: [],
        features: [],
        fixes: [],
        docs: [],
        other: [],
      }

      for (const commit of commits) {
        const parsed = parseCommit(commit)

        if (parsed.breaking) {
          groups.breaking.push(parsed)
        } else if (parsed.type === 'feat') {
          groups.features.push(parsed)
        } else if (parsed.type === 'fix') {
          groups.fixes.push(parsed)
        } else if (parsed.type === 'docs') {
          groups.docs.push(parsed)
        } else {
          groups.other.push(parsed)
        }
      }

      return groups
    }

    test('groups commits by type', () => {
      const commits = [
        'abc123 feat: add feature',
        'def456 fix: bug fix',
        'ghi789 docs: update docs',
        'jkl012 chore: update deps',
      ]

      const groups = groupCommits(commits)

      expect(groups.features).toHaveLength(1)
      expect(groups.fixes).toHaveLength(1)
      expect(groups.docs).toHaveLength(1)
      expect(groups.other).toHaveLength(1)
    })

    test('prioritizes breaking changes', () => {
      const commits = [
        'abc123 feat!: breaking feature',
        'def456 feat: normal feature',
      ]

      const groups = groupCommits(commits)

      expect(groups.breaking).toHaveLength(1)
      expect(groups.features).toHaveLength(1)
    })
  })

  describe('formatCommit', () => {
    // Helper function (extracted from script)
    function formatCommit(parsed) {
      const scope = parsed.scope ? `**${parsed.scope}:**` : ''
      return `- ${scope} ${parsed.subject}`
    }

    test('formats commit without scope', () => {
      const parsed = {
        type: 'feat',
        scope: null,
        subject: 'add new feature',
      }

      expect(formatCommit(parsed)).toBe('- add new feature')
    })

    test('formats commit with scope', () => {
      const parsed = {
        type: 'fix',
        scope: 'auth',
        subject: 'resolve login issue',
      }

      expect(formatCommit(parsed)).toBe('- **auth:** resolve login issue')
    })
  })
})
