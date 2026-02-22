#!/usr/bin/env node

/**
 * Test Coverage Analyzer
 *
 * Analyzes test coverage and provides recommendations for improvements.
 *
 * Usage:
 *   node scripts/maintenance/analyze-coverage.js [options]
 *
 * Options:
 *   --config <path>     Path to maintenance config
 *   --format <type>     Output format: json|markdown|html
 *   --output <path>     Output file path
 *   --create-issue      Create GitHub issue for low coverage areas
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

class CoverageAnalyzer {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.maintenance-config.json',
      format: options.format || 'markdown',
      output: options.output || null,
      createIssue: options.createIssue || false
    };

    this.config = null;
    this.coverage = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        overall: {},
        byCategory: {},
        belowThreshold: []
      },
      recommendations: [],
      criticalPaths: []
    };
  }

  async loadConfig() {
    const configPath = path.resolve(this.options.configPath);
    const configContent = await readFileAsync(configPath, 'utf8');
    this.config = JSON.parse(configContent);
    console.log(`✓ Loaded config from ${configPath}`);
  }

  async loadCoverageReport() {
    const coveragePath = path.resolve('coverage/coverage-summary.json');

    if (!fs.existsSync(coveragePath)) {
      console.log('No coverage report found. Running tests...');
      await execAsync('npm run test:coverage');
    }

    const coverageContent = await readFileAsync(coveragePath, 'utf8');
    this.coverage = JSON.parse(coverageContent);
    console.log(`✓ Loaded coverage report`);
  }

  analyzeCoverage() {
    console.log('\nAnalyzing coverage...');

    // Overall coverage
    this.results.summary.overall = this.coverage.total;

    // Analyze by category (critical, high, standard)
    const targets = this.config.coverage.targets;

    Object.entries(targets).forEach(([category, config]) => {
      const files = this.getFilesInPaths(config.paths);
      const categoryCoverage = this.calculateCategoryCoverage(files);

      this.results.summary.byCategory[category] = {
        ...categoryCoverage,
        threshold: config,
        meetsThreshold: this.meetsThreshold(categoryCoverage, config)
      };
    });

    // Find files below threshold
    this.findBelowThreshold();

    // Identify critical paths
    this.identifyCriticalPaths();

    console.log(`✓ Analysis complete`);
  }

  getFilesInPaths(patterns) {
    const files = [];

    Object.entries(this.coverage).forEach(([filePath, coverage]) => {
      if (filePath === 'total') return;

      const matches = patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        return regex.test(filePath);
      });

      if (matches) {
        files.push({ path: filePath, coverage });
      }
    });

    return files;
  }

  calculateCategoryCoverage(files) {
    if (files.length === 0) {
      return {
        statements: { pct: 0 },
        branches: { pct: 0 },
        functions: { pct: 0 },
        lines: { pct: 0 },
        fileCount: 0
      };
    }

    const totals = files.reduce((acc, file) => {
      acc.statements += file.coverage.statements.total;
      acc.statementsCovered += file.coverage.statements.covered;
      acc.branches += file.coverage.branches.total;
      acc.branchesCovered += file.coverage.branches.covered;
      acc.functions += file.coverage.functions.total;
      acc.functionsCovered += file.coverage.functions.covered;
      acc.lines += file.coverage.lines.total;
      acc.linesCovered += file.coverage.lines.covered;
      return acc;
    }, {
      statements: 0,
      statementsCovered: 0,
      branches: 0,
      branchesCovered: 0,
      functions: 0,
      functionsCovered: 0,
      lines: 0,
      linesCovered: 0
    });

    return {
      statements: {
        pct: totals.statements > 0 ? (totals.statementsCovered / totals.statements * 100).toFixed(2) : 0
      },
      branches: {
        pct: totals.branches > 0 ? (totals.branchesCovered / totals.branches * 100).toFixed(2) : 0
      },
      functions: {
        pct: totals.functions > 0 ? (totals.functionsCovered / totals.functions * 100).toFixed(2) : 0
      },
      lines: {
        pct: totals.lines > 0 ? (totals.linesCovered / totals.lines * 100).toFixed(2) : 0
      },
      fileCount: files.length
    };
  }

  meetsThreshold(coverage, threshold) {
    return (
      parseFloat(coverage.statements.pct) >= threshold.statements &&
      parseFloat(coverage.branches.pct) >= threshold.branches &&
      parseFloat(coverage.functions.pct) >= threshold.functions &&
      parseFloat(coverage.lines.pct) >= threshold.lines
    );
  }

  findBelowThreshold() {
    const globalThreshold = this.config.coverage.thresholds.global;
    const exemptions = this.config.coverage.exemptions;

    Object.entries(this.coverage).forEach(([filePath, coverage]) => {
      if (filePath === 'total') return;

      // Skip exempted files
      const isExempt = exemptions.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        return regex.test(filePath);
      });

      if (isExempt) return;

      const belowThreshold = {
        path: filePath,
        coverage,
        issues: []
      };

      if (coverage.statements.pct < globalThreshold.statements) {
        belowThreshold.issues.push({
          type: 'statements',
          current: coverage.statements.pct,
          required: globalThreshold.statements,
          gap: globalThreshold.statements - coverage.statements.pct
        });
      }

      if (coverage.branches.pct < globalThreshold.branches) {
        belowThreshold.issues.push({
          type: 'branches',
          current: coverage.branches.pct,
          required: globalThreshold.branches,
          gap: globalThreshold.branches - coverage.branches.pct
        });
      }

      if (coverage.functions.pct < globalThreshold.functions) {
        belowThreshold.issues.push({
          type: 'functions',
          current: coverage.functions.pct,
          required: globalThreshold.functions,
          gap: globalThreshold.functions - coverage.functions.pct
        });
      }

      if (coverage.lines.pct < globalThreshold.lines) {
        belowThreshold.issues.push({
          type: 'lines',
          current: coverage.lines.pct,
          required: globalThreshold.lines,
          gap: globalThreshold.lines - coverage.lines.pct
        });
      }

      if (belowThreshold.issues.length > 0) {
        this.results.summary.belowThreshold.push(belowThreshold);
      }
    });

    // Sort by total gap
    this.results.summary.belowThreshold.sort((a, b) => {
      const gapA = a.issues.reduce((sum, i) => sum + i.gap, 0);
      const gapB = b.issues.reduce((sum, i) => sum + i.gap, 0);
      return gapB - gapA;
    });
  }

  identifyCriticalPaths() {
    const criticalPatterns = this.config.coverage.targets.critical.paths;

    Object.entries(this.coverage).forEach(([filePath, coverage]) => {
      if (filePath === 'total') return;

      const isCritical = criticalPatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        return regex.test(filePath);
      });

      if (isCritical) {
        const threshold = this.config.coverage.targets.critical;
        const issues = [];

        if (coverage.statements.pct < threshold.statements) {
          issues.push({ type: 'statements', gap: threshold.statements - coverage.statements.pct });
        }
        if (coverage.branches.pct < threshold.branches) {
          issues.push({ type: 'branches', gap: threshold.branches - coverage.branches.pct });
        }
        if (coverage.functions.pct < threshold.functions) {
          issues.push({ type: 'functions', gap: threshold.functions - coverage.functions.pct });
        }
        if (coverage.lines.pct < threshold.lines) {
          issues.push({ type: 'lines', gap: threshold.lines - coverage.lines.pct });
        }

        if (issues.length > 0) {
          this.results.criticalPaths.push({
            path: filePath,
            coverage,
            issues,
            priority: 'critical'
          });
        }
      }
    });
  }

  generateRecommendations() {
    const recommendations = [];

    // Critical paths below threshold
    if (this.results.criticalPaths.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Critical Path Coverage',
        title: 'Critical files have insufficient test coverage',
        description: `${this.results.criticalPaths.length} critical files don't meet the 90% coverage threshold.`,
        action: 'Add comprehensive tests for services, hooks, and utils. These are the core of your application.',
        files: this.results.criticalPaths.slice(0, 10).map(cp => ({
          path: cp.path,
          coverage: `${cp.coverage.statements.pct}% statements, ${cp.coverage.branches.pct}% branches`
        }))
      });
    }

    // Overall coverage below threshold
    Object.entries(this.results.summary.byCategory).forEach(([category, data]) => {
      if (!data.meetsThreshold) {
        recommendations.push({
          priority: category === 'critical' ? 'critical' : 'high',
          category: `${category} Coverage`,
          title: `${category} coverage below threshold`,
          description: `Current: ${data.statements.pct}% statements. Required: ${data.threshold.statements}%`,
          action: `Add tests to improve coverage in ${category} areas.`,
          stats: {
            statements: `${data.statements.pct}% (need ${data.threshold.statements}%)`,
            branches: `${data.branches.pct}% (need ${data.threshold.branches}%)`,
            functions: `${data.functions.pct}% (need ${data.threshold.functions}%)`,
            lines: `${data.lines.pct}% (need ${data.threshold.lines}%)`
          }
        });
      }
    });

    // Files with largest coverage gaps
    if (this.results.summary.belowThreshold.length > 0) {
      const topGaps = this.results.summary.belowThreshold.slice(0, 10);
      recommendations.push({
        priority: 'medium',
        category: 'Coverage Gaps',
        title: 'Files with largest coverage gaps',
        description: `${this.results.summary.belowThreshold.length} files below global threshold.`,
        action: 'Focus testing efforts on these files for maximum impact.',
        files: topGaps.map(file => ({
          path: file.path,
          gaps: file.issues.map(i => `${i.type}: ${i.gap.toFixed(1)}% gap`).join(', ')
        }))
      });
    }

    // Suggest coverage improvements
    recommendations.push({
      priority: 'low',
      category: 'Best Practices',
      title: 'Coverage improvement strategies',
      description: 'Recommendations for achieving better test coverage.',
      action: 'Follow these strategies to improve coverage systematically.',
      strategies: [
        'Write tests for new features before implementation (TDD)',
        'Add integration tests for complex user flows',
        'Test error handling and edge cases',
        'Use snapshot tests for UI components',
        'Add E2E tests for critical user journeys',
        'Review coverage reports in CI/CD pipeline',
        'Set coverage as a PR requirement (e.g., no decrease in coverage)'
      ]
    });

    this.results.recommendations = recommendations;
  }

  formatMarkdown() {
    const { summary, recommendations, criticalPaths } = this.results;
    let output = [];

    output.push('# Test Coverage Analysis Report');
    output.push('');
    output.push(`**Generated:** ${new Date(this.results.timestamp).toLocaleString()}`);
    output.push('');

    // Overall summary
    output.push('## Overall Coverage');
    output.push('');
    output.push('| Metric | Coverage | Status |');
    output.push('|--------|----------|--------|');
    output.push(`| Statements | ${summary.overall.statements.pct}% | ${this.getStatus(summary.overall.statements.pct, 70)} |`);
    output.push(`| Branches | ${summary.overall.branches.pct}% | ${this.getStatus(summary.overall.branches.pct, 60)} |`);
    output.push(`| Functions | ${summary.overall.functions.pct}% | ${this.getStatus(summary.overall.functions.pct, 70)} |`);
    output.push(`| Lines | ${summary.overall.lines.pct}% | ${this.getStatus(summary.overall.lines.pct, 70)} |`);
    output.push('');

    // By category
    output.push('## Coverage by Category');
    output.push('');

    Object.entries(summary.byCategory).forEach(([category, data]) => {
      const icon = data.meetsThreshold ? '✅' : '❌';
      output.push(`### ${icon} ${category.toUpperCase()}`);
      output.push('');
      output.push('| Metric | Current | Required | Status |');
      output.push('|--------|---------|----------|--------|');
      output.push(`| Statements | ${data.statements.pct}% | ${data.threshold.statements}% | ${data.statements.pct >= data.threshold.statements ? '✅' : '❌'} |`);
      output.push(`| Branches | ${data.branches.pct}% | ${data.threshold.branches}% | ${data.branches.pct >= data.threshold.branches ? '✅' : '❌'} |`);
      output.push(`| Functions | ${data.functions.pct}% | ${data.threshold.functions}% | ${data.functions.pct >= data.threshold.functions ? '✅' : '❌'} |`);
      output.push(`| Lines | ${data.lines.pct}% | ${data.threshold.lines}% | ${data.lines.pct >= data.threshold.lines ? '✅' : '❌'} |`);
      output.push('');
    });

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

        if (rec.files) {
          output.push('**Files:**');
          rec.files.forEach(file => {
            output.push(`- \`${file.path}\`${file.coverage ? ` - ${file.coverage}` : ''}${file.gaps ? ` - ${file.gaps}` : ''}`);
          });
          output.push('');
        }

        if (rec.stats) {
          output.push('**Current vs Required:**');
          Object.entries(rec.stats).forEach(([key, value]) => {
            output.push(`- ${key}: ${value}`);
          });
          output.push('');
        }

        if (rec.strategies) {
          output.push('**Strategies:**');
          rec.strategies.forEach(strategy => {
            output.push(`- ${strategy}`);
          });
          output.push('');
        }
      });
    }

    // Critical paths
    if (criticalPaths.length > 0) {
      output.push('## Critical Paths Needing Attention');
      output.push('');

      criticalPaths.forEach(cp => {
        output.push(`### 🔴 \`${cp.path}\``);
        output.push('');
        output.push('| Metric | Current | Required | Gap |');
        output.push('|--------|---------|----------|-----|');
        const threshold = this.config.coverage.targets.critical;
        output.push(`| Statements | ${cp.coverage.statements.pct}% | ${threshold.statements}% | ${(threshold.statements - cp.coverage.statements.pct).toFixed(1)}% |`);
        output.push(`| Branches | ${cp.coverage.branches.pct}% | ${threshold.branches}% | ${(threshold.branches - cp.coverage.branches.pct).toFixed(1)}% |`);
        output.push(`| Functions | ${cp.coverage.functions.pct}% | ${threshold.functions}% | ${(threshold.functions - cp.coverage.functions.pct).toFixed(1)}% |`);
        output.push(`| Lines | ${cp.coverage.lines.pct}% | ${threshold.lines}% | ${(threshold.lines - cp.coverage.lines.pct).toFixed(1)}% |`);
        output.push('');
      });
    }

    return output.join('\n');
  }

  getStatus(value, threshold) {
    if (value >= threshold + 10) return '🟢 Excellent';
    if (value >= threshold) return '✅ Good';
    if (value >= threshold - 10) return '🟡 Fair';
    return '🔴 Needs Improvement';
  }

  formatJSON() {
    return JSON.stringify(this.results, null, 2);
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
      default:
        content = this.formatMarkdown();
        break;
    }

    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`✓ Report saved to ${outputPath}`);
  }

  async run() {
    try {
      await this.loadConfig();
      await this.loadCoverageReport();
      this.analyzeCoverage();
      this.generateRecommendations();

      if (!this.options.output) {
        console.log('\n' + this.formatMarkdown());
      } else {
        await this.saveOutput();
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
      case '--create-issue':
        options.createIssue = true;
        break;
      case '--help':
        console.log(`
Test Coverage Analyzer

Usage: node analyze-coverage.js [options]

Options:
  --config <path>     Path to maintenance config
  --format <type>     Output format: json|markdown
  --output <path>     Output file path
  --create-issue      Create GitHub issue for low coverage areas
  --help              Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

if (require.main === module) {
  const options = parseArgs();
  const analyzer = new CoverageAnalyzer(options);
  analyzer.run();
}

module.exports = CoverageAnalyzer;
