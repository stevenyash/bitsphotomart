// M-Pesa utility functions for Lipa Na M-Pesa integration

// Normalize environment - strip quotes if present
const rawEnv = process.env.MPESA_ENVIRONMENT || "sandbox";
const MPESA_ENVIRONMENT = rawEnv.replace(/^"|"$/g, "").toLowerCase();

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const MPESA_BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || "";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "";
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || "";
const MPESA_INITIATOR_NAME = process.env.MPESA_INITIATOR_NAME || "";
const MPESA_INITIATOR_PASSWORD = process.env.MPESA_INITIATOR_PASSWORD || "";

// Debug mode - enable detailed logging
const MPESA_DEBUG = process.env.MPESA_DEBUG === "true" || process.env.NODE_ENV === "development";

// Log current environment for debugging
console.log(`[MPESA] Environment: ${MPESA_ENVIRONMENT}, Debug: ${MPESA_DEBUG}`);

// Token caching to prevent expiration issues
let cachedToken: { token: string; expiresAt: number } | null = null;

// Debug logging utility
function mpesaDebug(label: string, data?: unknown) {
  if (MPESA_DEBUG) {
    console.log(`[MPESA DEBUG ${new Date().toISOString()}] ${label}:`, data ?? "");
  }
}

function mpesaError(label: string, error: unknown) {
  console.error(`[MPESA ERROR ${new Date().toISOString()}] ${label}:`, error);
}

// Base URLs for M-Pesa API
const MPESA_BASE_URL = MPESA_ENVIRONMENT === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const MPESA_AUTH_URL = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
const MPESA_STK_PUSH_URL = `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`;
const MPESA_STK_QUERY_URL = `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`;
const MPESA_B2C_URL = `${MPESA_BASE_URL}/mpesa/b2c/v1/paymentrequest`;
const MPESA_C2B_REGISTER_URL = `${MPESA_BASE_URL}/mpesa/c2b/v1/registerurl`;
const MPESA_C2B_SIMULATE_URL = `${MPESA_BASE_URL}/mpesa/c2b/v1/simulate`;

// Get access token for M-Pesa API (with caching)
export async function getMpesaAccessToken(): Promise<string> {
  mpesaDebug("Getting access token...");
  
  // In sandbox mode, always get a fresh token to avoid expiration issues
  // In production, use caching
  if (MPESA_ENVIRONMENT === "sandbox") {
    mpesaDebug("Sandbox mode - fetching fresh token");
  } else {
    // Check if we have a valid cached token (expires in more than 60 seconds)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
      mpesaDebug("Using cached access token");
      return cachedToken.token;
    }
  }
  
  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  mpesaDebug("Auth URL", MPESA_AUTH_URL);
  mpesaDebug("Consumer key (first 10 chars)", MPESA_CONSUMER_KEY.slice(0, 10) + "...");

  const response = await fetch(MPESA_AUTH_URL, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    mpesaError("Failed to get M-Pesa access token", { status: response.status, statusText: response.statusText, body: errorText });
    throw new Error(`Failed to get M-Pesa access token: ${response.statusText}`);
  }

  const data = await response.json();
  
  mpesaDebug("Raw token response", data);
  
  // Cache the token with 60 second buffer before expiry
  const expiresIn = parseInt(data.expires_in || "3600", 10);
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };
  
  mpesaDebug("Access token received and cached", { 
    expires_in: expiresIn, 
    cachedUntil: new Date(cachedToken.expiresAt).toISOString(),
    tokenPrefix: data.access_token?.substring(0, 20) + "..."
  });
  return data.access_token;
}

// Generate password for STK Push
function generateStkPassword(): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
  const dataToEncode = `${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(dataToEncode).toString("base64");
}

// Lipa Na M-Pesa STK Push (Payment Request)
export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
}

export interface StkPushResponse {
  success: boolean;
  message?: string;
  checkoutRequestId?: string;
  error?: string;
  debug?: {
    request: unknown;
    response: unknown;
    timestamp: string;
  };
}

export async function initiateStkPush(request: StkPushRequest): Promise<StkPushResponse> {
  mpesaDebug("Initiating STK Push", request);
  
  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
    const password = generateStkPassword();

    // Format phone number (remove +254, add 254)
    let formattedPhone = request.phoneNumber.replace(/^\+254/, "254");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(request.amount),
      PartyA: formattedPhone,
      PartyB: MPESA_BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${MPESA_CALLBACK_URL}/api/mpesa/stk-callback`,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc || "Bits Photo Mart Purchase",
    };

    mpesaDebug("STK Push payload", payload);
    mpesaDebug("STK Push URL", MPESA_STK_PUSH_URL);
    mpesaDebug("Authorization header", `Bearer ${accessToken.substring(0, 10)}...`);

    const response = await fetch(MPESA_STK_PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }
    
    mpesaDebug("STK Push response status", response.status);
    mpesaDebug("STK Push response", data);

    if (data.ResponseCode === "0") {
      mpesaDebug("STK Push successful", { checkoutRequestId: data.CheckoutRequestID });
      return {
        success: true,
        message: "Payment initiated successfully",
        checkoutRequestId: data.CheckoutRequestID,
        debug: MPESA_DEBUG ? { request: payload, response: data, timestamp: new Date().toISOString() } : undefined,
      };
    } else {
      mpesaError("STK Push failed", data);
      return {
        success: false,
        error: data.ResponseDescription || "Payment initiation failed",
        debug: MPESA_DEBUG ? { request: payload, response: data, timestamp: new Date().toISOString() } : undefined,
      };
    }
  } catch (error) {
    mpesaError("M-Pesa STK Push error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Query STK Push status
export async function queryStkStatus(checkoutRequestId: string): Promise<{
  success: boolean;
  status?: string;
  message?: string;
  debug?: {
    request: unknown;
    response: unknown;
    timestamp: string;
  };
}> {
  mpesaDebug("Querying STK status", { checkoutRequestId });
  
  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
    const password = generateStkPassword();

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    mpesaDebug("STK Query payload", payload);

    const response = await fetch(MPESA_STK_QUERY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    mpesaDebug("STK Query response", data);

    if (data.ResponseCode === "0") {
      return {
        success: true,
        status: data.ResultCode === "0" ? "SUCCESS" : "FAILED",
        message: data.ResultDesc,
        debug: MPESA_DEBUG ? { request: payload, response: data, timestamp: new Date().toISOString() } : undefined,
      };
    } else {
      return {
        success: false,
        status: "FAILED",
        message: data.ResponseDescription,
        debug: MPESA_DEBUG ? { request: payload, response: data, timestamp: new Date().toISOString() } : undefined,
      };
    }
  } catch (error) {
    mpesaError("M-Pesa STK Query error", error);
    return {
      success: false,
      status: "ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// B2C Payment (for payouts to photographers)
export interface B2CPaymentRequest {
  phoneNumber: string;
  amount: number;
  commandId?: string;
  occasion?: string;
  remarks?: string;
}

export async function initiateB2CPayment(request: B2CPaymentRequest): Promise<{
  success: boolean;
  message?: string;
  transactionId?: string;
  error?: string;
}> {
  try {
    const accessToken = await getMpesaAccessToken();

    // Format phone number
    let formattedPhone = request.phoneNumber.replace(/^\+254/, "254");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    const payload = {
      InitiatorName: MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: request.commandId || "BusinessPayment",
      Amount: Math.ceil(request.amount),
      PartyA: MPESA_BUSINESS_SHORTCODE,
      PartyB: formattedPhone,
      Remarks: request.remarks || "Bits Photo Mart Payout",
      QueueTimeOutURL: `${MPESA_CALLBACK_URL}/api/mpesa/b2c-timeout`,
      ResultURL: `${MPESA_CALLBACK_URL}/api/mpesa/b2c-result`,
      Occasion: request.occasion || "",
    };

    const response = await fetch(MPESA_B2C_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ResponseCode === "0") {
      return {
        success: true,
        message: "Payment sent successfully",
        transactionId: data.ConversationID,
      };
    } else {
      return {
        success: false,
        error: data.ResponseDescription || "Payment failed",
      };
    }
  } catch (error) {
    mpesaError("M-Pesa B2C error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Register C2B URLs (for receiving payments)
export async function registerC2BUrls(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const accessToken = await getMpesaAccessToken();

    const payload = {
      ShortCode: MPESA_BUSINESS_SHORTCODE,
      ResponseType: "Completed",
      ConfirmationURL: `${MPESA_CALLBACK_URL}/api/mpesa/c2b-confirmation`,
      ValidationURL: `${MPESA_CALLBACK_URL}/api/mpesa/c2b-validation`,
    };

    const response = await fetch(MPESA_C2B_REGISTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ResponseCode === "0") {
      return {
        success: true,
        message: "C2B URLs registered successfully",
      };
    } else {
      return {
        success: false,
        error: data.ResponseDescription,
      };
    }
  } catch (error) {
    mpesaError("M-Pesa C2B Register error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Simulate C2B Payment (for testing)
export async function simulateC2BPayment(
  phoneNumber: string,
  amount: number,
  accountReference: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const accessToken = await getMpesaAccessToken();

    // Format phone number
    let formattedPhone = phoneNumber.replace(/^\+254/, "254");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    const payload = {
      ShortCode: MPESA_BUSINESS_SHORTCODE,
      CommandID: "CustomerBuyGoodsOnline",
      Amount: Math.ceil(amount),
      Msisdn: formattedPhone,
      BillRefNumber: accountReference,
    };

    const response = await fetch(MPESA_C2B_SIMULATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ResponseCode === "0") {
      return {
        success: true,
        message: "C2B simulation successful",
      };
    } else {
      return {
        success: false,
        error: data.ResponseDescription,
      };
    }
  } catch (error) {
    mpesaError("M-Pesa C2B Simulate error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Clear cached token (useful for debugging)
export function clearMpesaTokenCache() {
  cachedToken = null;
  mpesaDebug("Access token cache cleared");
}

// Get M-Pesa configuration status (debug helper)
export function getMpesaConfigStatus() {
  const config = {
    environment: MPESA_ENVIRONMENT,
    debugEnabled: MPESA_DEBUG,
    baseUrl: MPESA_BASE_URL,
    hasConsumerKey: !!MPESA_CONSUMER_KEY,
    hasConsumerSecret: !!MPESA_CONSUMER_SECRET,
    hasBusinessShortcode: !!MPESA_BUSINESS_SHORTCODE,
    hasPasskey: !!MPESA_PASSKEY,
    hasCallbackUrl: !!MPESA_CALLBACK_URL,
    hasInitiatorName: !!MPESA_INITIATOR_NAME,
    callbackUrl: MPESA_CALLBACK_URL,
    tokenCacheStatus: cachedToken ? {
      cached: true,
      expiresAt: new Date(cachedToken.expiresAt).toISOString(),
      isValid: cachedToken.expiresAt > Date.now(),
    } : { cached: false },
  };
  
  mpesaDebug("Config status requested", config);
  return config;
}
