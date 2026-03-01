import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLATFORM_COMMISSION_PERCENT = 15; // 15% platform commission
const MIN_PAYOUT_AMOUNT = 1000; // Minimum KES 1000

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        photographer: true,
      },
    });

    if (!user?.photographer) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }

    const photographerId = user.photographer.id;

    // Get all order items for this photographer's photos
    const photos = await prisma.photo.findMany({
      where: { photographerId },
      select: { id: true },
    });
    const photoIds = photos.map(p => p.id);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        photoId: { in: photoIds },
        order: { status: "PAID" },
      },
    });

    // Calculate total earnings
    const totalEarnings = orderItems.reduce((sum, item) => sum + Number(item.price), 0);

    // Get completed and pending payouts
    const payouts = await prisma.payout.findMany({
      where: { photographerId },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = payouts
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.netAmount), 0);

    const pendingPayouts = payouts
      .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + Number(p.netAmount), 0);

    // Calculate available balance
    const availableBalance = totalEarnings - totalPaid - pendingPayouts;

    // Serialize payout records
    const serializedPayouts = payouts.map((p) => ({
      ...p,
      amount: Number(p.amount),
      commission: Number(p.commission),
      netAmount: Number(p.netAmount),
      createdAt: p.createdAt?.toISOString() || null,
      processedAt: p.processedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      availableBalance,
      totalEarnings,
      totalPaid,
      pendingPayouts,
      minPayoutAmount: MIN_PAYOUT_AMOUNT,
      recentPayouts: serializedPayouts.slice(0, 5),
    });
  } catch (error) {
    console.error("Error fetching payout info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        photographer: true,
      },
    });

    if (!user?.photographer) {
      return NextResponse.json({ error: "Photographer profile not found" }, { status: 404 });
    }

    if (user.photographer.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your account must be approved to request a payout" },
        { status: 403 }
      );
    }

    const photographerId = user.photographer.id;
    const body = await request.json();
    const { amount, method, phoneNumber, bankDetails } = body;

    // Validate amount
    if (!amount || amount < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum payout amount is KES ${MIN_PAYOUT_AMOUNT.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Validate method
    if (!method || !["MPESA", "BANK", "PAYPAL"].includes(method)) {
      return NextResponse.json(
        { error: "Invalid payout method" },
        { status: 400 }
      );
    }

    // Validate phone for M-Pesa
    if (method === "MPESA" && !phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required for M-Pesa payouts" },
        { status: 400 }
      );
    }

    // Validate bank details for BANK transfer
    if (method === "BANK" && (!bankDetails?.accountNumber || !bankDetails?.bankName)) {
      return NextResponse.json(
        { error: "Bank account details are required for bank transfers" },
        { status: 400 }
      );
    }

    // Calculate available balance
    const photos = await prisma.photo.findMany({
      where: { photographerId },
      select: { id: true },
    });
    const photoIds = photos.map(p => p.id);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        photoId: { in: photoIds },
        order: { status: "PAID" },
      },
    });

    const totalEarnings = orderItems.reduce((sum, item) => sum + Number(item.price), 0);

    const payouts = await prisma.payout.findMany({
      where: { photographerId },
    });

    const totalPaid = payouts
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.netAmount), 0);

    const pendingPayouts = payouts
      .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + Number(p.netAmount), 0);

    const availableBalance = totalEarnings - totalPaid - pendingPayouts;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Insufficient balance for this payout" },
        { status: 400 }
      );
    }

    // Calculate commission and net amount
    const commission = (amount * PLATFORM_COMMISSION_PERCENT) / 100;
    const netAmount = amount - commission;

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        photographerId,
        amount: amount,
        commission: commission,
        netAmount: netAmount,
        method,
        reference: method === "MPESA" ? phoneNumber : 
                    method === "BANK" ? bankDetails.accountNumber : null,
        status: "PENDING",
      },
    });

    // For M-Pesa, initiate B2C payment
    if (method === "MPESA" && phoneNumber) {
      try {
        const { initiateB2CPayment } = await import("@/lib/mpesa");
        const result = await initiateB2CPayment({
          amount: Math.round(netAmount),
          phoneNumber: phoneNumber,
          remarks: `Payout for photographer ${user.photographer.id}`,
        });

        if (result.success) {
          // Update payout with reference
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              reference: result.transactionId,
              status: "PROCESSING",
            },
          });
        }
      } catch (mpesaError) {
        console.error("M-Pesa B2C error:", mpesaError);
        // Payout still created but will be processed manually
      }
    }

    return NextResponse.json({
      message: "Payout request submitted successfully",
      payout: {
        id: payout.id,
        amount: Number(payout.amount),
        netAmount: Number(payout.netAmount),
        method: payout.method,
        status: payout.status,
        createdAt: payout.createdAt?.toISOString() || null,
        processedAt: payout.processedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
