/**
 * Gmail Disconnect Edge Function
 *
 * Handles disconnecting a Gmail account from MoltBot.
 * Revokes the OAuth token with Google and deletes the connection from the database.
 *
 * Setup Required:
 * - GOOGLE_CLIENT_ID in Supabase secrets (optional for revocation)
 * - GOOGLE_CLIENT_SECRET in Supabase secrets (optional for revocation)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";
import { decryptServer } from "../_shared/crypto-server.ts";

// =============================================================================
// Constants
// =============================================================================

const LOG_PREFIX = '[GmailDisconnect]';
const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

// =============================================================================
// Types
// =============================================================================

interface DisconnectRequest {
  connectionId: string;
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

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
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
    const body: DisconnectRequest = await req.json();
    const { connectionId } = body;

    if (!connectionId) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Missing connectionId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    console.log(`${LOG_PREFIX} Disconnecting connection ${connectionId} for user ${user.id}`);

    // Get user's workspaces to verify access
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

    const workspaceIds = workspaces.map(w => w.workspace_id);

    // Fetch the connection (verify user has access through workspace membership)
    const { data: connection, error: fetchError } = await supabase
      .schema('integrations').from('email_connections')
      .select('*')
      .eq('id', connectionId)
      .in('workspace_id', workspaceIds)
      .single();

    if (fetchError || !connection) {
      console.error(`${LOG_PREFIX} Connection not found or access denied`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Connection not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const warnings: string[] = [];

    // Try to revoke the OAuth token with Google
    if (connection.access_token_encrypted) {
      try {
        const accessToken = await decryptServer(connection.access_token_encrypted);

        const revokeResponse = await fetch(
          `${GOOGLE_REVOKE_ENDPOINT}?token=${encodeURIComponent(accessToken)}`,
          { method: 'POST' }
        );

        if (!revokeResponse.ok) {
          const errorText = await revokeResponse.text();
          console.warn(`${LOG_PREFIX} Token revocation failed (non-critical):`, errorText);
          warnings.push('Could not revoke Google access. You may want to revoke access manually at https://myaccount.google.com/permissions');
        } else {
          console.log(`${LOG_PREFIX} Token revoked with Google`);
        }
      } catch (decryptError) {
        console.warn(`${LOG_PREFIX} Could not decrypt token for revocation:`, decryptError);
        warnings.push('Could not revoke Google access. You may want to revoke access manually at https://myaccount.google.com/permissions');
      }
    }

    // Delete the connection from database
    const { error: deleteError } = await supabase
      .schema('integrations').from('email_connections')
      .delete()
      .eq('id', connectionId);

    if (deleteError) {
      console.error(`${LOG_PREFIX} Failed to delete connection:`, deleteError);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Failed to delete connection' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    console.log(`${LOG_PREFIX} Connection ${connectionId} deleted successfully`);

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Gmail disconnected successfully',
          warnings: warnings.length > 0 ? warnings : undefined,
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
