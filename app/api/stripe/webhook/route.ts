import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent, processPaymentSuccess } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { calculateFeeSplit } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = await constructWebhookEvent(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const sessionId = session.id;
        const paymentIntentId = session.payment_intent;

        // Process the payment
        const result = await processPaymentSuccess(sessionId);

        if (result.success && result.orderId) {
          // Update order status
          await prisma.order.update({
            where: { id: result.orderId },
            data: {
              status: "PAID",
              paymentRef: paymentIntentId as string,
            },
          });

          // Fetch order with user and items for email
          const order = await prisma.order.findUnique({
            where: { id: result.orderId },
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

            // Send order confirmation email
            const emailSent = await sendOrderConfirmationEmail(
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
              "Stripe"
            );
            
            if (emailSent) {
              console.log(`Order confirmation email sent for order ${order.orderNumber}`);
            }
          }

          console.log(`Order ${result.orderId} marked as paid via Stripe webhook`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        
        // Find the order by payment reference
        const order = await prisma.order.findFirst({
          where: { paymentRef: session.id },
        });

        if (order && order.status === "PENDING") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
          console.log(`Order ${order.id} cancelled due to session expiration`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        // Find and update the order
        const order = await prisma.order.findFirst({
          where: { paymentRef: paymentIntentId as string },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "REFUNDED" },
          });
          console.log(`Order ${order.id} marked as refunded`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
