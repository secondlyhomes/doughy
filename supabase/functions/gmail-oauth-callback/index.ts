/**
 * Gmail OAuth Callback Edge Function
 *
 * Handles the OAuth code exchange after user authorizes Gmail access.
 * Exchanges the authorization code for access/refresh tokens and stores
 * them (encrypted) in the rental_email_connections table.
 *
 * Setup Required:
 * - GOOGLE_CLIENT_ID in Supabase secrets
 * - GOOGLE_CLIENT_SECRET in Supabase secrets
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";
import { encryptServer } from "../_shared/crypto-server.ts";

// =============================================================================
// Constants
// =============================================================================

const LOG_PREFIX = '[GmailOAuthCallback]';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';

// =============================================================================
// Types
// =============================================================================

/**
 * Valid Google service types
 */
type GoogleServiceType = 'gmail' | 'calendar';

interface CallbackRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  /** Which Google services to enable (defaults to ['gmail']) */
  services?: GoogleServiceType[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface UserInfo {
  email: string;
  verified_email: boolean;
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!googleClientId || !googleClientSecret) {
      console.error(`${LOG_PREFIX} Missing Google OAuth credentials`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Gmail integration not configured. Please contact support.',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid authentication' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Parse request body
    const body: CallbackRequest = await req.json();
    const { code, codeVerifier, redirectUri, services = ['gmail'] } = body;

    if (!code || !codeVerifier || !redirectUri) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing required parameters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Validate services array
    const validServices: GoogleServiceType[] = ['gmail', 'calendar'];
    const requestedServices = services.filter((s): s is GoogleServiceType =>
      validServices.includes(s as GoogleServiceType)
    );

    // Ensure at least gmail is included (required for email sync)
    if (!requestedServices.includes('gmail')) {
      requestedServices.unshift('gmail');
    }

    console.log(`${LOG_PREFIX} Requested services: ${requestedServices.join(', ')}`);

    console.log(`${LOG_PREFIX} Exchanging code for tokens`);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`${LOG_PREFIX} Token exchange failed:`, errorText);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to exchange authorization code. Please try again.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    if (!tokens.refresh_token) {
      console.error(`${LOG_PREFIX} No refresh token received`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Authorization incomplete. Please disconnect and reconnect Gmail.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get user's email address
    const userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error(`${LOG_PREFIX} Failed to get user info`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Failed to get Gmail account info' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const userInfo: UserInfo = await userInfoResponse.json();
    console.log(`${LOG_PREFIX} Connected Gmail: ${userInfo.email}`);

    // Encrypt tokens before storing
    const accessTokenEncrypted = await encryptServer(tokens.access_token);
    const refreshTokenEncrypted = await encryptServer(tokens.refresh_token);

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Get user's workspace
    const { data: workspaces, error: wsError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (wsError || !workspaces || workspaces.length === 0) {
      console.error(`${LOG_PREFIX} No workspace found for user`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'No workspace found' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const workspaceId = workspaces[0].workspace_id;

    // Check if connection already exists for this workspace
    const { data: existing } = await supabase
      .from('rental_email_connections')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'gmail')
      .single();

    let connectionId: string;

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('rental_email_connections')
        .update({
          email_address: userInfo.email,
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: tokenExpiresAt,
          is_active: true,
          sync_error: null,
          google_services: requestedServices,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`${LOG_PREFIX} Failed to update connection:`, updateError);
        return addCorsHeaders(
          new Response(
            JSON.stringify({ success: false, error: 'Failed to save connection' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      connectionId = existing.id;
      console.log(`${LOG_PREFIX} Updated existing connection ${connectionId} with services: ${requestedServices.join(', ')}`);
    } else {
      // Create new connection
      const { data: newConnection, error: insertError } = await supabase
        .from('rental_email_connections')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          provider: 'gmail',
          email_address: userInfo.email,
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: tokenExpiresAt,
          is_active: true,
          google_services: requestedServices,
        })
        .select('id')
        .single();

      if (insertError || !newConnection) {
        console.error(`${LOG_PREFIX} Failed to create connection:`, insertError);
        return addCorsHeaders(
          new Response(
            JSON.stringify({ success: false, error: 'Failed to save connection' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      connectionId = newConnection.id;
      console.log(`${LOG_PREFIX} Created new connection ${connectionId} with services: ${requestedServices.join(', ')}`);
    }

    // Trigger initial sync
    try {
      await fetch(`${supabaseUrl}/functions/v1/gmail-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseSecretKey}`,
        },
        body: JSON.stringify({
          connectionId,
          manual: true,
        }),
      });
    } catch (syncError) {
      console.warn(`${LOG_PREFIX} Initial sync failed:`, syncError);
      // Non-critical - sync can happen later
    }

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          email: userInfo.email,
          connectionId,
          services: requestedServices,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${LOG_PREFIX} Error:`, error);

    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
