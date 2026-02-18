/**
 * Purchase Mail Credits Edge Function
 *
 * Stripe-based mail credits purchase.
 * Handles credit package purchases, creates transactions,
 * updates user wallet balance.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, handleCors, addCorsHeaders } from "../_shared/cors.ts";

// =============================================================================
// Types
// =============================================================================

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;            // Price in cents
  savings_percent?: number;
}

interface PurchaseRequest {
  package_id: string;
  payment_method_id?: string;  // For immediate charge
  create_checkout?: boolean;   // Create Stripe Checkout session instead
  success_url?: string;
  cancel_url?: string;
}

interface PurchaseResult {
  success: boolean;
  transaction_id?: string;
  new_balance?: number;
  checkout_url?: string;
  error?: string;
}

// Credit packages available for purchase
const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter_50',
    name: 'Starter Pack',
    credits: 50,
    price: 7500,  // $75
  },
  {
    id: 'standard_100',
    name: 'Standard Pack',
    credits: 100,
    price: 13900,  // $139
    savings_percent: 7,
  },
  {
    id: 'pro_250',
    name: 'Pro Pack',
    credits: 250,
    price: 32500,  // $325
    savings_percent: 13,
  },
  {
    id: 'business_500',
    name: 'Business Pack',
    credits: 500,
    price: 59900,  // $599
    savings_percent: 20,
  },
  {
    id: 'enterprise_1000',
    name: 'Enterprise Pack',
    credits: 1000,
    price: 109900,  // $1,099
    savings_percent: 27,
  },
];

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Handle GET request for packages list
  if (req.method === 'GET') {
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          packages: CREDIT_PACKAGES.map(pkg => ({
            ...pkg,
            price_formatted: `$${(pkg.price / 100).toFixed(2)}`,
            per_credit: `$${(pkg.price / 100 / pkg.credits).toFixed(2)}`
          }))
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
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
    const body: PurchaseRequest = await req.json();
    const {
      package_id,
      payment_method_id,
      create_checkout = true,
      success_url = 'doughy://mail-credits/success',
      cancel_url = 'doughy://mail-credits/cancel'
    } = body;

    if (!package_id) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'package_id is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Validate redirect URLs to prevent phishing attacks
    const ALLOWED_URL_PREFIXES = ['doughy://', 'https://app.doughy.ai', 'https://doughy.ai'];
    const isValidUrl = (url: string) => ALLOWED_URL_PREFIXES.some(prefix => url.startsWith(prefix));

    if (!isValidUrl(success_url)) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid success_url. Must use doughy:// or https://doughy.ai domain.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    if (!isValidUrl(cancel_url)) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid cancel_url. Must use doughy:// or https://doughy.ai domain.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Find package
    const selectedPackage = CREDIT_PACKAGES.find(p => p.id === package_id);
    if (!selectedPackage) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ success: false, error: 'Invalid package_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Get user profile for Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('user_id', userId)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!stripeCustomerId) {
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email || '',
          name: profile?.full_name || '',
          'metadata[user_id]': userId,
        }).toString(),
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create Stripe customer');
      }

      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;

      // Save customer ID to profile
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', userId);

      if (profileUpdateError) {
        console.error('[PurchaseCredits] Error saving Stripe customer ID to profile:', profileUpdateError);
        // Non-critical for payment, but log for tracking
      }
    }

    // Create Stripe Checkout session
    if (create_checkout) {
      const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer: stripeCustomerId,
          mode: 'payment',
          success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancel_url,
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `Mail Credits - ${selectedPackage.name}`,
          'line_items[0][price_data][product_data][description]': `${selectedPackage.credits} mail credits`,
          'line_items[0][price_data][unit_amount]': selectedPackage.price.toString(),
          'line_items[0][quantity]': '1',
          'metadata[user_id]': userId,
          'metadata[package_id]': package_id,
          'metadata[credits]': selectedPackage.credits.toString(),
          'payment_intent_data[metadata][user_id]': userId,
          'payment_intent_data[metadata][package_id]': package_id,
          'payment_intent_data[metadata][credits]': selectedPackage.credits.toString(),
        }).toString(),
      });

      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text();
        console.error('[PurchaseCredits] Stripe checkout error:', errorText);
        throw new Error('Failed to create checkout session');
      }

      const session = await checkoutResponse.json();

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: true,
            checkout_url: session.url,
            session_id: session.id
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    // Direct charge with payment method (for saved cards)
    if (payment_method_id) {
      const paymentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: selectedPackage.price.toString(),
          currency: 'usd',
          customer: stripeCustomerId,
          payment_method: payment_method_id,
          confirm: 'true',
          off_session: 'true',
          description: `Mail Credits - ${selectedPackage.name}`,
          'metadata[user_id]': userId,
          'metadata[package_id]': package_id,
          'metadata[credits]': selectedPackage.credits.toString(),
        }).toString(),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        console.error('[PurchaseCredits] Payment error:', errorData);
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              error: errorData.error?.message || 'Payment failed'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      const paymentIntent = await paymentResponse.json();

      if (paymentIntent.status !== 'succeeded') {
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              error: 'Payment requires additional action',
              requires_action: true,
              client_secret: paymentIntent.client_secret
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          req
        );
      }

      // Payment succeeded - add credits
      // Get or create credits record
      const { data: existingCredits } = await supabase
        .from('user_mail_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = existingCredits?.balance || 0;
      const newBalance = currentBalance + selectedPackage.credits;

      if (existingCredits) {
        const { error: updateError } = await supabase.rpc('add_mail_credits', {
          p_user_id: userId,
          p_amount: selectedPackage.credits,
          p_description: `Purchased ${selectedPackage.name}`
        });

        if (updateError) {
          console.error('[PurchaseCredits] Error adding credits:', updateError);
          throw new Error('Failed to add credits to account');
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_mail_credits')
          .insert({
            user_id: userId,
            balance: selectedPackage.credits,
            lifetime_purchased: selectedPackage.credits
          });

        if (insertError) {
          console.error('[PurchaseCredits] Error creating credits record:', insertError);
          throw new Error('Failed to create credits record');
        }
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('mail_credit_transactions')
        .insert({
          user_id: userId,
          type: 'purchase',
          amount: selectedPackage.credits,
          balance_after: newBalance,
          stripe_payment_id: paymentIntent.id,
          package_name: selectedPackage.name,
          package_price: selectedPackage.price / 100,
          description: `Purchased ${selectedPackage.name} (${selectedPackage.credits} credits)`
        })
        .select()
        .single();

      if (transactionError) {
        console.error('[PurchaseCredits] Error creating transaction record:', transactionError);
        // Credits were added, transaction record is for audit - log but continue
      }

      console.log(`[PurchaseCredits] Success: ${selectedPackage.credits} credits for user ${userId}`);

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: true,
            transaction_id: transaction?.id,
            new_balance: newBalance,
            credits_added: selectedPackage.credits
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        req
      );
    }

    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: 'Either create_checkout or payment_method_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );

  } catch (error) {
    console.error('[PurchaseCredits] Error:', error);
    // Sanitize error response - don't leak internal details
    return addCorsHeaders(
      new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      req
    );
  }
});
