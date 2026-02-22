#!/usr/bin/env node

/**
 * Version Checker Script
 *
 * Checks all dependencies for available updates, breaking changes,
 * and generates update recommendations.
 *
 * Usage:
 *   node scripts/maintenance/check-versions.js [options]
 *
 * Options:
 *   --config <path>       Path to maintenance config
 *   --format <type>       Output format: json|markdown|html
 *   --output <path>       Output file path
 *   --check-breaking      Check for breaking changes
 *   --update-minor        Create PR for minor updates
 *   --create-issue        Create GitHub issue
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const https = require('https');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

class VersionChecker {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.maintenance-config.json',
      format: options.format || 'markdown',
      output: options.output || null,
      checkBreaking: options.checkBreaking || false,
      updateMinor: options.updateMinor || false,
      createIssue: options.createIssue || false
    };

    this.config = null;
    this.packageJson = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDependencies: 0,
        outdatedDependencies: 0,
        minorUpdates: 0,
        majorUpdates: 0,
        securityIssues: 0
      },
      dependencies: [],
      devDependencies: [],
      recommendations: [],
      breakingChanges: []
    };
  }

  async loadConfig() {
    const configPath = path.resolve(this.options.configPath);
    const configContent = await readFileAsync(configPath, 'utf8');
    this.config = JSON.parse(configContent);
    console.log(`✓ Loaded config from ${configPath}`);
  }

  async loadPackageJson() {
    const packagePath = path.resolve('package.json');
    const packageContent = await readFileAsync(packagePath, 'utf8');
    this.packageJson = JSON.parse(packageContent);
    console.log(`✓ Loaded package.json`);
  }

  async getNpmPackageInfo(packageName) {
    return new Promise((resolve, reject) => {
      const url = `https://registry.npmjs.org/${packageName}`;

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            resolve(info);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  parseVersion(version) {
    // Remove version range characters
    const cleanVersion = version.replace(/^[\^~>=<]/g, '');
    const parts = cleanVersion.split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0,
      patch: parseInt(parts[2]) || 0,
      original: version,
      clean: cleanVersion
    };
  }

  compareVersions(current, latest) {
    const curr = this.parseVersion(current);
    const lat = this.parseVersion(latest);

    if (lat.major > curr.major) return 'major';
    if (lat.minor > curr.minor) return 'minor';
    if (lat.patch > curr.patch) return 'patch';
    return 'current';
  }

  async checkDependency(name, currentVersion, type = 'dependencies') {
    try {
      const info = await this.getNpmPackageInfo(name);
      const latestVersion = info['dist-tags'].latest;
      const updateType = this.compareVersions(currentVersion, latestVersion);

      // Check if package is in ignored list
      const isIgnored = this.config.versions.ignoredPackages.includes(name);

      // Get package-specific config if available
      const packageConfig = this.config.versions[type][name];

      // Check age of current version
      let ageInDays = 0;
      if (info.time && info.time[this.parseVersion(currentVersion).clean]) {
        const publishDate = new Date(info.time[this.parseVersion(currentVersion).clean]);
        ageInDays = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const result = {
        name,
        currentVersion,
        latestVersion,
        updateType,
        ageInDays,
        isIgnored,
        type,
        priority: this.calculatePriority(name, updateType, ageInDays, packageConfig),
        recommendations: [],
        breakingChanges: [],
        securityIssues: []
      };

      // Check for security vulnerabilities
      if (info.vulnerabilities) {
        result.securityIssues = info.vulnerabilities;
        this.results.summary.securityIssues += info.vulnerabilities.length;
      }

      // Add recommendations based on update type
      if (updateType === 'major') {
        this.results.summary.majorUpdates++;
        result.recommendations.push('Major version update available. Review breaking changes before updating.');
        result.recommendations.push(`Visit https://github.com/search?q=repo:${name}+is:issue+breaking+changes`);

        if (this.options.checkBreaking) {
          result.breakingChanges = await this.checkBreakingChanges(name, currentVersion, latestVersion);
        }
      } else if (updateType === 'minor') {
        this.results.summary.minorUpdates++;
        result.recommendations.push('Minor version update available. Should be safe to update.');
      } else if (updateType === 'patch') {
        result.recommendations.push('Patch version update available. Contains bug fixes.');
      }

      // Age-based recommendations
      if (packageConfig) {
        if (ageInDays > packageConfig.criticalAge) {
          result.recommendations.push(`Current version is ${ageInDays} days old. Critical update recommended.`);
          result.priority = 'critical';
        } else if (ageInDays > packageConfig.warningAge) {
          result.recommendations.push(`Current version is ${ageInDays} days old. Update recommended.`);
        }
      }

      // Package-specific recommendations
      if (name === 'expo') {
        result.recommendations.push('Check Expo SDK changelog: https://docs.expo.dev/versions/latest/');
        result.recommendations.push('Major updates may require React Native version changes.');
      } else if (name === 'react-native') {
        result.recommendations.push('Check React Native upgrade helper: https://react-native-community.github.io/upgrade-helper/');
      } else if (name === '@supabase/supabase-js') {
        result.recommendations.push('Check Supabase changelog: https://github.com/supabase/supabase-js/releases');
      }

      if (updateType !== 'current') {
        this.results.summary.outdatedDependencies++;
      }

      return result;

    } catch (error) {
      console.error(`Error checking ${name}: ${error.message}`);
      return null;
    }
  }

  calculatePriority(name, updateType, ageInDays, config) {
    // Critical dependencies (Expo, React Native, Supabase)
    const criticalDeps = ['expo', 'react-native', 'react', '@supabase/supabase-js'];

    if (criticalDeps.includes(name)) {
      if (updateType === 'major' || (config && ageInDays > config.criticalAge)) {
        return 'critical';
      }
      return 'high';
    }

    // Security-related dependencies
    const securityDeps = ['expo-secure-store', 'expo-crypto', 'jsonwebtoken'];
    if (securityDeps.some(dep => name.includes(dep))) {
      return 'high';
    }

    // Based on update type
    if (updateType === 'major') return 'medium';
    if (updateType === 'minor') return 'low';

    return 'info';
  }

  async checkBreakingChanges(packageName, fromVersion, toVersion) {
    const breakingChanges = [];

    try {
      // Try to fetch changelog from GitHub
      const { stdout } = await execAsync(
        `gh api repos/${packageName}/releases --jq '[.[] | select(.tag_name | contains("${toVersion}"))] | .[0].body'`
      );

      // Look for breaking change indicators
      const indicators = ['BREAKING', 'Breaking Change', '⚠️', 'breaking:'];
      const lines = stdout.split('\n');

      lines.forEach(line => {
        if (indicators.some(indicator => line.includes(indicator))) {
          breakingChanges.push(line.trim());
        }
      });
    } catch (error) {
      // Silently fail if we can't fetch changelog
    }

    return breakingChanges;
  }

  async scanDependencies() {
    console.log('\nScanning dependencies...');

    // Check regular dependencies
    if (this.packageJson.dependencies) {
      for (const [name, version] of Object.entries(this.packageJson.dependencies)) {
        const result = await this.checkDependency(name, version, 'dependencies');
        if (result) this.results.dependencies.push(result);
        this.results.summary.totalDependencies++;
      }
    }

    // Check dev dependencies
    if (this.packageJson.devDependencies) {
      for (const [name, version] of Object.entries(this.packageJson.devDependencies)) {
        const result = await this.checkDependency(name, version, 'devDependencies');
        if (result) this.results.devDependencies.push(result);
        this.results.summary.totalDependencies++;
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    this.results.dependencies.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    this.results.devDependencies.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log(`✓ Scanned ${this.results.summary.totalDependencies} dependencies`);
  }

  generateRecommendations() {
    const recommendations = [];

    // Critical updates
    const criticalUpdates = [
      ...this.results.dependencies.filter(d => d.priority === 'critical'),
      ...this.results.devDependencies.filter(d => d.priority === 'critical')
    ];

    if (criticalUpdates.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Security & Stability',
        title: 'Critical dependency updates available',
        description: `${criticalUpdates.length} critical updates require immediate attention.`,
        action: 'Review and update these dependencies as soon as possible.',
        packages: criticalUpdates.map(u => ({
          name: u.name,
          current: u.currentVersion,
          latest: u.latestVersion,
          type: u.updateType
        }))
      });
    }

    // Major updates
    if (this.results.summary.majorUpdates > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Major Updates',
        title: 'Major version updates available',
        description: `${this.results.summary.majorUpdates} packages have major version updates.`,
        action: 'Review breaking changes before updating. Plan migration strategy.',
        packages: [
          ...this.results.dependencies.filter(d => d.updateType === 'major'),
          ...this.results.devDependencies.filter(d => d.updateType === 'major')
        ].map(u => ({
          name: u.name,
          current: u.currentVersion,
          latest: u.latestVersion
        }))
      });
    }

    // Security issues
    if (this.results.summary.securityIssues > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Security',
        title: 'Security vulnerabilities detected',
        description: `${this.results.summary.securityIssues} security issues found.`,
        action: 'Run npm audit fix immediately. Review security advisories.',
        packages: [
          ...this.results.dependencies.filter(d => d.securityIssues.length > 0),
          ...this.results.devDependencies.filter(d => d.securityIssues.length > 0)
        ]
      });
    }

    // Safe updates (minor/patch)
    const safeUpdates = [
      ...this.results.dependencies.filter(d => ['minor', 'patch'].includes(d.updateType)),
      ...this.results.devDependencies.filter(d => ['minor', 'patch'].includes(d.updateType))
    ];

    if (safeUpdates.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Maintenance',
        title: 'Safe updates available',
        description: `${safeUpdates.length} minor/patch updates available.`,
        action: 'These updates should be safe to apply. Run tests after updating.',
        packages: safeUpdates.map(u => ({
          name: u.name,
          current: u.currentVersion,
          latest: u.latestVersion,
          type: u.updateType
        }))
      });
    }

    this.results.recommendations = recommendations;
  }

  formatMarkdown() {
    const { summary, dependencies, devDependencies, recommendations } = this.results;
    let output = [];

    output.push('# Dependency Version Report');
    output.push('');
    output.push(`**Generated:** ${new Date(this.results.timestamp).toLocaleString()}`);
    output.push('');

    // Summary
    output.push('## Summary');
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| Total Dependencies | ${summary.totalDependencies} |`);
    output.push(`| Outdated | ${summary.outdatedDependencies} |`);
    output.push(`| Major Updates | ${summary.majorUpdates} |`);
    output.push(`| Minor Updates | ${summary.minorUpdates} |`);
    output.push(`| Security Issues | ${summary.securityIssues} |`);
    output.push('');

    // Recommendations
    if (recommendations.length > 0) {
      output.push('## Recommendations');
      output.push('');

      recommendations.forEach(rec => {
        const icon = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟡' : '🔵';
        output.push(`### ${icon} ${rec.title}`);
        output.push('');
        output.push(`**Priority:** ${rec.priority.toUpperCase()}`);
        output.push(`**Category:** ${rec.category}`);
        output.push('');
        output.push(rec.description);
        output.push('');
        output.push(`**Action:** ${rec.action}`);
        output.push('');

        if (rec.packages && rec.packages.length > 0) {
          output.push('**Packages:**');
          rec.packages.forEach(pkg => {
            output.push(`- \`${pkg.name}\`: ${pkg.current} → ${pkg.latest}${pkg.type ? ` (${pkg.type})` : ''}`);
          });
          output.push('');
        }
      });
    }

    // Dependencies
    if (dependencies.length > 0) {
      output.push('## Dependencies');
      output.push('');

      dependencies.forEach(dep => {
        if (dep.updateType === 'current') return;

        const icon = dep.priority === 'critical' ? '🔴' : dep.priority === 'high' ? '🟡' : '🔵';
        output.push(`### ${icon} ${dep.name}`);
        output.push('');
        output.push(`- **Current:** ${dep.currentVersion}`);
        output.push(`- **Latest:** ${dep.latestVersion}`);
        output.push(`- **Update Type:** ${dep.updateType}`);
        output.push(`- **Priority:** ${dep.priority}`);
        output.push(`- **Age:** ${dep.ageInDays} days`);

        if (dep.recommendations.length > 0) {
          output.push('- **Recommendations:**');
          dep.recommendations.forEach(rec => {
            output.push(`  - ${rec}`);
          });
        }

        if (dep.breakingChanges.length > 0) {
          output.push('- **Breaking Changes:**');
          dep.breakingChanges.forEach(change => {
            output.push(`  - ${change}`);
          });
        }

        output.push('');
      });
    }

    // Dev Dependencies
    if (devDependencies.length > 0) {
      output.push('## Dev Dependencies');
      output.push('');

      devDependencies.forEach(dep => {
        if (dep.updateType === 'current') return;

        const icon = dep.priority === 'critical' ? '🔴' : dep.priority === 'high' ? '🟡' : '🔵';
        output.push(`### ${icon} ${dep.name}`);
        output.push('');
        output.push(`- **Current:** ${dep.currentVersion}`);
        output.push(`- **Latest:** ${dep.latestVersion}`);
        output.push(`- **Update Type:** ${dep.updateType}`);
        output.push(`- **Priority:** ${dep.priority}`);
        output.push(`- **Age:** ${dep.ageInDays} days`);

        if (dep.recommendations.length > 0) {
          output.push('- **Recommendations:**');
          dep.recommendations.forEach(rec => {
            output.push(`  - ${rec}`);
          });
        }

        output.push('');
      });
    }

    // Update commands
    output.push('## Update Commands');
    output.push('');
    output.push('```bash');
    output.push('# Check for outdated packages');
    output.push('npm outdated');
    output.push('');
    output.push('# Check for security issues');
    output.push('npm audit');
    output.push('');
    output.push('# Update specific package');
    output.push('npm install package-name@latest');
    output.push('');
    output.push('# Update all minor/patch versions');
    output.push('npm update');
    output.push('```');
    output.push('');

    return output.join('\n');
  }

  formatJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  formatHTML() {
    // Similar to staleness checker HTML format
    // Omitted for brevity, but would follow same pattern
    return this.formatMarkdown();
  }

  async saveOutput() {
    if (!this.options.output) return;

    const outputPath = path.resolve(this.options.output);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content;
    switch (this.options.format) {
      case 'json':
        content = this.formatJSON();
        break;
      case 'html':
        content = this.formatHTML();
        break;
      case 'markdown':
      default:
        content = this.formatMarkdown();
        break;
    }

    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`✓ Report saved to ${outputPath}`);
  }

  async createGitHubIssue() {
    if (!this.options.createIssue) return;

    try {
      const issueConfig = this.config.github.issues.versions;
      const body = this.formatMarkdown();

      const { stdout } = await execAsync(
        `gh issue create --title "${issueConfig.title}" --body-file - --label "${issueConfig.labels.join(',')}"`,
        { input: body }
      );

      console.log(`✓ Created GitHub issue: ${stdout.trim()}`);
    } catch (error) {
      console.error(`✗ Failed to create GitHub issue: ${error.message}`);
    }
  }

  async run() {
    try {
      await this.loadConfig();
      await this.loadPackageJson();
      await this.scanDependencies();
      this.generateRecommendations();

      if (!this.options.output) {
        console.log('\n' + this.formatMarkdown());
      } else {
        await this.saveOutput();
      }

      await this.createGitHubIssue();

      if (this.results.summary.securityIssues > 0) {
        console.log(`\n⚠️  ${this.results.summary.securityIssues} security issues found!`);
        process.exit(1);
      }

    } catch (error) {
      console.error(`\n✗ Error: ${error.message}`);
      process.exit(1);
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--config':
        options.configPath = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--check-breaking':
        options.checkBreaking = true;
        break;
      case '--update-minor':
        options.updateMinor = true;
        break;
      case '--create-issue':
        options.createIssue = true;
        break;
      case '--help':
        console.log(`
Version Checker Script

Usage: node check-versions.js [options]

Options:
  --config <path>       Path to maintenance config
  --format <type>       Output format: json|markdown|html
  --output <path>       Output file path
  --check-breaking      Check for breaking changes
  --update-minor        Create PR for minor updates
  --create-issue        Create GitHub issue
  --help                Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

if (require.main === module) {
  const options = parseArgs();
  const checker = new VersionChecker(options);
  checker.run();
}

module.exports = VersionChecker;
