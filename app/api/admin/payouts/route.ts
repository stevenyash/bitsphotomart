import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all payout requests
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          photographer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  phone: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    // Calculate totals
    const totalPending = payouts
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const totalPaid = payouts
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Serialize payouts with Decimal fields converted to numbers
    const serializedPayouts = payouts.map((p) => ({
      ...p,
      amount: Number(p.amount),
      commission: Number(p.commission),
      netAmount: Number(p.netAmount),
      createdAt: p.createdAt?.toISOString() || null,
      processedAt: p.processedAt?.toISOString() || null,
      photographer: p.photographer ? {
        ...p.photographer,
        totalEarnings: Number(p.photographer.totalEarnings),
        createdAt: p.photographer.createdAt?.toISOString() || null,
        updatedAt: p.photographer.updatedAt?.toISOString() || null,
        user: p.photographer.user ? {
          ...p.photographer.user,
          createdAt: p.photographer.user.createdAt?.toISOString() || null,
          updatedAt: p.photographer.user.updatedAt?.toISOString() || null,
        } : undefined,
      } : undefined,
    }));

    return NextResponse.json({
      payouts: serializedPayouts,
      stats: {
        totalPending,
        totalPaid,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Process payout (approve/reject)
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { payoutId, action, notes, transactionId } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: "payoutId and action are required" }, { status: 400 });
    }

    if (!["APPROVE", "REJECT", "COMPLETE"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        photographer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    let statusUpdate: any;
    let photographerUpdate: any = {};

    switch (action) {
      case "APPROVE":
        statusUpdate = { status: "APPROVED" };
        break;
      case "REJECT":
        statusUpdate = { status: "REJECTED" };
        // Return the earnings back to photographer
        photographerUpdate = {
          pendingBalance: {
            increment: payout.amount,
          },
        };
        break;
      case "COMPLETE":
        statusUpdate = { 
          status: "COMPLETED",
          processedAt: new Date(),
          transactionId: transactionId || `PAY-${Date.now()}`,
        };
        break;
    }

    const [updatedPayout] = await Promise.all([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          ...statusUpdate,
          notes: notes || payout.notes,
        },
      }),
      // Update photographer balance if rejected
      Object.keys(photographerUpdate).length > 0
        ? prisma.photographer.update({
            where: { id: payout.photographerId },
            data: photographerUpdate,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json(updatedPayout);
  } catch (error) {
    console.error("Error processing payout:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
