#!/usr/bin/env node

/**
 * Notification Script
 *
 * Sends deployment and build notifications to various channels:
 * - Slack
 * - Discord
 * - Email
 * - MS Teams
 */

const https = require('https');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  slack: {
    webhook: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_CHANNEL || '#deployments',
    username: 'CI/CD Bot',
    iconEmoji: ':rocket:',
  },
  discord: {
    webhook: process.env.DISCORD_WEBHOOK_URL,
  },
  teams: {
    webhook: process.env.TEAMS_WEBHOOK_URL,
  },
};

// Environment variables
const ENV = {
  status: process.env.DEPLOYMENT_STATUS || 'unknown',
  environment: process.env.ENVIRONMENT || 'unknown',
  version: process.env.VERSION || process.env.GITHUB_SHA?.substring(0, 7) || 'unknown',
  runUrl: process.env.GITHUB_RUN_URL || '',
  commitSha: process.env.COMMIT_SHA || process.env.GITHUB_SHA || '',
  commitMessage: process.env.COMMIT_MESSAGE || '',
  author: process.env.AUTHOR || process.env.GITHUB_ACTOR || 'unknown',
  notificationType: process.env.NOTIFICATION_TYPE || 'deployment',
};

// Status colors and emojis
const STATUS_CONFIG = {
  success: {
    color: '#36a64f',
    emoji: '✅',
    text: 'Successful',
  },
  failure: {
    color: '#ff0000',
    emoji: '❌',
    text: 'Failed',
  },
  rolled_back: {
    color: '#ff9900',
    emoji: '🔄',
    text: 'Rolled Back',
  },
  in_progress: {
    color: '#0099ff',
    emoji: '🚀',
    text: 'In Progress',
  },
  unknown: {
    color: '#808080',
    emoji: '❓',
    text: 'Unknown',
  },
};

/**
 * Get commit details
 */
function getCommitDetails() {
  try {
    const commitMessage =
      ENV.commitMessage ||
      execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const commitAuthor =
      ENV.author || execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    const commitSha =
      ENV.commitSha || execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

    return {
      message: commitMessage,
      author: commitAuthor,
      sha: commitSha.substring(0, 7),
      fullSha: commitSha,
    };
  } catch (error) {
    console.warn('Could not get commit details:', error.message);
    return {
      message: ENV.commitMessage || 'Unknown',
      author: ENV.author,
      sha: ENV.commitSha.substring(0, 7) || 'unknown',
      fullSha: ENV.commitSha || 'unknown',
    };
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(message) {
  if (!CONFIG.slack.webhook) {
    console.log('Slack webhook not configured, skipping...');
    return;
  }

  const statusConfig = STATUS_CONFIG[ENV.status] || STATUS_CONFIG.unknown;
  const commit = getCommitDetails();

  const payload = {
    channel: CONFIG.slack.channel,
    username: CONFIG.slack.username,
    icon_emoji: CONFIG.slack.iconEmoji,
    attachments: [
      {
        color: statusConfig.color,
        title: `${statusConfig.emoji} ${ENV.notificationType === 'nightly_summary' ? 'Nightly Build Summary' : `Deployment ${statusConfig.text}`}`,
        fields: [
          {
            title: 'Environment',
            value: ENV.environment.toUpperCase(),
            short: true,
          },
          {
            title: 'Status',
            value: statusConfig.text,
            short: true,
          },
          {
            title: 'Version',
            value: ENV.version,
            short: true,
          },
          {
            title: 'Author',
            value: commit.author,
            short: true,
          },
          {
            title: 'Commit',
            value: commit.message.split('\n')[0].substring(0, 100),
            short: false,
          },
        ],
        actions: [
          {
            type: 'button',
            text: 'View Workflow',
            url: ENV.runUrl,
          },
        ],
        footer: 'CI/CD Pipeline',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  return sendWebhook(CONFIG.slack.webhook, payload, 'Slack');
}

/**
 * Send Discord notification
 */
async function sendDiscordNotification() {
  if (!CONFIG.discord.webhook) {
    console.log('Discord webhook not configured, skipping...');
    return;
  }

  const statusConfig = STATUS_CONFIG[ENV.status] || STATUS_CONFIG.unknown;
  const commit = getCommitDetails();

  const payload = {
    username: 'CI/CD Bot',
    avatar_url:
      'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    embeds: [
      {
        title: `${statusConfig.emoji} Deployment ${statusConfig.text}`,
        description: `**${ENV.environment.toUpperCase()}** environment`,
        color: parseInt(statusConfig.color.replace('#', ''), 16),
        fields: [
          {
            name: 'Version',
            value: ENV.version,
            inline: true,
          },
          {
            name: 'Status',
            value: statusConfig.text,
            inline: true,
          },
          {
            name: 'Author',
            value: commit.author,
            inline: true,
          },
          {
            name: 'Commit',
            value: `\`${commit.sha}\` ${commit.message.split('\n')[0].substring(0, 80)}`,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'CI/CD Pipeline',
        },
      },
    ],
  };

  if (ENV.runUrl) {
    payload.embeds[0].url = ENV.runUrl;
  }

  return sendWebhook(CONFIG.discord.webhook, payload, 'Discord');
}

/**
 * Send MS Teams notification
 */
async function sendTeamsNotification() {
  if (!CONFIG.teams.webhook) {
    console.log('Teams webhook not configured, skipping...');
    return;
  }

  const statusConfig = STATUS_CONFIG[ENV.status] || STATUS_CONFIG.unknown;
  const commit = getCommitDetails();

  const payload = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `Deployment ${statusConfig.text}`,
    themeColor: statusConfig.color.replace('#', ''),
    title: `${statusConfig.emoji} Deployment ${statusConfig.text}`,
    sections: [
      {
        activityTitle: `${ENV.environment.toUpperCase()} Environment`,
        activitySubtitle: `Version ${ENV.version}`,
        facts: [
          {
            name: 'Status',
            value: statusConfig.text,
          },
          {
            name: 'Author',
            value: commit.author,
          },
          {
            name: 'Commit',
            value: `${commit.sha}: ${commit.message.split('\n')[0].substring(0, 100)}`,
          },
          {
            name: 'Time',
            value: new Date().toLocaleString(),
          },
        ],
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View Workflow',
        targets: [
          {
            os: 'default',
            uri: ENV.runUrl,
          },
        ],
      },
    ],
  };

  return sendWebhook(CONFIG.teams.webhook, payload, 'Teams');
}

/**
 * Send webhook request
 */
function sendWebhook(webhookUrl, payload, service) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${service} notification sent successfully`);
          resolve(responseData);
        } else {
          console.error(
            `❌ ${service} notification failed: ${res.statusCode} ${res.statusMessage}`
          );
          console.error('Response:', responseData);
          reject(new Error(`${service} notification failed`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${service} notification error:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate summary for nightly builds
 */
function generateNightlySummary() {
  const statusConfig = STATUS_CONFIG[ENV.status] || STATUS_CONFIG.success;

  return {
    title: '🌙 Nightly Build Summary',
    description: 'Automated nightly build and maintenance report',
    color: statusConfig.color,
    fields: [
      {
        name: 'Date',
        value: new Date().toLocaleDateString(),
        inline: true,
      },
      {
        name: 'Status',
        value: statusConfig.text,
        inline: true,
      },
    ],
  };
}

/**
 * Main notification function
 */
async function main() {
  try {
    console.log('📢 Sending notifications...');
    console.log(`Environment: ${ENV.environment}`);
    console.log(`Status: ${ENV.status}`);
    console.log(`Type: ${ENV.notificationType}`);

    const notifications = [];

    // Send to all configured channels
    if (CONFIG.slack.webhook) {
      notifications.push(sendSlackNotification());
    }

    if (CONFIG.discord.webhook) {
      notifications.push(sendDiscordNotification());
    }

    if (CONFIG.teams.webhook) {
      notifications.push(sendTeamsNotification());
    }

    if (notifications.length === 0) {
      console.log('⚠️  No notification channels configured');
      console.log('Set SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL, or TEAMS_WEBHOOK_URL');
      process.exit(0);
    }

    // Wait for all notifications to complete
    await Promise.allSettled(notifications);

    console.log('✅ Notifications sent');
    process.exit(0);
  } catch (error) {
    console.error('❌ Notification failed:', error.message);
    console.error(error);
    // Don't fail the workflow if notifications fail
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  sendSlackNotification,
  sendDiscordNotification,
  sendTeamsNotification,
};
