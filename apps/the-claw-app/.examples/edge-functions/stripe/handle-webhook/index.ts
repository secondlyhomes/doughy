/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events with signature verification and idempotency
 *
 * This is an enhanced version specifically for the payments feature.
 * For the complete webhook handler, see: /.examples/edge-functions/webhooks/stripe.ts
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.17.0?target=deno'

Deno.serve(async (req) => {
  try {
    // Get Stripe API key and webhook secret from Vault
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEY')!
    )

    const [stripeKeyResult, webhookSecretResult] = await Promise.all([
      supabase
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('name', 'stripe_secret_key')
        .single(),
      supabase
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('name', 'stripe_webhook_secret')
        .single(),
    ])

    if (!stripeKeyResult.data || !webhookSecretResult.data) {
      console.error('Failed to retrieve Stripe credentials from Vault')
      return new Response('Configuration error', { status: 500 })
    }

    const stripeKey = stripeKeyResult.data.decrypted_secret
    const webhookSecret = webhookSecretResult.data.decrypted_secret

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing signature', { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Check for duplicate events (idempotency)
    const { data: existing } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .single()

    if (existing) {
      console.log('Duplicate event, skipping:', event.id)
      return new Response(JSON.stringify({ received: true, duplicate: true }))
    }

    // Log event
    await supabase.from('stripe_events').insert({
      event_id: event.id,
      type: event.type,
      data: event.data,
      processed: false,
      created_at: new Date().toISOString(),
    })

    // Process event
    console.log('Processing event:', event.type)
    await processStripeEvent(supabase, event)

    // Mark as processed
    await supabase
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

// Process different Stripe event types
async function processStripeEvent(
  supabase: ReturnType<typeof createClient>,
  event: Stripe.Event
) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(supabase, event.data.object as Stripe.Subscription)
      break

    case 'invoice.created':
      await handleInvoiceCreated(supabase, event.data.object as Stripe.Invoice)
      break

    case 'invoice.paid':
      await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice)
      break

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(supabase, event.data.object as Stripe.PaymentIntent)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(supabase, event.data.object as Stripe.PaymentIntent)
      break

    case 'payment_method.attached':
      await handlePaymentMethodAttached(supabase, event.data.object as Stripe.PaymentMethod)
      break

    case 'payment_method.detached':
      await handlePaymentMethodDetached(supabase, event.data.object as Stripe.PaymentMethod)
      break

    default:
      console.log('Unhandled event type:', event.type)
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id
  const customerId = session.customer as string

  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  // Update user's Stripe customer ID
  await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log('Checkout completed for user:', userId)
}

// Handle subscription created or updated
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  let userId = subscription.metadata?.user_id
  const customerId = subscription.customer as string

  if (!userId) {
    // Try to find user by customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.error('No user found for subscription:', subscription.id)
      return
    }
    userId = profile.id
  }

  // Get product and price IDs
  const item = subscription.items.data[0]
  const priceId = item.price.id
  const productId = typeof item.price.product === 'string'
    ? item.price.product
    : item.price.product.id

  // Upsert subscription
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      stripe_product_id: productId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'stripe_subscription_id',
    }
  )

  console.log('Subscription updated:', subscription.id, subscription.status)
}

// Handle subscription deleted
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  console.log('Subscription deleted:', subscription.id)
}

// Handle trial will end (3 days before)
async function handleTrialWillEnd(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  console.log('Trial ending soon for user:', userId)
  // TODO: Send notification to user
}

// Handle invoice created
async function handleInvoiceCreated(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string

  // Find user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  // Insert invoice record
  await supabase.from('invoices').upsert(
    {
      user_id: profile.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription as string | null,
      stripe_customer_id: customerId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: invoice.status || 'draft',
      invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      created_at: new Date(invoice.created * 1000).toISOString(),
    },
    {
      onConflict: 'stripe_invoice_id',
    }
  )

  console.log('Invoice created:', invoice.id)
}

// Handle invoice paid
async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string

  // Find user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id)

  // Record payment
  await supabase.from('payments').insert({
    user_id: profile.id,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: invoice.subscription as string | null,
    stripe_customer_id: customerId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'succeeded',
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    created_at: new Date().toISOString(),
  })

  console.log('Invoice paid:', invoice.id)
}

// Handle payment failed
async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string

  // Find user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      status: 'failed',
    })
    .eq('stripe_invoice_id', invoice.id)

  // Record failed payment
  await supabase.from('payments').insert({
    user_id: profile.id,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: invoice.subscription as string | null,
    stripe_customer_id: customerId,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
    error_message: invoice.last_finalization_error?.message || 'Payment failed',
    created_at: new Date().toISOString(),
  })

  console.log('Payment failed for user:', profile.id)
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const customerId = paymentIntent.customer as string
  if (!customerId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  await supabase.from('payments').insert({
    user_id: profile.id,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: customerId,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'succeeded',
    metadata: paymentIntent.metadata,
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })

  console.log('Payment intent succeeded:', paymentIntent.id)
}

// Handle payment intent failed
async function handlePaymentIntentFailed(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const customerId = paymentIntent.customer as string
  if (!customerId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  await supabase.from('payments').insert({
    user_id: profile.id,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: customerId,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'failed',
    error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
    created_at: new Date().toISOString(),
  })

  console.log('Payment intent failed:', paymentIntent.id)
}

// Handle payment method attached
async function handlePaymentMethodAttached(
  supabase: ReturnType<typeof createClient>,
  paymentMethod: Stripe.PaymentMethod
) {
  const customerId = paymentMethod.customer as string
  if (!customerId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  // Insert or update payment method
  await supabase.from('payment_methods').upsert(
    {
      user_id: profile.id,
      stripe_payment_method_id: paymentMethod.id,
      stripe_customer_id: customerId,
      type: paymentMethod.type,
      card_brand: paymentMethod.card?.brand || null,
      card_last4: paymentMethod.card?.last4 || null,
      card_exp_month: paymentMethod.card?.exp_month || null,
      card_exp_year: paymentMethod.card?.exp_year || null,
      is_default: false, // Will be updated if set as default
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'stripe_payment_method_id',
    }
  )

  console.log('Payment method attached:', paymentMethod.id)
}

// Handle payment method detached
async function handlePaymentMethodDetached(
  supabase: ReturnType<typeof createClient>,
  paymentMethod: Stripe.PaymentMethod
) {
  await supabase
    .from('payment_methods')
    .delete()
    .eq('stripe_payment_method_id', paymentMethod.id)

  console.log('Payment method detached:', paymentMethod.id)
}
