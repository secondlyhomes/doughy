/**
 * GitHub Webhook Handler
 *
 * Handles GitHub webhook events with:
 * - Signature verification
 * - Event processing
 * - Security best practices
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
// Note: crypto.subtle is available globally in Deno - no import needed

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

// GitHub event types
interface GitHubPushEvent {
  ref: string;
  repository: {
    name: string;
    full_name: string;
    private: boolean;
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    url: string;
  }>;
}

interface GitHubPullRequestEvent {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize';
  number: number;
  pull_request: {
    id: number;
    title: string;
    user: {
      login: string;
    };
    html_url: string;
    merged: boolean;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

interface GitHubIssueEvent {
  action: 'opened' | 'closed' | 'reopened' | 'edited';
  issue: {
    number: number;
    title: string;
    user: {
      login: string;
    };
    html_url: string;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

Deno.serve(async (req) => {
  try {
    // Get GitHub webhook secret from Vault
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'github_webhook_secret')
      .single();

    if (secretError || !secretData) {
      console.error('Failed to retrieve GitHub webhook secret from Vault');
      return new Response('Configuration error', { status: 500 });
    }

    const webhookSecret = secretData.decrypted_secret;

    // Get request body and signature
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    const delivery = req.headers.get('x-github-delivery');

    if (!signature || !event || !delivery) {
      console.error('Missing required GitHub headers');
      return new Response('Missing headers', { status: 400 });
    }

    // Verify signature
    const isValid = await verifyGitHubSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid GitHub signature');
      return new Response('Invalid signature', { status: 401 });
    }

    // Check for duplicate deliveries (idempotency)
    const { data: existing } = await supabase
      .from('github_webhooks')
      .select('id')
      .eq('delivery_id', delivery)
      .single();

    if (existing) {
      console.log('Duplicate webhook, skipping:', delivery);
      return new Response(JSON.stringify({ received: true, duplicate: true }));
    }

    // Parse event data
    const eventData = JSON.parse(body);

    // Log webhook
    await supabase.from('github_webhooks').insert({
      delivery_id: delivery,
      event_type: event,
      data: eventData,
      processed: false,
      created_at: new Date().toISOString(),
    });

    // Process event
    console.log('Processing GitHub event:', event);
    await processGitHubEvent(supabase, event, eventData);

    // Mark as processed
    await supabase
      .from('github_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('delivery_id', delivery);

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GitHub webhook processing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// Verify GitHub webhook signature
async function verifyGitHubSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const computedSignature = `sha256=${Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;

  // Constant-time comparison
  return signature === computedSignature;
}

// Process different GitHub event types
async function processGitHubEvent(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  data: any
) {
  switch (eventType) {
    case 'push':
      await handlePush(supabase, data as GitHubPushEvent);
      break;

    case 'pull_request':
      await handlePullRequest(supabase, data as GitHubPullRequestEvent);
      break;

    case 'issues':
      await handleIssue(supabase, data as GitHubIssueEvent);
      break;

    case 'ping':
      console.log('Received ping event');
      break;

    default:
      console.log('Unhandled event type:', eventType);
  }
}

// Handle push events
async function handlePush(
  supabase: ReturnType<typeof createClient>,
  event: GitHubPushEvent
) {
  const branch = event.ref.replace('refs/heads/', '');

  console.log(
    `Push to ${event.repository.full_name}/${branch} by ${event.pusher.name}`
  );

  // Store commits
  for (const commit of event.commits) {
    await supabase.from('github_commits').insert({
      commit_sha: commit.id,
      message: commit.message,
      author_name: commit.author.name,
      author_email: commit.author.email,
      repository: event.repository.full_name,
      branch,
      url: commit.url,
      created_at: new Date().toISOString(),
    });
  }

  // Trigger deployment if push to main/master
  if (branch === 'main' || branch === 'master') {
    console.log('Triggering deployment for', branch);
    // Add your deployment logic here
  }

  // Notify team in Slack/Discord
  await notifyTeam(supabase, {
    type: 'push',
    repository: event.repository.full_name,
    branch,
    pusher: event.pusher.name,
    commitCount: event.commits.length,
  });
}

// Handle pull request events
async function handlePullRequest(
  supabase: ReturnType<typeof createClient>,
  event: GitHubPullRequestEvent
) {
  const pr = event.pull_request;

  console.log(
    `PR #${event.number} ${event.action} in ${event.repository.full_name}`
  );

  // Store/update PR
  await supabase.from('github_pull_requests').upsert(
    {
      pr_number: event.number,
      pr_id: pr.id,
      title: pr.title,
      author: pr.user.login,
      repository: event.repository.full_name,
      url: pr.html_url,
      status: event.action,
      merged: pr.merged,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'pr_id',
    }
  );

  // Notify on new PR
  if (event.action === 'opened') {
    await notifyTeam(supabase, {
      type: 'pull_request_opened',
      repository: event.repository.full_name,
      prNumber: event.number,
      title: pr.title,
      author: pr.user.login,
      url: pr.html_url,
    });
  }

  // Notify on PR merged
  if (event.action === 'closed' && pr.merged) {
    await notifyTeam(supabase, {
      type: 'pull_request_merged',
      repository: event.repository.full_name,
      prNumber: event.number,
      title: pr.title,
      author: pr.user.login,
    });
  }
}

// Handle issue events
async function handleIssue(
  supabase: ReturnType<typeof createClient>,
  event: GitHubIssueEvent
) {
  const issue = event.issue;

  console.log(
    `Issue #${issue.number} ${event.action} in ${event.repository.full_name}`
  );

  // Store/update issue
  await supabase.from('github_issues').upsert(
    {
      issue_number: issue.number,
      title: issue.title,
      author: issue.user.login,
      repository: event.repository.full_name,
      url: issue.html_url,
      status: event.action,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'repository,issue_number',
    }
  );

  // Notify on new issue
  if (event.action === 'opened') {
    await notifyTeam(supabase, {
      type: 'issue_opened',
      repository: event.repository.full_name,
      issueNumber: issue.number,
      title: issue.title,
      author: issue.user.login,
      url: issue.html_url,
    });
  }
}

// Notify team (Slack, Discord, email, etc.)
async function notifyTeam(
  supabase: ReturnType<typeof createClient>,
  notification: Record<string, any>
) {
  // Example: Send to Slack
  // const slackWebhookUrl = await getSecretFromVault(supabase, 'slack_webhook_url');
  // await fetch(slackWebhookUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: formatSlackMessage(notification),
  //   }),
  // });

  // Example: Send push notification to admins
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (admins && admins.length > 0) {
    await supabase.functions.invoke('notifications', {
      body: {
        userIds: admins.map((a) => a.id),
        title: formatNotificationTitle(notification),
        body: formatNotificationBody(notification),
        data: notification,
      },
    });
  }
}

// Format notification title
function formatNotificationTitle(notification: Record<string, any>): string {
  switch (notification.type) {
    case 'push':
      return `Push to ${notification.repository}`;
    case 'pull_request_opened':
      return `New PR in ${notification.repository}`;
    case 'pull_request_merged':
      return `PR Merged in ${notification.repository}`;
    case 'issue_opened':
      return `New Issue in ${notification.repository}`;
    default:
      return 'GitHub Notification';
  }
}

// Format notification body
function formatNotificationBody(notification: Record<string, any>): string {
  switch (notification.type) {
    case 'push':
      return `${notification.pusher} pushed ${notification.commitCount} commit(s) to ${notification.branch}`;
    case 'pull_request_opened':
      return `${notification.author} opened PR #${notification.prNumber}: ${notification.title}`;
    case 'pull_request_merged':
      return `${notification.author} merged PR #${notification.prNumber}: ${notification.title}`;
    case 'issue_opened':
      return `${notification.author} opened issue #${notification.issueNumber}: ${notification.title}`;
    default:
      return JSON.stringify(notification);
  }
}
