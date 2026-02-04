/**
 * Drip Campaign Enroll Edge Function
 *
 * API endpoint for enrolling contacts into drip campaigns.
 * Handles enrollment logic, calculates first touch date, creates enrollment record.
 *
 * Supports:
 * - Single contact enrollment
 * - Bulk enrollment (multiple contacts)
 * - Re-enrollment (restart campaign for existing contact)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface EnrollRequest {
  campaign_id: string;
  contact_ids: string[];           // Can be single or multiple
  deal_id?: string;                // Optional deal association
  context?: {                      // Personalization context
    property_address?: string;
    pain_points?: string[];
    motivation_score?: number;
    custom_variables?: Record<string, string>;
  };
  start_immediately?: boolean;     // Send first touch now (default: true)
  skip_opted_out?: boolean;        // Skip contacts who opted out (default: true)
  allow_re_enrollment?: boolean;   // Re-enroll if already enrolled (default: false)
}

interface EnrollResult {
  success: boolean;
  enrolled: string[];              // Contact IDs that were enrolled
  skipped: {
    contact_id: string;
    reason: string;
  }[];
  errors: {
    contact_id: string;
    error: string;
  }[];
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const userId = user.id;

    // Parse request
    const body: EnrollRequest = await req.json();
    const {
      campaign_id,
      contact_ids,
      deal_id,
      context,
      start_immediately = true,
      skip_opted_out = true,
      allow_re_enrollment = false
    } = body;

    if (!campaign_id || !contact_ids || contact_ids.length === 0) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'campaign_id and contact_ids are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Verify campaign exists and belongs to user
    const { data: campaign, error: campaignError } = await supabase
      .schema('investor')
      .from('campaigns')
      .select('id, status, is_drip_campaign')
      .eq('id', campaign_id)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Campaign not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    if (campaign.status !== 'active') {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Campaign is not active' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get first step to calculate initial touch time
    const { data: firstStep, error: stepError } = await supabase
      .schema('crm')
      .from('drip_campaign_steps')
      .select('id, delay_days, channel')
      .eq('campaign_id', campaign_id)
      .eq('step_number', 1)
      .eq('is_active', true)
      .single();

    if (stepError || !firstStep) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Campaign has no active steps' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    const result: EnrollResult = {
      success: true,
      enrolled: [],
      skipped: [],
      errors: []
    };

    // Check for existing enrollments
    const { data: existingEnrollments } = await supabase
      .schema('crm')
      .from('drip_enrollments')
      .select('contact_id, status')
      .eq('campaign_id', campaign_id)
      .in('contact_id', contact_ids);

    const existingMap = new Map(
      existingEnrollments?.map(e => [e.contact_id, e.status]) || []
    );

    // Get opt-out status for contacts
    let optedOutContacts = new Set<string>();
    if (skip_opted_out) {
      const { data: optOuts } = await supabase
        .schema('crm')
        .from('opt_outs')
        .select('contact_id')
        .in('contact_id', contact_ids)
        .eq('channel', firstStep.channel)
        .eq('is_active', true);

      optedOutContacts = new Set(optOuts?.map(o => o.contact_id) || []);
    }

    // Get do_not_contact flags
    const { data: contacts } = await supabase
      .schema('crm')
      .from('contacts')
      .select('id, do_not_contact')
      .in('id', contact_ids)
      .eq('user_id', userId);

    const contactMap = new Map(contacts?.map(c => [c.id, c]) || []);

    // Calculate next touch time
    const now = new Date();
    let nextTouchAt: Date;
    if (start_immediately && firstStep.delay_days === 0) {
      // Send immediately
      nextTouchAt = now;
    } else {
      // Calculate based on delay
      nextTouchAt = new Date(now.getTime() + firstStep.delay_days * 24 * 60 * 60 * 1000);
    }

    // Process each contact
    for (const contactId of contact_ids) {
      try {
        // Check if contact exists and belongs to user
        const contact = contactMap.get(contactId);
        if (!contact) {
          result.skipped.push({
            contact_id: contactId,
            reason: 'Contact not found'
          });
          continue;
        }

        // Check do_not_contact flag
        if (contact.do_not_contact) {
          result.skipped.push({
            contact_id: contactId,
            reason: 'Contact marked as do not contact'
          });
          continue;
        }

        // Check opt-out
        if (optedOutContacts.has(contactId)) {
          result.skipped.push({
            contact_id: contactId,
            reason: `Opted out of ${firstStep.channel}`
          });
          continue;
        }

        // Check existing enrollment
        const existingStatus = existingMap.get(contactId);
        if (existingStatus) {
          if (existingStatus === 'active' && !allow_re_enrollment) {
            result.skipped.push({
              contact_id: contactId,
              reason: 'Already enrolled in this campaign'
            });
            continue;
          }

          if (allow_re_enrollment) {
            // Update existing enrollment to restart
            const { error: updateError } = await supabase
              .schema('crm')
              .from('drip_enrollments')
              .update({
                status: 'active',
                current_step: 1,
                next_touch_at: nextTouchAt.toISOString(),
                touches_sent: 0,
                touches_delivered: 0,
                touches_failed: 0,
                last_touch_at: null,
                responded_at: null,
                converted_at: null,
                paused_at: null,
                completed_at: null,
                enrollment_context: context || {},
                enrolled_at: now.toISOString(),
                updated_at: now.toISOString()
              })
              .eq('campaign_id', campaign_id)
              .eq('contact_id', contactId);

            if (updateError) {
              result.errors.push({
                contact_id: contactId,
                error: updateError.message
              });
              continue;
            }

            result.enrolled.push(contactId);
            continue;
          }
        }

        // Create new enrollment
        const { error: insertError } = await supabase
          .schema('crm')
          .from('drip_enrollments')
          .insert({
            user_id: userId,
            campaign_id,
            contact_id: contactId,
            deal_id: deal_id || null,
            current_step: 1,
            next_touch_at: nextTouchAt.toISOString(),
            status: 'active',
            enrollment_context: context || {},
            enrolled_at: now.toISOString()
          });

        if (insertError) {
          // Check for unique constraint violation (already enrolled)
          if (insertError.code === '23505') {
            result.skipped.push({
              contact_id: contactId,
              reason: 'Already enrolled in this campaign'
            });
          } else {
            result.errors.push({
              contact_id: contactId,
              error: insertError.message
            });
          }
          continue;
        }

        // Update contact's campaign status
        const { error: contactUpdateError } = await supabase
          .schema('crm')
          .from('contacts')
          .update({
            campaign_status: 'enrolled',
            active_campaign_id: campaign_id
          })
          .eq('id', contactId);

        if (contactUpdateError) {
          console.error(`[DripEnroll] Error updating contact ${contactId} status:`, contactUpdateError);
          // Non-critical - enrollment was created, continue
        }

        result.enrolled.push(contactId);

      } catch (error) {
        result.errors.push({
          contact_id: contactId,
          error: error.message
        });
      }
    }

    // Update campaign enrolled count
    if (result.enrolled.length > 0) {
      const { error: countError } = await supabase.rpc('increment_campaign_enrolled_count', {
        p_campaign_id: campaign_id,
        p_count: result.enrolled.length
      });

      if (countError) {
        console.error(`[DripEnroll] Error updating campaign enrolled count:`, countError);
        // Non-critical - enrollments were created
      }
    }

    console.log(`[DripEnroll] Campaign ${campaign_id}: Enrolled ${result.enrolled.length}, Skipped ${result.skipped.length}, Errors ${result.errors.length}`);

    return addCorsHeaders(
      new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('[DripEnroll] Error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
