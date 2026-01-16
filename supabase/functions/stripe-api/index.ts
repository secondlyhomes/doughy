// src/supabase/functions/stripe-api/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.18.0';
import { decryptServer } from "../_shared/crypto-server.ts";

// ================ CORS HANDLING ================
// Define allowed origins for more restrictive environments
const allowedOrigins = [
  // Production domains
  'https://app.doughy.app',
  'https://api.doughy.app',
  'https://doughy.app',

  // Development/staging environments
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',

  // Specific local development IPs
  'http://192.168.1.184:8081',
  'http://192.168.1.184:8080',
];

// Dynamically add IP ranges for common development networks
for (let i = 0; i < 256; i++) {
  allowedOrigins.push(`http://192.168.1.${i}:8080`);
  allowedOrigins.push(`http://192.168.1.${i}:8081`);
  allowedOrigins.push(`http://192.168.0.${i}:8080`);
  allowedOrigins.push(`http://192.168.0.${i}:8081`);
}

/**
 * Get CORS headers based on the origin of the request
 *
 * @param requestOrigin - The Origin header from the request
 * @returns Object with appropriate CORS headers
 */
const getCorsHeaders = (requestOrigin?: string): Record<string, string> => {
  // ENVIRONMENT-BASED MODE - Check actual environment instead of hardcoding
  const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';

  // If in development mode and there's a request origin, use that origin
  if (isDevelopment && requestOrigin) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, baggage, sentry-trace, x-request-id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Production behavior - check allowed origins
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, baggage, sentry-trace, x-request-id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // For local development IPs not explicitly listed, check if they match pattern
  if (requestOrigin && requestOrigin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, baggage, sentry-trace, x-request-id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Default fallback if no specific match
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, baggage, sentry-trace, x-request-id',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
};

// ================ LOGGER UTILITY ================
const logger = {
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data || '');
  },

  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '');
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || '');
  }
};

/**
 * Retrieves the Stripe API key from the database
 */
async function getStripeApiKey(supabase: any): Promise<string> {
  try {
    // Query the api_keys table for the Stripe key using the correct column name
    // Try both 'stripe' and 'stripe-key' and 'stripe-secret' for backward compatibility
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('key_ciphertext')
      .or('service.eq.stripe,service.eq.stripe-key,service.eq.stripe-secret')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching Stripe API key:', error);
      throw new Error('Failed to retrieve Stripe API key');
    }

    if (!data?.key_ciphertext) {
      throw new Error('Stripe API key not found in the database');
    }

    // Decrypt the API key
    try {
      const decryptedKey = await decryptServer(data.key_ciphertext);
      return decryptedKey;
    } catch (decryptError) {
      logger.error('Error decrypting Stripe API key:', decryptError);
      throw new Error('Failed to decrypt Stripe API key');
    }
  } catch (error) {
    logger.error('Exception retrieving Stripe API key:', error);
    throw error;
  }
}

/**
 * Initialize Stripe client with the API key from database
 */
async function initializeStripe(supabase: any): Promise<Stripe> {
  const apiKey = await getStripeApiKey(supabase);
  return new Stripe(apiKey, {
    apiVersion: '2023-10-16', // Use latest stable API version
    // Set Deno compatibility
    httpClient: Stripe.createFetch()
  });
}

// Create handler for Supabase Edge Function
serve(async (req) => {
  // Get request origin
  const origin = req.headers.get('origin');

  // Get appropriate CORS headers based on the request origin
  const corsHeaders = getCorsHeaders(origin || undefined);

  // Add Content-Type header
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers,
      status: 204
    });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Server configuration error',
      }), {
        status: 500,
        headers
      });
    }

    // Parse request data
    const requestData = await req.json();
    const { action, ...params } = requestData;

    // Validate the request
    if (!action) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required action parameter',
      }), {
        status: 400,
        headers
      });
    }

    // For webhook handler, we use Stripe signature validation (done below)
    // For all other actions, validate JWT authentication
    let authenticatedUserId: string | null = null;
    if (action !== 'handleWebhook') {
      const authHeader = req.headers.get('Authorization');

      if (!authHeader) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Unauthorized',
        }), {
          status: 401,
          headers
        });
      }

      // Validate JWT using Supabase client with anon key
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        logger.error('JWT validation failed:', authError);
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Unauthorized',
        }), {
          status: 401,
          headers
        });
      }

      authenticatedUserId = user.id;
      logger.info('Authenticated user:', user.id);
    }

    // Initialize Stripe with API key from database (use service role key)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = await initializeStripe(supabase);

    // Process different Stripe actions
    switch (action) {
      case 'createCheckoutSession':
        // Create a checkout session for subscription
        try {
          const { priceId, customerId, successUrl, cancelUrl, options } = params;
          
          if (!priceId) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required priceId parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          if (!successUrl || !cancelUrl) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required success or cancel URL parameters',
            }), {
              status: 400,
              headers
            });
          }
          
          const sessionParams: any = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
          };
          
          // Add customer ID if provided
          if (customerId) {
            sessionParams.customer = customerId;
          }
          
          // Add optional parameters if provided
          if (options) {
            // Add billing address collection
            if (options.billing_address_collection) {
              sessionParams.billing_address_collection = options.billing_address_collection;
            }
            
            // Add shipping address collection
            if (options.collect_shipping_address) {
              sessionParams.shipping_address_collection = {
                allowed_countries: ['US', 'CA', 'MX', 'GB', 'AU'],
              };
            }
            
            // Add promotion code support
            if (options.allow_promotion_codes) {
              sessionParams.allow_promotion_codes = true;
            }
            
            // Use trial from plan if requested
            if (options.trial_from_plan) {
              sessionParams.subscription_data = {
                ...(sessionParams.subscription_data || {}),
                trial_from_plan: true,
              };
            }
            
            // Add metadata if provided
            if (options.metadata) {
              sessionParams.metadata = options.metadata;
            }
          }
          
          const session = await stripe.checkout.sessions.create(sessionParams);
          
          return new Response(JSON.stringify({
            status: 'success',
            sessionId: session.id,
            url: session.url
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error creating checkout session:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to create checkout session',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      case 'createCustomer':
        // Create a new Stripe customer
        try {
          const { email, name, metadata } = params;
          
          if (!email) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required email parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          const customer = await stripe.customers.create({
            email,
            name: name || undefined,
            metadata: metadata || undefined
          });
          
          return new Response(JSON.stringify({
            status: 'success',
            customerId: customer.id,
            customer
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error creating customer:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to create customer',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      case 'getSubscription':
        // Get subscription details
        try {
          const { subscriptionId } = params;
          
          if (!subscriptionId) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required subscriptionId parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          return new Response(JSON.stringify({
            status: 'success',
            subscription
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error retrieving subscription:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to retrieve subscription',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      case 'cancelSubscription':
        // Cancel a subscription
        try {
          const { subscriptionId } = params;
          
          if (!subscriptionId) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required subscriptionId parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
          
          return new Response(JSON.stringify({
            status: 'success',
            subscription: canceledSubscription
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error canceling subscription:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to cancel subscription',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      case 'listProducts':
        // List available products with prices
        try {
          const products = await stripe.products.list({
            active: true,
            expand: ['data.default_price']
          });
          
          return new Response(JSON.stringify({
            status: 'success',
            products: products.data
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error listing products:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to list products',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      case 'createPortalSession':
        // Create a billing portal session for customer self-service
        try {
          const { customerId, returnUrl } = params;
          
          if (!customerId) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required customerId parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          if (!returnUrl) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required returnUrl parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
          });
          
          return new Response(JSON.stringify({
            status: 'success',
            url: portalSession.url
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error creating portal session:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to create portal session',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      case 'getCheckoutSession':
        // Get details about a completed checkout session
        try {
          const { sessionId } = params;
          
          if (!sessionId) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing required sessionId parameter',
            }), {
              status: 400,
              headers
            });
          }
          
          const session = await stripe.checkout.sessions.retrieve(
            sessionId,
            { expand: ['customer', 'subscription'] }
          );
          
          return new Response(JSON.stringify({
            status: 'success',
            session
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error retrieving checkout session:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to retrieve checkout session',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }

      case 'handleWebhook':
        // Process Stripe webhook events
        try {
          const signature = req.headers.get('stripe-signature');
          
          if (!signature) {
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Missing Stripe signature header',
            }), {
              status: 400,
              headers
            });
          }
          
          // Get the raw body for signature verification
          const rawBody = await req.text();
          
          // Get webhook secret from database
          const { data: webhookData, error: webhookError } = await supabase
            .from('security_api_keys')
            .select('key_ciphertext')
            .or('service.eq.stripe_webhook,service.eq.stripe-webhook')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (webhookError || !webhookData?.key_ciphertext) {
            logger.error('Error retrieving webhook secret:', webhookError);
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Failed to retrieve webhook secret',
            }), {
              status: 500,
              headers
            });
          }
          
          // Decrypt the webhook secret
          let webhookSecret;
          try {
            webhookSecret = await decryptServer(webhookData.key_ciphertext);
          } catch (decryptError) {
            logger.error('Error decrypting webhook secret:', decryptError);
            return new Response(JSON.stringify({
              status: 'error',
              message: 'Failed to decrypt webhook secret',
            }), {
              status: 500,
              headers
            });
          }
          
          // Verify webhook signature
          const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret
          );
          
          // Process different webhook events
          switch (event.type) {
            case 'checkout.session.completed':
              // Payment successful, provision access
              const checkoutSession = event.data.object;
              
              // Check if this is from a signup flow
              const isSignup = checkoutSession.metadata?.is_signup === 'true';
              
              if (isSignup) {
                // For the new signup flow, we handle this differently
                // The user will complete registration after checkout
                // Just log this event for now - registration will create the records
                logger.info('Checkout completed for signup flow:', {
                  sessionId: checkoutSession.id,
                  customerId: checkoutSession.customer,
                  subscriptionId: checkoutSession.subscription,
                  email: checkoutSession.customer_email
                });
              } else if (checkoutSession.client_reference_id) {
                // For existing users, update subscription status in database
                const { error: dbError } = await supabase
                  .from('user_subscriptions')
                  .upsert({
                    user_id: checkoutSession.client_reference_id,
                    customer_id: checkoutSession.customer,
                    subscription_id: checkoutSession.subscription,
                    status: 'active',
                    payment_status: checkoutSession.payment_status,
                    updated_at: new Date().toISOString()
                  });
                  
                if (dbError) {
                  logger.error('Error updating subscription status:', dbError);
                }
              }
              
              break;
              
            case 'invoice.payment_succeeded':
              // Subscription renewed successfully
              const invoice = event.data.object;
              
              // Update subscription status in your database
              if (invoice.subscription) {
                const { error: renewalError } = await supabase
                  .from('user_subscriptions')
                  .update({
                    status: 'active',
                    payment_status: 'paid',
                    updated_at: new Date().toISOString()
                  })
                  .eq('subscription_id', invoice.subscription);
                  
                if (renewalError) {
                  logger.error('Error updating subscription renewal:', renewalError);
                }
              }
              
              break;
              
            case 'invoice.payment_failed':
              // Failed payment
              const failedInvoice = event.data.object;
              
              // Update subscription status in your database
              if (failedInvoice.subscription) {
                const { error: failureError } = await supabase
                  .from('user_subscriptions')
                  .update({
                    payment_status: 'failed',
                    updated_at: new Date().toISOString()
                  })
                  .eq('subscription_id', failedInvoice.subscription);
                  
                if (failureError) {
                  logger.error('Error updating payment failure:', failureError);
                }
              }
              
              break;
              
            case 'customer.subscription.deleted':
              // Subscription canceled or expired
              const subscription = event.data.object;
              
              // Update subscription status in your database
              const { error: cancelError } = await supabase
                .from('user_subscriptions')
                .update({
                  status: 'canceled',
                  updated_at: new Date().toISOString()
                })
                .eq('subscription_id', subscription.id);
                
              if (cancelError) {
                logger.error('Error updating subscription cancellation:', cancelError);
              }
              
              break;
          }
          
          return new Response(JSON.stringify({
            status: 'success',
            received: true
          }), {
            status: 200,
            headers
          });
        } catch (error) {
          logger.error('Error processing webhook:', error);
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Failed to process webhook',
            error: error.message
          }), {
            status: 500,
            headers
          });
        }
        
      default:
        return new Response(JSON.stringify({
          status: 'error',
          message: `Unknown action: ${action}`
        }), {
          status: 400,
          headers
        });
    }
    
  } catch (error) {
    logger.error('Unhandled error in stripe-integration function:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    }), {
      status: 500,
      headers
    });
  }
});