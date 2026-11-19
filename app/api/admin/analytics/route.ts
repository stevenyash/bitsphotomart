import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('analytics.view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - analytics.view permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Parallel queries for dashboard data
    const [
      totalUsers,
      totalPhotographers,
      totalPhotos,
      pendingPhotos,
      totalOrders,
      totalRevenue,
      recentOrders,
      topPhotographers,
      pendingPayouts,
      pendingPhotographerApps,
      monthlyRevenue,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.photographer.count({ where: { status: "APPROVED" } }),
      prisma.photo.count(),
      prisma.photo.count({ where: { isApproved: false } }),
      prisma.order.count(),
      
      // Total revenue (completed orders)
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { total: true },
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      
      // Top photographers by sales - using findMany with include
      prisma.orderItem.findMany({
        include: {
          photo: {
            include: {
              photographer: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      
      // Pending payouts
      prisma.payout.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      
      // Pending photographer applications
      prisma.photographer.count({ where: { status: "PENDING" } }),
      
      // Monthly revenue (last 12 months)
      prisma.order.groupBy({
        by: ["createdAt"],
        where: {
          status: "COMPLETED",
          createdAt: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
        _sum: { total: true },
      }),
    ]);

    // Process top photographers with user details - aggregate from order items with photos
    const photographerSales = new Map();
    topPhotographers.forEach((item) => {
      const photographerId = item.photo?.photographer?.id;
      if (photographerId) {
        const existing = photographerSales.get(photographerId) || { totalSales: 0, totalOrders: 0 };
        photographerSales.set(photographerId, {
          totalSales: existing.totalSales + Number(item.price),
          totalOrders: existing.totalOrders + 1,
          photographer: item.photo.photographer
        });
      }
    });

    // Convert to array and sort
    const sortedPhotographers = Array.from(photographerSales.entries())
      .sort((a, b) => b[1].totalSales - a[1].totalSales)
      .slice(0, 10);

    const topPhotographersWithDetails = await Promise.all(
      sortedPhotographers.map(async ([photographerId, data]) => {
        const photographer = await prisma.photographer.findUnique({
          where: { id: photographerId },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        });
        return {
          photographerId,
          totalSales: data.totalSales,
          totalOrders: data.totalOrders,
          user: photographer?.user,
        };
      })
    );

    // Process monthly revenue
    const monthlyRevenueMap = new Map();
    monthlyRevenue.forEach((mr) => {
      if (mr._sum.total) {
        const month = mr.createdAt.toISOString().slice(0, 7); // YYYY-MM
        monthlyRevenueMap.set(
          month,
          (monthlyRevenueMap.get(month) || 0) + Number(mr._sum.total)
        );
      }
    });

    // Calculate growth percentages
    const lastPeriodStart = new Date();
    lastPeriodStart.setDate(lastPeriodStart.getDate() - parseInt(period) * 2);

    const [lastPeriodOrders, lastPeriodRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: lastPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: lastPeriodStart,
            lt: startDate,
          },
        },
        _sum: { total: true },
      }),
    ]);

    const orderGrowth = lastPeriodOrders > 0 
      ? ((totalOrders - lastPeriodOrders) / lastPeriodOrders) * 100 
      : 0;
    
    const revenueGrowth = lastPeriodRevenue._sum.total 
      ? ((Number(totalRevenue._sum.total) - Number(lastPeriodRevenue._sum.total)) / Number(lastPeriodRevenue._sum.total)) * 100 
      : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPhotographers,
        totalPhotos,
        pendingPhotos,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.total) || 0,
        pendingPayouts: Number(pendingPayouts._sum.amount) || 0,
        pendingPayoutsCount: pendingPayouts._count.id,
        pendingPhotographerApps,
      },
      recentOrders: recentOrders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        createdAt: order.createdAt?.toISOString() || null,
        updatedAt: order.updatedAt?.toISOString() || null,
        paidAt: order.paidAt?.toISOString() || null,
      })),
      topPhotographers: topPhotographersWithDetails,
      monthlyRevenue: Object.fromEntries(monthlyRevenueMap),
      growth: {
        orders: orderGrowth,
        revenue: revenueGrowth,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
