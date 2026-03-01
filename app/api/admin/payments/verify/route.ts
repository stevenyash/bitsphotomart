import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin API: Verify or reject payment manually
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or finance manager
    const userRole = (session.user.role as string) || "USER";
    const isAdmin = ["ADMIN", "FINANCE_MANAGER", "MANAGER"].includes(userRole);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins and finance managers can verify payments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, action, notes } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { error: "Order ID and action are required" },
        { status: 400 }
      );
    }

    if (!["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'verify' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const adminId = session.user.id;
    const now = new Date();

    if (action === "verify") {
      // Verify the payment
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: now,
          paymentVerified: true,
          verifiedBy: adminId,
          verifiedAt: now,
          verificationStatus: "VERIFIED",
          verificationNotes: notes || "Payment verified manually by admin",
        },
      });

      // Create download records for each item
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        // Check if download record already exists
        const existingDownload = await prisma.download.findFirst({
          where: {
            userId: order.userId,
            photoId: item.photoId,
          },
        });

        if (!existingDownload && item.photoId) {
          await prisma.download.create({
            data: {
              userId: order.userId,
              photoId: item.photoId,
              orderItemId: item.id,
              orderId: orderId,
              downloadKey: `DL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
          });
        }
      }

      // Notify the user
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "SUCCESS",
          title: "Payment Verified",
          message: `Your payment for order ${order.orderNumber} has been verified. You can now download your photos.`,
          link: "/purchases",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      });
    } else {
      // Reject the payment
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentVerified: false,
          verifiedBy: adminId,
          verifiedAt: now,
          verificationStatus: "REJECTED",
          verificationNotes: notes || "Payment rejected - please contact support",
        },
      });

      // Notify the user
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "ERROR",
          title: "Payment Verification Failed",
          message: `Your payment for order ${order.orderNumber} could not be verified. ${notes || "Please contact support for assistance."}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment rejected",
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

// GET: Get orders pending verification
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user.role as string) || "USER";
    const isAdmin = ["ADMIN", "FINANCE_MANAGER", "MANAGER"].includes(userRole);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins and finance managers can view pending verifications" },
        { status: 403 }
      );
    }

    // Get orders that need verification - using raw query or filter by status
    const orders = await prisma.order.findMany({
      where: {
        status: "PENDING",
      },
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
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentRef: order.paymentRef,
        mpesaReceipt: order.mpesaReceipt,
        createdAt: order.createdAt,
        user: order.user,
        items: order.items.map((item) => ({
          id: item.id,
          photoId: item.photoId,
          title: item.photo?.title,
          thumbnailUrl: item.photo?.thumbnailUrl,
          price: Number(item.price),
        })),
      })),
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending verifications" },
      { status: 500 }
    );
  }
}
