// src/supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.18.0';

// Define Stripe subscription interface
interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  cancellation_details?: {
    reason?: string;
  };
  canceled_at?: number;
  items: {
    data: Array<{
      price: {
        product: string;
      };
    }>;
  };
}

// Define Stripe invoice interface
interface StripeInvoice {
  id: string;
  customer: string;
  subscription: string;
  status: string;
  attempt_count?: number;
  next_payment_attempt?: number;
  amount_paid: number;
  currency: string;
  billing_reason: string;
}

// Define Stripe checkout session interface
interface StripeCheckoutSession {
  id: string;
  customer: string;
  subscription: string;
  client_reference_id?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
}

// Utility logger
const logger = {
  debug: (message: string, data?: unknown) => {
    console.debug(`[STRIPE-WEBHOOK] ${message}`, data || '');
  },
  info: (message: string, data?: unknown) => {
    console.info(`[STRIPE-WEBHOOK] ${message}`, data || '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[STRIPE-WEBHOOK] ${message}`, data || '');
  },
  error: (message: string, data?: unknown) => {
    console.error(`[STRIPE-WEBHOOK] ${message}`, data || '');
  }
};

/**
 * Retrieves the Stripe webhook secret from the database
 */
async function getStripeWebhookSecret(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('key_value')
      .eq('service', 'stripe_webhook')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching Stripe webhook secret:', error);
      throw new Error('Failed to retrieve Stripe webhook secret');
    }

    if (!data || !data.key_value) {
      throw new Error('Stripe webhook secret not found in the database');
    }

    return data.key_value;
  } catch (error: unknown) {
    logger.error('Exception retrieving Stripe webhook secret:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Retrieves the Stripe API key from the database
 */
async function getStripeApiKey(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('key_value')
      .eq('service', 'stripe')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching Stripe API key:', error);
      throw new Error('Failed to retrieve Stripe API key');
    }

    if (!data || !data.key_value) {
      throw new Error('Stripe API key not found in the database');
    }

    return data.key_value;
  } catch (error: unknown) {
    logger.error('Exception retrieving Stripe API key:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Log subscription event to the database
 */
async function logSubscriptionEvent(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  eventType: string,
  eventData: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      'log_subscription_event',
      {
        p_user_id: userId,
        p_subscription_id: subscriptionId,
        p_event_type: eventType,
        p_event_data: eventData
      }
    );

    if (error) {
      logger.error('Error logging subscription event:', error);
    }
  } catch (error: unknown) {
    logger.error('Exception logging subscription event:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Create a notification for the user
 */
async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false
      });

    if (error) {
      logger.error('Error creating notification:', error);
    }
  } catch (error: unknown) {
    logger.error('Exception creating notification:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Helper function to update subscription record and create notifications
 */
async function updateSubscriptionRecord(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  planId: string,
  subscription: StripeSubscription
): Promise<void> {
  try {
    // Update user_subscription record
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        plan_id: planId,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionId);
      
    if (updateError) {
      logger.error('Error updating subscription record:', updateError);
      throw updateError;
    }
    
    // Log the event
    await logSubscriptionEvent(
      supabase,
      userId,
      subscriptionId,
      'subscription_updated',
      {
        plan_id: planId,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      }
    );
    
    // Create notification if necessary
    if (subscription.cancel_at_period_end) {
      // Subscription has been set to cancel
      await createNotification(
        supabase,
        userId,
        'subscription',
        'Subscription Cancellation',
        'Your subscription has been canceled. You will continue to have access until the end of your billing period.',
        {
          subscription_id: subscriptionId,
          end_date: new Date(subscription.current_period_end * 1000).toISOString()
        }
      );
    } else if (subscription.status === 'past_due') {
      // Payment is past due
      await createNotification(
        supabase,
        userId,
        'subscription',
        'Payment Failed',
        'We were unable to process your latest payment. Please update your payment method to continue your subscription.',
        {
          subscription_id: subscriptionId
        }
      );
    }
    
    logger.info('Successfully updated subscription record:', {
      user_id: userId,
      subscription_id: subscriptionId,
      status: subscription.status
    });
  } catch (error: unknown) {
    logger.error('Error in updateSubscriptionRecord:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: StripeCheckoutSession
): Promise<void> {
  // Get customer and subscription details
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  
  if (!customerId || !subscriptionId) {
    logger.warn('Missing customer or subscription ID in checkout session:', session.id);
    return;
  }
  
  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Try to find user associated with this customer
    let userId = session.client_reference_id;
    
    // If no client_reference_id, try to find user from customer
    if (!userId) {
      const { data: customerData } = await supabase
        .from('billing_stripe_customers')
        .select('user_id')
        .eq('customer_id', customerId)
        .single();
        
      if (customerData) {
        userId = customerData.user_id;
      }
    }
    
    if (!userId) {
      logger.warn('Could not find user for customer:', customerId);
      return;
    }
    
    // Get plan ID from the subscription
    const planId = subscription.items.data[0]?.price.product as string;
    
    // Create or update user_subscription record
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        subscription_id: subscriptionId,
        status: subscription.status,
        payment_status: 'paid',
        plan_id: planId,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      });
      
    if (upsertError) {
      logger.error('Error upserting subscription record:', upsertError);
    }
    
    // Create customer record if it doesn't exist
    const { error: customerError } = await supabase
      .from('billing_stripe_customers')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        subscription_id: subscriptionId,
        last_updated: new Date().toISOString()
      });
      
    if (customerError) {
      logger.error('Error upserting customer record:', customerError);
    }
    
    // Log the event
    await logSubscriptionEvent(
      supabase,
      userId,
      subscriptionId,
      'subscription_created',
      {
        checkout_session_id: session.id,
        plan_id: planId,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      }
    );
    
    // Create notification
    await createNotification(
      supabase,
      userId,
      'subscription',
      'Subscription Activated',
      'Your subscription has been activated successfully. Thank you for subscribing!',
      {
        subscription_id: subscriptionId,
        plan_id: planId,
        status: subscription.status
      }
    );
    
    logger.info('Successfully processed checkout.session.completed:', {
      user_id: userId,
      customer_id: customerId,
      subscription_id: subscriptionId
    });
  } catch (error: unknown) {
    logger.error('Error processing checkout.session.completed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(
  supabase: SupabaseClient,
  stripe: Stripe,
  subscription: StripeSubscription
): Promise<void> {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer;
  
  if (!customerId || !subscriptionId) {
    logger.warn('Missing customer or subscription ID:', subscription.id);
    return;
  }
  
  try {
    // Find user associated with this subscription
    const { data: subscriptionUserData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('subscription_id', subscriptionId)
      .single();
      
    if (userError || !subscriptionUserData) {
      // Try finding by customer ID
      const { data: customerData, error: customerError } = await supabase
        .from('billing_stripe_customers')
        .select('user_id')
        .eq('customer_id', customerId)
        .single();
        
      if (customerError || !customerData) {
        logger.warn('Could not find user for subscription:', subscriptionId);
        return;
      }
      
      // Use the customer data if subscription data not found
      const userId = customerData.user_id;
      if (!userId) {
        logger.warn('No user ID found in customer data for:', customerId);
        return;
      }
      
      // Get plan ID from the subscription
      const planId = subscription.items.data[0]?.price.product as string;
      
      // Process the update with customer data
      await updateSubscriptionRecord(supabase, userId, subscriptionId, planId, subscription);
      return;
    }
    
    // If we get here, we found the user in the subscription data
    const userId = subscriptionUserData.user_id;
    
    // Get plan ID from the subscription
    const planId = subscription.items.data[0]?.price.product as string;
    
    // Update the subscription record
    await updateSubscriptionRecord(supabase, userId, subscriptionId, planId, subscription);
  } catch (error: unknown) {
    logger.error('Error processing customer.subscription.updated:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  subscription: StripeSubscription
): Promise<void> {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer;
  
  if (!customerId || !subscriptionId) {
    logger.warn('Missing customer or subscription ID:', subscription.id);
    return;
  }
  
  try {
    // Find user associated with this subscription
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('subscription_id', subscriptionId)
      .single();
      
    if (userError || !userData) {
      logger.warn('Could not find user for subscription:', subscriptionId);
      return;
    }
    
    const userId = userData.user_id;
    
    // Update user_subscription record
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionId);
      
    if (updateError) {
      logger.error('Error updating subscription record:', updateError);
    }
    
    // Log the event
    await logSubscriptionEvent(
      supabase,
      userId,
      subscriptionId,
      'subscription_deleted',
      {
        status: subscription.status,
        cancel_reason: subscription.cancellation_details?.reason,
        canceled_at: subscription.canceled_at
      }
    );
    
    // Create notification
    await createNotification(
      supabase,
      userId,
      'subscription',
      'Subscription Ended',
      'Your subscription has ended. Resubscribe to regain access to premium features.',
      {
        subscription_id: subscriptionId
      }
    );
    
    logger.info('Successfully processed customer.subscription.deleted:', {
      user_id: userId,
      subscription_id: subscriptionId
    });
  } catch (error: unknown) {
    logger.error('Error processing customer.subscription.deleted:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(
  supabase: SupabaseClient,
  stripe: Stripe,
  invoice: StripeInvoice
): Promise<void> {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  if (!customerId || !subscriptionId) {
    logger.warn('Missing customer or subscription ID in invoice:', invoice.id);
    return;
  }
  
  try {
    // Find user associated with this subscription
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('subscription_id', subscriptionId)
      .single();
      
    if (userError || !userData) {
      logger.warn('Could not find user for subscription:', subscriptionId);
      return;
    }
    
    const userId = userData.user_id;
    
    // Update user_subscription record
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionId);
      
    if (updateError) {
      logger.error('Error updating subscription record:', updateError);
    }
    
    // Log the event
    await logSubscriptionEvent(
      supabase,
      userId,
      subscriptionId,
      'payment_failed',
      {
        invoice_id: invoice.id,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt
      }
    );
    
    // Create notification
    await createNotification(
      supabase,
      userId,
      'subscription',
      'Payment Failed',
      'We were unable to process your payment. Please update your payment method to avoid losing access to premium features.',
      {
        subscription_id: subscriptionId,
        attempt_count: invoice.attempt_count,
        next_attempt: invoice.next_payment_attempt 
          ? new Date(invoice.next_payment_attempt * 1000).toISOString() 
          : null
      }
    );
    
    logger.info('Successfully processed invoice.payment_failed:', {
      user_id: userId,
      subscription_id: subscriptionId,
      invoice_id: invoice.id
    });
  } catch (error: unknown) {
    logger.error('Error processing invoice.payment_failed:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(
  supabase: SupabaseClient,
  stripe: Stripe,
  invoice: StripeInvoice
): Promise<void> {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  if (!customerId || !subscriptionId) {
    logger.warn('Missing customer or subscription ID in invoice:', invoice.id);
    return;
  }
  
  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Find user associated with this subscription
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id, payment_status')
      .eq('subscription_id', subscriptionId)
      .single();
      
    if (userError || !userData) {
      logger.warn('Could not find user for subscription:', subscriptionId);
      return;
    }
    
    const userId = userData.user_id;
    const previousPaymentStatus = userData.payment_status;
    
    // Update user_subscription record
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        payment_status: 'paid',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionId);
      
    if (updateError) {
      logger.error('Error updating subscription record:', updateError);
    }
    
    // Log the event
    await logSubscriptionEvent(
      supabase,
      userId,
      subscriptionId,
      'payment_succeeded',
      {
        invoice_id: invoice.id,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        billing_reason: invoice.billing_reason
      }
    );
    
    // Create notification if recovering from a failed payment
    if (previousPaymentStatus === 'failed') {
      await createNotification(
        supabase,
        userId,
        'subscription',
        'Payment Successful',
        'Your payment has been successfully processed. Your subscription is now active.',
        {
          subscription_id: subscriptionId
        }
      );
    }
    
    logger.info('Successfully processed invoice.payment_succeeded:', {
      user_id: userId,
      subscription_id: subscriptionId,
      invoice_id: invoice.id
    });
  } catch (error: unknown) {
    logger.error('Error processing invoice.payment_succeeded:', error instanceof Error ? error.message : String(error));
  }
}

// Define Request handler context interface
interface WebhookContext {
  subscription?: Record<string, unknown>;
  [key: string]: unknown;
}

// Serve HTTP requests
serve(async (req: Request) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers
    });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing required environment variables:', {
        SUPABASE_URL: supabaseUrl ? 'set' : 'MISSING',
        SUPABASE_SECRET_KEY: supabaseKey ? 'set' : 'MISSING',
      });
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing Supabase credentials'
      }), {
        status: 500,
        headers
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Stripe API key and webhook secret
    const stripeApiKey = await getStripeApiKey(supabase);
    const webhookSecret = await getStripeWebhookSecret(supabase);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeApiKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetch()
    });
    
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      logger.error('Missing Stripe signature');
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing Stripe signature'
      }), {
        status: 400,
        headers
      });
    }
    
    // Get the raw request body
    const rawBody = await req.text();
    
    // Construct the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Webhook signature verification failed: ${errorMessage}`);
      return new Response(JSON.stringify({
        status: 'error',
        message: `Webhook signature verification failed: ${errorMessage}`
      }), {
        status: 400,
        headers
      });
    }
    
    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(supabase, stripe, event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(supabase, stripe, event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(supabase, stripe, event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await handlePaymentFailed(supabase, stripe, event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(supabase, stripe, event.data.object);
          break;
          
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error: unknown) {
      logger.error(`Error handling event type ${event.type}:`, error instanceof Error ? error.message : String(error));
      // Still return 200 to Stripe to avoid retries
    }
    
    // Return success
    return new Response(JSON.stringify({
      status: 'success',
      received: true,
      type: event.type
    }), {
      status: 200,
      headers
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Unhandled error in stripe-webhook function:', errorMessage);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Internal server error',
      error: errorMessage
    }), {
      status: 500,
      headers
    });
  }
});