import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

// GET /api/admin/superadmin/activity-logs - Get admin activity logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission using RBAC - admins.activity permission required
    const hasAccess = await hasPermission('admins.activity');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden - admins.activity permission required' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const adminId = searchParams.get('adminId') || '';
    const action = searchParams.get('action') || '';
    
    const where: Record<string, unknown> = {};
    
    if (adminId) {
      where.adminId = adminId;
    }
    
    if (action) {
      where.action = { contains: action };
    }
    
    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminActivityLog.count({ where }),
    ]);
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
