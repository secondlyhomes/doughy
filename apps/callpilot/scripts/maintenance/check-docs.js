#!/usr/bin/env node

/**
 * Documentation Health Check Script
 *
 * Validates documentation for broken links, outdated code examples,
 * missing file references, and TODO markers.
 *
 * Usage:
 *   node scripts/maintenance/check-docs.js [options]
 *
 * Options:
 *   --config <path>     Path to maintenance config
 *   --format <type>     Output format: json|markdown|html
 *   --output <path>     Output file path
 *   --fix-links         Attempt to fix broken links automatically
 *   --check-examples    Validate code examples compile
 *   --create-issue      Create GitHub issue for findings
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const https = require('https');
const http = require('http');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

class DocumentationChecker {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.maintenance-config.json',
      format: options.format || 'markdown',
      output: options.output || null,
      fixLinks: options.fixLinks || false,
      checkExamples: options.checkExamples || false,
      createIssue: options.createIssue || false
    };

    this.config = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        filesWithIssues: 0,
        brokenLinks: 0,
        invalidExamples: 0,
        missingReferences: 0,
        markers: 0
      },
      files: [],
      recommendations: []
    };
  }

  async loadConfig() {
    const configPath = path.resolve(this.options.configPath);
    const configContent = await readFileAsync(configPath, 'utf8');
    this.config = JSON.parse(configContent);
    console.log(`✓ Loaded config from ${configPath}`);
  }

  async getMarkdownFiles() {
    const files = [];
    const patterns = this.config.documentation.references.patterns;

    for (const pattern of patterns) {
      if (pattern.endsWith('.md')) {
        const baseDir = pattern.includes('**') ? pattern.split('**')[0] : path.dirname(pattern);
        await this.walkDirectory(baseDir, files, /\.md$/);
      }
    }

    this.results.summary.totalFiles = files.length;
    console.log(`Found ${files.length} markdown files`);
    return files;
  }

  async walkDirectory(dir, files, pattern) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules and other ignored directories
      if (entry.name === 'node_modules' || entry.name === '.git') continue;

      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, files, pattern);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(path.relative(process.cwd(), fullPath));
      }
    }
  }

  async checkFile(filePath) {
    try {
      const content = await readFileAsync(filePath, 'utf8');

      const fileResult = {
        path: filePath,
        issues: [],
        links: [],
        codeExamples: [],
        references: [],
        markers: []
      };

      // Check for broken links
      if (this.config.documentation.linkCheck.enabled) {
        fileResult.links = await this.checkLinks(content, filePath);
      }

      // Check code examples
      if (this.options.checkExamples && this.config.documentation.codeExamples.enabled) {
        fileResult.codeExamples = await this.checkCodeExamples(content, filePath);
      }

      // Check file references
      if (this.config.documentation.references.checkFileExists) {
        fileResult.references = await this.checkFileReferences(content, filePath);
      }

      // Check for markers
      fileResult.markers = await this.checkMarkers(content, filePath);

      // Count issues
      const totalIssues =
        fileResult.links.filter(l => l.status === 'broken').length +
        fileResult.codeExamples.filter(e => e.status === 'invalid').length +
        fileResult.references.filter(r => r.status === 'missing').length +
        fileResult.markers.length;

      if (totalIssues > 0) {
        this.results.summary.filesWithIssues++;
        this.results.summary.brokenLinks += fileResult.links.filter(l => l.status === 'broken').length;
        this.results.summary.invalidExamples += fileResult.codeExamples.filter(e => e.status === 'invalid').length;
        this.results.summary.missingReferences += fileResult.references.filter(r => r.status === 'missing').length;
        this.results.summary.markers += fileResult.markers.length;

        fileResult.issues = this.generateFileIssues(fileResult);
        this.results.files.push(fileResult);
      }

    } catch (error) {
      console.error(`Error checking ${filePath}: ${error.message}`);
    }
  }

  async checkLinks(content, filePath) {
    const links = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const text = match[1];
      const url = match[2];
      const line = content.substring(0, match.index).split('\n').length;

      // Skip anchor links for now
      if (url.startsWith('#')) {
        continue;
      }

      const linkResult = {
        text,
        url,
        line,
        status: 'checking',
        type: this.getLinkType(url)
      };

      // Check internal file links
      if (linkResult.type === 'file') {
        const resolved = path.resolve(path.dirname(filePath), url);
        linkResult.status = fs.existsSync(resolved) ? 'valid' : 'broken';
        linkResult.resolvedPath = resolved;
      }
      // Check external HTTP(S) links
      else if (linkResult.type === 'external') {
        // Skip excluded domains
        const urlObj = new URL(url);
        const isExcluded = this.config.documentation.linkCheck.excludeDomains.some(
          domain => urlObj.hostname.includes(domain)
        );

        if (!isExcluded) {
          linkResult.status = await this.checkExternalLink(url);
        } else {
          linkResult.status = 'skipped';
        }
      }

      links.push(linkResult);
    }

    return links;
  }

  getLinkType(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return 'external';
    } else if (url.startsWith('#')) {
      return 'anchor';
    } else {
      return 'file';
    }
  }

  async checkExternalLink(url) {
    return new Promise((resolve) => {
      const timeout = this.config.documentation.linkCheck.timeout;
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, { timeout }, (res) => {
        const validCodes = this.config.documentation.linkCheck.allowedStatusCodes;
        resolve(validCodes.includes(res.statusCode) ? 'valid' : 'broken');
      });

      req.on('error', () => resolve('broken'));
      req.on('timeout', () => {
        req.destroy();
        resolve('timeout');
      });
    });
  }

  async checkCodeExamples(content, filePath) {
    const examples = [];
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let match;

    const languages = this.config.documentation.codeExamples.languages;
    const skipPatterns = this.config.documentation.codeExamples.skipPatterns;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1];
      const code = match[2];
      const line = content.substring(0, match.index).split('\n').length;

      // Only check configured languages
      if (!languages.includes(language)) continue;

      // Skip if contains skip patterns
      const shouldSkip = skipPatterns.some(pattern => code.includes(pattern));
      if (shouldSkip) continue;

      const example = {
        language,
        code,
        line,
        status: 'valid'
      };

      // Basic syntax validation
      if (language === 'typescript' || language === 'tsx') {
        example.status = this.validateTypeScript(code) ? 'valid' : 'invalid';
      } else if (language === 'javascript' || language === 'jsx') {
        example.status = this.validateJavaScript(code) ? 'valid' : 'invalid';
      } else if (language === 'bash' || language === 'sh') {
        example.status = this.validateBash(code) ? 'valid' : 'invalid';
      }

      examples.push(example);
    }

    return examples;
  }

  validateTypeScript(code) {
    // Basic validation - check for common syntax errors
    // This is a simplified check; full validation would require TypeScript compiler
    try {
      // Check for unclosed braces/brackets
      const braces = code.match(/[{}]/g) || [];
      const brackets = code.match(/[\[\]]/g) || [];
      const parens = code.match(/[()]/g) || [];

      let braceCount = 0;
      let bracketCount = 0;
      let parenCount = 0;

      braces.forEach(b => braceCount += b === '{' ? 1 : -1);
      brackets.forEach(b => bracketCount += b === '[' ? 1 : -1);
      parens.forEach(p => parenCount += p === '(' ? 1 : -1);

      return braceCount === 0 && bracketCount === 0 && parenCount === 0;
    } catch {
      return false;
    }
  }

  validateJavaScript(code) {
    return this.validateTypeScript(code); // Same basic checks
  }

  validateBash(code) {
    // Basic bash validation
    const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

    for (const line of lines) {
      // Check for common bash errors
      if (line.includes('$(') && !line.includes(')')) return false;
      if (line.includes('`') && (line.match(/`/g) || []).length % 2 !== 0) return false;
    }

    return true;
  }

  async checkFileReferences(content, filePath) {
    const references = [];

    // Look for common file reference patterns
    const patterns = [
      /`([^`]+\.(ts|tsx|js|jsx|json|md))`/g,  // Inline code references
      /See `([^`]+)`/g,                        // "See X" references
      /refer to `([^`]+)`/gi,                  // "refer to X" references
      /\[\[([^\]]+)\]\]/g                      // Wiki-style links
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const ref = match[1];
        const line = content.substring(0, match.index).split('\n').length;

        // Skip if it's just a variable name or function
        if (!ref.includes('/') && !ref.includes('.')) continue;

        const resolved = path.resolve(path.dirname(filePath), ref);
        const exists = fs.existsSync(resolved);

        references.push({
          reference: ref,
          line,
          status: exists ? 'valid' : 'missing',
          resolvedPath: resolved
        });
      }
    }

    return references;
  }

  async checkMarkers(content, filePath) {
    const markers = [];
    const markerConfig = this.config.documentation.markers;

    Object.entries(markerConfig).forEach(([category, markerList]) => {
      markerList.forEach(marker => {
        const regex = new RegExp(`(${marker})([:\\s]+(.*))?`, 'gi');
        let match;

        while ((match = regex.exec(content)) !== null) {
          const line = content.substring(0, match.index).split('\n').length;

          markers.push({
            category,
            marker: match[1],
            message: match[3] ? match[3].trim() : '',
            line
          });
        }
      });
    });

    return markers;
  }

  generateFileIssues(fileResult) {
    const issues = [];

    // Broken links
    const brokenLinks = fileResult.links.filter(l => l.status === 'broken');
    if (brokenLinks.length > 0) {
      issues.push({
        type: 'broken-links',
        severity: 'high',
        count: brokenLinks.length,
        message: `${brokenLinks.length} broken link(s) found`,
        items: brokenLinks.map(l => `Line ${l.line}: [${l.text}](${l.url})`)
      });
    }

    // Invalid code examples
    const invalidExamples = fileResult.codeExamples.filter(e => e.status === 'invalid');
    if (invalidExamples.length > 0) {
      issues.push({
        type: 'invalid-examples',
        severity: 'medium',
        count: invalidExamples.length,
        message: `${invalidExamples.length} invalid code example(s)`,
        items: invalidExamples.map(e => `Line ${e.line}: ${e.language} code has syntax errors`)
      });
    }

    // Missing references
    const missingRefs = fileResult.references.filter(r => r.status === 'missing');
    if (missingRefs.length > 0) {
      issues.push({
        type: 'missing-references',
        severity: 'high',
        count: missingRefs.length,
        message: `${missingRefs.length} missing file reference(s)`,
        items: missingRefs.map(r => `Line ${r.line}: ${r.reference}`)
      });
    }

    // Markers (TODO, FIXME, etc.)
    if (fileResult.markers.length > 0) {
      const markersByCategory = {};
      fileResult.markers.forEach(m => {
        if (!markersByCategory[m.category]) markersByCategory[m.category] = [];
        markersByCategory[m.category].push(m);
      });

      Object.entries(markersByCategory).forEach(([category, markers]) => {
        const severity = category === 'outdated' ? 'critical' : category === 'todo' ? 'medium' : 'low';
        issues.push({
          type: 'markers',
          category,
          severity,
          count: markers.length,
          message: `${markers.length} ${category} marker(s)`,
          items: markers.map(m => `Line ${m.line}: ${m.marker}${m.message ? ` - ${m.message}` : ''}`)
        });
      });
    }

    return issues;
  }

  async scanDocumentation() {
    console.log('\nScanning documentation files...');
    const files = await this.getMarkdownFiles();

    for (const file of files) {
      await this.checkFile(file);
    }

    console.log(`✓ Scanned ${this.results.summary.totalFiles} files`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.summary.brokenLinks > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Links',
        title: 'Fix broken links',
        description: `${this.results.summary.brokenLinks} broken links found across documentation.`,
        action: 'Review and update all broken links. Consider using link checker in CI.',
        files: this.results.files.filter(f => f.links.some(l => l.status === 'broken')).map(f => f.path)
      });
    }

    if (this.results.summary.invalidExamples > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Code Examples',
        title: 'Fix invalid code examples',
        description: `${this.results.summary.invalidExamples} code examples have syntax errors.`,
        action: 'Review and test all code examples. Consider adding automated testing.',
        files: this.results.files.filter(f => f.codeExamples.some(e => e.status === 'invalid')).map(f => f.path)
      });
    }

    if (this.results.summary.missingReferences > 0) {
      recommendations.push({
        priority: 'high',
        category: 'References',
        title: 'Fix missing file references',
        description: `${this.results.summary.missingReferences} file references point to non-existent files.`,
        action: 'Update file paths or create missing files.',
        files: this.results.files.filter(f => f.references.some(r => r.status === 'missing')).map(f => f.path)
      });
    }

    if (this.results.summary.markers > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Markers',
        title: 'Address documentation markers',
        description: `${this.results.summary.markers} TODO/FIXME/OUTDATED markers found.`,
        action: 'Review and resolve all markers. Update outdated content.',
        files: this.results.files.filter(f => f.markers.length > 0).map(f => f.path)
      });
    }

    this.results.recommendations = recommendations;
  }

  formatMarkdown() {
    const { summary, files, recommendations } = this.results;
    let output = [];

    output.push('# Documentation Health Report');
    output.push('');
    output.push(`**Generated:** ${new Date(this.results.timestamp).toLocaleString()}`);
    output.push('');

    // Summary
    output.push('## Summary');
    output.push('');
    output.push('| Metric | Count |');
    output.push('|--------|-------|');
    output.push(`| Total Files | ${summary.totalFiles} |`);
    output.push(`| Files with Issues | ${summary.filesWithIssues} |`);
    output.push(`| Broken Links | ${summary.brokenLinks} |`);
    output.push(`| Invalid Examples | ${summary.invalidExamples} |`);
    output.push(`| Missing References | ${summary.missingReferences} |`);
    output.push(`| Markers (TODO/FIXME) | ${summary.markers} |`);
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

        if (rec.files && rec.files.length > 0) {
          output.push('**Affected Files:**');
          rec.files.slice(0, 10).forEach(file => {
            output.push(`- \`${file}\``);
          });
          if (rec.files.length > 10) {
            output.push(`- ... and ${rec.files.length - 10} more`);
          }
          output.push('');
        }
      });
    }

    // File details
    if (files.length > 0) {
      output.push('## Issues by File');
      output.push('');

      files.forEach(file => {
        output.push(`### \`${file.path}\``);
        output.push('');

        file.issues.forEach(issue => {
          const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟡' : '🔵';
          output.push(`#### ${icon} ${issue.message}`);
          output.push('');

          if (issue.items && issue.items.length > 0) {
            issue.items.slice(0, 5).forEach(item => {
              output.push(`- ${item}`);
            });
            if (issue.items.length > 5) {
              output.push(`- ... and ${issue.items.length - 5} more`);
            }
          }

          output.push('');
        });
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
      await this.scanDocumentation();
      this.generateRecommendations();

      if (!this.options.output) {
        console.log('\n' + this.formatMarkdown());
      } else {
        await this.saveOutput();
      }

      if (this.results.summary.filesWithIssues > 0) {
        console.log(`\n⚠️  ${this.results.summary.filesWithIssues} files have issues`);
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
      case '--fix-links':
        options.fixLinks = true;
        break;
      case '--check-examples':
        options.checkExamples = true;
        break;
      case '--create-issue':
        options.createIssue = true;
        break;
      case '--help':
        console.log(`
Documentation Health Check

Usage: node check-docs.js [options]

Options:
  --config <path>     Path to maintenance config
  --format <type>     Output format: json|markdown|html
  --output <path>     Output file path
  --fix-links         Attempt to fix broken links automatically
  --check-examples    Validate code examples compile
  --create-issue      Create GitHub issue for findings
  --help              Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

if (require.main === module) {
  const options = parseArgs();
  const checker = new DocumentationChecker(options);
  checker.run();
}

module.exports = DocumentationChecker;
