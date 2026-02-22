#!/usr/bin/env node

/**
 * Disable mobile development setup feature
 * This feature is documentation-only, so nothing to clean up
 */

function print(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  };
  console.log(colors[color] + message + colors.reset);
}

async function disable() {
  print('\n📱 Disabling Mobile Development Setup...', 'yellow');

  try {
    // This feature is documentation-only, no cleanup needed

    print('✅ Mobile Development Setup disabled!', 'green');
    print('\n📝 Note: Documentation still available at:', 'reset');
    print('   .blueprint/features/mobile-dev-setup/README.md\n', 'reset');

    return { success: true };
  } catch (error) {
    print(`\n❌ Error: ${error.message}`, 'yellow');
    return { success: false, error: error.message };
  }
}

module.exports = { disable };

// Run if called directly
if (require.main === module) {
  disable().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
