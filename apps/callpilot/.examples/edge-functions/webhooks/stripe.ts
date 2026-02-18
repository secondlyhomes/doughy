/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events with:
 * - Signature verification
 * - Event processing
 * - Idempotency
 * - Error handling
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.17.0?target=deno';

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

Deno.serve(async (req) => {
  try {
    // Get Stripe API key and webhook secret from Vault
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    ]);

    if (!stripeKeyResult.data || !webhookSecretResult.data) {
      console.error('Failed to retrieve Stripe credentials from Vault');
      return new Response('Configuration error', { status: 500 });
    }

    const stripeKey = stripeKeyResult.data.decrypted_secret;
    const webhookSecret = webhookSecretResult.data.decrypted_secret;

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Check for duplicate events (idempotency)
    const { data: existing } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existing) {
      console.log('Duplicate event, skipping:', event.id);
      return new Response(JSON.stringify({ received: true, duplicate: true }));
    }

    // Log event
    await supabase.from('stripe_events').insert({
      event_id: event.id,
      type: event.type,
      data: event.data,
      processed: false,
      created_at: new Date().toISOString(),
    });

    // Process event
    console.log('Processing event:', event.type);
    await processStripeEvent(supabase, stripe, event);

    // Mark as processed
    await supabase
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// Process different Stripe event types
async function processStripeEvent(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  event: Stripe.Event
) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
      break;

    case 'customer.created':
    case 'customer.updated':
      await handleCustomerUpdated(supabase, event.data.object as Stripe.Customer);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  // Update user's Stripe customer ID
  await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log('Checkout completed for user:', userId);

  // Send notification
  await supabase.functions.invoke('notifications', {
    body: {
      userId,
      title: 'Subscription Activated',
      body: 'Your premium subscription is now active!',
      data: { screen: '/account' },
    },
  });
}

// Handle subscription updated
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }
  }

  // Get product and price IDs
  const item = subscription.items.data[0];
  const priceId = item.price.id;
  const productId = item.price.product as string;

  // Upsert subscription
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      stripe_product_id: productId,
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'stripe_subscription_id',
    }
  );

  console.log('Subscription updated:', subscription.id, subscription.status);
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
    .eq('stripe_subscription_id', subscription.id);

  console.log('Subscription deleted:', subscription.id);

  // Send notification
  const userId = subscription.metadata?.user_id;
  if (userId) {
    await supabase.functions.invoke('notifications', {
      body: {
        userId,
        title: 'Subscription Canceled',
        body: 'Your subscription has been canceled',
        data: { screen: '/account' },
      },
    });
  }
}

// Handle invoice paid
async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  if (!subscriptionId) return;

  // Record payment
  await supabase.from('payments').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    amount: invoice.amount_paid / 100, // Convert cents to dollars
    currency: invoice.currency,
    status: 'paid',
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    created_at: new Date().toISOString(),
  });

  console.log('Invoice paid:', invoice.id);
}

// Handle payment failed
async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  // Find user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Record failed payment
  await supabase.from('payments').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: invoice.subscription as string,
    stripe_customer_id: customerId,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
    created_at: new Date().toISOString(),
  });

  console.log('Payment failed for user:', profile.id);

  // Send notification
  await supabase.functions.invoke('notifications', {
    body: {
      userId: profile.id,
      title: 'Payment Failed',
      body: 'Your recent payment failed. Please update your payment method.',
      data: { screen: '/account/billing' },
    },
  });
}

// Handle customer updated
async function handleCustomerUpdated(
  supabase: ReturnType<typeof createClient>,
  customer: Stripe.Customer
) {
  await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customer.id,
      email: customer.email,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id);

  console.log('Customer updated:', customer.id);
}

// Map Stripe status to internal status
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    unpaid: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    trialing: 'trialing',
    paused: 'paused',
  };
  return statusMap[status] || status;
}
