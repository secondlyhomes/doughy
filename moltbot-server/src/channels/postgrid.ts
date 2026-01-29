// PostGrid Channel Adapter for MoltBot
// Handles direct mail communication via PostGrid API

import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
} from './base.js';

/**
 * PostGrid webhook payload for mail status updates
 */
interface PostGridWebhookPayload {
  id: string;
  object: 'letter' | 'postcard';
  status: string;
  to: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    city?: string;
    provinceOrState?: string;
    postalOrZip?: string;
  };
  from: {
    firstName?: string;
    companyName?: string;
  };
  trackingNumber?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
}

/**
 * User's PostGrid credentials
 */
export interface PostGridCredentials {
  user_id: string;
  return_name?: string;
  return_company?: string;
  return_address_line1?: string;
  return_address_line2?: string;
  return_city?: string;
  return_state?: string;
  return_zip?: string;
  default_mail_class?: 'first_class' | 'standard';
}

/**
 * Mail piece types
 */
export type MailPieceType =
  | 'postcard_4x6'
  | 'postcard_6x9'
  | 'postcard_6x11'
  | 'yellow_letter'
  | 'letter_1_page'
  | 'letter_2_page';

/**
 * PostGrid Channel Adapter
 * Uses PostGrid Print & Mail API for direct mail campaigns
 *
 * Setup (system-level, not per-user):
 * 1. Sign up for PostGrid account
 * 2. Get API key (POSTGRID_API_KEY env var)
 * 3. Configure webhook URL: https://moltbot.doughy.app/webhooks/postgrid
 */
export class PostGridAdapter implements ChannelAdapter {
  readonly channelType = 'direct_mail' as const;

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.postgrid.com/print-mail/v1';

  constructor() {
    this.apiKey = process.env.POSTGRID_API_KEY || '';
  }

  initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('[PostGrid] API key not configured');
    } else {
      console.log('[PostGrid] Adapter initialized');
    }
    return Promise.resolve();
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Normalize PostGrid webhook to IncomingMessage
   * Note: PostGrid doesn't receive messages, only status updates
   */
  normalizeMessage(payload: PostGridWebhookPayload): IncomingMessage | null {
    // PostGrid webhooks are status updates, not incoming messages
    // We track these for delivery confirmation
    console.log('[PostGrid] Status update:', payload.id, payload.status);
    return null;
  }

  /**
   * Send direct mail via PostGrid
   */
  async sendMessage(
    message: OutgoingMessage & {
      mailPieceType?: MailPieceType;
      templateId?: string;
      frontHtml?: string;
      backHtml?: string;
      recipientAddress?: {
        firstName?: string;
        lastName?: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        zip: string;
      };
    },
    credentials: PostGridCredentials
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('PostGrid API key not configured');
    }

    if (!message.recipientAddress) {
      throw new Error('Recipient address is required for direct mail');
    }

    if (!credentials.return_address_line1) {
      throw new Error('Return address not configured');
    }

    const mailPieceType = message.mailPieceType || 'postcard_4x6';
    const isLetter = mailPieceType.includes('letter');

    // Build payload
    const payload: Record<string, unknown> = {
      to: {
        firstName: message.recipientAddress.firstName || '',
        lastName: message.recipientAddress.lastName || '',
        addressLine1: message.recipientAddress.addressLine1,
        addressLine2: message.recipientAddress.addressLine2 || '',
        city: message.recipientAddress.city,
        provinceOrState: message.recipientAddress.state,
        postalOrZip: message.recipientAddress.zip,
        country: 'US',
      },
      from: {
        firstName: credentials.return_name || '',
        companyName: credentials.return_company || '',
        addressLine1: credentials.return_address_line1,
        addressLine2: credentials.return_address_line2 || '',
        city: credentials.return_city,
        provinceOrState: credentials.return_state,
        postalOrZip: credentials.return_zip,
        country: 'US',
      },
      mailClass: credentials.default_mail_class || 'first_class',
    };

    // Add content
    if (message.templateId) {
      payload.template = message.templateId;
    } else if (isLetter) {
      // Generate letter HTML
      const isYellowLetter = mailPieceType === 'yellow_letter';
      payload.html = isYellowLetter
        ? this.generateYellowLetterHtml(message.body, credentials)
        : this.generateLetterHtml(message.body, credentials);
    } else {
      // Postcard
      const sizeMap: Record<string, string> = {
        postcard_4x6: '4x6',
        postcard_6x9: '6x9',
        postcard_6x11: '6x11',
      };
      payload.size = sizeMap[mailPieceType] || '4x6';

      if (message.frontHtml) {
        payload.frontHtml = message.frontHtml;
      } else {
        payload.frontHtml = this.generatePostcardFrontHtml(message.body);
      }

      if (message.backHtml) {
        payload.backHtml = message.backHtml;
      } else {
        payload.backHtml = this.generatePostcardBackHtml(credentials);
      }
    }

    // Determine endpoint
    const endpoint = isLetter ? '/letters' : '/postcards';

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PostGrid API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as { data: { id: string } };
    console.log(`[PostGrid] Mail sent: ${result.data.id}`);
    return result.data.id;
  }

  /**
   * Generate standard letter HTML
   */
  private generateLetterHtml(body: string, credentials: PostGridCredentials): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <html>
        <head>
          <style>
            body {
              font-family: Georgia, 'Times New Roman', serif;
              margin: 1in;
              line-height: 1.6;
              color: #333;
            }
            .header { margin-bottom: 2em; }
            .date { margin-bottom: 1.5em; }
            .body { margin-bottom: 2em; }
            .signature { margin-top: 2em; }
          </style>
        </head>
        <body>
          <div class="header">
            ${credentials.return_company ? `<strong>${credentials.return_company}</strong><br>` : ''}
            ${credentials.return_name}<br>
            ${credentials.return_address_line1}<br>
            ${credentials.return_city}, ${credentials.return_state} ${credentials.return_zip}
          </div>
          <div class="date">${date}</div>
          <div class="body">${body.replace(/\n/g, '<br>')}</div>
          <div class="signature">
            Sincerely,<br><br>
            ${credentials.return_name}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate yellow letter HTML (handwritten style)
   */
  private generateYellowLetterHtml(body: string, credentials: PostGridCredentials): string {
    return `
      <html>
        <head>
          <style>
            body {
              font-family: 'Comic Sans MS', 'Bradley Hand', 'Marker Felt', cursive;
              background-color: #FFFACD;
              margin: 0.75in;
              line-height: 1.8;
              color: #1a1a1a;
              font-size: 14pt;
            }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="content">${body}</div>
          <br><br>
          - ${credentials.return_name}
          ${credentials.return_company ? `<br>${credentials.return_company}` : ''}
        </body>
      </html>
    `;
  }

  /**
   * Generate postcard front HTML
   */
  private generatePostcardFrontHtml(body: string): string {
    return `
      <div style="
        padding: 24px;
        font-family: Arial, sans-serif;
        height: 100%;
        box-sizing: border-box;
      ">
        <h2 style="color: #2563eb; margin-bottom: 12px; margin-top: 0;">
          Important Message
        </h2>
        <p style="margin: 0; line-height: 1.5;">
          ${body.replace(/\n/g, '<br>')}
        </p>
      </div>
    `;
  }

  /**
   * Generate postcard back HTML
   */
  private generatePostcardBackHtml(credentials: PostGridCredentials): string {
    return `
      <div style="
        padding: 24px;
        font-family: Arial, sans-serif;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      ">
        <div style="font-size: 12px; line-height: 1.4;">
          <strong>${credentials.return_company || credentials.return_name}</strong><br>
          ${credentials.return_address_line1}<br>
          ${credentials.return_city}, ${credentials.return_state} ${credentials.return_zip}
        </div>
      </div>
    `;
  }

  /**
   * Get mail piece pricing (in credits)
   */
  static getPricing(pieceType: MailPieceType): number {
    const pricing: Record<MailPieceType, number> = {
      postcard_4x6: 1.49,
      postcard_6x9: 1.99,
      postcard_6x11: 2.49,
      yellow_letter: 2.99,
      letter_1_page: 2.49,
      letter_2_page: 3.49,
    };
    return pricing[pieceType] || 1.49;
  }
}

// Export singleton instance
export const postgridAdapter = new PostGridAdapter();
