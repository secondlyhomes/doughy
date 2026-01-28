// supabase/functions/import-leads/index.ts
// Handles lead imports with transaction support and property linking
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabasePublishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

// Types for import functionality
interface CanonicalRow {
  // Lead contact fields
  first_name?: string | null;
  last_name?: string | null;
  email_1?: string | null;
  email_2?: string | null;
  email_3?: string | null;
  email_4?: string | null;
  phone_1?: string | null;
  phone_2?: string | null;
  phone_3?: string | null;
  phone_4?: string | null;
  company?: string | null;

  // Lead address fields
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  county?: string | null;
  notes?: string | null;

  // Property-specific fields
  property_address_1?: string | null;
  property_address_2?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  property_zip?: string | null;
  property_county?: string | null;
  owner_occupied?: boolean | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  lot_size?: number | null;
  year_built?: number | null;
  purchase_price?: number | null;
  arv?: number | null;
  property_type?: string | null;
  property_notes?: string | null;

  [key: string]: any; // Allow for additional properties
}

interface ImportError {
  row_index: number;
  error: string;
}

interface ImportResult {
  inserted: number;
  failed: ImportError[];
}

// Use shared CORS headers instead of custom ones for consistency
// This ensures all headers sent by the client (including X-Request-ID) are properly allowed in CORS
// The shared headers in _shared/cors.ts already include all necessary headers for our application
const updatedCorsHeaders = {
  ...corsHeaders
};

// Helper function to create CORS headers with specific origin
const createCorsHeaders = (req: Request, additionalHeaders = {}) => {
  const origin = req.headers.get('Origin') || '*';
  console.log(`[CORS] Request from origin: ${origin}`);
  
  return {
    ...updatedCorsHeaders,
    'Access-Control-Allow-Origin': origin,
    ...additionalHeaders
  };
};

// Validation helpers
const hasContact = (r: any) => !!(
  r.email_1 || r.email_2 || r.email_3 || r.email_4 || // Any email field
  r.phone_1 || r.phone_2 || r.phone_3 || r.phone_4 || r.phone_5 // Any phone field
);
const hasName = (r: any) => !!(r.first_name || r.last_name); // Either first or last name is sufficient

// Check for either lead address data or property-specific address data
const hasPropertyData = (r: any) => {
  // First check if we have property-specific address data
  const hasPropertyAddress = !!(
    r.property_address_1 &&
    r.property_city &&
    r.property_state &&
    r.property_zip
  );

  // If we have specific property address data, use that
  if (hasPropertyAddress) return true;

  // Otherwise fall back to checking if lead address data can be used for property
  return !!(r.address_line_1 && r.city && r.state && r.zip);
};

serve(async (req) => {
  // Handle CORS preflight requests with origin-specific response
  if (req.method === "OPTIONS") {
    // Use our helper to create CORS headers
    const preflightHeaders = createCorsHeaders(req);
    console.log(`[CORS] Preflight response headers:`, JSON.stringify(preflightHeaders));
    
    return new Response(null, {
      headers: preflightHeaders,
      status: 204,
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    // Use our helper to create CORS headers
    const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
    
    return new Response(
      JSON.stringify({ error: "Only POST requests are accepted" }),
      {
        status: 405,
        headers: responseHeaders,
      }
    );
  }

  try {
    // 1. Initialize Supabase client with both anon key and Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Use our helper to create CORS headers
      const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
      
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          message: "No authorization header provided",
        }),
        {
          status: 401,
          headers: responseHeaders,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 2. Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      
      // Use our helper to create CORS headers
      const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
      
      return new Response(
        JSON.stringify({
          error: "Invalid authentication",
          message: authError?.message || "Authentication failed",
        }),
        {
          status: 401,
          headers: responseHeaders,
        }
      );
    }

    // 3. Get workspace_id from user metadata
    const workspaceId = user.user_metadata?.workspace_id;
    if (!workspaceId) {
      // Use our helper to create CORS headers
      const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
      
      return new Response(
        JSON.stringify({
          error: "Invalid workspace",
          message: "Workspace ID not found in user metadata",
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // 4. Guards - check request size and rows length
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 6_000_000) {
      // Use our helper to create CORS headers
      const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
      
      return new Response(
        JSON.stringify({
          error: "Request too large",
          message: "The request payload exceeds the 6MB limit",
        }),
        {
          status: 413,
          headers: responseHeaders,
        }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const rows = requestData.rows || [];
    const importId = requestData.import_id || crypto.randomUUID();

    if (!Array.isArray(rows) || rows.length === 0) {
      // Use our helper to create CORS headers
      const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
      
      return new Response(
        JSON.stringify({
          error: "No data to import",
          message: "Request contained no valid lead data",
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    if (rows.length > 10_000) {
      // Use our helper to create CORS headers
      const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
      
      return new Response(
        JSON.stringify({
          error: "Too many rows",
          message: "Maximum 10,000 rows per import",
        }),
        {
          status: 413,
          headers: responseHeaders,
        }
      );
    }

    // 5. Skip transaction entirely since your database is having issues with transactions
    // This makes the imports work directly without relying on the client-side fallback
    let useTransactions = false;
    console.log("Skipping transaction support - processing imports directly");

    let inserted = 0;
    const failed: ImportError[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      
      // Create savepoint for this row (only if transactions are enabled)
      if (useTransactions) {
        try {
          const { error: savePointError } = await supabase.rpc("create_savepoint", { 
            name: `sp_${i}` 
          });
          
          if (savePointError) {
            console.error(`Savepoint error for row ${i}:`, savePointError);
            // Continue without savepoint - still try to process the row
          }
        } catch (savePointError) {
          console.error(`Savepoint creation error for row ${i}:`, savePointError);
          // Continue without savepoint
        }
      }

      // Skip invalid rows (missing name or contact)
      if (!hasName(r) || !hasContact(r)) {
        // Roll back to savepoint if transactions are enabled
        if (useTransactions) {
          try {
            await supabase.rpc("rollback_to_savepoint", { name: `sp_${i}` });
          } catch (rollbackError) {
            console.error(`Rollback error for row ${i}:`, rollbackError);
          }
        }
        
        // Provide more specific error message
        let errorMessage = "Missing required information: ";
        if (!hasName(r)) {
          errorMessage += "need either first name or last name";
        }
        if (!hasContact(r)) {
          errorMessage += (!hasName(r) ? " AND " : "") + "need either email or phone";
        }
        
        failed.push({
          row_index: i,
          error: errorMessage,
        });
        continue;
      }

      // Get the raw email and phone values
      const rawEmails = [r.email_1, r.email_2, r.email_3, r.email_4].filter(Boolean);
      const rawPhones = [r.phone_1, r.phone_2, r.phone_3, r.phone_4].filter(Boolean);
      
      // Extract primary email and phone
      const primaryEmail = rawEmails.length > 0 ? rawEmails[0] : null;
      const primaryPhone = rawPhones.length > 0 ? rawPhones[0] : null;
      
      // Format emails and phones as ContactMethod objects to match UI expectations
      const emails = rawEmails.map((email, idx) => ({
        value: email,
        type: 'imported', // Default type
        isPrimary: idx === 0 // First one is primary
      }));
      
      const phones = rawPhones.map((phone, idx) => ({
        value: phone,
        type: 'imported', // Default type
        isPrimary: idx === 0 // First one is primary
      }));
      
      // Log for debugging
      console.log(`Processing lead #${i}: ${r.first_name} ${r.last_name}`);
      console.log(`  Emails: ${JSON.stringify(emails)} (primary: ${primaryEmail})`);
      console.log(`  Phones: ${JSON.stringify(phones)} (primary: ${primaryPhone})`);

      try {
        // Combine first_name and last_name for the name field
        const fullName = [r.first_name, r.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
        
        // Insert lead - minimal fields only
        // Explicitly set all status fields to 'new' instead of relying on database defaults
        const { data: lead, error: leadError } = await supabase
          .from("crm_leads")
          .insert({
            name: fullName || null,
            
            // Arrays for all emails and phones
            emails,                    // Full array of emails
            phones,                    // Full array of phones
            
            // Primary contact for quick access (these are the fields shown in the UI)
            email: primaryEmail,       // Primary email 
            phone: primaryPhone,       // Primary phone
            
            company: r.company ?? null,
            workspace_id: workspaceId,
            import_id: importId,
            
            // Explicitly set all status fields to 'new'
            status: 'new',
            email_opt_status: 'new',
            phone_opt_status: 'new',
            text_opt_status: 'new'
          })
          .select("id")
          .single();

        if (leadError) {
          throw new Error(`Lead insert error: ${leadError.message}`);
        }
        
        // Log the successfully inserted lead data for debugging
        console.log(`Successfully inserted lead with ID: ${lead.id}`);
        console.log(`  Name: ${fullName}`);
        console.log(`  Email array: ${JSON.stringify(emails)}`);
        console.log(`  Phone array: ${JSON.stringify(phones)}`);
        console.log(`  Primary email: ${primaryEmail}`);
        console.log(`  Primary phone: ${primaryPhone}`);
        console.log(`  Status: new (explicitly set)`);
        console.log(`  Email opt status: new (explicitly set)`);
        console.log(`  Phone opt status: new (explicitly set)`);
        console.log(`  Text opt status: new (explicitly set)`);

        // If property data exists, insert property and link to lead
        if (hasPropertyData(r)) {
          // Determine which address fields to use based on availability
          const hasPropertySpecificAddress = !!(r.property_address_1 && r.property_city && r.property_state && r.property_zip);

          // Prepare property data
          const propertyData = {
            // Use property-specific address if available, otherwise fall back to lead address
            address_line_1: hasPropertySpecificAddress ? r.property_address_1 : r.address_line_1,
            address_line_2: hasPropertySpecificAddress ? r.property_address_2 ?? null : r.address_line_2 ?? null,
            city: hasPropertySpecificAddress ? r.property_city : r.city,
            state: hasPropertySpecificAddress ? r.property_state : r.state,
            zip: hasPropertySpecificAddress ? r.property_zip : r.zip,
            county: hasPropertySpecificAddress ? r.property_county ?? null : r.county ?? null,

            // Property details
            owner_occupied: r.owner_occupied ?? null,
            bedrooms: r.bedrooms ?? null,
            bathrooms: r.bathrooms ?? null,
            square_feet: r.square_feet ?? null,
            lot_size: r.lot_size ?? null,
            year_built: r.year_built ?? null,
            purchase_price: r.purchase_price ?? null,
            arv: r.arv ?? null,
            property_type: r.property_type ?? null,
            property_notes: r.property_notes ?? null,

            // Metadata
            workspace_id: workspaceId,
            import_id: importId,
          };

          const { data: prop, error: propError } = await supabase
            .from("re_properties")
            .insert(propertyData)
            .select("id")
            .single();

          if (propError) {
            throw new Error(`Property insert error: ${propError.message}`);
          }

          // Link property to lead
          const { error: linkError } = await supabase
            .from("re_lead_properties")
            .insert({
              lead_id: lead.id,
              property_id: prop.id,
              relationship: "owner",
              is_primary: true,
              workspace_id: workspaceId,
            });

          if (linkError) {
            throw new Error(`Property link error: ${linkError.message}`);
          }
        }

        // Release savepoint and increment counter
        if (useTransactions) {
          try {
            await supabase.rpc("release_savepoint", { name: `sp_${i}` });
          } catch (releaseError) {
            console.error(`Release savepoint error for row ${i}:`, releaseError);
          }
        }
        inserted++;
      } catch (e) {
        // Rollback to savepoint on error (if transactions are enabled)
        if (useTransactions) {
          try {
            await supabase.rpc("rollback_to_savepoint", { name: `sp_${i}` });
          } catch (rollbackError) {
            console.error(`Rollback error for row ${i}:`, rollbackError);
          }
        }
        
        // Record the failure
        failed.push({
          row_index: i,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Skip transaction commit since transactions are disabled
    // This allows direct database operations to succeed
    console.log(`Import completed: ${inserted} leads inserted, ${failed.length} failed`);

    // 6. Broadcast completion event
    try {
      const channel = supabase.channel(`imports:${workspaceId}`);
      await channel.subscribe();
      
      await channel.send({
        type: "broadcast",
        event: "import_completed",
        payload: {
          import_id: importId,
          timestamp: new Date().toISOString(),
          inserted,
          failed: failed.length
        }
      });
      
      console.log("Import completion notification sent");
    } catch (notifyError) {
      console.error("Failed to send import notification:", notifyError);
      // Don't fail the import if notification fails
    }

    // 7. Return result
    // Use our helper to create CORS headers
    const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
    
    return new Response(
      JSON.stringify({ inserted, failed }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    
    // Use our helper to create CORS headers even in error cases
    const responseHeaders = createCorsHeaders(req, { "Content-Type": "application/json" });
    
    return new Response(
      JSON.stringify({
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
        inserted: 0,
        failed: [],
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
});