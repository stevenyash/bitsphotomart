/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateStkPush } from "@/lib/mpesa";
import { createCheckoutSession } from "@/lib/stripe";
import { createPayPalOrder } from "@/lib/paypal";
import { randomBytes } from "crypto";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { calculateFeeSplit } from "@/lib/settings";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `BPM-${timestamp}-${random}`;
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

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`checkout:${clientIp}`, RATE_LIMITS.PAYMENT);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again later." },
        { status: 429 }
      );
    }

    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumber, paymentMethod, promoCode, promoCodeId } = body;

    // Validate payment method
    const validPaymentMethods: PaymentMethod[] = ["MPESA", "STRIPE", "PAYPAL"];
    const selectedPaymentMethod = (paymentMethod?.toUpperCase() as PaymentMethod) || "MPESA";
    
    if (!validPaymentMethods.includes(selectedPaymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method selected" },
        { status: 400 }
      );
    }

    // Validate and process promo code if provided
    let discount = 0;
    let appliedPromoCodeId = null;
    
    if (promoCodeId) {
      // Get promo code from database
      const promoCodeRecord = await prisma.promoCode.findUnique({
        where: { id: promoCodeId },
      });
      
      if (promoCodeRecord) {
        // Will calculate discount after subtotal is known
        appliedPromoCodeId = promoCodeRecord.id;
      }
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

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        photo: {
          include: {
            photographer: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + Number(item.photo.price);
    }, 0);

    // Calculate discount if promo code was applied
    if (appliedPromoCodeId) {
      const promoCodeRecord = await prisma.promoCode.findUnique({
        where: { id: appliedPromoCodeId },
      });
      
      if (promoCodeRecord) {
        if (promoCodeRecord.discountType === "PERCENTAGE") {
          discount = (subtotal * Number(promoCodeRecord.discountValue)) / 100;
        } else {
          discount = Number(promoCodeRecord.discountValue);
        }
      }
    }

    const { platformFee, photographerEarnings } = await calculateFeeSplit(subtotal);
    const tax = 0; // No tax for digital products
    const total = subtotal + tax - discount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Collect photographer earnings data for each item
    const photographerEarningsMap = new Map<string, number>();
    for (const item of cartItems) {
      const itemPrice = Number(item.photo.price);
      const itemFee = await calculateFeeSplit(itemPrice);
      const photographerId = item.photo.photographerId;
      const currentEarnings = photographerEarningsMap.get(photographerId) || 0;
      photographerEarningsMap.set(photographerId, currentEarnings + itemFee.photographerEarnings);
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        promoCodeId: appliedPromoCodeId,
        status: "PENDING",
        paymentMethod: selectedPaymentMethod,
        items: {
          create: cartItems.map((item) => ({
            photoId: item.photoId,
            price: item.photo.price,
            licenseType: item.licenseType,
            downloadKey: randomBytes(16).toString("hex"),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Increment promo code usage count if applied
    if (appliedPromoCodeId) {
      await prisma.promoCode.update({
        where: { id: appliedPromoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Handle different payment methods
    if (selectedPaymentMethod === "MPESA") {
      return await handleMpesaPayment(order, orderNumber, phoneNumber, total);
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
      message: "Order created. Please complete payment.",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout. Please try again." },
      { status: 500 }
    );
  }
}

// Handle M-Pesa payment
async function handleMpesaPayment(
  order: any,
  orderNumber: string,
  phoneNumber: string,
  total: number
) {
  const accountRef = generateAccountRef();
  
  const mpesaResponse = await initiateStkPush({
    phoneNumber,
    amount: total,
    accountReference: accountRef,
    transactionDesc: `BPM Order ${orderNumber}`,
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

    return NextResponse.json(
      {
        error: mpesaResponse.error || "Failed to initiate M-Pesa payment",
        orderId: order.id,
      },
      { status: 400 }
    );
  }
}

// Handle Stripe payment
async function handleStripePayment(
  order: any,
  orderNumber: string,
  customerEmail: string,
  cartItems: any[],
  total: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const items = cartItems.map((item) => ({
    id: item.photo.id,
    title: item.photo.title,
    price: Number(item.photo.price),
    quantity: 1,
  }));

  const stripeResult = await createCheckoutSession({
    orderId: order.id,
    orderNumber,
    amount: total,
    currency: "kes",
    customerEmail,
    items,
    successUrl: `${appUrl}/checkout/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/checkout?canceled=true`,
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

// Handle PayPal payment
async function handlePayPalPayment(
  order: any,
  orderNumber: string,
  cartItems: any[],
  total: number
) {
  const items = cartItems.map((item) => ({
    id: item.photo.id,
    title: item.photo.title,
    price: Number(item.photo.price),
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

// Get checkout status
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

    // Get cart items for checkout preview
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        photo: {
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
      return sum + Number(item.photo.price);
    }, 0);

    const tax = 0;
    const total = subtotal + tax;

    // Convert Decimal fields to numbers for serialization
    const serializedItems = cartItems.map((item) => ({
      ...item,
      photo: {
        ...item.photo,
        price: Number(item.photo.price),
        width: item.photo.width,
        height: item.photo.height,
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
    console.error("Checkout GET error:", error);
    return NextResponse.json(
      { error: "Failed to get checkout data" },
      { status: 500 }
    );
  }
}
