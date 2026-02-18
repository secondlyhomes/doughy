/**
 * Create Stripe Subscription
 *
 * Creates a subscription directly using Stripe API (for mobile payments)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.17.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { priceId, paymentMethodId, trialPeriodDays } = await req.json()

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Missing priceId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get Stripe API key from Vault
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEY')!
    )

    const { data: secretData, error: secretError } = await adminClient
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', 'stripe_secret_key')
      .single()

    if (secretError || !secretData) {
      console.error('Failed to retrieve Stripe key from Vault')
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(secretData.decrypted_secret, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get or create Stripe customer
    let customerId: string

    const { data: profile } = await adminClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await adminClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
    }

    // Create subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        user_id: user.id,
      },
      expand: ['latest_invoice.payment_intent'],
    }

    // Add trial period if specified
    if (trialPeriodDays) {
      subscriptionParams.trial_period_days = trialPeriodDays
    }

    // If no payment method and no trial, use payment_behavior to create invoice
    if (!paymentMethodId && !trialPeriodDays) {
      subscriptionParams.payment_behavior = 'default_incomplete'
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)

    // Insert subscription into database
    await adminClient.from('subscriptions').insert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      stripe_product_id:
        typeof subscription.items.data[0].price.product === 'string'
          ? subscription.items.data[0].price.product
          : subscription.items.data[0].price.product.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })

    // Get client secret for payment confirmation if needed
    let clientSecret: string | undefined
    let requiresAction = false

    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      const invoice = subscription.latest_invoice as Stripe.Invoice
      if (invoice.payment_intent && typeof invoice.payment_intent !== 'string') {
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
        clientSecret = paymentIntent.client_secret || undefined
        requiresAction = paymentIntent.status === 'requires_action'
      }
    }

    return new Response(
      JSON.stringify({
        subscription: {
          id: subscription.id,
          user_id: user.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          stripe_price_id: priceId,
          stripe_product_id:
            typeof subscription.items.data[0].price.product === 'string'
              ? subscription.items.data[0].price.product
              : subscription.items.data[0].price.product.id,
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start
            ? new Date(subscription.trial_start * 1000).toISOString()
            : null,
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        clientSecret,
        requiresAction,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Subscription creation error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
