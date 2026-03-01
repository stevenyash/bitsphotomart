import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { calculateFeeSplit } from "@/lib/settings";

/**
 * M-Pesa STK Push Callback
 * 
 * This endpoint receives the payment result from M-Pesa after the customer
 * completes or cancels the payment on their phone.
 * 
 * The callback URL is configured in MPESA_CALLBACK_URL environment variable.
 * 
 * SECURITY: This endpoint should be protected by verifying the callback originates
 * from M-Pesa servers. In production, implement IP allowlisting or signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is from trusted source (M-Pesa)
    // In production, implement one or more of:
    // 1. IP allowlisting - verify request comes from M-Pesa IP ranges
    // 2. Callback signature verification
    // 3. Basic auth or API key
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    
    // M-Pesa typically sends from specific IPs - in production, validate this
    const trustedIPs = process.env.MPESA_TRUSTED_IPS?.split(',') || [];
    const isTrustedSource = trustedIPs.length === 0 || trustedIPs.includes(clientIp);
    
    // For development, warn but allow; in production, enforce IP validation
    if (trustedIPs.length > 0 && !isTrustedSource) {
      console.error(`M-Pesa callback from untrusted IP: ${clientIp}`);
      return NextResponse.json(
        { error: "Unauthorized source" },
        { status: 403 }
      );
    }

    const body = await request.json();

    console.log("M-Pesa STK Callback received:", JSON.stringify(body));

    // Extract callback data
    const callback = body.Body?.stkCallback;
    
    if (!callback) {
      console.error("Invalid M-Pesa callback: missing Body.stkCallback");
      return NextResponse.json(
        { error: "Invalid callback" },
        { status: 400 }
      );
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    // Find the order by payment reference
    const order = await prisma.order.findFirst({
      where: { paymentRef: checkoutRequestId },
      include: {
        items: {
          include: {
            photo: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      console.error("Order not found for checkoutRequestId:", checkoutRequestId);
      return NextResponse.json({ status: "success" });
    }

    // Process the callback result
    if (resultCode === 0) {
      // Payment successful
      const mpesaReceiptNumber = callback.CallbackMetadata?.Item?.find(
        (item: { Name: string }) => item.Name === "MpesaReceiptNumber"
      )?.Value;

      const phoneNumber = callback.CallbackMetadata?.Item?.find(
        (item: { Name: string }) => item.Name === "PhoneNumber"
      )?.Value;

      const amount = callback.CallbackMetadata?.Item?.find(
        (item: { Name: string }) => item.Name === "Amount"
      )?.Value;

      // Update order with payment details
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          mpesaReceipt: mpesaReceiptNumber?.toString() || "",
          paidAt: new Date(),
        },
      });

      // Handle exclusive license purchases - mark photos as sold
      const exclusiveItems = order.items.filter(
        (item: { photo: { licenseType: string } }) => item.photo?.licenseType === "EXCLUSIVE"
      );
      for (const item of exclusiveItems) {
        if (item.photoId) {
          await prisma.photo.update({
            where: { id: item.photoId },
            data: {
              exclusiveSold: true,
              exclusiveTo: order.userId,
              status: "SOLD",
            },
          });
        }
      }

      // Credit photographer earnings for each photo sold
      const photographerEarningsMap = new Map<string, number>();
      for (const item of order.items) {
        const itemPrice = Number(item.price);
        const { photographerEarnings } = await calculateFeeSplit(itemPrice);
        const photographerId = item.photo.photographerId;
        const current = photographerEarningsMap.get(photographerId) || 0;
        photographerEarningsMap.set(photographerId, current + photographerEarnings);
      }

      // Update each photographer's total earnings
      for (const [photographerId, earnings] of photographerEarningsMap) {
        await prisma.photographer.update({
          where: { id: photographerId },
          data: {
            totalEarnings: { increment: earnings },
            totalSales: { increment: 1 },
          },
        });
      }

      // Delete cart items after successful payment
      await prisma.cartItem.deleteMany({
        where: { userId: order.userId },
      });

      console.log(`Payment successful for order ${order.orderNumber}. Receipt: ${mpesaReceiptNumber}`);

      // Send order confirmation email
      await sendOrderConfirmationEmail(
        order.id,
        order.orderNumber,
        order.user.email || "",
        order.user.name || "Customer",
        order.items.map((item) => ({
          title: item.photo?.title || "Photo",
          price: Number(item.price),
          licenseType: item.licenseType,
        })),
        Number(order.total),
        "M-Pesa"
      );

      // TODO: Generate download links for purchased photos

    } else {
      // Payment failed or cancelled
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      });

      console.log(`Payment ${resultCode === 0 ? "successful" : "failed/cancelled"} for order ${order.orderNumber}: ${resultDesc}`);
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing/verification)
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "M-Pesa STK Callback endpoint is active",
  });
}
