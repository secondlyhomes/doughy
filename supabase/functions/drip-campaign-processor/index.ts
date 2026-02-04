/**
 * Drip Campaign Processor Edge Function
 *
 * Cron job that runs every 15 minutes to process drip campaign enrollments.
 * Queries enrollments due for touch, checks opt-outs and quiet hours,
 * then triggers the touch executor.
 *
 * This function is designed to be called by Supabase pg_cron or external scheduler.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface DueEnrollment {
  enrollment_id: string;
  user_id: string;
  campaign_id: string;
  contact_id: string;
  current_step: number;
  campaign_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  contact_email: string;
}

interface Campaign {
  id: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
  respect_weekends: boolean;
  auto_pause_on_response: boolean;
}

interface CampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  channel: string;
  subject: string | null;
  message_body: string | null;
  template_id: string | null;
  use_ai_generation: boolean;
  ai_tone: string | null;
  mail_piece_type: string | null;
  mail_template_id: string | null;
  talking_points: string[] | null;
  call_script: string | null;
  skip_if_responded: boolean;
  skip_if_converted: boolean;
}

interface ProcessResult {
  processed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if current time is within quiet hours for a campaign
 */
function isWithinQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string
): boolean {
  if (!quietStart || !quietEnd) return false;

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const timeString = formatter.format(now);
    const [hours, minutes] = timeString.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = quietStart.split(':').map(Number);
    const [endHours, endMinutes] = quietEnd.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    // Handle overnight quiet hours (e.g., 21:00 to 09:00)
    if (startTotal > endTotal) {
      return currentMinutes >= startTotal || currentMinutes <= endTotal;
    }
    return currentMinutes >= startTotal && currentMinutes <= endTotal;
  } catch (error) {
    console.error('[DripProcessor] Error checking quiet hours - defaulting to quiet:', error);
    return true; // Fail-safe: assume quiet hours when uncertain
  }
}

/**
 * Check if today is a weekend
 */
function isWeekend(timezone: string): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });
    const dayName = formatter.format(now);
    return dayName === 'Saturday' || dayName === 'Sunday';
  } catch (error) {
    console.error('[DripProcessor] Error checking weekend - defaulting to weekend:', error);
    return true; // Fail-safe: assume weekend when uncertain
  }
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

    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Optional: Check for cron secret if using external scheduler
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // For cron jobs, if CRON_SECRET is configured, require valid auth
    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '');
      if (!token || token !== cronSecret) {
        console.warn('[DripProcessor] Invalid or missing cron secret');
        return addCorsHeaders(
          new Response(
            JSON.stringify({ success: false, error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }
    }

    const result: ProcessResult = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    // Get due enrollments
    const { data: dueEnrollments, error: fetchError } = await supabase
      .rpc('get_due_drip_enrollments', { p_limit: 100 });

    if (fetchError) {
      console.error('[DripProcessor] Error fetching due enrollments:', fetchError);
      throw fetchError;
    }

    if (!dueEnrollments || dueEnrollments.length === 0) {
      console.log('[DripProcessor] No enrollments due for processing');
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: true,
            message: 'No enrollments due',
            result
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    console.log(`[DripProcessor] Found ${dueEnrollments.length} due enrollments`);

    // Cache campaigns and steps to reduce queries
    const campaignCache = new Map<string, Campaign>();
    const stepCache = new Map<string, CampaignStep>();

    // Process each enrollment
    for (const enrollment of dueEnrollments as DueEnrollment[]) {
      try {
        // Get campaign settings (cached)
        let campaign = campaignCache.get(enrollment.campaign_id);
        if (!campaign) {
          const { data: campaignData, error: campaignError } = await supabase
            .schema('investor')
            .from('campaigns')
            .select('id, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, respect_weekends, auto_pause_on_response')
            .eq('id', enrollment.campaign_id)
            .single();

          if (campaignError || !campaignData) {
            console.error(`[DripProcessor] Campaign not found: ${enrollment.campaign_id}`);
            result.failed++;
            result.errors.push(`Campaign not found: ${enrollment.campaign_id}`);
            continue;
          }

          campaign = campaignData as Campaign;
          campaignCache.set(enrollment.campaign_id, campaign);
        }

        // Check quiet hours
        if (isWithinQuietHours(
          campaign.quiet_hours_start,
          campaign.quiet_hours_end,
          campaign.quiet_hours_timezone || 'America/New_York'
        )) {
          console.log(`[DripProcessor] Skipping ${enrollment.enrollment_id}: quiet hours`);
          result.skipped++;
          continue;
        }

        // Check weekends
        if (campaign.respect_weekends && isWeekend(campaign.quiet_hours_timezone || 'America/New_York')) {
          console.log(`[DripProcessor] Skipping ${enrollment.enrollment_id}: weekend`);
          result.skipped++;
          continue;
        }

        // Get current step configuration
        const stepCacheKey = `${enrollment.campaign_id}_${enrollment.current_step}`;
        let step = stepCache.get(stepCacheKey);
        if (!step) {
          const { data: stepData, error: stepError } = await supabase
            .schema('investor')
            .from('drip_campaign_steps')
            .select('*')
            .eq('campaign_id', enrollment.campaign_id)
            .eq('step_number', enrollment.current_step)
            .eq('is_active', true)
            .single();

          if (stepError || !stepData) {
            console.error(`[DripProcessor] Step not found: campaign ${enrollment.campaign_id}, step ${enrollment.current_step}`);
            result.failed++;
            result.errors.push(`Step not found: campaign ${enrollment.campaign_id}, step ${enrollment.current_step}`);
            continue;
          }

          step = stepData as CampaignStep;
          stepCache.set(stepCacheKey, step);
        }

        // Check opt-out for this channel
        const { data: isOptedOut, error: optOutCheckError } = await supabase
          .rpc('is_contact_opted_out', {
            p_contact_id: enrollment.contact_id,
            p_channel: step.channel
          });

        // Fail-safe: if we can't verify opt-out status, skip this contact
        if (optOutCheckError) {
          console.error(`[DripProcessor] Cannot verify opt-out status for ${enrollment.contact_id}:`, optOutCheckError);
          result.skipped++;
          result.errors.push(`Cannot verify opt-out for ${enrollment.enrollment_id}: ${optOutCheckError.message}`);
          continue;
        }

        if (isOptedOut) {
          console.log(`[DripProcessor] Skipping ${enrollment.enrollment_id}: opted out of ${step.channel}`);

          // Mark enrollment as opted out
          const { error: optOutUpdateError } = await supabase
            .schema('investor')
            .from('drip_enrollments')
            .update({ status: 'opted_out', paused_at: new Date().toISOString() })
            .eq('id', enrollment.enrollment_id);

          if (optOutUpdateError) {
            console.error(`[DripProcessor] CRITICAL: Failed to mark enrollment as opted out: ${enrollment.enrollment_id}`, optOutUpdateError);
            result.failed++;
            result.errors.push(`Failed to record opt-out for ${enrollment.enrollment_id}: ${optOutUpdateError.message}`);
            continue;
          }

          result.skipped++;
          continue;
        }

        // Check if contact is marked do_not_contact
        const { data: contact, error: contactError } = await supabase
          .schema('crm')
          .from('contacts')
          .select('do_not_contact')
          .eq('id', enrollment.contact_id)
          .single();

        // Fail-safe: if we can't verify contact status, skip
        if (contactError) {
          console.error(`[DripProcessor] Cannot verify contact status for ${enrollment.contact_id}:`, contactError);
          result.skipped++;
          result.errors.push(`Cannot verify contact for ${enrollment.enrollment_id}: ${contactError.message}`);
          continue;
        }

        if (contact?.do_not_contact) {
          console.log(`[DripProcessor] Skipping ${enrollment.enrollment_id}: do_not_contact flag`);
          result.skipped++;
          continue;
        }

        // Invoke touch executor
        const touchExecutorUrl = `${supabaseUrl}/functions/v1/drip-touch-executor`;
        const touchResponse = await fetch(touchExecutorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseSecretKey}`
          },
          body: JSON.stringify({
            enrollment_id: enrollment.enrollment_id,
            step_id: step.id,
            user_id: enrollment.user_id,
            contact: {
              id: enrollment.contact_id,
              first_name: enrollment.contact_first_name,
              last_name: enrollment.contact_last_name,
              phone: enrollment.contact_phone,
              email: enrollment.contact_email
            },
            step: {
              channel: step.channel,
              subject: step.subject,
              message_body: step.message_body,
              template_id: step.template_id,
              use_ai_generation: step.use_ai_generation,
              ai_tone: step.ai_tone,
              mail_piece_type: step.mail_piece_type,
              mail_template_id: step.mail_template_id,
              talking_points: step.talking_points,
              call_script: step.call_script
            }
          })
        });

        if (!touchResponse.ok) {
          const errorText = await touchResponse.text();
          console.error(`[DripProcessor] Touch executor failed for ${enrollment.enrollment_id}:`, errorText);
          result.failed++;
          result.errors.push(`Touch executor failed for ${enrollment.enrollment_id}: ${errorText}`);
          continue;
        }

        const touchResult = await touchResponse.json();

        if (touchResult.success) {
          console.log(`[DripProcessor] Successfully processed ${enrollment.enrollment_id}`);
          result.processed++;
        } else {
          console.error(`[DripProcessor] Touch executor error for ${enrollment.enrollment_id}:`, touchResult.error);
          result.failed++;
          result.errors.push(`Touch error for ${enrollment.enrollment_id}: ${touchResult.error}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[DripProcessor] Error processing enrollment ${enrollment.enrollment_id}:`, error);
        result.failed++;
        result.errors.push(`Error processing ${enrollment.enrollment_id}: ${errorMessage}`);
      }
    }

    console.log(`[DripProcessor] Complete. Processed: ${result.processed}, Skipped: ${result.skipped}, Failed: ${result.failed}`);

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${result.processed} enrollments`,
          result
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('[DripProcessor] Fatal error:', error);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
