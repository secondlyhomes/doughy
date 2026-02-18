const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');

/**
 * Disable AGENTS.md feature
 */
async function disable() {
  console.log('🗑️  Disabling AGENTS.md...');

  try {
    // Step 1: Remove AGENTS.md
    const agentsMdPath = path.join(ROOT_DIR, 'AGENTS.md');
    if (fs.existsSync(agentsMdPath)) {
      console.log('  Removing AGENTS.md...');
      fs.unlinkSync(agentsMdPath);
    }

    // Step 2: Remove symlinks
    console.log('  Removing symlinks...');
    const symlinks = [
      '.cursorrules',
      '.windsurfrules',
      '.clinerules',
      '.github/copilot-instructions.md',
    ];

    symlinks.forEach((link) => {
      const linkPath = path.join(ROOT_DIR, link);
      if (fs.existsSync(linkPath)) {
        const stats = fs.lstatSync(linkPath);
        if (stats.isSymbolicLink() || stats.isFile()) {
          fs.unlinkSync(linkPath);
          console.log(`    ✓ Removed ${link}`);
        }
      }
    });

    // Step 3: Restore CLAUDE.md (remove AGENTS.md reference)
    console.log('  Restoring CLAUDE.md...');
    const claudeMdPath = path.join(ROOT_DIR, 'CLAUDE.md');

    if (fs.existsSync(claudeMdPath)) {
      let claudeMd = fs.readFileSync(claudeMdPath, 'utf8');

      // Remove the AGENTS.md addition section
      const separator = '---\n\n';
      const parts = claudeMd.split(separator);

      if (parts.length > 1 && parts[0].includes('AGENTS.md')) {
        // Remove the first part (AGENTS.md reference)
        claudeMd = parts.slice(1).join(separator);
        fs.writeFileSync(claudeMdPath, claudeMd);
      }
    }

    console.log('✅ AGENTS.md disabled successfully!');
    console.log('');
    console.log('ℹ️  CLAUDE.md has been restored to its original state.');
    console.log('   Each AI tool will need its own context file if needed.');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to disable AGENTS.md:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  disable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { disable };
