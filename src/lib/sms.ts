// SMS utility for sending SMS notifications using MobileSasa API

interface SMSOptions {
  to: string;
  message: string;
}

interface MobileSasaResponse {
  status: string;
  message?: string;
  data?: any;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const { to, message } = options;

  // In development, log SMS instead of sending
  if (process.env.NODE_ENV === "development") {
    console.log("📱 [DEV] SMS would be sent:");
    console.log(`   To: ${to}`);
    console.log(`   Message: ${message}`);
    return true;
  }

  try {
    const apiURL = "https://api.mobilesasa.com/v1/send/message";
    const senderID = process.env.MOBILESASA_SENDER_ID || "LinkPal";
    const authToken = process.env.MOBILESASA_AUTH_TOKEN;

    if (!authToken) {
      console.warn("MobileSasa auth token not configured");
      return false;
    }

    // Format phone number (remove + and ensure 12 digits)
    let formattedPhone = to.replace(/^\+/, "").replace(/^0/, "254");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        sender_id: senderID,
        message: message,
      }),
    });

    const data: MobileSasaResponse = await response.json();

    if (response.ok && data.status === "success") {
      console.log("SMS sent successfully:", data);
      return true;
    } else {
      console.error("MobileSasa API error:", data);
      return false;
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

// Helper functions for common SMS messages

export async function sendOrderConfirmationSMS(phone: string, orderNumber: string): Promise<boolean> {
  const message = `Bits Photo Mart: Your order #${orderNumber} has been confirmed. Thank you for your purchase!`;
  return sendSMS({ to: phone, message });
}

export async function sendPaymentReceivedSMS(phone: string, amount: number): Promise<boolean> {
  const message = `Bits Photo Mart: Payment of KSh ${amount.toLocaleString()} received. Your order is being processed.`;
  return sendSMS({ to: phone, message });
}

export async function sendPayoutNotificationSMS(phone: string, amount: number): Promise<boolean> {
  const message = `Bits Photo Mart: A payout of KSh ${amount.toLocaleString()} has been initiated to your M-Pesa account.`;
  return sendSMS({ to: phone, message });
}

export async function sendPhotographerApprovalSMS(phone: string, approved: boolean): Promise<boolean> {
  if (approved) {
    const message = `Bits Photo Mart: Congratulations! Your photographer application has been approved. You can now start selling your photos!`;
    return sendSMS({ to: phone, message });
  } else {
    const message = `Bits Photo Mart: Your photographer application was not approved at this time. Please contact support for more information.`;
    return sendSMS({ to: phone, message });
  }
}

export async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
  const message = `Bits Photo Mart: Your verification code is ${otp}. This code expires in 10 minutes.`;
  return sendSMS({ to: phone, message });
}
