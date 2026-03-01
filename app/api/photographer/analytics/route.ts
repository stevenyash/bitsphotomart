import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Get all photos by this photographer
    const photos = await prisma.photo.findMany({
      where: { photographerId },
      select: {
        id: true,
        title: true,
        price: true,
        downloadCount: true,
        viewCount: true,
        status: true,
        category: true,
        createdAt: true,
      },
    });

    // Get all order items for these photos
    const photoIds = photos.map(p => p.id);
    const orderItems = await prisma.orderItem.findMany({
      where: {
        photoId: { in: photoIds },
        order: {
          status: "PAID",
        },
      },
      include: {
        order: {
          select: {
            createdAt: true,
            paidAt: true,
          },
        },
        photo: {
          select: {
            title: true,
            price: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals
    const totalPhotos = photos.length;
    const approvedPhotos = photos.filter(p => p.status === "APPROVED").length;
    const totalViews = photos.reduce((sum, p) => sum + p.viewCount, 0);
    const totalDownloads = photos.reduce((sum, p) => sum + p.downloadCount, 0);
    const totalSales = orderItems.length;
    const totalEarnings = orderItems.reduce((sum, item) => sum + Number(item.price), 0);

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = orderItems.filter(
      item => item.order.paidAt && new Date(item.order.paidAt) >= thirtyDaysAgo
    );
    const recentEarnings = recentSales.reduce((sum, item) => sum + Number(item.price), 0);

    // Sales by month (last 6 months)
    const monthlySales: { [key: string]: { sales: number; earnings: number } } = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    orderItems.forEach(item => {
      if (item.order.paidAt) {
        const date = new Date(item.order.paidAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlySales[key]) {
          monthlySales[key] = { sales: 0, earnings: 0 };
        }
        monthlySales[key].sales += 1;
        monthlySales[key].earnings += Number(item.price);
      }
    });

    // Sales by category
    const categorySales: { [key: string]: { sales: number; earnings: number } } = {};
    orderItems.forEach(item => {
      const category = item.photo.category;
      if (!categorySales[category]) {
        categorySales[category] = { sales: 0, earnings: 0 };
      }
      categorySales[category].sales += 1;
      categorySales[category].earnings += Number(item.price);
    });

    // Top performing photos
    const photoPerformance = photos
      .map(photo => {
        const sales = orderItems.filter(item => item.photoId === photo.id);

        return {
          id: photo.id,
          title: photo.title,
          views: photo.viewCount,
          downloads: photo.downloadCount,
          sales: sales.length,
          earnings: sales.reduce((sum, s) => sum + Number(s.price), 0),
          status: photo.status,
        };
      })
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 10);

    // Get payout information
    const payouts = await prisma.payout.findMany({
      where: { photographerId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const totalPaid = payouts
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.netAmount), 0);
    
    const pendingPayouts = payouts
      .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + Number(p.netAmount), 0);

    // Calculate available balance (total earnings - paid - pending)
    const availableBalance = totalEarnings - totalPaid - pendingPayouts;

    return NextResponse.json({
      stats: {
        totalPhotos,
        approvedPhotos,
        totalViews,
        totalDownloads,
        totalSales,
        totalEarnings,
        recentEarnings,
        availableBalance,
        totalPaid,
        pendingPayouts,
        rating: user.photographer.rating,
      },
      monthlySales: Object.entries(monthlySales)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      categorySales: Object.entries(categorySales)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.earnings - a.earnings),
      topPhotos: photoPerformance,
      recentSales: orderItems.slice(0, 10).map(item => ({
        id: item.id,
        photoTitle: item.photo.title,
        amount: Number(item.price),
        date: item.order.paidAt,
      })),
      payouts: payouts.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        netAmount: Number(p.netAmount),
        method: p.method,
        status: p.status,
        createdAt: p.createdAt?.toISOString() || null,
        processedAt: p.processedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
