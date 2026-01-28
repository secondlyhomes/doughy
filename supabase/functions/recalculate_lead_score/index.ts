
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    const customCorsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      headers: {
        ...customCorsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }


  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
    )

    const { leadId } = await req.json()

    // Complex lead scoring logic 
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError) throw leadError

    // Example scoring logic - customize as needed
    let score = 0
    
    // Email engagement score
    if (lead.email) score += 10
    
    // Company size score
    if (lead.company_size) score += 15
    
    // Activity score - based on lead notes count
    const { data: notes } = await supabase
      .from('crm_lead_notes')
      .select('id')
      .eq('lead_id', leadId)

    score += (notes?.length ?? 0) * 5

    // Update lead score
    const { error: updateError } = await supabase
      .from('crm_leads')
      .update({ score: Math.min(score, 100) })
      .eq('id', leadId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: Math.min(score, 100),
        reason: 'Email engagement' 
      }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
