import { prisma } from '@/lib/prisma';

/**
 * Calculate and credit commission to a marketer when an order is completed
 * @param orderId - The order that was paid
 * @returns The referral that earned commission, or null if no referral found
 */
export async function creditCommissionForOrder(orderId: string) {
  try {
    // Get the order with user info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            referredByMarketer: {
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!order || !order.paidAt) {
      console.log('[Commission] Order not found or not paid');
      return null;
    }

    // Find the pending referral for this user
    const referral = order.user?.referredByMarketer?.[0];

    if (!referral) {
      console.log('[Commission] No pending referral found for user:', order.userId);
      return null;
    }

    // Get the marketer's profile to get commission rate
    const marketer = await prisma.marketerProfile.findUnique({
      where: { id: referral.marketerId },
    });

    if (!marketer || marketer.status !== 'ACTIVE') {
      console.log('[Commission] Marketer not active or not found');
      return null;
    }

    // Calculate commission
    const orderTotal = parseFloat(order.total.toString());
    const commissionRate = parseFloat(marketer.commissionRate.toString());
    const commission = (orderTotal * commissionRate) / 100;

    if (commission <= 0) {
      console.log('[Commission] Zero commission amount');
      return null;
    }

    // Update the referral with earned commission
    const updatedReferral = await prisma.marketerReferral.update({
      where: { id: referral.id },
      data: {
        commissionEarned: commission,
        saleAmount: orderTotal,
        orderId: orderId,
        status: 'APPROVED',
        earnedAt: new Date(),
      },
    });

    // Update marketer's totals
    await prisma.marketerProfile.update({
      where: { id: marketer.id },
      data: {
        totalSales: { increment: orderTotal },
        totalCommission: { increment: commission },
        pendingCommission: { increment: commission },
      },
    });

    console.log(`[Commission] Credited KES ${commission} to marketer ${marketer.id} for order ${orderId}`);

    return updatedReferral;
  } catch (error) {
    console.error('[Commission] Error crediting commission:', error);
    return null;
  }
}

/**
 * Check if a user was referred by a marketer
 * @param userId - The user to check
 * @returns The referral if found
 */
export async function getUserReferral(userId: string) {
  return prisma.marketerReferral.findFirst({
    where: {
      referredUserId: userId,
    },
    include: {
      marketer: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get all commissions for a marketer
 * @param marketerId - The marketer profile ID
 */
export async function getMarketerCommissions(marketerId: string) {
  return prisma.marketerReferral.findMany({
    where: {
      marketerId,
      status: { not: 'PENDING' },
    },
    orderBy: {
      earnedAt: 'desc',
    },
    include: {
      referredUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}
