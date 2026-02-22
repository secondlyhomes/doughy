const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const FEATURE_DIR = __dirname;

/**
 * Enable AGENTS.md feature
 */
async function enable() {
  console.log('📦 Setting up AGENTS.md...');

  try {
    // Step 1: Create AGENTS.md from template
    console.log('  Creating AGENTS.md...');
    const agentsMdTemplate = fs.readFileSync(path.join(FEATURE_DIR, 'AGENTS.md.template'), 'utf8');
    fs.writeFileSync(path.join(ROOT_DIR, 'AGENTS.md'), agentsMdTemplate);

    // Step 2: Update CLAUDE.md to reference AGENTS.md
    console.log('  Updating CLAUDE.md...');
    const claudeMdPath = path.join(ROOT_DIR, 'CLAUDE.md');

    if (fs.existsSync(claudeMdPath)) {
      let claudeMd = fs.readFileSync(claudeMdPath, 'utf8');

      // Add reference to AGENTS.md at the top if not already present
      if (!claudeMd.includes('AGENTS.md')) {
        const addition = fs.readFileSync(path.join(FEATURE_DIR, 'CLAUDE.md-addition.template'), 'utf8');

        // Prepend the addition
        claudeMd = addition + '\n\n---\n\n' + claudeMd;

        fs.writeFileSync(claudeMdPath, claudeMd);
      }
    } else {
      console.log('  ⚠️  CLAUDE.md not found, skipping update');
    }

    // Step 3: Create symlinks for other AI tools
    console.log('  Creating symlinks for AI tools...');

    const symlinks = [
      { target: 'AGENTS.md', link: '.cursorrules' },
      { target: 'AGENTS.md', link: '.windsurfrules' },
      { target: 'AGENTS.md', link: '.clinerules' },
    ];

    const isWindows = process.platform === 'win32';

    symlinks.forEach(({ target, link }) => {
      const linkPath = path.join(ROOT_DIR, link);
      const targetPath = path.join(ROOT_DIR, target);

      // Remove existing file/symlink if exists
      if (fs.existsSync(linkPath)) {
        if (fs.lstatSync(linkPath).isSymbolicLink() || fs.lstatSync(linkPath).isFile()) {
          fs.unlinkSync(linkPath);
        }
      }

      try {
        if (isWindows) {
          // Windows: Use mklink command (requires admin or Developer Mode)
          execSync(`mklink "${linkPath}" "${targetPath}"`, { stdio: 'ignore' });
        } else {
          // Unix: Use fs.symlinkSync
          fs.symlinkSync(target, linkPath);
        }
        console.log(`    ✓ Created ${link} → ${target}`);
      } catch (error) {
        console.log(`    ⚠️  Could not create symlink ${link} (may need admin rights on Windows)`);
        console.log(`       Alternative: Copy AGENTS.md to ${link} manually`);
      }
    });

    // Step 4: Create .github/copilot-instructions.md symlink
    console.log('  Creating GitHub Copilot symlink...');
    const githubDir = path.join(ROOT_DIR, '.github');
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    const copilotLinkPath = path.join(githubDir, 'copilot-instructions.md');
    const copilotTargetPath = path.join(ROOT_DIR, 'AGENTS.md');

    if (fs.existsSync(copilotLinkPath)) {
      fs.unlinkSync(copilotLinkPath);
    }

    try {
      if (isWindows) {
        execSync(`mklink "${copilotLinkPath}" "${copilotTargetPath}"`, { stdio: 'ignore' });
      } else {
        fs.symlinkSync('../AGENTS.md', copilotLinkPath);
      }
      console.log(`    ✓ Created .github/copilot-instructions.md → AGENTS.md`);
    } catch (error) {
      console.log(`    ⚠️  Could not create Copilot symlink (may need admin rights)`);
    }

    console.log('✅ AGENTS.md enabled successfully!');
    console.log('');
    console.log('📚 What was created:');
    console.log('   - AGENTS.md (universal AI context)');
    console.log('   - .cursorrules → AGENTS.md');
    console.log('   - .windsurfrules → AGENTS.md');
    console.log('   - .clinerules → AGENTS.md');
    console.log('   - .github/copilot-instructions.md → AGENTS.md');
    console.log('');
    console.log('ℹ️  All AI tools will now read AGENTS.md automatically.');
    console.log('   Update AGENTS.md to change context for all tools.');
    console.log('   Update CLAUDE.md for Claude-specific features only.');

    if (isWindows) {
      console.log('');
      console.log('💡 Windows Note: If symlinks failed, either:');
      console.log('   1. Run this script as Administrator, OR');
      console.log('   2. Enable Developer Mode in Windows Settings');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to enable AGENTS.md:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  enable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { enable };
