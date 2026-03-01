import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const paypalOrderId = searchParams.get("paypalOrderId");

    if (!orderId || !paypalOrderId) {
      return NextResponse.redirect(new URL("/checkout?error=missing_params", request.url));
    }

    // Capture the PayPal order
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (!captureResult.success) {
      return NextResponse.redirect(
        new URL(`/checkout?error=payment_failed&message=${encodeURIComponent(captureResult.error || "Payment failed")}`, request.url)
      );
    }

    // Update order status in database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paymentRef: captureResult.transactionId || paypalOrderId,
      },
    });

    // Fetch order with user and items for email
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            photo: true,
          },
        },
      },
    });

    // Clear the user's cart and send confirmation email
    if (order) {
      await prisma.cartItem.deleteMany({
        where: { userId: order.userId },
      });

      // Send order confirmation email
      await sendOrderConfirmationEmail(
        order.id,
        order.orderNumber,
        order.user.email || "",
        order.user.name || "Customer",
        order.items.map((item) => ({
          title: item.photo.title,
          price: Number(item.price),
          licenseType: item.licenseType,
        })),
        Number(order.total),
        "PayPal"
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/checkout/success?orderId=${orderId}`, request.url)
    );
  } catch (error) {
    console.error("PayPal success callback error:", error);
    return NextResponse.redirect(new URL("/checkout?error=processing_error", request.url));
  }
}
