// PayPal payment utility functions for Bits Photo Mart
// Using PayPal REST API directly

// Configure PayPal environment
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // sandbox or live

// Debug mode
const PAYPAL_DEBUG = process.env.PAYPAL_DEBUG === "true" || process.env.NODE_ENV === "development";

function paypalDebug(label: string, data?: unknown) {
  if (PAYPAL_DEBUG) {
    console.log(`[PAYPAL DEBUG ${new Date().toISOString()}] ${label}:`, data ?? "");
  }
}

function paypalError(label: string, error: unknown) {
  console.error(`[PAYPAL ERROR ${new Date().toISOString()}] ${label}:`, error);
}

// PayPal API Base URL
const PAYPAL_BASE_URL = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    paypalDebug("PayPal not initialized - missing credentials");
    return null;
  }

  try {
    const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const error = await response.text();
      paypalError("Failed to get PayPal access token", error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    paypalError("Failed to get PayPal access token", error);
    return null;
  }
}

// Create an order for PayPal Checkout
export interface CreatePayPalOrderParams {
  orderId: string;
  orderNumber: string;
  amount: number; // Amount in KES
  currency?: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
}

export interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
}

export async function createPayPalOrder(
  params: CreatePayPalOrderParams
): Promise<PayPalOrderResult> {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    return {
      success: false,
      error: "PayPal is not configured. Please contact support.",
    };
  }

  try {
    const { orderId, orderNumber, amount, currency = "USD", items } = params;

    paypalDebug("Creating PayPal order", {
      orderId,
      orderNumber,
      amount,
      currency,
      itemCount: items.length,
    });

    // Convert KES to USD for PayPal (approximate exchange rate)
    const KES_TO_USD_RATE = 0.0085;
    const amountInUSD = Math.round(amount * KES_TO_USD_RATE * 100) / 100;

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            description: `Bits Photo Mart Order ${orderNumber}`,
            soft_descriptor: "BITS PHOTO MART",
            amount: {
              currency_code: currency,
              value: amountInUSD.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: amountInUSD.toFixed(2),
                },
              },
            },
            items: items.map((item) => ({
              name: item.title,
              description: `Photo - ${item.title}`,
              sku: item.id,
              unit_amount: {
                currency_code: currency,
                value: (item.price * KES_TO_USD_RATE).toFixed(2),
              },
              quantity: item.quantity.toString(),
            })),
          },
        ],
        application_context: {
          brand_name: "Bits Photo Mart",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/success?orderId=${orderId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/cancel?orderId=${orderId}`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      paypalError("Failed to create PayPal order", error);
      return { success: false, error: "Failed to create PayPal order" };
    }

    const data = await response.json();

    paypalDebug("PayPal order created", {
      status: data.status,
      id: data.id,
    });

    // Find the approval URL
    const approvalUrl = data.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    )?.href;

    return {
      success: true,
      orderId: data.id,
      approvalUrl,
    };
  } catch (error) {
    paypalError("Failed to create PayPal order", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create PayPal order",
    };
  }
}

// Capture a PayPal order (after user approval)
export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    return { success: false, error: "PayPal is not configured" };
  }

  try {
    paypalDebug("Capturing PayPal order", { paypalOrderId });

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      paypalError("Failed to capture PayPal order", error);
      return { success: false, error: "Failed to capture PayPal order" };
    }

    const data = await response.json();

    paypalDebug("PayPal order captured", {
      status: data.status,
      id: data.id,
    });

    // Get the transaction ID
    const transactionId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    return {
      success: true,
      transactionId,
    };
  } catch (error) {
    paypalError("Failed to capture PayPal order", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to capture PayPal order",
    };
  }
}

// Get PayPal order details
export async function getPayPalOrderDetails(
  paypalOrderId: string
): Promise<{ success: boolean; order?: unknown; error?: string }> {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    return { success: false, error: "PayPal is not configured" };
  }

  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: "Failed to get PayPal order details" };
    }

    const data = await response.json();
    return { success: true, order: data };
  } catch (error) {
    paypalError("Failed to get PayPal order details", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get PayPal order details",
    };
  }
}

// Process PayPal webhook events
export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: Record<string, unknown>;
  summary: string;
}

export function verifyPayPalWebhook(
  webhookId: string,
  transmissionId: string,
  timestamp: string,
  webhookSignature: string,
  body: string
): boolean {
  // In production, you would verify the webhook signature using PayPal's SDK
  // For now, we'll do basic validation
  if (!PAYPAL_CLIENT_SECRET) {
    paypalError("Cannot verify webhook", "missing client secret");
    return false;
  }

  paypalDebug("Webhook verification (simplified)", {
    webhookId,
    transmissionId,
    timestamp,
  });

  return true;
}

// Create a refund via PayPal
export async function createPayPalRefund(
  captureId: string,
  amount?: number,
  currency?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) {
    return { success: false, error: "PayPal is not configured" };
  }

  try {
    paypalDebug("Creating PayPal refund", { captureId, amount, currency });

    const refundBody: Record<string, unknown> = {};
    
    if (amount && currency) {
      const KES_TO_USD_RATE = 0.0085;
      const amountInUSD = Math.round(amount * KES_TO_USD_RATE * 100) / 100;
      
      refundBody.amount = {
        value: amountInUSD.toFixed(2),
        currency_code: currency,
      };
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: Object.keys(refundBody).length > 0 ? JSON.stringify(refundBody) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      paypalError("Failed to create PayPal refund", error);
      return { success: false, error: "Failed to create PayPal refund" };
    }

    const data = await response.json();

    paypalDebug("PayPal refund created", {
      refundId: data.id,
      status: data.status,
    });

    return {
      success: true,
      refundId: data.id,
    };
  } catch (error) {
    paypalError("Failed to create PayPal refund", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create PayPal refund",
    };
  }
}
