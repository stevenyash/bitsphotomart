import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

// GET - Get all corporate accounts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('corporate.view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - corporate.view permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { billingEmail: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [accounts, total] = await Promise.all([
      prisma.corporateAccount.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.corporateAccount.count({ where }),
    ]);

    // Get license counts
    const accountsWithCounts = await Promise.all(
      accounts.map(async (account) => {
        const licenseCount = await prisma.corporateLicense.count({
          where: { corporateAccountId: account.id },
        });
        return {
          ...account,
          createdAt: account.createdAt?.toISOString(),
          approvedAt: account.approvedAt?.toISOString(),
          _count: { licenses: licenseCount },
        };
      })
    );

    return NextResponse.json({
      accounts: accountsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching corporate accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// PATCH - Update corporate account status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('corporate.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - corporate.manage permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'ACTIVE') {
        updateData.approvedAt = new Date();
      }
    }

    const account = await prisma.corporateAccount.update({
      where: { id: accountId },
      data: updateData,
    });

    return NextResponse.json({
      ...account,
      createdAt: account.createdAt?.toISOString(),
      approvedAt: account.approvedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error updating corporate account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

// DELETE - Delete corporate account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission using RBAC
    const hasAccess = await hasPermission('corporate.manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - corporate.manage permission required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    // Delete related records first
    await prisma.corporateLicense.deleteMany({
      where: { corporateAccountId: accountId },
    });

    await prisma.corporateTeamMember.deleteMany({
      where: { corporateAccountId: accountId },
    });

    await prisma.corporateAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting corporate account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
