import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get corporate account details for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    // Get corporate account
    const corporateAccount = await prisma.corporateAccount.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          // Also check if user is a team member
          { teamMembers: { some: { userId: session.user.id } } },
        ],
        ...(accountId ? { id: accountId } : {}),
      },
      include: {
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        licenses: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!corporateAccount) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 });
    }

    // Get usage statistics
    const usageStats = await getUsageStats(corporateAccount.id);

    return NextResponse.json({
      ...corporateAccount,
      usageStats,
    });
  } catch (error) {
    console.error('Error fetching corporate account:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}

// POST - Create a new corporate account application
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyName, 
      industry, 
      contactPerson, 
      jobTitle, 
      phone, 
      address,
      subscriptionTier,
      teamMembers = [],
    } = body;

    // Check if user already has a corporate account
    const existingAccount = await prisma.corporateAccount.findFirst({
      where: { userId: session.user.id },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'You already have a corporate account' },
        { status: 400 }
      );
    }

    // Create corporate account
    const corporateAccount = await prisma.corporateAccount.create({
      data: {
        companyName,
        industry,
        contactPerson,
        jobTitle,
        phone,
        address,
        subscriptionTier: subscriptionTier || 'STANDARD',
        status: 'PENDING', // Pending approval
        userId: session.user.id,
        teamMembers: {
          create: [
            {
              userId: session.user.id,
              role: 'ADMIN',
            },
          ],
        },
      },
    });

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });
    
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'INFO',
          title: 'New Corporate Account Application',
          message: `${companyName} has applied for a corporate account`,
          link: '/admin/corporate-accounts',
        }))
      });
    }

    return NextResponse.json(corporateAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating corporate account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// PATCH - Update corporate account
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, ...updateData } = body;

    // Verify ownership or admin role
    const account = await prisma.corporateAccount.findFirst({
      where: {
        id: accountId,
        OR: [
          { userId: session.user.id },
          { teamMembers: { some: { userId: session.user.id, role: 'ADMIN' } } },
        ],
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    // Update account
    const updated = await prisma.corporateAccount.update({
      where: { id: accountId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating corporate account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// Helper function to get usage statistics
async function getUsageStats(accountId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentDownloads, totalLicenses, monthlyUsage] = await Promise.all([
    prisma.corporateLicense.count({
      where: {
        corporateAccountId: accountId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.corporateLicense.count({
      where: { corporateAccountId: accountId },
    }),
    prisma.order.count({
      where: {
        corporateAccountId: accountId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  return {
    downloadsLast30Days: recentDownloads,
    totalLicenses,
    ordersLast30Days: monthlyUsage,
  };
}
