#!/usr/bin/env node

/**
 * Staleness Detection Script
 *
 * Checks for stale files in the project based on modification dates,
 * version references, and documentation freshness.
 *
 * Usage:
 *   node scripts/maintenance/check-staleness.js [options]
 *
 * Options:
 *   --config <path>    Path to maintenance config (default: .maintenance-config.json)
 *   --format <type>    Output format: json|html|markdown (default: markdown)
 *   --output <path>    Output file path (default: console)
 *   --threshold <days> Override warning threshold in days
 *   --critical-only    Only report critical staleness issues
 *   --create-issue     Create GitHub issue for findings
 *   --fix              Attempt to auto-fix issues (requires confirmation)
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

class StalenessChecker {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.maintenance-config.json',
      format: options.format || 'markdown',
      output: options.output || null,
      thresholdOverride: options.thresholdOverride || null,
      criticalOnly: options.criticalOnly || false,
      createIssue: options.createIssue || false,
      fix: options.fix || false
    };

    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        staleFiles: 0,
        criticalFiles: 0,
        warningFiles: 0,
        deprecatedFiles: 0
      },
      files: [],
      versions: [],
      documentation: [],
      recommendations: []
    };
  }

  /**
   * Load maintenance configuration
   */
  async loadConfig() {
    try {
      const configPath = path.resolve(this.options.configPath);
      const configContent = await readFileAsync(configPath, 'utf8');
      this.config = JSON.parse(configContent);
      this.log(`✓ Loaded config from ${configPath}`, 'green');
    } catch (error) {
      this.log(`✗ Failed to load config: ${error.message}`, 'red');
      throw error;
    }
  }

  /**
   * Get all files to check
   */
  async getFilesToCheck() {
    const excludePatterns = this.config.staleness.excludePatterns;
    const files = [];

    const walkDir = async (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        // Check if path should be excluded
        const shouldExclude = excludePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
          return regex.test(relativePath);
        });

        if (shouldExclude) continue;

        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.isFile()) {
          files.push(relativePath);
        }
      }
    };

    try {
      await walkDir(process.cwd());
      this.results.summary.totalFiles = files.length;
      this.log(`Found ${files.length} files to check`, 'cyan');
    } catch (error) {
      this.log(`Error scanning files: ${error.message}`, 'red');
    }

    return files;
  }

  /**
   * Check file staleness
   */
  async checkFileStaleness(filePath) {
    try {
      const stats = await statAsync(filePath);
      const now = Date.now();
      const modifiedDate = stats.mtime;
      const ageInDays = Math.floor((now - modifiedDate) / (1000 * 60 * 60 * 24));

      const thresholds = this.config.staleness.thresholds;
      const warningDays = this.options.thresholdOverride || thresholds.warning.days;
      const criticalDays = thresholds.critical.days;
      const deprecatedDays = thresholds.deprecated.days;

      let status = 'fresh';
      let priority = 'low';

      if (ageInDays >= deprecatedDays) {
        status = 'deprecated';
        priority = 'critical';
      } else if (ageInDays >= criticalDays) {
        status = 'critical';
        priority = 'critical';
      } else if (ageInDays >= warningDays) {
        status = 'warning';
        priority = 'medium';
      }

      // Check if file is in critical path
      const isCritical = this.config.staleness.criticalPaths.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        return regex.test(filePath);
      });

      if (isCritical && status !== 'fresh') {
        priority = 'critical';
      }

      return {
        path: filePath,
        modifiedDate: modifiedDate.toISOString(),
        ageInDays,
        status,
        priority,
        isCritical,
        recommendations: this.getRecommendations(filePath, status, ageInDays)
      };
    } catch (error) {
      this.log(`Error checking ${filePath}: ${error.message}`, 'yellow');
      return null;
    }
  }

  /**
   * Get recommendations for stale file
   */
  getRecommendations(filePath, status, ageInDays) {
    const recommendations = [];

    if (status === 'deprecated') {
      recommendations.push(`File is ${ageInDays} days old (2+ years). Consider removing or updating.`);
      recommendations.push('Review if this file is still needed in the project.');
      recommendations.push('If needed, update content and verify all references work.');
    } else if (status === 'critical') {
      recommendations.push(`File is ${ageInDays} days old (1+ year). Urgent review needed.`);
      recommendations.push('Check if information is still accurate and up-to-date.');
      recommendations.push('Update version references and best practices.');
    } else if (status === 'warning') {
      recommendations.push(`File is ${ageInDays} days old (6+ months). Review recommended.`);
      recommendations.push('Verify content is still relevant.');
    }

    // File-specific recommendations
    if (filePath.endsWith('.md')) {
      recommendations.push('Check for broken links and outdated code examples.');
      recommendations.push('Verify version references match current dependencies.');
    }

    if (filePath.includes('docs/patterns/')) {
      recommendations.push('Validate pattern against current Expo/React Native best practices.');
      recommendations.push('Use WebSearch to find latest recommendations.');
    }

    if (filePath.includes('docs/09-security/')) {
      recommendations.push('CRITICAL: Review security recommendations against latest vulnerabilities.');
      recommendations.push('Check CVE databases for any new security concerns.');
    }

    if (filePath === 'package.json') {
      recommendations.push('Run dependency audit: npm audit or npm outdated');
      recommendations.push('Check for major version updates in critical dependencies.');
    }

    return recommendations;
  }

  /**
   * Check for version references in documentation
   */
  async checkVersionReferences(filePath) {
    if (!filePath.endsWith('.md')) return [];

    try {
      const content = await readFileAsync(filePath, 'utf8');
      const versionPatterns = [
        /expo\s+(?:sdk\s+)?(\d+)/gi,
        /react\s+native\s+([\d.]+)/gi,
        /react\s+([\d.]+)/gi,
        /typescript\s+([\d.]+)/gi,
        /supabase(?:-js)?\s+([\d.]+)/gi,
        /node\s+([\d.]+)/gi,
        /npm\s+([\d.]+)/gi
      ];

      const versions = [];
      for (const pattern of versionPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          versions.push({
            type: match[0].split(/\s+/)[0].toLowerCase(),
            version: match[1],
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }

      return versions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check documentation markers (TODO, FIXME, etc.)
   */
  async checkDocumentationMarkers(filePath) {
    try {
      const content = await readFileAsync(filePath, 'utf8');
      const markers = this.config.documentation.markers;
      const found = [];

      // Check for all marker types
      Object.entries(markers).forEach(([category, markerList]) => {
        markerList.forEach(marker => {
          const regex = new RegExp(`(${marker})[:\\s]+(.*)`, 'gi');
          let match;
          while ((match = regex.exec(content)) !== null) {
            found.push({
              category,
              marker: match[1],
              message: match[2].trim(),
              line: content.substring(0, match.index).split('\n').length
            });
          }
        });
      });

      return found;
    } catch (error) {
      return [];
    }
  }

  /**
   * Scan all files
   */
  async scanFiles() {
    this.log('\nScanning files for staleness...', 'cyan');
    const files = await this.getFilesToCheck();

    for (const file of files) {
      const result = await this.checkFileStaleness(file);

      if (!result) continue;

      // Check version references
      if (file.endsWith('.md')) {
        result.versions = await this.checkVersionReferences(file);
        result.markers = await this.checkDocumentationMarkers(file);
      }

      // Only add if stale or if not in critical-only mode
      if (result.status !== 'fresh' || !this.options.criticalOnly) {
        this.results.files.push(result);

        // Update summary
        if (result.status === 'deprecated') {
          this.results.summary.deprecatedFiles++;
        } else if (result.status === 'critical') {
          this.results.summary.criticalFiles++;
        } else if (result.status === 'warning') {
          this.results.summary.warningFiles++;
        }

        if (result.status !== 'fresh') {
          this.results.summary.staleFiles++;
        }
      }
    }

    // Sort by priority and age
    this.results.files.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.ageInDays - a.ageInDays;
    });

    this.log(`✓ Scan complete: ${this.results.summary.staleFiles} stale files found`, 'green');
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Overall recommendations
    if (this.results.summary.criticalFiles > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Documentation',
        title: 'Critical files require immediate attention',
        description: `${this.results.summary.criticalFiles} files haven't been updated in over a year.`,
        action: 'Review and update critical files immediately.',
        files: this.results.files
          .filter(f => f.status === 'critical')
          .slice(0, 10)
          .map(f => f.path)
      });
    }

    if (this.results.summary.deprecatedFiles > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Cleanup',
        title: 'Deprecated files should be removed or updated',
        description: `${this.results.summary.deprecatedFiles} files are over 2 years old.`,
        action: 'Evaluate if these files are still needed. Remove or update.',
        files: this.results.files
          .filter(f => f.status === 'deprecated')
          .slice(0, 10)
          .map(f => f.path)
      });
    }

    // Check for high concentration of stale files in specific directories
    const staleByDir = {};
    this.results.files.forEach(file => {
      const dir = path.dirname(file.path);
      if (!staleByDir[dir]) staleByDir[dir] = 0;
      staleByDir[dir]++;
    });

    Object.entries(staleByDir).forEach(([dir, count]) => {
      if (count >= 5) {
        recommendations.push({
          priority: 'high',
          category: 'Directory Maintenance',
          title: `High staleness in ${dir}`,
          description: `${count} stale files detected in this directory.`,
          action: 'Review entire directory for consistency and accuracy.',
          files: this.results.files
            .filter(f => path.dirname(f.path) === dir)
            .map(f => f.path)
        });
      }
    });

    // Pattern-specific recommendations
    const patternFiles = this.results.files.filter(f => f.path.includes('docs/patterns/'));
    if (patternFiles.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Patterns',
        title: 'Pattern documentation needs review',
        description: `${patternFiles.length} pattern files are stale.`,
        action: 'Patterns should reflect current best practices. Use WebSearch to verify.',
        files: patternFiles.map(f => f.path)
      });
    }

    this.results.recommendations = recommendations;
  }

  /**
   * Format output as markdown
   */
  formatMarkdown() {
    const { summary, files, recommendations } = this.results;
    let output = [];

    output.push('# Staleness Detection Report');
    output.push('');
    output.push(`**Generated:** ${new Date(this.results.timestamp).toLocaleString()}`);
    output.push('');

    // Summary
    output.push('## Summary');
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| Total Files Scanned | ${summary.totalFiles} |`);
    output.push(`| Stale Files | ${summary.staleFiles} |`);
    output.push(`| Critical (1+ year) | ${summary.criticalFiles} |`);
    output.push(`| Warning (6+ months) | ${summary.warningFiles} |`);
    output.push(`| Deprecated (2+ years) | ${summary.deprecatedFiles} |`);
    output.push('');

    // Recommendations
    if (recommendations.length > 0) {
      output.push('## Recommendations');
      output.push('');

      recommendations.forEach((rec, index) => {
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

        if (rec.files && rec.files.length > 0) {
          output.push('**Affected Files:**');
          rec.files.forEach(file => {
            output.push(`- \`${file}\``);
          });
          output.push('');
        }
      });
    }

    // Detailed file list
    if (files.length > 0) {
      output.push('## Stale Files');
      output.push('');

      const grouped = {
        critical: files.filter(f => f.status === 'critical'),
        deprecated: files.filter(f => f.status === 'deprecated'),
        warning: files.filter(f => f.status === 'warning')
      };

      Object.entries(grouped).forEach(([status, fileList]) => {
        if (fileList.length === 0) return;

        const icon = status === 'critical' ? '🔴' : status === 'deprecated' ? '⚫' : '🟡';
        output.push(`### ${icon} ${status.toUpperCase()} (${fileList.length} files)`);
        output.push('');

        fileList.forEach(file => {
          output.push(`#### \`${file.path}\``);
          output.push('');
          output.push(`- **Age:** ${file.ageInDays} days (${Math.floor(file.ageInDays / 30)} months)`);
          output.push(`- **Last Modified:** ${new Date(file.modifiedDate).toLocaleDateString()}`);
          output.push(`- **Priority:** ${file.priority}`);
          output.push(`- **Critical Path:** ${file.isCritical ? 'Yes' : 'No'}`);

          if (file.versions && file.versions.length > 0) {
            output.push('- **Version References:**');
            file.versions.forEach(v => {
              output.push(`  - ${v.type} ${v.version} (line ${v.line})`);
            });
          }

          if (file.markers && file.markers.length > 0) {
            output.push('- **Markers:**');
            file.markers.forEach(m => {
              output.push(`  - ${m.marker}: ${m.message} (line ${m.line})`);
            });
          }

          if (file.recommendations && file.recommendations.length > 0) {
            output.push('- **Recommendations:**');
            file.recommendations.forEach(rec => {
              output.push(`  - ${rec}`);
            });
          }

          output.push('');
        });
      });
    }

    // Next steps
    output.push('## Next Steps');
    output.push('');
    output.push('1. Review critical and deprecated files immediately');
    output.push('2. Update version references to match current dependencies');
    output.push('3. Use `WebSearch` tool to verify best practices are current');
    output.push('4. Address all TODO/FIXME/OUTDATED markers');
    output.push('5. Update "Last Verified" timestamps in documentation');
    output.push('6. Run `npm run validate` after making changes');
    output.push('');

    return output.join('\n');
  }

  /**
   * Format output as JSON
   */
  formatJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Format output as HTML
   */
  formatHTML() {
    const { summary, files, recommendations } = this.results;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Staleness Detection Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { margin: 0 0 10px 0; color: #333; }
    .timestamp { color: #666; font-size: 14px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .stat-value { font-size: 32px; font-weight: bold; color: #333; margin: 5px 0; }
    .critical { color: #d32f2f; }
    .warning { color: #f57c00; }
    .deprecated { color: #616161; }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .file-item {
      border-left: 4px solid #ddd;
      padding: 10px;
      margin: 10px 0;
      background: #f9f9f9;
    }
    .file-item.critical { border-left-color: #d32f2f; }
    .file-item.warning { border-left-color: #f57c00; }
    .file-item.deprecated { border-left-color: #616161; }
    .file-path { font-family: monospace; font-weight: bold; }
    .recommendation {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 10px 0;
    }
    .recommendation.critical { background: #ffebee; border-left-color: #d32f2f; }
    .recommendation.high { background: #fff3e0; border-left-color: #f57c00; }
    ul { margin: 5px 0; padding-left: 20px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Staleness Detection Report</h1>
    <div class="timestamp">Generated: ${new Date(this.results.timestamp).toLocaleString()}</div>
  </div>

  <div class="summary">
    <div class="stat-card">
      <div class="stat-label">Total Files</div>
      <div class="stat-value">${summary.totalFiles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Stale Files</div>
      <div class="stat-value">${summary.staleFiles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Critical</div>
      <div class="stat-value critical">${summary.criticalFiles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Warnings</div>
      <div class="stat-value warning">${summary.warningFiles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Deprecated</div>
      <div class="stat-value deprecated">${summary.deprecatedFiles}</div>
    </div>
  </div>
`;

    if (recommendations.length > 0) {
      html += `  <div class="section">
    <h2>🎯 Recommendations</h2>
`;
      recommendations.forEach(rec => {
        html += `    <div class="recommendation ${rec.priority}">
      <h3>${rec.title}</h3>
      <p><strong>Priority:</strong> ${rec.priority.toUpperCase()} | <strong>Category:</strong> ${rec.category}</p>
      <p>${rec.description}</p>
      <p><strong>Action:</strong> ${rec.action}</p>
`;
        if (rec.files && rec.files.length > 0) {
          html += `      <p><strong>Affected Files:</strong></p>
      <ul>
`;
          rec.files.forEach(file => {
            html += `        <li><code>${file}</code></li>\n`;
          });
          html += `      </ul>\n`;
        }
        html += `    </div>\n`;
      });
      html += `  </div>\n`;
    }

    if (files.length > 0) {
      html += `  <div class="section">
    <h2>📁 Stale Files</h2>
`;
      files.forEach(file => {
        html += `    <div class="file-item ${file.status}">
      <div class="file-path">${file.path}</div>
      <ul>
        <li><strong>Age:</strong> ${file.ageInDays} days (${Math.floor(file.ageInDays / 30)} months)</li>
        <li><strong>Last Modified:</strong> ${new Date(file.modifiedDate).toLocaleDateString()}</li>
        <li><strong>Status:</strong> ${file.status}</li>
        <li><strong>Priority:</strong> ${file.priority}</li>
      </ul>
`;
        if (file.recommendations && file.recommendations.length > 0) {
          html += `      <p><strong>Recommendations:</strong></p>
      <ul>
`;
          file.recommendations.forEach(rec => {
            html += `        <li>${rec}</li>\n`;
          });
          html += `      </ul>\n`;
        }
        html += `    </div>\n`;
      });
      html += `  </div>\n`;
    }

    html += `</body>
</html>`;

    return html;
  }

  /**
   * Create GitHub issue
   */
  async createGitHubIssue() {
    if (!this.options.createIssue) return;

    try {
      const issueConfig = this.config.github.issues.staleness;
      const body = this.formatMarkdown();

      // Use gh CLI to create issue
      const { stdout } = await execAsync(
        `gh issue create --title "${issueConfig.title}" --body-file - --label "${issueConfig.labels.join(',')}"`,
        { input: body }
      );

      this.log(`✓ Created GitHub issue: ${stdout.trim()}`, 'green');
    } catch (error) {
      this.log(`✗ Failed to create GitHub issue: ${error.message}`, 'red');
    }
  }

  /**
   * Save output to file
   */
  async saveOutput() {
    if (!this.options.output) return;

    const outputPath = path.resolve(this.options.output);
    const outputDir = path.dirname(outputPath);

    // Create directory if it doesn't exist
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
    this.log(`✓ Report saved to ${outputPath}`, 'green');
  }

  /**
   * Run the checker
   */
  async run() {
    try {
      await this.loadConfig();
      await this.scanFiles();
      this.generateRecommendations();

      // Output results
      if (!this.options.output) {
        console.log('\n' + this.formatMarkdown());
      } else {
        await this.saveOutput();
      }

      // Create GitHub issue if requested
      await this.createGitHubIssue();

      // Exit with error code if critical issues found
      if (this.results.summary.criticalFiles > 0) {
        this.log(`\n⚠️  ${this.results.summary.criticalFiles} critical files need immediate attention`, 'red');
        process.exit(1);
      }

    } catch (error) {
      this.log(`\n✗ Error: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  /**
   * Log with color
   */
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

// Parse command line arguments
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
      case '--threshold':
        options.thresholdOverride = parseInt(args[++i], 10);
        break;
      case '--critical-only':
        options.criticalOnly = true;
        break;
      case '--create-issue':
        options.createIssue = true;
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--help':
        console.log(`
Staleness Detection Script

Usage: node check-staleness.js [options]

Options:
  --config <path>     Path to maintenance config (default: .maintenance-config.json)
  --format <type>     Output format: json|html|markdown (default: markdown)
  --output <path>     Output file path (default: console)
  --threshold <days>  Override warning threshold in days
  --critical-only     Only report critical staleness issues
  --create-issue      Create GitHub issue for findings
  --fix               Attempt to auto-fix issues (requires confirmation)
  --help              Show this help message

Examples:
  node check-staleness.js
  node check-staleness.js --format html --output .maintenance/staleness.html
  node check-staleness.js --critical-only --create-issue
  node check-staleness.js --threshold 90 --format json
        `);
        process.exit(0);
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const checker = new StalenessChecker(options);
  checker.run();
}

module.exports = StalenessChecker;
