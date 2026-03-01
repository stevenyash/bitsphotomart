// Stripe payment utility functions for Bits Photo Mart

import Stripe from "stripe";

// Initialize Stripe with API key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  : null;

// Debug mode
const STRIPE_DEBUG = process.env.STRIPE_DEBUG === "true" || process.env.NODE_ENV === "development";

function stripeDebug(label: string, data?: unknown) {
  if (STRIPE_DEBUG) {
    console.log(`[STRIPE DEBUG ${new Date().toISOString()}] ${label}:`, data ?? "");
  }
}

function stripeError(label: string, error: unknown) {
  console.error(`[STRIPE ERROR ${new Date().toISOString()}] ${label}:`, error);
}

// Create a Stripe Checkout Session
export interface CreateCheckoutSessionParams {
  orderId: string;
  orderNumber: string;
  amount: number; // Amount in KES (cents for Stripe)
  currency?: string;
  customerEmail: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  success: boolean;
  sessionId?: string;
  sessionUrl?: string;
  error?: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  if (!stripe) {
    stripeDebug("Stripe not initialized - missing secret key");
    return {
      success: false,
      error: "Stripe is not configured. Please contact support.",
    };
  }

  try {
    const {
      orderId,
      orderNumber,
      amount,
      currency = "kes",
      customerEmail,
      items,
      successUrl,
      cancelUrl,
    } = params;

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    stripeDebug("Creating checkout session", {
      orderId,
      orderNumber,
      amount,
      amountInCents,
      currency,
      itemCount: items.length,
    });

    // Create line items for the session
    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.title,
          description: `Order ${orderNumber}`,
          metadata: {
            photoId: item.id,
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      metadata: {
        orderId,
        orderNumber,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    stripeDebug("Checkout session created", {
      sessionId: session.id,
      url: session.url,
    });

    return {
      success: true,
      sessionId: session.id,
      sessionUrl: session.url || undefined,
    };
  } catch (error) {
    stripeError("Failed to create checkout session", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    };
  }
}

// Retrieve a checkout session
export async function retrieveSession(sessionId: string) {
  if (!stripe) {
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    stripeError("Failed to retrieve session", error);
    return null;
  }
}

// Create a Stripe webhook handler
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Process payment confirmation (called from webhook)
export async function processPaymentSuccess(sessionId: string): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const session = await retrieveSession(sessionId);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    if (session.payment_status !== "paid") {
      return { success: false, error: "Payment not completed" };
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return { success: false, error: "Order ID not found in session" };
    }

    return { success: true, orderId };
  } catch (error) {
    stripeError("Failed to process payment success", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payment",
    };
  }
}

// Create a refund (for order cancellations)
export async function createRefund(
  paymentIntentId: string,
  amount?: number // Optional: partial refund in cents
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (!stripe) {
    return { success: false, error: "Stripe is not configured" };
  }

  try {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    const refund = await stripe.refunds.create(refundParams);

    stripeDebug("Refund created", { refundId: refund.id, status: refund.status });

    return { success: true, refundId: refund.id };
  } catch (error) {
    stripeError("Failed to create refund", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create refund",
    };
  }
}
