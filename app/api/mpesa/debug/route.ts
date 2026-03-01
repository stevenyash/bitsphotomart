import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryStkStatus, getMpesaConfigStatus, initiateStkPush } from "@/lib/mpesa";

/**
 * M-Pesa Debug API Endpoint
 * 
 * This endpoint provides debugging and diagnostic tools for M-Pesa integration.
 * Use for testing and troubleshooting payment issues.
 * 
 * GET /api/mpesa/debug - Get M-Pesa configuration status
 * POST /api/mpesa/debug - Query payment status or test payment
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    // Get configuration status
    if (action === "config") {
      const config = getMpesaConfigStatus();
      
      // Mask sensitive data
      const safeConfig = {
        ...config,
        hasConsumerKey: config.hasConsumerKey ? "✓" : "✗",
        hasConsumerSecret: config.hasConsumerSecret ? "✓" : "✗",
        hasBusinessShortcode: config.hasBusinessShortcode ? "✓" : "✗",
        hasPasskey: config.hasPasskey ? "✓" : "✗",
        hasCallbackUrl: config.hasCallbackUrl ? "✓" : "✗",
        hasInitiatorName: config.hasInitiatorName ? "✓" : "✗",
      };
      
      return NextResponse.json({
        success: true,
        message: "M-Pesa configuration status",
        data: safeConfig,
      });
    }
    
    // Get recent orders with payment issues
    if (action === "orders") {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: "PENDING",
          paymentMethod: "MPESA",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentRef: true,
          createdAt: true,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "Recent pending orders",
        data: pendingOrders,
        count: pendingOrders.length,
      });
    }
    
    // Default: return debug info
    return NextResponse.json({
      success: true,
      message: "M-Pesa Debug API",
      availableActions: {
        "GET /api/mpesa/debug?action=config": "Get M-Pesa configuration status",
        "GET /api/mpesa/debug?action=orders": "Get recent pending orders",
        "POST /api/mpesa/debug?action=query": "Query payment status (body: { checkoutRequestId })",
        "POST /api/mpesa/debug?action=test": "Test STK push (body: { phoneNumber, amount })",
      },
    });
  } catch (error) {
    console.error("M-Pesa debug GET error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();
    
    // Query payment status
    if (action === "query") {
      const { checkoutRequestId } = body;
      
      if (!checkoutRequestId) {
        return NextResponse.json(
          { error: "checkoutRequestId is required" },
          { status: 400 }
        );
      }
      
      console.log(`[MPESA DEBUG] Querying payment status for: ${checkoutRequestId}`);
      
      const result = await queryStkStatus(checkoutRequestId);
      
      return NextResponse.json({
        success: result.success,
        message: "Payment status query result",
        checkoutRequestId,
        status: result.status,
        details: result.message,
        debug: result.debug,
      });
    }
    
    // Test STK Push
    if (action === "test") {
      const { phoneNumber, amount } = body;
      
      if (!phoneNumber || !amount) {
        return NextResponse.json(
          { error: "phoneNumber and amount are required" },
          { status: 400 }
        );
      }
      
      console.log(`[MPESA DEBUG] Testing STK Push to ${phoneNumber} for KES ${amount}`);
      
      const result = await initiateStkPush({
        phoneNumber,
        amount: Number(amount),
        accountReference: `DEBUG-${Date.now()}`,
        transactionDesc: "Bits Photo Mart Debug Test",
      });
      
      return NextResponse.json({
        success: result.success,
        message: "STK Push test result",
        checkoutRequestId: result.checkoutRequestId,
        error: result.error,
        debug: result.debug,
      });
    }
    
    // Update order status manually (for debugging stuck payments)
    if (action === "fix-order") {
      const { orderId, status } = body;
      
      if (!orderId || !status) {
        return NextResponse.json(
          { error: "orderId and status are required" },
          { status: 400 }
        );
      }
      
      const validStatuses = ["PENDING", "PAID", "CANCELLED", "FAILED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      });
      
      console.log(`[MPESA DEBUG] Order ${orderId} status updated to ${status}`);
      
      return NextResponse.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updatedOrder,
      });
    }
    
    return NextResponse.json(
      { error: "Unknown action", availableActions: ["query", "test", "fix-order"] },
      { status: 400 }
    );
  } catch (error) {
    console.error("M-Pesa debug POST error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
