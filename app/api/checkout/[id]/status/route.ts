import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { retrieveSession } from "@/lib/stripe";
import { queryStkStatus } from "@/lib/mpesa";

// Handle exclusive license purchases - mark photos as sold when paid
async function handleExclusiveLicenses(orderId: string, userId: string) {
  // Get all order items for this order
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      photo: {
        select: {
          id: true,
          licenseType: true,
        },
      },
    },
  });

  // Find EXCLUSIVE license purchases
  const exclusiveItems = orderItems.filter(
    item => item.photo?.licenseType === "EXCLUSIVE"
  );

  // Mark each exclusive photo as sold
  for (const item of exclusiveItems) {
    if (item.photoId) {
      await prisma.photo.update({
        where: { id: item.photoId },
        data: {
          exclusiveSold: true,
          exclusiveTo: userId,
          status: "SOLD", // Remove from public display
        },
      });
    }
  }

  return exclusiveItems.length;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        paymentRef: true,
        paymentMethod: true,
        mpesaReceipt: true,
        paidAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // For M-Pesa payments, check transaction status with Safaricom
    if (order.paymentMethod === "MPESA" && order.paymentRef && order.status === "PENDING") {
      try {
        const mpesaStatus = await queryStkStatus(order.paymentRef);
        
        // If status indicates success, update order
        if (mpesaStatus.success) {
          // Check the status message - "Success" means payment was completed
          const isSuccess = mpesaStatus.status === "Success" || 
                          mpesaStatus.message?.toLowerCase().includes("success");
          
          if (isSuccess) {
            // Payment was successful
            await prisma.order.update({
              where: { id },
              data: {
                status: "PAID",
                paidAt: new Date(),
              },
            });
            
            // Get user ID for exclusive license handling
            const orderWithUser = await prisma.order.findUnique({
              where: { id },
              select: { userId: true },
            });
            
            // Handle exclusive license purchases
            if (orderWithUser?.userId) {
              await handleExclusiveLicenses(id, orderWithUser.userId);
            }
            
            // Return updated status
            return NextResponse.json({
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: "PAID",
              paymentRef: order.paymentRef,
              paidAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("M-Pesa status check error:", error);
        // Continue to return current status
      }
    }

    // For Stripe payments, check the session status
    if (order.paymentMethod === "STRIPE" && order.paymentRef && order.status === "PENDING") {
      const session = await retrieveSession(order.paymentRef);
      if (session && session.payment_status === "paid") {
        // Update order to PAID
        await prisma.order.update({
          where: { id },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
        
        // Get user ID for exclusive license handling
        const orderWithUser = await prisma.order.findUnique({
          where: { id },
          select: { userId: true },
        });
        
        // Handle exclusive license purchases
        if (orderWithUser?.userId) {
          await handleExclusiveLicenses(id, orderWithUser.userId);
        }
        
        // Return updated status
        return NextResponse.json({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: "PAID",
          paymentRef: order.paymentRef,
          mpesaReceipt: order.mpesaReceipt,
          paidAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentRef: order.paymentRef,
      paymentMethod: order.paymentMethod,
      mpesaReceipt: order.mpesaReceipt,
      paidAt: order.paidAt,
    });
  } catch (error) {
    console.error("Checkout status error:", error);
    return NextResponse.json(
      { error: "Failed to get order status" },
      { status: 500 }
    );
  }
}
