#!/usr/bin/env node

/**
 * Maintenance Dashboard
 *
 * Runs all maintenance checks and generates a comprehensive report.
 *
 * Usage:
 *   node scripts/maintenance/dashboard.js [options]
 *
 * Options:
 *   --config <path>       Path to maintenance config
 *   --format <type>       Output format: json|markdown|html
 *   --output <path>       Output directory
 *   --create-issues       Create GitHub issues for findings
 *   --skip-staleness      Skip staleness check
 *   --skip-versions       Skip version check
 *   --skip-docs           Skip documentation check
 *   --skip-coverage       Skip coverage check
 *   --skip-navigation     Skip navigation check
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

const StalenessChecker = require('./check-staleness');
const VersionChecker = require('./check-versions');
const DocumentationChecker = require('./check-docs');
const CoverageAnalyzer = require('./analyze-coverage');
const NavigationAnalyzer = require('./check-navigation');

class MaintenanceDashboard {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.maintenance-config.json',
      format: options.format || 'html',
      output: options.output || '.maintenance',
      createIssues: options.createIssues || false,
      skipStaleness: options.skipStaleness || false,
      skipVersions: options.skipVersions || false,
      skipDocs: options.skipDocs || false,
      skipCoverage: options.skipCoverage || false,
      skipNavigation: options.skipNavigation || false
    };

    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0
      },
      checks: {},
      overallRecommendations: []
    };
  }

  async run() {
    console.log('='.repeat(80));
    console.log('MAINTENANCE DASHBOARD');
    console.log('='.repeat(80));
    console.log('');

    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.options.output)) {
        fs.mkdirSync(this.options.output, { recursive: true });
      }

      // Run all checks
      await this.runAllChecks();

      // Generate comprehensive report
      await this.generateReport();

      // Create GitHub issues if requested
      if (this.options.createIssues) {
        await this.createGitHubIssues();
      }

      // Print summary
      this.printSummary();

      // Exit with appropriate code
      if (this.results.summary.criticalIssues > 0) {
        console.log('\n❌ Critical issues found. Exiting with error code.');
        process.exit(1);
      }

    } catch (error) {
      console.error(`\n✗ Dashboard error: ${error.message}`);
      process.exit(1);
    }
  }

  async runAllChecks() {
    const checks = [];

    if (!this.options.skipStaleness) {
      checks.push(this.runStalenessCheck());
    }

    if (!this.options.skipVersions) {
      checks.push(this.runVersionCheck());
    }

    if (!this.options.skipDocs) {
      checks.push(this.runDocumentationCheck());
    }

    if (!this.options.skipCoverage) {
      checks.push(this.runCoverageCheck());
    }

    if (!this.options.skipNavigation) {
      checks.push(this.runNavigationCheck());
    }

    await Promise.all(checks);
    this.results.summary.totalChecks = checks.length;
  }

  async runStalenessCheck() {
    console.log('\n📅 Running staleness check...');
    try {
      const checker = new StalenessChecker({
        configPath: this.options.configPath,
        format: 'json',
        output: path.join(this.options.output, 'staleness.json')
      });

      await checker.run();

      this.results.checks.staleness = {
        status: checker.results.summary.criticalFiles === 0 ? 'pass' : 'fail',
        summary: checker.results.summary,
        recommendations: checker.results.recommendations
      };

      this.updateIssueCount(checker.results.recommendations);
      console.log('✓ Staleness check complete');
    } catch (error) {
      console.error('✗ Staleness check failed:', error.message);
      this.results.checks.staleness = { status: 'error', error: error.message };
    }
  }

  async runVersionCheck() {
    console.log('\n📦 Running version check...');
    try {
      const checker = new VersionChecker({
        configPath: this.options.configPath,
        format: 'json',
        output: path.join(this.options.output, 'versions.json')
      });

      await checker.run();

      this.results.checks.versions = {
        status: checker.results.summary.securityIssues === 0 ? 'pass' : 'fail',
        summary: checker.results.summary,
        recommendations: checker.results.recommendations
      };

      this.updateIssueCount(checker.results.recommendations);
      console.log('✓ Version check complete');
    } catch (error) {
      console.error('✗ Version check failed:', error.message);
      this.results.checks.versions = { status: 'error', error: error.message };
    }
  }

  async runDocumentationCheck() {
    console.log('\n📚 Running documentation check...');
    try {
      const checker = new DocumentationChecker({
        configPath: this.options.configPath,
        format: 'json',
        output: path.join(this.options.output, 'documentation.json'),
        checkExamples: true
      });

      await checker.run();

      this.results.checks.documentation = {
        status: checker.results.summary.filesWithIssues === 0 ? 'pass' : 'warning',
        summary: checker.results.summary,
        recommendations: checker.results.recommendations
      };

      this.updateIssueCount(checker.results.recommendations);
      console.log('✓ Documentation check complete');
    } catch (error) {
      console.error('✗ Documentation check failed:', error.message);
      this.results.checks.documentation = { status: 'error', error: error.message };
    }
  }

  async runCoverageCheck() {
    console.log('\n🧪 Running coverage check...');
    try {
      const analyzer = new CoverageAnalyzer({
        configPath: this.options.configPath,
        format: 'json',
        output: path.join(this.options.output, 'coverage.json')
      });

      await analyzer.run();

      this.results.checks.coverage = {
        status: analyzer.results.criticalPaths.length === 0 ? 'pass' : 'warning',
        summary: analyzer.results.summary,
        recommendations: analyzer.results.recommendations
      };

      this.updateIssueCount(analyzer.results.recommendations);
      console.log('✓ Coverage check complete');
    } catch (error) {
      console.error('✗ Coverage check failed:', error.message);
      this.results.checks.coverage = { status: 'error', error: error.message };
    }
  }

  async runNavigationCheck() {
    console.log('\n🗺️  Running navigation check...');
    try {
      const analyzer = new NavigationAnalyzer({
        configPath: this.options.configPath,
        format: 'json',
        output: path.join(this.options.output, 'navigation.json')
      });

      await analyzer.run();

      this.results.checks.navigation = {
        status: analyzer.results.summary.orphanedDocs === 0 ? 'pass' : 'warning',
        summary: analyzer.results.summary,
        recommendations: analyzer.results.recommendations
      };

      this.updateIssueCount(analyzer.results.recommendations);
      console.log('✓ Navigation check complete');
    } catch (error) {
      console.error('✗ Navigation check failed:', error.message);
      this.results.checks.navigation = { status: 'error', error: error.message };
    }
  }

  updateIssueCount(recommendations) {
    recommendations.forEach(rec => {
      switch (rec.priority) {
        case 'critical':
          this.results.summary.criticalIssues++;
          break;
        case 'high':
          this.results.summary.highIssues++;
          break;
        case 'medium':
          this.results.summary.mediumIssues++;
          break;
        case 'low':
          this.results.summary.lowIssues++;
          break;
      }
    });
  }

  generateOverallRecommendations() {
    const recommendations = [];

    // Collect all recommendations from all checks
    Object.values(this.results.checks).forEach(check => {
      if (check.recommendations) {
        recommendations.push(...check.recommendations);
      }
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Top 10 most important
    this.results.overallRecommendations = recommendations.slice(0, 10);
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive report...');

    this.generateOverallRecommendations();

    // Generate all formats
    const formats = ['html', 'markdown', 'json'];

    for (const format of formats) {
      let content;
      switch (format) {
        case 'html':
          content = this.formatHTML();
          break;
        case 'markdown':
          content = this.formatMarkdown();
          break;
        case 'json':
          content = this.formatJSON();
          break;
      }

      const filename = `dashboard.${format === 'markdown' ? 'md' : format}`;
      const filepath = path.join(this.options.output, filename);
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`✓ Generated ${filepath}`);
    }
  }

  formatHTML() {
    const { summary, checks, overallRecommendations } = this.results;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 36px; margin-bottom: 10px; }
    .timestamp { opacity: 0.9; font-size: 14px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-value {
      font-size: 42px;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .critical { color: #d32f2f; }
    .high { color: #f57c00; }
    .medium { color: #fbc02d; }
    .low { color: #388e3c; }
    .pass { color: #4caf50; }
    .fail { color: #f44336; }
    .warning { color: #ff9800; }
    .section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 { margin-bottom: 20px; color: #333; }
    .check-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .check-card {
      border: 2px solid #e0e0e0;
      padding: 20px;
      border-radius: 8px;
    }
    .check-card.pass { border-color: #4caf50; }
    .check-card.fail { border-color: #f44336; }
    .check-card.warning { border-color: #ff9800; }
    .check-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-badge.pass { background: #e8f5e9; color: #2e7d32; }
    .status-badge.fail { background: #ffebee; color: #c62828; }
    .status-badge.warning { background: #fff3e0; color: #e65100; }
    .recommendation {
      background: #f9f9f9;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .recommendation.critical { border-left-color: #d32f2f; background: #ffebee; }
    .recommendation.high { border-left-color: #f57c00; background: #fff3e0; }
    .recommendation.medium { border-left-color: #fbc02d; background: #fffde7; }
    .recommendation-title { font-weight: bold; margin-bottom: 8px; }
    .recommendation-desc { color: #666; font-size: 14px; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 14px;
    }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 Maintenance Dashboard</h1>
      <div class="timestamp">Generated: ${new Date(this.results.timestamp).toLocaleString()}</div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Total Checks</div>
        <div class="stat-value">${summary.totalChecks}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Critical Issues</div>
        <div class="stat-value critical">${summary.criticalIssues}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">High Priority</div>
        <div class="stat-value high">${summary.highIssues}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Medium Priority</div>
        <div class="stat-value medium">${summary.mediumIssues}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Low Priority</div>
        <div class="stat-value low">${summary.lowIssues}</div>
      </div>
    </div>

    <div class="section">
      <h2>📋 Check Results</h2>
      <div class="check-grid">
        ${Object.entries(checks).map(([name, check]) => `
          <div class="check-card ${check.status}">
            <div class="check-title">
              <span>${this.getCheckIcon(name)} ${this.formatCheckName(name)}</span>
              <span class="status-badge ${check.status}">${check.status}</span>
            </div>
            ${check.summary ? `
              <ul>
                ${Object.entries(check.summary).slice(0, 5).map(([key, value]) => `
                  <li>${this.formatKey(key)}: ${value}</li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    ${overallRecommendations.length > 0 ? `
    <div class="section">
      <h2>🎯 Top Recommendations</h2>
      ${overallRecommendations.map(rec => `
        <div class="recommendation ${rec.priority}">
          <div class="recommendation-title">
            ${this.getPriorityIcon(rec.priority)} ${rec.title}
          </div>
          <div class="recommendation-desc">${rec.description}</div>
          <div class="recommendation-desc"><strong>Action:</strong> ${rec.action}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <p>Mobile App Blueprint - Automated Maintenance System</p>
      <p>Next scheduled check: ${this.getNextCheckDate()}</p>
    </div>
  </div>
</body>
</html>`;
  }

  formatMarkdown() {
    const { summary, checks, overallRecommendations } = this.results;
    let output = [];

    output.push('# 🔧 Maintenance Dashboard');
    output.push('');
    output.push(`**Generated:** ${new Date(this.results.timestamp).toLocaleString()}`);
    output.push('');

    // Summary
    output.push('## Summary');
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| Total Checks | ${summary.totalChecks} |`);
    output.push(`| Critical Issues | ${summary.criticalIssues} |`);
    output.push(`| High Priority | ${summary.highIssues} |`);
    output.push(`| Medium Priority | ${summary.mediumIssues} |`);
    output.push(`| Low Priority | ${summary.lowIssues} |`);
    output.push('');

    // Check results
    output.push('## Check Results');
    output.push('');

    Object.entries(checks).forEach(([name, check]) => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
      output.push(`### ${icon} ${this.formatCheckName(name)}`);
      output.push('');
      output.push(`**Status:** ${check.status.toUpperCase()}`);
      output.push('');

      if (check.summary) {
        output.push('**Summary:**');
        Object.entries(check.summary).forEach(([key, value]) => {
          output.push(`- ${this.formatKey(key)}: ${value}`);
        });
        output.push('');
      }
    });

    // Top recommendations
    if (overallRecommendations.length > 0) {
      output.push('## 🎯 Top Recommendations');
      output.push('');

      overallRecommendations.forEach((rec, i) => {
        const icon = this.getPriorityIcon(rec.priority);
        output.push(`### ${i + 1}. ${icon} ${rec.title}`);
        output.push('');
        output.push(`**Priority:** ${rec.priority.toUpperCase()}`);
        output.push(`**Category:** ${rec.category}`);
        output.push('');
        output.push(rec.description);
        output.push('');
        output.push(`**Action:** ${rec.action}`);
        output.push('');
      });
    }

    output.push('---');
    output.push('');
    output.push(`**Next Check:** ${this.getNextCheckDate()}`);
    output.push('');

    return output.join('\n');
  }

  formatJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  getCheckIcon(name) {
    const icons = {
      staleness: '📅',
      versions: '📦',
      documentation: '📚',
      coverage: '🧪',
      navigation: '🗺️'
    };
    return icons[name] || '🔍';
  }

  formatCheckName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  getPriorityIcon(priority) {
    const icons = {
      critical: '🔴',
      high: '🟡',
      medium: '🔵',
      low: '⚪'
    };
    return icons[priority] || '⚪';
  }

  getNextCheckDate() {
    const next = new Date();
    next.setDate(next.getDate() + 7); // Weekly
    return next.toLocaleDateString();
  }

  async createGitHubIssues() {
    console.log('\n📝 Creating GitHub issues...');

    // Only create issue if there are critical or high priority items
    if (this.results.summary.criticalIssues > 0 || this.results.summary.highIssues > 0) {
      const body = this.formatMarkdown();

      try {
        const { stdout } = await execAsync(
          `gh issue create --title "[Maintenance] Weekly Dashboard Report" --body-file - --label "maintenance,automated"`,
          { input: body }
        );
        console.log(`✓ Created issue: ${stdout.trim()}`);
      } catch (error) {
        console.error(`✗ Failed to create issue: ${error.message}`);
      }
    } else {
      console.log('✓ No critical issues - skipping issue creation');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Total Checks:     ${this.results.summary.totalChecks}`);
    console.log(`Critical Issues:  ${this.results.summary.criticalIssues}`);
    console.log(`High Priority:    ${this.results.summary.highIssues}`);
    console.log(`Medium Priority:  ${this.results.summary.mediumIssues}`);
    console.log(`Low Priority:     ${this.results.summary.lowIssues}`);
    console.log('');
    console.log(`Reports saved to: ${path.resolve(this.options.output)}`);
    console.log('');

    if (this.results.summary.criticalIssues === 0 && this.results.summary.highIssues === 0) {
      console.log('✅ All checks passed!');
    } else {
      console.log('⚠️  Action required - see reports for details');
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
      case '--create-issues':
        options.createIssues = true;
        break;
      case '--skip-staleness':
        options.skipStaleness = true;
        break;
      case '--skip-versions':
        options.skipVersions = true;
        break;
      case '--skip-docs':
        options.skipDocs = true;
        break;
      case '--skip-coverage':
        options.skipCoverage = true;
        break;
      case '--skip-navigation':
        options.skipNavigation = true;
        break;
      case '--help':
        console.log(`
Maintenance Dashboard

Usage: node dashboard.js [options]

Options:
  --config <path>       Path to maintenance config
  --format <type>       Output format: json|markdown|html
  --output <path>       Output directory
  --create-issues       Create GitHub issues for findings
  --skip-staleness      Skip staleness check
  --skip-versions       Skip version check
  --skip-docs           Skip documentation check
  --skip-coverage       Skip coverage check
  --skip-navigation     Skip navigation check
  --help                Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

if (require.main === module) {
  const options = parseArgs();
  const dashboard = new MaintenanceDashboard(options);
  dashboard.run();
}

module.exports = MaintenanceDashboard;
