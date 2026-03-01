/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateStkPush } from "@/lib/mpesa";
import { createCheckoutSession } from "@/lib/stripe";
import { createPayPalOrder } from "@/lib/paypal";
import { randomBytes } from "crypto";
import { calculateFeeSplit } from "@/lib/settings";

// Generate unique order number for video orders
function generateVideoOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `BPM-VID-${timestamp}-${random}`;
}

// Generate shorter account reference for M-Pesa (max 12 characters)
function generateAccountRef(): string {
  const random = randomBytes(3).toString("hex").toUpperCase();
  return random.slice(0, 10);
}

// Note: Platform fee calculation now uses dynamic settings from database
// See calculateFeeSplit in @/lib/settings for dynamic fee calculation

// Valid payment methods
type PaymentMethod = "MPESA" | "STRIPE" | "PAYPAL";

// Separate model for video orders (since VideoOrderItem exists but no VideoOrder model)
async function createVideoOrder(data: {
  orderNumber: string;
  userId: string;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  items: { videoId: string; price: number; licenseType: string }[];
}) {
  // Create order with video items - we'll store in a simple format
  // For now, let's use Order but mark it as video order via orderNumber prefix
  const order = await prisma.order.create({
    data: {
      orderNumber: data.orderNumber,
      userId: data.userId,
      subtotal: data.subtotal,
      tax: 0,
      total: data.total,
      status: "PENDING",
      paymentMethod: data.paymentMethod,
      items: {
        create: [], // No photo items for video orders
      },
    },
  });

  // Create video order items separately
  for (const item of data.items) {
    await prisma.videoOrderItem.create({
      data: {
        videoId: item.videoId,
        price: item.price,
        licenseType: item.licenseType as any,
        downloadKey: randomBytes(16).toString("hex"),
      },
    });
  }

  return order;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumber, paymentMethod } = body;

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ["MPESA", "STRIPE", "PAYPAL"];
    const selectedPaymentMethod = (paymentMethod?.toUpperCase() as PaymentMethod) || "MPESA";
    
    if (!validPaymentMethods.includes(selectedPaymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method selected" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // For M-Pesa, phone number is required
    if (selectedPaymentMethod === "MPESA" && !phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required for M-Pesa payment" },
        { status: 400 }
      );
    }

    // Get user's video cart items
    const cartItems = await prisma.videoCartItem.findMany({
      where: { userId: user.id },
      include: {
        video: {
          include: {
            photographer: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Your video cart is empty" },
        { status: 400 }
      );
    }

    // Calculate totals using dynamic platform fee
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number(item.video.price);
    }, 0);

    const { platformFee } = await calculateFeeSplit(subtotal);
    const tax = 0; // No tax for digital products
    const total = subtotal + tax;

    // Generate order number
    const orderNumber = generateVideoOrderNumber();

    // Create video order items first
    const videoOrderItems = await Promise.all(
      cartItems.map((item) =>
        prisma.videoOrderItem.create({
          data: {
            videoId: item.videoId,
            price: item.video.price,
            licenseType: item.licenseType,
            downloadKey: randomBytes(16).toString("hex"),
          },
        })
      )
    );

    // Create a record to track the video order (using Order with special naming)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: "PENDING",
        paymentMethod: selectedPaymentMethod,
      },
    });

    // Handle different payment methods
    if (selectedPaymentMethod === "MPESA") {
      return await handleMpesaPayment(order, orderNumber, phoneNumber, total, cartItems);
    } else if (selectedPaymentMethod === "STRIPE") {
      return await handleStripePayment(order, orderNumber, user.email, cartItems, total);
    } else if (selectedPaymentMethod === "PAYPAL") {
      return await handlePayPalPayment(order, orderNumber, cartItems, total);
    }

    // Default fallback
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total,
      message: "Video order created. Please complete payment.",
    });
  } catch (error) {
    console.error("Video checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process video checkout. Please try again." },
      { status: 500 }
    );
  }
}

// Handle M-Pesa payment for video orders
async function handleMpesaPayment(
  order: any,
  orderNumber: string,
  phoneNumber: string,
  total: number,
  cartItems: any[]
) {
  const accountRef = generateAccountRef();
  
  const mpesaResponse = await initiateStkPush({
    phoneNumber,
    amount: total,
    accountReference: accountRef,
    transactionDesc: `BPM Video Order ${orderNumber}`,
  });

  if (mpesaResponse.success && mpesaResponse.checkoutRequestId) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentRef: mpesaResponse.checkoutRequestId,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutRequestId: mpesaResponse.checkoutRequestId,
      paymentMethod: "MPESA",
      message: "Payment request sent to your phone",
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    // Delete video order items
    for (const item of cartItems) {
      await prisma.videoOrderItem.deleteMany({
        where: { videoId: item.videoId },
      });
    }

    return NextResponse.json(
      {
        error: mpesaResponse.error || "Failed to initiate M-Pesa payment",
        orderId: order.id,
      },
      { status: 400 }
    );
  }
}

// Handle Stripe payment for video orders
async function handleStripePayment(
  order: any,
  orderNumber: string,
  customerEmail: string,
  cartItems: any[],
  total: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const items = cartItems.map((item) => ({
    id: item.video.id,
    title: item.video.title,
    price: Number(item.video.price),
    quantity: 1,
  }));

  const stripeResult = await createCheckoutSession({
    orderId: order.id,
    orderNumber,
    amount: total,
    currency: "kes",
    customerEmail,
    items,
    successUrl: `${appUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}&type=video`,
    cancelUrl: `${appUrl}/checkout?canceled=true&type=video`,
  });

  if (stripeResult.success && stripeResult.sessionUrl) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentRef: stripeResult.sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      sessionId: stripeResult.sessionId,
      paymentUrl: stripeResult.sessionUrl,
      paymentMethod: "STRIPE",
      message: "Redirecting to Stripe checkout...",
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(
      {
        error: stripeResult.error || "Failed to create Stripe checkout session. Please try M-Pesa instead or contact support.",
        orderId: order.id,
      },
      { status: 400 }
    );
  }
}

// Handle PayPal payment for video orders
async function handlePayPalPayment(
  order: any,
  orderNumber: string,
  cartItems: any[],
  total: number
) {
  const items = cartItems.map((item) => ({
    id: item.video.id,
    title: item.video.title,
    price: Number(item.video.price),
    quantity: 1,
  }));

  const paypalResult = await createPayPalOrder({
    orderId: order.id,
    orderNumber,
    amount: total,
    currency: "USD",
    items,
  });

  if (paypalResult.success && paypalResult.approvalUrl) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentRef: paypalResult.orderId,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paypalOrderId: paypalResult.orderId,
      paymentUrl: paypalResult.approvalUrl,
      paymentMethod: "PAYPAL",
      message: "Redirecting to PayPal...",
    });
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(
      {
        error: paypalResult.error || "Failed to create PayPal order. Please try M-Pesa instead or contact support.",
        orderId: order.id,
      },
      { status: 400 }
    );
  }
}

// Get video checkout status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get video cart items for checkout preview
    const cartItems = await prisma.videoCartItem.findMany({
      where: { userId: user.id },
      include: {
        video: {
          include: {
            photographer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      });
    }

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number(item.video.price);
    }, 0);

    const tax = 0;
    const total = subtotal + tax;

    // Convert Decimal fields to numbers for serialization
    const serializedItems = cartItems.map((item) => ({
      ...item,
      video: {
        ...item.video,
        price: Number(item.video.price),
        width: item.video.width,
        height: item.video.height,
        duration: item.video.duration,
      },
      createdAt: item.createdAt?.toISOString() || null,
      updatedAt: item.updatedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      items: serializedItems,
      subtotal,
      tax,
      total,
    });
  } catch (error) {
    console.error("Video checkout GET error:", error);
    return NextResponse.json(
      { error: "Failed to get video checkout data" },
      { status: 500 }
    );
  }
}
