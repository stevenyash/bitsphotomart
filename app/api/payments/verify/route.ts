/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Check payment status (for users to manually verify)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            photo: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user owns this order or is admin/finance
    const userId = session.user.id;
    const userRole = (session.user.role as string) || "USER";
    const isOwner = order.userId === userId;
    const isAdmin = ["ADMIN", "FINANCE_MANAGER", "MANAGER"].includes(userRole);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return payment status details
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef,
      mpesaReceipt: order.mpesaReceipt,
      paidAt: order.paidAt,
      verificationStatus: (order as any).verificationStatus || "PENDING",
      paymentVerified: (order as any).paymentVerified || false,
      verifiedAt: (order as any).verifiedAt,
      verificationNotes: (order as any).verificationNotes,
      createdAt: order.createdAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        photoId: item.photoId,
        title: item.photo?.title,
        thumbnailUrl: item.photo?.thumbnailUrl,
        quantity: item.quantity || 1,
        price: Number(item.price),
      })),
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}

// POST: Request manual payment verification (user submits their M-Pesa details)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, phoneNumber } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check ownership
    if (order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If order is already paid/verified, no need to request verification
    if (order.status === "PAID" || order.status === "COMPLETED") {
      return NextResponse.json({
        message: "Order is already paid",
        status: order.status,
      });
    }

    // Mark for manual verification review
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        verificationStatus: "NEEDS_REVIEW",
        // Update phone if provided
        ...(phoneNumber && { paymentRef: phoneNumber }),
      } as any,
    });

    // Get admin users
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER"] },
      },
      select: { id: true },
    });

    // Create notifications for admins
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "INFO",
          title: "Payment Verification Requested",
          message: `Manual verification requested for order ${order.orderNumber} by ${session.user.email}`,
          link: `/admin/orders?id=${order.id}`,
        })),
      });
    }

    return NextResponse.json({
      message: "Verification request submitted. Our finance team will review your payment.",
      orderId: order.id,
      verificationStatus: (updatedOrder as any).verificationStatus,
    });
  } catch (error) {
    console.error("Error requesting payment verification:", error);
    return NextResponse.json(
      { error: "Failed to submit verification request" },
      { status: 500 }
    );
  }
}
