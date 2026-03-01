import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");

    // If we have an orderId, cancel the order
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
        },
      });
    }

    // Redirect back to checkout with cancel message
    return NextResponse.redirect(
      new URL("/checkout?canceled=true", request.url)
    );
  } catch (error) {
    console.error("PayPal cancel callback error:", error);
    return NextResponse.redirect(new URL("/checkout?error=cancel_error", request.url));
  }
}
