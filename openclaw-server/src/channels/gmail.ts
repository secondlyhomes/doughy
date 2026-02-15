// Gmail Channel Adapter for OpenClaw
// Handles email communication via Gmail API and Pub/Sub webhooks

import { google } from 'googleapis';
import { config } from '../config.js';
import {
  saveUserGmailTokens,
  getUserGmailTokens,
  updateUserHistoryId,
} from '../supabase.js';
import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from './base.js';
import type {
  GmailMessage,
  GmailMessagePart,
  GmailHistoryRecord,
  UserGmailTokens,
} from '../types.js';

/**
 * Gmail Channel Adapter
 * Implements the ChannelAdapter interface for Gmail/Email communication
 */
export class GmailAdapter implements ChannelAdapter {
  readonly channelType = 'email' as const;

  initialize(): Promise<void> {
    // Gmail uses per-user OAuth, no global initialization needed
    return Promise.resolve();
  }

  isConfigured(): boolean {
    return !!(config.googleClientId && config.googleClientSecret);
  }

  /**
   * Create OAuth2 client
   */
  createOAuth2Client() {
    return new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
  }

  /**
   * Get authenticated client for a user
   */
  async getAuthenticatedClient(
    userTokens: UserGmailTokens
  ): Promise<ReturnType<typeof this.createOAuth2Client>> {
    const oauth2Client = this.createOAuth2Client();

    oauth2Client.setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token,
      expiry_date: new Date(userTokens.token_expiry).getTime(),
    });

    // Set up automatic token refresh
    oauth2Client.on('tokens', async (tokens) => {
      console.log('[Gmail] Tokens refreshed for user:', userTokens.user_id);
      await saveUserGmailTokens({
        user_id: userTokens.user_id,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || userTokens.refresh_token,
        token_expiry: new Date(tokens.expiry_date!).toISOString(),
      });
    });

    return oauth2Client;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const oauth2Client = this.createOAuth2Client();

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    email: string;
  }> {
    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expiry_date: tokens.expiry_date!,
      email: userInfo.data.email!,
    };
  }

  /**
   * Start watching a user's Gmail inbox
   */
  async startWatch(
    userTokens: UserGmailTokens
  ): Promise<{ historyId: string; expiration: string }> {
    const oauth2Client = await this.getAuthenticatedClient(userTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: config.pubSubTopicName,
        labelIds: ['INBOX'],
      },
    });

    const historyId = response.data.historyId!;
    const expiration = new Date(
      parseInt(response.data.expiration!, 10)
    ).toISOString();

    await saveUserGmailTokens({
      user_id: userTokens.user_id,
      history_id: historyId,
      watch_expiration: expiration,
    });

    console.log(
      `[Gmail] Watch started for ${userTokens.gmail_email}, expires: ${expiration}`
    );

    return { historyId, expiration };
  }

  /**
   * Stop watching a user's Gmail inbox
   */
  async stopWatch(userTokens: UserGmailTokens): Promise<void> {
    const oauth2Client = await this.getAuthenticatedClient(userTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    await gmail.users.stop({ userId: 'me' });
    console.log(`[Gmail] Watch stopped for ${userTokens.gmail_email}`);
  }

  /**
   * Get new messages since last history ID
   */
  async getNewMessages(
    userTokens: UserGmailTokens,
    startHistoryId: string
  ): Promise<{ messages: GmailMessage[]; latestHistoryId: string }> {
    const oauth2Client = await this.getAuthenticatedClient(userTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const messages: GmailMessage[] = [];
    let latestHistoryId = startHistoryId;
    let pageToken: string | undefined;

    try {
      do {
        const historyResponse = await gmail.users.history.list({
          userId: 'me',
          startHistoryId,
          historyTypes: ['messageAdded'],
          labelId: 'INBOX',
          pageToken,
        });

        latestHistoryId = historyResponse.data.historyId || latestHistoryId;
        pageToken = historyResponse.data.nextPageToken || undefined;

        const history = (historyResponse.data.history ||
          []) as GmailHistoryRecord[];

        for (const record of history) {
          if (record.messagesAdded) {
            for (const addedMessage of record.messagesAdded) {
              if (addedMessage.message.labelIds?.includes('INBOX')) {
                try {
                  const fullMessage = await gmail.users.messages.get({
                    userId: 'me',
                    id: addedMessage.message.id,
                    format: 'full',
                  });
                  messages.push(fullMessage.data as unknown as GmailMessage);
                } catch (err) {
                  console.error(
                    `[Gmail] Failed to fetch message ${addedMessage.message.id}:`,
                    err
                  );
                }
              }
            }
          }
        }
      } while (pageToken);
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 404) {
        console.log('[Gmail] History ID expired, performing initial sync');
        const profile = await gmail.users.getProfile({ userId: 'me' });
        latestHistoryId = profile.data.historyId!;
      } else {
        throw err;
      }
    }

    await updateUserHistoryId(userTokens.user_id, latestHistoryId);

    return { messages, latestHistoryId };
  }

  /**
   * Normalize Gmail message to IncomingMessage format
   */
  normalizeMessage(message: GmailMessage): IncomingMessage | null {
    const headers = message.payload.headers;

    const getHeader = (name: string): string | undefined => {
      return headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      )?.value;
    };

    const from = getHeader('From');
    const to = getHeader('To');
    const subject = getHeader('Subject') || '(no subject)';

    if (!from || !to) {
      console.error('[Gmail] Message missing From or To header');
      return null;
    }

    const body = this.extractMessageBody(message);

    // Parse "Name <email>" format
    const fromMatch = from.match(/^(.+?)\s*<(.+)>$/);
    const fromName = fromMatch ? fromMatch[1].trim() : undefined;
    const fromEmail = fromMatch ? fromMatch[2] : from;

    return {
      channel: 'email',
      channelMessageId: message.id,
      channelThreadId: message.threadId,
      from: fromEmail,
      fromName,
      to,
      subject,
      body,
      receivedAt: new Date(parseInt(message.internalDate, 10)).toISOString(),
    };
  }

  /**
   * Send a message via Gmail
   */
  async sendMessage(
    message: OutgoingMessage,
    userCredentials: UserGmailTokens
  ): Promise<string> {
    const oauth2Client = await this.getAuthenticatedClient(userCredentials);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const headers = [
      `To: ${message.to}`,
      `Subject: ${message.subject || 'Re: Your inquiry'}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
    ];

    if (message.replyToMessageId) {
      headers.push(`In-Reply-To: ${message.replyToMessageId}`);
      headers.push(`References: ${message.replyToMessageId}`);
    }

    const rawMessage = [...headers, '', message.body].join('\r\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: message.replyToThreadId,
      },
    });

    console.log(`[Gmail] Email sent: ${response.data.id}`);
    return response.data.id!;
  }

  /**
   * Extract plain text body from Gmail message
   */
  private extractMessageBody(message: GmailMessage): string {
    const plainText = this.findPartByMimeType(message.payload, 'text/plain');
    if (plainText) {
      return this.decodeBase64Url(plainText);
    }

    const htmlText = this.findPartByMimeType(message.payload, 'text/html');
    if (htmlText) {
      return this.stripHtml(this.decodeBase64Url(htmlText));
    }

    return message.snippet || '';
  }

  private findPartByMimeType(
    part: GmailMessage['payload'] | GmailMessagePart,
    mimeType: string
  ): string | null {
    if (part.mimeType === mimeType && part.body?.data) {
      return part.body.data;
    }

    if ('parts' in part && part.parts) {
      for (const subPart of part.parts) {
        const result = this.findPartByMimeType(subPart, mimeType);
        if (result) return result;
      }
    }

    return null;
  }

  private decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Export singleton instance
export const gmailAdapter = new GmailAdapter();
