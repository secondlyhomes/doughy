#!/usr/bin/env node

/**
 * Navigation Analyzer
 *
 * Analyzes documentation structure, checks for orphaned files,
 * and suggests navigation improvements.
 *
 * Usage:
 *   node scripts/maintenance/check-navigation.js [options]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

class NavigationAnalyzer {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.maintenance-config.json',
      format: options.format || 'markdown',
      output: options.output || null
    };

    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDocs: 0,
        orphanedDocs: 0,
        missingIndexes: 0,
        brokenNavLinks: 0
      },
      orphaned: [],
      missingIndexes: [],
      recommendations: []
    };
  }

  async loadConfig() {
    const configPath = path.resolve(this.options.configPath);
    const configContent = await readFileAsync(configPath, 'utf8');
    this.config = JSON.parse(configContent);
    console.log(`✓ Loaded config`);
  }

  async getAllMarkdownFiles() {
    const files = [];
    await this.walkDirectory('.', files, /\.md$/);
    this.results.summary.totalDocs = files.length;
    return files;
  }

  async walkDirectory(dir, files, pattern) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (['node_modules', '.git', 'coverage', '.expo'].includes(entry.name)) continue;

      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, files, pattern);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  async findOrphanedDocs() {
    console.log('\nFinding orphaned documentation...');
    const allDocs = await this.getAllMarkdownFiles();
    const linkedDocs = new Set();

    // Add main docs as linked
    this.config.navigation.mainDocs.forEach(doc => linkedDocs.add(doc));

    // Parse all markdown files to find links
    for (const doc of allDocs) {
      const content = await readFileAsync(doc, 'utf8');
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        const url = match[2];
        if (!url.startsWith('http') && !url.startsWith('#')) {
          const resolved = path.normalize(path.join(path.dirname(doc), url));
          if (fs.existsSync(resolved)) {
            linkedDocs.add(resolved);
          }
        }
      }
    }

    // Find orphaned docs
    for (const doc of allDocs) {
      if (!linkedDocs.has(doc) && !this.config.navigation.mainDocs.includes(doc)) {
        this.results.orphaned.push({
          path: doc,
          recommendation: 'Link from appropriate index or remove if obsolete'
        });
        this.results.summary.orphanedDocs++;
      }
    }
  }

  async checkRequiredLinks() {
    console.log('Checking required links...');

    for (const [file, requiredLinks] of Object.entries(this.config.navigation.requiredLinks)) {
      if (!fs.existsSync(file)) continue;

      const content = await readFileAsync(file, 'utf8');

      for (const link of requiredLinks) {
        if (!content.includes(link)) {
          this.results.summary.brokenNavLinks++;
        }
      }
    }
  }

  async checkIndexes() {
    console.log('Checking for missing category indexes...');

    for (const indexPath of this.config.navigation.categoryIndexes) {
      if (!fs.existsSync(indexPath)) {
        this.results.missingIndexes.push({
          path: indexPath,
          recommendation: `Create ${indexPath} to organize documentation in this category`
        });
        this.results.summary.missingIndexes++;
      }
    }
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.summary.orphanedDocs > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Navigation',
        title: 'Orphaned documentation files',
        description: `${this.results.summary.orphanedDocs} files are not linked from any other documentation.`,
        action: 'Link these files from appropriate indexes or remove if obsolete.',
        files: this.results.orphaned.slice(0, 10).map(o => o.path)
      });
    }

    if (this.results.summary.missingIndexes > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Structure',
        title: 'Missing category indexes',
        description: `${this.results.summary.missingIndexes} expected index files are missing.`,
        action: 'Create README.md files in each major documentation category.',
        files: this.results.missingIndexes.map(m => m.path)
      });
    }

    this.results.recommendations = recommendations;
  }

  formatMarkdown() {
    const { summary, orphaned, missingIndexes, recommendations } = this.results;
    let output = [];

    output.push('# Documentation Navigation Report');
    output.push('');
    output.push(`**Generated:** ${new Date(this.results.timestamp).toLocaleString()}`);
    output.push('');

    output.push('## Summary');
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| Total Documentation Files | ${summary.totalDocs} |`);
    output.push(`| Orphaned Files | ${summary.orphanedDocs} |`);
    output.push(`| Missing Indexes | ${summary.missingIndexes} |`);
    output.push('');

    if (recommendations.length > 0) {
      output.push('## Recommendations');
      output.push('');

      recommendations.forEach(rec => {
        output.push(`### ${rec.title}`);
        output.push('');
        output.push(rec.description);
        output.push('');
        output.push(`**Action:** ${rec.action}`);
        output.push('');

        if (rec.files && rec.files.length > 0) {
          output.push('**Files:**');
          rec.files.forEach(file => output.push(`- \`${file}\``));
          output.push('');
        }
      });
    }

    return output.join('\n');
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

    const content = this.options.format === 'json' ? this.formatJSON() : this.formatMarkdown();
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`✓ Report saved to ${outputPath}`);
  }

  async run() {
    try {
      await this.loadConfig();
      await this.findOrphanedDocs();
      await this.checkRequiredLinks();
      await this.checkIndexes();
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
      case '--help':
        console.log(`
Navigation Analyzer

Usage: node check-navigation.js [options]

Options:
  --config <path>     Path to maintenance config
  --format <type>     Output format: json|markdown
  --output <path>     Output file path
  --help              Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

if (require.main === module) {
  const options = parseArgs();
  const analyzer = new NavigationAnalyzer(options);
  analyzer.run();
}

module.exports = NavigationAnalyzer;
